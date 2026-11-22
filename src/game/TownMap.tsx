import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import meFront from '../assets/characters/me-front.png'
import meBack from '../assets/characters/me-back.png'
import meWalk from '../assets/characters/me-walk.png'
import meWalk2 from '../assets/characters/me-walk-2.png'
import himWalk from '../assets/characters/him-walk.png'
import himWalk2 from '../assets/characters/him-walk-2.png'
import dog1Sprite from '../assets/characters/dog-1.png'
import dog2Sprite from '../assets/characters/dog-2.png'
import catSprite from '../assets/characters/cat-2.png'
import meMoto from '../assets/characters/me-moto.png'
import meCar from '../assets/characters/me-car.png'
import hatSprite from '../assets/characters/grad-hat.png'
import diplomaSprite from '../assets/characters/grad-diploma.png'
import passportSprite from '../assets/characters/passport.png'
import townBackground from '../assets/town-profile.jpg'
import { BUILDINGS, MAP_HEIGHT, MAP_WIDTH, type Building } from './buildings'
import {
  doorPoint,
  isOnRoad,
  ROAD1_Y,
  ROAD2_Y,
  ROAD3_Y,
  ROAD_HALF_WIDTH,
  ROAD_SEGMENTS,
  ROAD_X1,
  ROAD_X2,
  VERTICAL_ROAD_X,
  type Point,
} from './roads'
import { useTownState } from './useTownState'
import './TownMap.css'

const PLAYER_RADIUS = 12
const PLAYER_WIDTH = 28
const PLAYER_HEIGHT = 40
const MOVE_SPEED = 170 // px per second
const DOOR_TRIGGER_RADIUS = 46
const WALK_FRAME_SKIP = 10 // how many animation ticks to hold each leg pose before swapping

const HIM_WIDTH = 26
const HIM_HEIGHT = 38
const HIM_SPEED = MOVE_SPEED * 0.65 // slower than the player, so they're chaseable
const HIM_TURN_CHANCE = 0.35 // odds of turning at a pass-through intersection instead of continuing straight
const CATCH_RADIUS = 22 // how close the player must get to him to trigger the escort to church
const ESCORT_TRAIL_OFFSET = 18 // how far behind the player him trails during the escort

interface HimMoveState {
  x: number
  y: number
  axis: 'horizontal' | 'vertical'
  sign: 1 | -1
}

const HIM_ROWS = [ROAD1_Y, ROAD2_Y, ROAD3_Y]

const CHURCH_BUILDING = BUILDINGS.find((building) => building.id === 'church')!
const CHURCH_DOOR = doorPoint(CHURCH_BUILDING)
const HOUSE_BUILDING = BUILDINGS.find((building) => building.id === 'house')!
const HOUSE_DOOR = doorPoint(HOUSE_BUILDING)
const TJSP_BUILDING = BUILDINGS.find((building) => building.id === 'tjsp')!
const TJSP_DOOR = doorPoint(TJSP_BUILDING)
const TOTAL_STOPS = BUILDINGS.filter((building) => !building.noStop).length

const UNICAMP_BUILDING = BUILDINGS.find((building) => building.id === 'unicamp')!
const UNICAMP_DOOR = doorPoint(UNICAMP_BUILDING)
const BANK_BUILDING = BUILDINGS.find((building) => building.id === 'bank')!
const BANK_DOOR = doorPoint(BANK_BUILDING)
const AIRPORT_BUILDING = BUILDINGS.find((building) => building.id === 'airport')!
const AIRPORT_DOOR = doorPoint(AIRPORT_BUILDING)
const GYM_BUILDING = BUILDINGS.find((building) => building.id === 'gym')!
const GYM_DOOR = doorPoint(GYM_BUILDING)
const SUPERMARKET_BUILDING = BUILDINGS.find((building) => building.id === 'supermarket')!
const SUPERMARKET_DOOR = doorPoint(SUPERMARKET_BUILDING)
const HOSPITAL_BUILDING = BUILDINGS.find((building) => building.id === 'hospital')!
const HOSPITAL_DOOR = doorPoint(HOSPITAL_BUILDING)

// Job opportunities unlock (one icon each) once the graduation hat has been
// collected, in front of the three "career" buildings.
const JOB_BUILDING_IDS = ['tjsp', 'elite-school', 'kenlo-software'] as const
const JOB_DOORS: Record<string, Point> = Object.fromEntries(
  JOB_BUILDING_IDS.map((id) => [id, doorPoint(BUILDINGS.find((building) => building.id === id)!)]),
)

// A second, later job offer appears in front of Unicamp once the second
// flight has happened, reusing the same collected-jobs/money-at-bank system.
const SECOND_JOB_ID = 'unicamp-second-job'

// How long the player needs to be moving around before "him" shows up, so
// there's a moment to get oriented first.
const HIM_APPEAR_DELAY_MS = 3000

// How long after the first graduation before the passport shows up at the
// airport, so the graduation celebration has a moment to land first.
const PASSPORT_APPEAR_DELAY_MS = 4000

// After the first flight, the same delay is reused before the second
// graduation hat shows up, and again before the second passport shows up.
const SEQUEL_APPEAR_DELAY_MS = 4000

// How long the player vanishes from the map for after the second flight,
// as a little "time has passed" beat before the job offer appears.
const PLAYER_DISAPPEAR_DURATION_MS = 2000

// How long the player rides the scooter after collecting money from the
// bank before reverting back to walking on foot.
const MOTO_RIDE_DURATION_MS = 8000
const MOTO_WIDTH = 42
const MOTO_HEIGHT = 42
// The car is noticeably bigger than the scooter it replaces.
const CAR_WIDTH = MOTO_WIDTH * 2
const CAR_HEIGHT = MOTO_HEIGHT * 2
const PICKUP_WIDTH = 22
const PICKUP_HEIGHT = 22

const COMPANION_WIDTH = 22
const COMPANION_HEIGHT = 22

interface CompanionState {
  id: string
  sprite: string
  x: number
  y: number
  visible: boolean
  home: boolean
  facingLeft: boolean
}

// Each companion is its own distinct pet (two different dogs + the grey
// cat), so there's no walk-frame alternation -- just one static sprite each.
const INITIAL_COMPANIONS: CompanionState[] = [
  { id: 'dog-1', sprite: dog1Sprite, x: 0, y: 0, visible: false, home: false, facingLeft: false },
  { id: 'dog-2', sprite: dog2Sprite, x: 0, y: 0, visible: false, home: false, facingLeft: false },
  { id: 'cat-2', sprite: catSprite, x: 0, y: 0, visible: false, home: false, facingLeft: false },
]

// Fixed front-yard spots near the house door where rescued companions settle
// in and stay, side by side (shifted up/left of the door so they read as
// sitting in the yard rather than standing on the doorstep).
const COMPANION_HOME_SPOTS: Point[] = [
  { x: HOUSE_DOOR.x - 22 - COMPANION_WIDTH * 3, y: HOUSE_DOOR.y + 14 - COMPANION_HEIGHT * 2 },
  { x: HOUSE_DOOR.x - COMPANION_WIDTH * 3, y: HOUSE_DOOR.y + 14 - COMPANION_HEIGHT * 2 },
  { x: HOUSE_DOOR.x + 22 - COMPANION_WIDTH * 3, y: HOUSE_DOOR.y + 14 - COMPANION_HEIGHT * 2 },
]


// Picks a random point somewhere on the road grid (trunk roads only, never
// inside a building spur) so companions always spawn reachable by foot.
function randomRoadPoint(): Point {
  if (Math.random() < 0.25) {
    return { x: VERTICAL_ROAD_X, y: ROAD1_Y + Math.random() * (ROAD3_Y - ROAD1_Y) }
  }
  const row = HIM_ROWS[Math.floor(Math.random() * HIM_ROWS.length)]
  return { x: ROAD_X1 + 20 + Math.random() * (ROAD_X2 - ROAD_X1 - 40), y: row }
}

// Spawns 3 companion points spread out from each other and from `avoid`
// (the spot where "him" just vanished), retrying a few times if too close.
function spawnCompanionPoints(avoid: Point): Point[] {
  const points: Point[] = []
  for (let i = 0; i < 3; i += 1) {
    let candidate = randomRoadPoint()
    let attempts = 0
    while (
      attempts < 20 &&
      (Math.hypot(candidate.x - avoid.x, candidate.y - avoid.y) < 80 ||
        points.some((p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) < 60))
    ) {
      candidate = randomRoadPoint()
      attempts += 1
    }
    points.push(candidate)
  }
  return points
}

// Resting/baseline levels the stat bars settle back towards once any event
// -driven spike has fully decayed. Exploration's baseline is computed live
// from buildings visited. Health works differently -- see HEALTH_* below --
// it decays continuously rather than spiking and settling.
const BASE_HAPPINESS = 70
const BASE_EDUCATION = 85
const MIN_HAPPINESS = 8

// How long a stat takes to decay back down from its event-triggered spike
// (100%) to its resting baseline.
const STAT_DECAY_DURATION_MS = 15000
// How often the decaying stat values are recomputed and re-rendered.
const STAT_TICK_MS = 400

// How long the player must stand still, inside a pickup's catch radius,
// before it actually gets collected -- so walking past an icon while moving
// through doesn't pick it up by accident.
const PICKUP_DWELL_MS = 450

// Health decays continuously, at the same rate as the other stats' decay
// window, until it's topped back up at the gym, supermarket or hospital.
// Icons appear once it drops past these thresholds.
const HEALTH_MAX = 100
const HEALTH_MIN = 0
const HEALTH_MIDDLE = 50 // below this, a gym/supermarket icon appears
const HEALTH_CRITICAL = 20 // below this, neglect forces a hospital visit
const HEALTH_DECAY_DURATION_MS = STAT_DECAY_DURATION_MS
// Being sick (hospital icon active, uncollected) slows the player down a lot.
const SICK_SPEED_MULTIPLIER = 0.35

const WEDDING_EMOJIS = ['🎉', '👰', '💍', '🤵', '🎶', '🎊', '💍', '👰']
const PET_RESCUE_EMOJIS = ['🐶', '🐱', '🐾', '❤️', '🐾', '❤️', '🐶', '🐱']
const BREAKUP_EMOJIS = ['🥲', '🤷‍♀️', '🤷‍♂️', '💔', '👎', '🥲', '💔', '👎']
const GRADUATION_EMOJIS = ['🎓', '👩‍🎓', '🎉', '📜', '👏', '🎓', '🎉', '📜']
const JOB_EMOJIS = ['🪙', '🌱', '💪', '🌱', '📈', '🪙', '💪', '📈']
const MONEY_EMOJIS = ['🤑', '🪙', '💵', '👏', '🤑', '💵', '🪙', '👏']
const TRAVEL_EMOJIS = ['🎓', '✈️', '🌍', '🧳', '😁', '☀️', '💖', '🤩']
const DIPLOMA_EMOJIS = ['🎓', '😁', '📜', '👩‍🎓', '🤩']
const GYM_EMOJIS = ['💪', '🏋️‍♂️', '🥰', '💪', '🏋️‍♂️', '🥰']
const SUPERMARKET_EMOJIS = ['🍎', '🍓', '🍍', '🍒', '🌱', '🌻']
const HOSPITAL_EMOJIS = ['🤒', '🤢', '🤮', '🤧', '😷']
const CELEBRATION_DURATION_MS = 2600
interface CelebrationParticle {
  emoji: string
  left: number
  delay: number
  duration: number
  drift: number
  spin: number
}
interface CelebrationState {
  x: number
  y: number
  particles: CelebrationParticle[]
}
// A stat "spike": jumps to `from` at `start`, then either holds there forever
// (duration = Infinity, used for the happiness dip while "him" is back) or
// linearly decays towards the live baseline over `duration` ms.
interface StatSpike {
  from: number
  start: number
  duration: number
}
function statSpikeValue(spike: StatSpike | null, now: number, baseline: number): number {
  if (!spike) return baseline
  const elapsed = now - spike.start
  if (!Number.isFinite(spike.duration) || elapsed <= 0) return spike.from
  if (elapsed >= spike.duration) return baseline
  const t = elapsed / spike.duration
  return spike.from + (baseline - spike.from) * t
}
function buildCelebrationParticles(emojis: string[]): CelebrationParticle[] {
  return emojis.map((emoji, i) => ({
    emoji,
    left: -70 + i * 20 + (i % 2 === 0 ? -6 : 6),
    delay: (i % 4) * 140,
    duration: 1700 + (i % 3) * 220,
    drift: (i % 2 === 0 ? -1 : 1) * (30 + (i % 3) * 18),
    spin: (i % 2 === 0 ? -1 : 1) * (15 + (i % 3) * 10),
  }))
}

function isOnHorizontalRoad(y: number): boolean {
  return HIM_ROWS.some((rowY) => Math.abs(y - rowY) <= ROAD_HALF_WIDTH)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Builds a simple road-following route from any point on the grid to a
// building's door: over to the vertical connector, up/down to the door's
// own road row, across to the building, then down its spur to the door.
function buildPathToDoor(start: Point, door: Point, roadY: number): Point[] {
  const path: Point[] = []
  if (Math.abs(start.x - VERTICAL_ROAD_X) > 1) path.push({ x: VERTICAL_ROAD_X, y: start.y })
  if (Math.abs(start.y - roadY) > 1) path.push({ x: VERTICAL_ROAD_X, y: roadY })
  path.push({ x: door.x, y: roadY })
  path.push(door)
  return path
}

function buildPathToChurch(start: Point): Point[] {
  return buildPathToDoor(start, CHURCH_DOOR, ROAD1_Y)
}

function buildPathToHouse(start: Point): Point[] {
  return buildPathToDoor(start, HOUSE_DOOR, ROAD3_Y)
}

function buildPathToTjsp(start: Point): Point[] {
  return buildPathToDoor(start, TJSP_DOOR, ROAD1_Y)
}

export default function TownMap() {
  const { visited, visit } = useTownState()
  const [player, setPlayer] = useState<Point>({ x: VERTICAL_ROAD_X, y: ROAD2_Y })
  const [facingLeft, setFacingLeft] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [walkFrame, setWalkFrame] = useState(0)
  const [nearBuilding, setNearBuilding] = useState<Building | null>(null)
  const [modalBuilding, setModalBuilding] = useState<Building | null>(null)
  const [justVisited, setJustVisited] = useState(false)
  const [him, setHim] = useState<Point>({ x: ROAD_X1, y: ROAD2_Y })
  const [himFacingLeft, setHimFacingLeft] = useState(false)
  const [himWalkFrame, setHimWalkFrame] = useState(0)
  const [himVisible, setHimVisible] = useState(false)
  const [isEscorting, setIsEscorting] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)
  const [companions, setCompanions] = useState<CompanionState[]>(INITIAL_COMPANIONS)
  const [hatCollected, setHatCollected] = useState(false)
  const [collectedJobs, setCollectedJobs] = useState<Set<string>>(new Set())
  const [moneyCollectCount, setMoneyCollectCount] = useState(0)
  const [passportAvailable, setPassportAvailable] = useState(false)
  const [passportCollected, setPassportCollected] = useState(false)
  const [diplomaAvailable, setDiplomaAvailable] = useState(false)
  const [diplomaCollected, setDiplomaCollected] = useState(false)
  const [motoActive, setMotoActive] = useState(false)
  const [hat2Available, setHat2Available] = useState(false)
  const [hat2Collected, setHat2Collected] = useState(false)
  const [passport2Available, setPassport2Available] = useState(false)
  const [passport2Collected, setPassport2Collected] = useState(false)
  const [job2Available, setJob2Available] = useState(false)
  const [playerHidden, setPlayerHidden] = useState(false)
  const [hasCar, setHasCar] = useState(false)
  const [happinessStat, setHappinessStat] = useState(BASE_HAPPINESS)
  const [educationStat, setEducationStat] = useState(BASE_EDUCATION)
  const [healthStat, setHealthStat] = useState(HEALTH_MAX)
  const [healthIcon, setHealthIcon] = useState<'gym' | 'supermarket' | 'hospital' | null>(null)
  const [explorationStat, setExplorationStat] = useState(
    TOTAL_STOPS > 0 ? Math.round((visited.size / TOTAL_STOPS) * 100) : 0,
  )
  const today = formatToday()

  const stats = {
    happiness: happinessStat,
    education: educationStat,
    health: healthStat,
    exploration: explorationStat,
  }

  const pressedKeys = useRef(new Set<string>())
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number | null>(null)
  const playerRef = useRef(player)
  const walkFrameCounterRef = useRef(0)
  const himMoveRef = useRef<HimMoveState>({ x: ROAD_X1, y: ROAD2_Y, axis: 'horizontal', sign: 1 })
  const himWalkFrameCounterRef = useRef(0)
  const himVisibleRef = useRef(false)
  const himAppearScheduledRef = useRef(false)
  const isEscortingRef = useRef(false)
  const escortPathRef = useRef<Point[]>([])
  const escortIndexRef = useRef(0)
  const escortKindRef = useRef<'him' | 'companion' | null>(null)
  const escortCompanionIdRef = useRef<string | null>(null)
  const himDestinationRef = useRef<'church' | 'tjsp'>('church')
  const hatCollectedRef = useRef(false)
  const collectedJobsRef = useRef<Set<string>>(new Set())
  const moneyCollectCountRef = useRef(0)
  const passportAvailableRef = useRef(false)
  const passportAppearScheduledRef = useRef(false)
  const passportCollectedRef = useRef(false)
  const diplomaAvailableRef = useRef(false)
  const diplomaCollectedRef = useRef(false)
  const motoRevertTimeoutRef = useRef<number | null>(null)
  const passportAppearTimeoutRef = useRef<number | null>(null)
  const hat2AvailableRef = useRef(false)
  const hat2AppearScheduledRef = useRef(false)
  const hat2AppearTimeoutRef = useRef<number | null>(null)
  const hat2CollectedRef = useRef(false)
  const passport2AvailableRef = useRef(false)
  const passport2AppearScheduledRef = useRef(false)
  const passport2AppearTimeoutRef = useRef<number | null>(null)
  const passport2CollectedRef = useRef(false)
  const job2AvailableRef = useRef(false)
  const playerHiddenRef = useRef(false)
  const playerHiddenTimeoutRef = useRef<number | null>(null)
  const hasCarRef = useRef(false)
  const isMovingRef = useRef(false)
  const dwellRef = useRef<Record<string, number>>({})
  const visitedRef = useRef(visited)
  const happinessSpikeRef = useRef<StatSpike | null>(null)
  const educationSpikeRef = useRef<StatSpike | null>(null)
  const explorationSpikeRef = useRef<StatSpike | null>(null)
  const healthRef = useRef(HEALTH_MAX)
  const healthIconRef = useRef<'gym' | 'supermarket' | 'hospital' | null>(null)
  const healthTurnRef = useRef<'gym' | 'supermarket'>('gym')
  const himPhaseRef = useRef<'before-church' | 'after-church' | 'reunited' | 'done'>('before-church')
  const companionsRef = useRef<CompanionState[]>(companions)
  const companionsSpawnedRef = useRef(false)
  const celebrationTimeoutRef = useRef<number | null>(null)
  playerRef.current = player
  himVisibleRef.current = himVisible
  isEscortingRef.current = isEscorting
  companionsRef.current = companions
  visitedRef.current = visited

  function triggerCelebration(emojis: string[], at: Point) {
    setCelebration({ x: at.x, y: at.y, particles: buildCelebrationParticles(emojis) })
    if (celebrationTimeoutRef.current !== null) window.clearTimeout(celebrationTimeoutRef.current)
    celebrationTimeoutRef.current = window.setTimeout(() => setCelebration(null), CELEBRATION_DURATION_MS)
  }

  function spikeStat(ref: { current: StatSpike | null }, from = 100, duration = STAT_DECAY_DURATION_MS) {
    ref.current = { from, start: performance.now(), duration }
  }

  // Returns true exactly once the player has stood still, within range of a
  // pickup, for PICKUP_DWELL_MS -- resets as soon as they leave or move.
  function dwellReady(key: string, withinRange: boolean, dt: number): boolean {
    if (!withinRange || isMovingRef.current) {
      dwellRef.current[key] = 0
      return false
    }
    const next = (dwellRef.current[key] ?? 0) + dt * 1000
    dwellRef.current[key] = next
    if (next >= PICKUP_DWELL_MS) {
      dwellRef.current[key] = 0
      return true
    }
    return false
  }

  function startMotoRide() {
    setMotoActive(true)
    if (motoRevertTimeoutRef.current !== null) window.clearTimeout(motoRevertTimeoutRef.current)
    motoRevertTimeoutRef.current = window.setTimeout(() => setMotoActive(false), MOTO_RIDE_DURATION_MS)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        pressedKeys.current.add(key)
        e.preventDefault()
      }
      if ((key === 'enter' || key === ' ') && nearBuilding && !modalBuilding) {
        enterBuilding(nearBuilding)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearBuilding, modalBuilding])

  useEffect(() => {
    const step = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      if (isEscortingRef.current) {
        const path = escortPathRef.current
        const idx = escortIndexRef.current
        const current = playerRef.current

        if (idx >= path.length) {
          // Arrived: separate, hand control back to the player, and wrap up
          // whichever escort just finished.
          if (escortKindRef.current === 'him') {
            if (himDestinationRef.current === 'church') {
              setHimVisible(false)
              himVisibleRef.current = false
              triggerCelebration(WEDDING_EMOJIS, current)
              if (!companionsSpawnedRef.current) {
                companionsSpawnedRef.current = true
                const points = spawnCompanionPoints(current)
                setCompanions((prev) => prev.map((c, i) => ({ ...c, x: points[i].x, y: points[i].y, visible: true })))
              }
              himPhaseRef.current = 'after-church'
            } else {
              setHimVisible(false)
              himVisibleRef.current = false
              triggerCelebration(BREAKUP_EMOJIS, current)
              himPhaseRef.current = 'done'
              // After the divorce, happiness rebounds to the top and slowly settles back down.
              spikeStat(happinessSpikeRef)
            }
          } else if (escortKindRef.current === 'companion' && escortCompanionIdRef.current) {
            const rescuedId = escortCompanionIdRef.current
            setCompanions((prev) => {
              const homeIndex = prev.filter((c) => c.home).length
              const spot = COMPANION_HOME_SPOTS[homeIndex] ?? COMPANION_HOME_SPOTS[COMPANION_HOME_SPOTS.length - 1]
              const next = prev.map((c) => (c.id === rescuedId ? { ...c, x: spot.x, y: spot.y, home: true } : c))
              // Every rescue gives happiness a boost that then decays...
              spikeStat(happinessSpikeRef)
              if (next.every((c) => c.home)) {
                himMoveRef.current = { x: ROAD_X1, y: ROAD2_Y, axis: 'horizontal', sign: 1 }
                setHim({ x: ROAD_X1, y: ROAD2_Y })
                setHimVisible(true)
                himVisibleRef.current = true
                himPhaseRef.current = 'reunited'
                // ...unless that was the last pet and "him" reappears, which
                // dips happiness to its minimum until the divorce happens.
                happinessSpikeRef.current = { from: MIN_HAPPINESS, start: performance.now(), duration: Infinity }
              }
              return next
            })
            triggerCelebration(PET_RESCUE_EMOJIS, current)
          }

          setIsEscorting(false)
          isEscortingRef.current = false
          setIsMoving(false)
          pressedKeys.current.clear()
          escortKindRef.current = null
          escortCompanionIdRef.current = null
        } else {
          const target = path[idx]
          const tdx = target.x - current.x
          const tdy = target.y - current.y
          const tdist = Math.hypot(tdx, tdy)

          if (tdist < 2) {
            escortIndexRef.current = idx + 1
          } else {
            const travel = Math.min(HIM_SPEED * dt, tdist)
            const dirX = tdx / tdist
            const dirY = tdy / tdist
            const nextPlayer = { x: current.x + dirX * travel, y: current.y + dirY * travel }
            setPlayer(nextPlayer)
            playerRef.current = nextPlayer
            if (dirX !== 0) {
              setFacingLeft(dirX < 0)
            }
            const trailPos = { x: nextPlayer.x - dirX * ESCORT_TRAIL_OFFSET, y: nextPlayer.y - dirY * ESCORT_TRAIL_OFFSET }
            if (escortKindRef.current === 'him') {
              setHim(trailPos)
              if (dirX !== 0) setHimFacingLeft(dirX < 0)
            } else if (escortKindRef.current === 'companion' && escortCompanionIdRef.current) {
              const id = escortCompanionIdRef.current
              setCompanions((prev) =>
                prev.map((c) =>
                  c.id === id ? { ...c, x: trailPos.x, y: trailPos.y, facingLeft: dirX !== 0 ? dirX < 0 : c.facingLeft } : c,
                ),
              )
            }
            setIsMoving(true)

            walkFrameCounterRef.current += 1
            if (walkFrameCounterRef.current >= WALK_FRAME_SKIP) {
              walkFrameCounterRef.current = 0
              setWalkFrame((f) => (f === 0 ? 1 : 0))
              if (escortKindRef.current === 'him') {
                setHimWalkFrame((f) => (f === 0 ? 1 : 0))
              }
            }
          }
        }

        frameRef.current = requestAnimationFrame(step)
        return
      }

      if (!modalBuilding && !playerHiddenRef.current) {
        const keys = pressedKeys.current
        let dx = 0
        let dy = 0
        if (keys.has('arrowup') || keys.has('w')) dy -= 1
        if (keys.has('arrowdown') || keys.has('s')) dy += 1
        if (keys.has('arrowleft') || keys.has('a')) dx -= 1
        if (keys.has('arrowright') || keys.has('d')) dx += 1

        if (dx !== 0 || dy !== 0) {
          const length = Math.hypot(dx, dy)
          // Being sick (hospital icon active, not yet collected) slows the player down a lot.
          const speed = healthIconRef.current === 'hospital' ? MOVE_SPEED * SICK_SPEED_MULTIPLIER : MOVE_SPEED
          const stepX = (dx / length) * speed * dt
          const stepY = (dy / length) * speed * dt

          const current = playerRef.current
          const rawX = current.x + stepX
          let nextX: number
          if (isOnHorizontalRoad(current.y) && rawX > ROAD_X2) {
            nextX = ROAD_X1
          } else if (isOnHorizontalRoad(current.y) && rawX < ROAD_X1) {
            nextX = ROAD_X2
          } else {
            nextX = clamp(rawX, PLAYER_RADIUS, MAP_WIDTH - PLAYER_RADIUS)
          }
          let nextY = current.y
          if (!isOnRoad({ x: nextX, y: nextY })) {
            nextX = current.x
          }
          nextY = clamp(current.y + stepY, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS)
          if (!isOnRoad({ x: nextX, y: nextY })) {
            nextY = current.y
          }

          const moved = nextX !== current.x || nextY !== current.y
          if (moved) {
            setPlayer({ x: nextX, y: nextY })
            if (nextX !== current.x) setFacingLeft(nextX < current.x)
          }

          // Give the player a few seconds of uninterrupted movement to get
          // oriented before "him" shows up on the roads for the first time.
          if (moved && !himAppearScheduledRef.current && himPhaseRef.current === 'before-church') {
            himAppearScheduledRef.current = true
            window.setTimeout(() => {
              if (himPhaseRef.current === 'before-church') {
                setHimVisible(true)
                himVisibleRef.current = true
              }
            }, HIM_APPEAR_DELAY_MS)
          }

          if (moved) {
            walkFrameCounterRef.current += 1
            if (walkFrameCounterRef.current >= WALK_FRAME_SKIP) {
              walkFrameCounterRef.current = 0
              setWalkFrame((f) => (f === 0 ? 1 : 0))
            }
            setIsMoving(true)
            isMovingRef.current = true
          } else {
            walkFrameCounterRef.current = 0
            setIsMoving(false)
            isMovingRef.current = false
          }
        } else {
          walkFrameCounterRef.current = 0
          setIsMoving(false)
          isMovingRef.current = false
        }
      } else {
        walkFrameCounterRef.current = 0
        setIsMoving(false)
        isMovingRef.current = false
      }

      // Background NPC: follows the trunk roads, turning at intersections,
      // always turning (not wrapping) at the vertical road's dead ends, and
      // wrapping around to the opposite end when a horizontal road ends.
      if (himVisibleRef.current) {
        const himState = himMoveRef.current
        let nextHimState: HimMoveState

        if (himState.axis === 'horizontal') {
          const rawX = himState.x + himState.sign * HIM_SPEED * dt
          const crossedIntersection =
            himState.x !== VERTICAL_ROAD_X && (himState.x - VERTICAL_ROAD_X) * (rawX - VERTICAL_ROAD_X) <= 0

          if (crossedIntersection && Math.random() < HIM_TURN_CHANCE) {
            const sign: 1 | -1 =
              himState.y === ROAD1_Y ? 1 : himState.y === ROAD3_Y ? -1 : Math.random() < 0.5 ? 1 : -1
            nextHimState = { x: VERTICAL_ROAD_X, y: himState.y, axis: 'vertical', sign }
          } else if (rawX > ROAD_X2) {
            nextHimState = { x: ROAD_X1, y: himState.y, axis: 'horizontal', sign: himState.sign }
          } else if (rawX < ROAD_X1) {
            nextHimState = { x: ROAD_X2, y: himState.y, axis: 'horizontal', sign: himState.sign }
          } else {
            nextHimState = { x: rawX, y: himState.y, axis: 'horizontal', sign: himState.sign }
          }
        } else {
          const rawY = himState.y + himState.sign * HIM_SPEED * dt
          const reachedTopEnd = himState.sign === -1 && rawY <= ROAD1_Y
          const reachedBottomEnd = himState.sign === 1 && rawY >= ROAD3_Y

          if (reachedTopEnd || reachedBottomEnd) {
            // Dead end of the connector road: always turn onto the horizontal road here.
            const endY = reachedTopEnd ? ROAD1_Y : ROAD3_Y
            nextHimState = {
              x: VERTICAL_ROAD_X,
              y: endY,
              axis: 'horizontal',
              sign: Math.random() < 0.5 ? 1 : -1,
            }
          } else {
            const crossedMidRow =
              himState.y !== ROAD2_Y && (himState.y - ROAD2_Y) * (rawY - ROAD2_Y) <= 0
            if (crossedMidRow && Math.random() < HIM_TURN_CHANCE) {
              nextHimState = {
                x: VERTICAL_ROAD_X,
                y: ROAD2_Y,
                axis: 'horizontal',
                sign: Math.random() < 0.5 ? 1 : -1,
              }
            } else {
              nextHimState = { x: VERTICAL_ROAD_X, y: rawY, axis: 'vertical', sign: himState.sign }
            }
          }
        }

        himMoveRef.current = nextHimState
        setHim({ x: nextHimState.x, y: nextHimState.y })
        if (nextHimState.axis === 'horizontal') setHimFacingLeft(nextHimState.sign < 0)

        himWalkFrameCounterRef.current += 1
        if (himWalkFrameCounterRef.current >= WALK_FRAME_SKIP) {
          himWalkFrameCounterRef.current = 0
          setHimWalkFrame((f) => (f === 0 ? 1 : 0))
        }

        // Catch detection: if the player reaches him, start the escort to church.
        // Only while the player is actually in control (not already mid-escort
        // or hidden off-map), so one event can't accidentally trigger another.
        const current = playerRef.current
        const caughtDist = Math.hypot(current.x - nextHimState.x, current.y - nextHimState.y)
        if (!modalBuilding && !isEscortingRef.current && !playerHiddenRef.current && caughtDist < CATCH_RADIUS) {
          const destination = himPhaseRef.current === 'reunited' ? 'tjsp' : 'church'
          himDestinationRef.current = destination
          escortPathRef.current = destination === 'tjsp' ? buildPathToTjsp(current) : buildPathToChurch(current)
          escortIndexRef.current = 0
          escortKindRef.current = 'him'
          setIsEscorting(true)
          isEscortingRef.current = true
          pressedKeys.current.clear()
        }
      }

      // Companion catch detection: if the player reaches a visible, un-rescued
      // dog or cat, start the escort to walk it home one at a time.
      if (!modalBuilding && !isEscortingRef.current && !playerHiddenRef.current) {
        const current = playerRef.current
        for (const companion of companionsRef.current) {
          if (!companion.visible || companion.home) continue
          const dist = Math.hypot(current.x - companion.x, current.y - companion.y)
          if (dist < CATCH_RADIUS) {
            escortPathRef.current = buildPathToHouse(current)
            escortIndexRef.current = 0
            escortKindRef.current = 'companion'
            escortCompanionIdRef.current = companion.id
            setIsEscorting(true)
            isEscortingRef.current = true
            pressedKeys.current.clear()
            break
          }
        }
      }

      // Graduation hat pickup, in front of Unicamp: collecting it triggers
      // the graduation celebration, unlocks the job icons below, reveals the
      // diploma, and (after a short delay) reveals the passport at the airport.
      // Requires standing still on the icon for a moment, not just walking past.
      if (!modalBuilding && !isEscortingRef.current && !playerHiddenRef.current && !hatCollectedRef.current) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - UNICAMP_DOOR.x, current.y - UNICAMP_DOOR.y)
        if (dwellReady('hat1', dist < CATCH_RADIUS, dt)) {
          hatCollectedRef.current = true
          setHatCollected(true)
          triggerCelebration(GRADUATION_EMOJIS, UNICAMP_DOOR)
          spikeStat(educationSpikeRef)
          diplomaAvailableRef.current = true
          setDiplomaAvailable(true)
          if (!passportAppearScheduledRef.current) {
            passportAppearScheduledRef.current = true
            passportAppearTimeoutRef.current = window.setTimeout(() => {
              passportAvailableRef.current = true
              setPassportAvailable(true)
            }, PASSPORT_APPEAR_DELAY_MS)
          }
        }
      }

      // Job icon pickups, one each in front of TJSP, Elite School and Kenlo
      // Software, only available once the graduation hat has been collected.
      if (!modalBuilding && !isEscortingRef.current && !playerHiddenRef.current && hatCollectedRef.current) {
        const current = playerRef.current
        for (const id of JOB_BUILDING_IDS) {
          if (collectedJobsRef.current.has(id)) continue
          const door = JOB_DOORS[id]
          const dist = Math.hypot(current.x - door.x, current.y - door.y)
          if (dwellReady(`job-${id}`, dist < CATCH_RADIUS, dt)) {
            const next = new Set(collectedJobsRef.current)
            next.add(id)
            collectedJobsRef.current = next
            setCollectedJobs(next)
            triggerCelebration(JOB_EMOJIS, door)
            break
          }
        }
      }

      // Money pickup in front of the bank: appears after each job taken (even
      // replenishing after being collected, as long as another job has since
      // been taken), and triggers its own celebration when collected. Taking
      // it syncs the collected count fully, so an unpicked-up money never
      // stacks -- the next one simply replaces it.
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        collectedJobsRef.current.size > moneyCollectCountRef.current
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - BANK_DOOR.x, current.y - BANK_DOOR.y)
        if (dwellReady('money', dist < CATCH_RADIUS, dt)) {
          moneyCollectCountRef.current = collectedJobsRef.current.size
          setMoneyCollectCount(moneyCollectCountRef.current)
          triggerCelebration(MONEY_EMOJIS, BANK_DOOR)
          if (collectedJobsRef.current.has(SECOND_JOB_ID)) {
            hasCarRef.current = true
            setHasCar(true)
          }
          startMotoRide()
        }
      }

      // Passport pickup in front of the airport, available a few seconds
      // after the first graduation: collecting it triggers a travel celebration,
      // then schedules the second graduation hat to appear after a delay.
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        passportAvailableRef.current &&
        !passportCollectedRef.current
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - AIRPORT_DOOR.x, current.y - AIRPORT_DOOR.y)
        if (dwellReady('passport1', dist < CATCH_RADIUS, dt)) {
          passportCollectedRef.current = true
          setPassportCollected(true)
          triggerCelebration(TRAVEL_EMOJIS, AIRPORT_DOOR)
          spikeStat(explorationSpikeRef)
          diplomaAvailableRef.current = true
          setDiplomaAvailable(true)
          if (!hat2AppearScheduledRef.current) {
            hat2AppearScheduledRef.current = true
            hat2AppearTimeoutRef.current = window.setTimeout(() => {
              hat2AvailableRef.current = true
              setHat2Available(true)
            }, SEQUEL_APPEAR_DELAY_MS)
          }
        }
      }

      // Second graduation hat, in front of Unicamp again, available a while
      // after the first flight: collecting it triggers another graduation
      // celebration, unlocks the diploma, and schedules the second passport.
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        hat2AvailableRef.current &&
        !hat2CollectedRef.current
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - UNICAMP_DOOR.x, current.y - UNICAMP_DOOR.y)
        if (dwellReady('hat2', dist < CATCH_RADIUS, dt)) {
          hat2CollectedRef.current = true
          setHat2Collected(true)
          triggerCelebration(GRADUATION_EMOJIS, UNICAMP_DOOR)
          spikeStat(educationSpikeRef)
          diplomaAvailableRef.current = true
          setDiplomaAvailable(true)
          if (!passport2AppearScheduledRef.current) {
            passport2AppearScheduledRef.current = true
            passport2AppearTimeoutRef.current = window.setTimeout(() => {
              passport2AvailableRef.current = true
              setPassport2Available(true)
            }, SEQUEL_APPEAR_DELAY_MS)
          }
        }
      }

      // Second passport, at the airport again, available a while after the
      // second graduation: collecting it triggers a travel celebration, then
      // the player vanishes from the map briefly before the diploma (if not
      // already out) and the new job offer appear.
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        passport2AvailableRef.current &&
        !passport2CollectedRef.current
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - AIRPORT_DOOR.x, current.y - AIRPORT_DOOR.y)
        if (dwellReady('passport2', dist < CATCH_RADIUS, dt)) {
          passport2CollectedRef.current = true
          setPassport2Collected(true)
          triggerCelebration(TRAVEL_EMOJIS, AIRPORT_DOOR)
          spikeStat(explorationSpikeRef)
          playerHiddenRef.current = true
          setPlayerHidden(true)
          if (playerHiddenTimeoutRef.current !== null) window.clearTimeout(playerHiddenTimeoutRef.current)
          playerHiddenTimeoutRef.current = window.setTimeout(() => {
            playerHiddenRef.current = false
            setPlayerHidden(false)
            diplomaAvailableRef.current = true
            setDiplomaAvailable(true)
            job2AvailableRef.current = true
            setJob2Available(true)
          }, PLAYER_DISAPPEAR_DURATION_MS)
        }
      }

      // Second job offer, in front of Unicamp, available once the player
      // reappears after the second flight: collecting it triggers the usual
      // job celebration and replenishes the money pickup at the bank.
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        job2AvailableRef.current &&
        !collectedJobsRef.current.has(SECOND_JOB_ID)
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - UNICAMP_DOOR.x, current.y - UNICAMP_DOOR.y)
        if (dwellReady('job2', dist < CATCH_RADIUS, dt)) {
          const next = new Set(collectedJobsRef.current)
          next.add(SECOND_JOB_ID)
          collectedJobsRef.current = next
          setCollectedJobs(next)
          triggerCelebration(JOB_EMOJIS, UNICAMP_DOOR)
        }
      }

      // Diploma pickup in front of the house, available after any graduation
      // or flight: collecting it triggers its own celebration. If a diploma
      // isn't picked up before the next graduation/flight, it just stays put
      // (there's only ever one diploma marker, so there's nothing to replace).
      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        diplomaAvailableRef.current &&
        !diplomaCollectedRef.current
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - HOUSE_DOOR.x, current.y - HOUSE_DOOR.y)
        if (dwellReady('diploma', dist < CATCH_RADIUS, dt)) {
          diplomaCollectedRef.current = true
          setDiplomaCollected(true)
          triggerCelebration(DIPLOMA_EMOJIS, HOUSE_DOOR)
        }
      }

      // Health upkeep icons: once health drops below the middle, an icon
      // appears at the gym or supermarket (alternating each time one gets
      // collected); if it's neglected long enough to get close to empty,
      // that icon is replaced by one at the hospital instead.
      if (!modalBuilding && !isEscortingRef.current && !playerHiddenRef.current && healthIconRef.current === 'gym') {
        const current = playerRef.current
        const dist = Math.hypot(current.x - GYM_DOOR.x, current.y - GYM_DOOR.y)
        if (dwellReady('gym', dist < CATCH_RADIUS, dt)) {
          healthRef.current = HEALTH_MAX
          setHealthStat(HEALTH_MAX)
          healthIconRef.current = null
          setHealthIcon(null)
          healthTurnRef.current = 'supermarket'
          triggerCelebration(GYM_EMOJIS, GYM_DOOR)
        }
      }

      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        healthIconRef.current === 'supermarket'
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - SUPERMARKET_DOOR.x, current.y - SUPERMARKET_DOOR.y)
        if (dwellReady('supermarket', dist < CATCH_RADIUS, dt)) {
          healthRef.current = HEALTH_MAX
          setHealthStat(HEALTH_MAX)
          healthIconRef.current = null
          setHealthIcon(null)
          healthTurnRef.current = 'gym'
          triggerCelebration(SUPERMARKET_EMOJIS, SUPERMARKET_DOOR)
        }
      }

      if (
        !modalBuilding &&
        !isEscortingRef.current &&
        !playerHiddenRef.current &&
        healthIconRef.current === 'hospital'
      ) {
        const current = playerRef.current
        const dist = Math.hypot(current.x - HOSPITAL_DOOR.x, current.y - HOSPITAL_DOOR.y)
        if (dwellReady('hospital', dist < CATCH_RADIUS, dt)) {
          healthRef.current = HEALTH_MAX
          setHealthStat(HEALTH_MAX)
          healthIconRef.current = null
          setHealthIcon(null)
          // Recovered -- back to the normal gym/supermarket upkeep cycle.
          healthTurnRef.current = 'gym'
          triggerCelebration(HOSPITAL_EMOJIS, HOSPITAL_DOOR)
        }
      }

      frameRef.current = requestAnimationFrame(step)

    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [modalBuilding])

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current !== null) window.clearTimeout(celebrationTimeoutRef.current)
      if (motoRevertTimeoutRef.current !== null) window.clearTimeout(motoRevertTimeoutRef.current)
      if (passportAppearTimeoutRef.current !== null) window.clearTimeout(passportAppearTimeoutRef.current)
      if (hat2AppearTimeoutRef.current !== null) window.clearTimeout(hat2AppearTimeoutRef.current)
      if (passport2AppearTimeoutRef.current !== null) window.clearTimeout(passport2AppearTimeoutRef.current)
      if (playerHiddenTimeoutRef.current !== null) window.clearTimeout(playerHiddenTimeoutRef.current)
    }
  }, [])

  // Continuously recompute the decaying/dipping stat bar values, independent
  // of movement, so a spike (e.g. from a graduation) keeps decaying even
  // while the player stands still.
  useEffect(() => {
    const tick = () => {
      const now = performance.now()
      const explorationBaseline = TOTAL_STOPS > 0 ? Math.round((visitedRef.current.size / TOTAL_STOPS) * 100) : 0
      setHappinessStat(Math.round(clamp(statSpikeValue(happinessSpikeRef.current, now, BASE_HAPPINESS), 0, 100)))
      setEducationStat(Math.round(clamp(statSpikeValue(educationSpikeRef.current, now, BASE_EDUCATION), 0, 100)))
      setExplorationStat(
        Math.round(clamp(statSpikeValue(explorationSpikeRef.current, now, explorationBaseline), 0, 100)),
      )

      // Health decays continuously (unlike the spike-based stats above) and
      // drives its own upkeep icons at the gym/supermarket/hospital.
      const healthStep = (HEALTH_MAX - HEALTH_MIN) * (STAT_TICK_MS / HEALTH_DECAY_DURATION_MS)
      healthRef.current = clamp(healthRef.current - healthStep, HEALTH_MIN, HEALTH_MAX)
      if (healthIconRef.current === null && healthRef.current < HEALTH_MIDDLE) {
        healthIconRef.current = healthTurnRef.current
        setHealthIcon(healthIconRef.current)
      } else if (
        (healthIconRef.current === 'gym' || healthIconRef.current === 'supermarket') &&
        healthRef.current <= HEALTH_CRITICAL
      ) {
        healthIconRef.current = 'hospital'
        setHealthIcon('hospital')
      }
      setHealthStat(Math.round(healthRef.current))
    }
    const id = window.setInterval(tick, STAT_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let closest: Building | null = null
    let closestDist = Infinity
    for (const building of BUILDINGS) {
      if (building.noStop) continue
      const door = doorPoint(building)
      const dist = Math.hypot(player.x - door.x, player.y - door.y)
      if (dist < DOOR_TRIGGER_RADIUS && dist < closestDist) {
        closest = building
        closestDist = dist
      }
    }
    setNearBuilding(closest)
  }, [player])

  function enterBuilding(building: Building) {
    const gained = visit(building.id)
    setJustVisited(gained)
    setModalBuilding(building)
  }

  const spriteSrc = motoActive
    ? hasCar
      ? meCar
      : meMoto
    : isMoving
      ? walkFrame === 0
        ? meWalk
        : meWalk2
      : nearBuilding
        ? meBack
        : meFront
  const shouldMirror = motoActive ? facingLeft : isMoving && facingLeft
  const vehicleWidth = hasCar ? CAR_WIDTH : MOTO_WIDTH
  const vehicleHeight = hasCar ? CAR_HEIGHT : MOTO_HEIGHT
  const himSpriteSrc = himWalkFrame === 0 ? himWalk : himWalk2
  const himShouldMirror = himFacingLeft

  return (
    <div className="town">
      <div className="town-map-wrap">
        <img src={townBackground} alt="" className="town-map-wrap__background" />
        <div className="town-hud-date">{today}</div>

        <div className="town-hud-bar town-hud-bar--happiness">
          <div className="town-hud-bar__fill" style={{ width: `${stats.happiness}%` }} />
        </div>
        <div className="town-hud-bar town-hud-bar--education">
          <div className="town-hud-bar__fill" style={{ width: `${stats.education}%` }} />
        </div>
        <div className="town-hud-bar town-hud-bar--health">
          <div className="town-hud-bar__fill" style={{ width: `${stats.health}%` }} />
        </div>
        <div className="town-hud-bar town-hud-bar--exploration">
          <div className="town-hud-bar__fill" style={{ width: `${stats.exploration}%` }} />
        </div>

        {celebration && (
          <div
            className="town-celebration"
            style={{ left: `${(celebration.x / MAP_WIDTH) * 100}%`, top: `${(celebration.y / MAP_HEIGHT) * 100}%` }}
          >
            {celebration.particles.map((p, i) => (
              <span
                key={i}
                className="town-celebration__emoji"
                style={
                  {
                    left: `${p.left}px`,
                    animationDelay: `${p.delay}ms`,
                    animationDuration: `${p.duration}ms`,
                    '--town-celebration-drift': `${p.drift}px`,
                    '--town-celebration-spin': `${p.spin}deg`,
                  } as CSSProperties
                }
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        <svg
          className="town-map"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="A town map overlaid on illustrated artwork, with roads connecting a school, courthouse, office, university, airport, bank, gym, supermarket, house, hospital and park"
        >
          {/* roads: three horizontal streets linked by one vertical street, plus a spur to each building's door */}
          {ROAD_SEGMENTS.map((segment) => (
            <line
              key={segment.id}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              className="town-map__road-spur"
              strokeWidth={ROAD_HALF_WIDTH * 2}
            />
          ))}

          {BUILDINGS.filter((building) => !building.noStop).map((building) => {
            const door = doorPoint(building)
            return (
              <g
                key={building.id}
                className={nearBuilding?.id === building.id ? 'building building--near' : 'building'}
              >
                <circle cx={door.x} cy={door.y} r={10} className="building__door-marker" />
                {visited.has(building.id) && (
                  <text x={door.x} y={door.y - 16} textAnchor="middle" className="building__visited-check">
                    ✓
                  </text>
                )}
              </g>
            )
          })}

          {!hatCollected && (
            <image
              href={hatSprite}
              x={UNICAMP_DOOR.x - PICKUP_WIDTH / 2}
              y={UNICAMP_DOOR.y - PICKUP_HEIGHT - 4}
              width={PICKUP_WIDTH}
              height={PICKUP_HEIGHT}
              className="town-pickup-sprite"
            />
          )}

          {hat2Available && !hat2Collected && (
            <image
              href={hatSprite}
              x={UNICAMP_DOOR.x - PICKUP_WIDTH / 2}
              y={UNICAMP_DOOR.y - PICKUP_HEIGHT - 4}
              width={PICKUP_WIDTH}
              height={PICKUP_HEIGHT}
              className="town-pickup-sprite"
            />
          )}

          {hatCollected &&
            JOB_BUILDING_IDS.filter((id) => !collectedJobs.has(id)).map((id) => {
              const door = JOB_DOORS[id]
              return (
                <text key={id} x={door.x} y={door.y - 6} textAnchor="middle" className="town-pickup-emoji">
                  👩‍💻
                </text>
              )
            })}

          {job2Available && !collectedJobs.has(SECOND_JOB_ID) && (
            <text x={UNICAMP_DOOR.x} y={UNICAMP_DOOR.y - 6} textAnchor="middle" className="town-pickup-emoji">
              👩‍💻
            </text>
          )}

          {collectedJobs.size > moneyCollectCount && (
            <text x={BANK_DOOR.x} y={BANK_DOOR.y - 6} textAnchor="middle" className="town-pickup-emoji">
              💰
            </text>
          )}

          {passportAvailable && !passportCollected && (
            <image
              href={passportSprite}
              x={AIRPORT_DOOR.x - PICKUP_WIDTH / 2}
              y={AIRPORT_DOOR.y - PICKUP_HEIGHT - 4}
              width={PICKUP_WIDTH}
              height={PICKUP_HEIGHT}
              className="town-pickup-sprite"
            />
          )}

          {passport2Available && !passport2Collected && (
            <image
              href={passportSprite}
              x={AIRPORT_DOOR.x - PICKUP_WIDTH / 2}
              y={AIRPORT_DOOR.y - PICKUP_HEIGHT - 4}
              width={PICKUP_WIDTH}
              height={PICKUP_HEIGHT}
              className="town-pickup-sprite"
            />
          )}

          {diplomaAvailable && !diplomaCollected && (
            <image
              href={diplomaSprite}
              x={HOUSE_DOOR.x - PICKUP_WIDTH / 2}
              y={HOUSE_DOOR.y - PICKUP_HEIGHT - 4}
              width={PICKUP_WIDTH}
              height={PICKUP_HEIGHT}
              className="town-pickup-sprite"
            />
          )}

          {healthIcon === 'gym' && (
            <text x={GYM_DOOR.x} y={GYM_DOOR.y - 6} textAnchor="middle" className="town-pickup-emoji">
              🏊
            </text>
          )}

          {healthIcon === 'supermarket' && (
            <text x={SUPERMARKET_DOOR.x} y={SUPERMARKET_DOOR.y - 6} textAnchor="middle" className="town-pickup-emoji">
              🍎
            </text>
          )}

          {healthIcon === 'hospital' && (
            <text x={HOSPITAL_DOOR.x} y={HOSPITAL_DOOR.y - 6} textAnchor="middle" className="town-pickup-emoji">
              🩺
            </text>
          )}

          {himVisible && (
            <>
              <ellipse cx={him.x} cy={him.y + HIM_HEIGHT / 2 - 4} rx={11} ry={5} className="player-shadow" />
              <image
                href={himSpriteSrc}
                x={him.x - HIM_WIDTH / 2}
                y={him.y - HIM_HEIGHT / 2}
                width={HIM_WIDTH}
                height={HIM_HEIGHT}
                transform={himShouldMirror ? `scale(-1 1) translate(${-2 * him.x} 0)` : undefined}
                className="player-sprite"
              />
            </>
          )}

          {companions.map(
            (companion) =>
              companion.visible && (
                <g key={companion.id}>
                  <ellipse
                    cx={companion.x}
                    cy={companion.y + COMPANION_HEIGHT / 2 - 3}
                    rx={9}
                    ry={4}
                    className="player-shadow"
                  />
                  <image
                    href={companion.sprite}
                    x={companion.x - COMPANION_WIDTH / 2}
                    y={companion.y - COMPANION_HEIGHT / 2}
                    width={COMPANION_WIDTH}
                    height={COMPANION_HEIGHT}
                    transform={
                      companion.facingLeft ? `scale(-1 1) translate(${-2 * companion.x} 0)` : undefined
                    }
                    className="player-sprite"
                  />
                </g>
              ),
          )}

          {!playerHidden && (
            <>
              <ellipse cx={player.x} cy={player.y + PLAYER_HEIGHT / 2 - 4} rx={12} ry={5} className="player-shadow" />
              <image
                href={spriteSrc}
                x={player.x - (motoActive ? vehicleWidth : PLAYER_WIDTH) / 2}
                y={player.y - (motoActive ? vehicleHeight : PLAYER_HEIGHT) / 2}
                width={motoActive ? vehicleWidth : PLAYER_WIDTH}
                height={motoActive ? vehicleHeight : PLAYER_HEIGHT}
                transform={shouldMirror ? `scale(-1 1) translate(${-2 * player.x} 0)` : undefined}
                className="player-sprite"
              />
            </>
          )}
        </svg>
      </div>

      {nearBuilding && !modalBuilding && (
        <button className="town-enter-prompt" onClick={() => enterBuilding(nearBuilding)}>
          Press Enter to go into {nearBuilding.label}
        </button>
      )}

      {modalBuilding && (
        <div className="town-modal__backdrop" onClick={() => setModalBuilding(null)}>
          <div className="town-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modalBuilding.label}</h2>
            <p>{justVisited ? modalBuilding.flavor : modalBuilding.returnFlavor}</p>
            <div className="town-modal__actions">
              <button className="town-modal__secondary" onClick={() => setModalBuilding(null)}>
                Stay in town
              </button>
              {modalBuilding.route && (
                <Link className="town-modal__primary" to={modalBuilding.route}>
                  Go inside →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
