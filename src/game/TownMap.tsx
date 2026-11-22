import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import meFront from '../assets/characters/me-front.png'
import meBack from '../assets/characters/me-back.png'
import meWalk from '../assets/characters/me-walk.png'
import meWalk2 from '../assets/characters/me-walk-2.png'
import himWalk from '../assets/characters/him-walk.png'
import himWalk2 from '../assets/characters/him-walk-2.png'
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
const TOTAL_STOPS = BUILDINGS.filter((building) => !building.noStop).length

// Placeholder baseline levels for the stats that aren't yet tied to a game
// mechanic -- easy to tune later, or wire up to real events (e.g. visiting
// specific buildings). Exploration is already driven by buildings visited.
const BASE_HAPPINESS = 70
const BASE_EDUCATION = 85
const BASE_HEALTH = 60

const CELEBRATION_EMOJIS = ['🎉', '👰', '💍', '🤵', '🎶', '🎊', '💍', '👰']
const CELEBRATION_DURATION_MS = 2600
interface CelebrationParticle {
  emoji: string
  left: number
  delay: number
  duration: number
  drift: number
  spin: number
}
const CELEBRATION_PARTICLES: CelebrationParticle[] = CELEBRATION_EMOJIS.map((emoji, i) => ({
  emoji,
  left: -70 + i * 20 + (i % 2 === 0 ? -6 : 6),
  delay: (i % 4) * 140,
  duration: 1700 + (i % 3) * 220,
  drift: (i % 2 === 0 ? -1 : 1) * (30 + (i % 3) * 18),
  spin: (i % 2 === 0 ? -1 : 1) * (15 + (i % 3) * 10),
}))

function isOnHorizontalRoad(y: number): boolean {
  return HIM_ROWS.some((rowY) => Math.abs(y - rowY) <= ROAD_HALF_WIDTH)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Builds a simple road-following route from any point on the grid to the
// church door: over to the vertical connector, up/down to road 1, across to
// the church, then down its spur to the door.
function buildPathToChurch(start: Point): Point[] {
  const path: Point[] = []
  if (Math.abs(start.x - VERTICAL_ROAD_X) > 1) path.push({ x: VERTICAL_ROAD_X, y: start.y })
  if (Math.abs(start.y - ROAD1_Y) > 1) path.push({ x: VERTICAL_ROAD_X, y: ROAD1_Y })
  path.push({ x: CHURCH_DOOR.x, y: ROAD1_Y })
  path.push(CHURCH_DOOR)
  return path
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
  const [himVisible, setHimVisible] = useState(true)
  const [isEscorting, setIsEscorting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const today = formatToday()

  const stats = {
    happiness: BASE_HAPPINESS,
    education: BASE_EDUCATION,
    health: BASE_HEALTH,
    exploration: TOTAL_STOPS > 0 ? Math.round((visited.size / TOTAL_STOPS) * 100) : 0,
  }

  const pressedKeys = useRef(new Set<string>())
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number | null>(null)
  const playerRef = useRef(player)
  const walkFrameCounterRef = useRef(0)
  const himMoveRef = useRef<HimMoveState>({ x: ROAD_X1, y: ROAD2_Y, axis: 'horizontal', sign: 1 })
  const himWalkFrameCounterRef = useRef(0)
  const himVisibleRef = useRef(true)
  const isEscortingRef = useRef(false)
  const escortPathRef = useRef<Point[]>([])
  const escortIndexRef = useRef(0)
  const celebrationTimeoutRef = useRef<number | null>(null)
  playerRef.current = player
  himVisibleRef.current = himVisible
  isEscortingRef.current = isEscorting

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
          // Arrived: separate, hide him, hand control back to the player, and celebrate.
          setIsEscorting(false)
          isEscortingRef.current = false
          setHimVisible(false)
          himVisibleRef.current = false
          setIsMoving(false)
          pressedKeys.current.clear()
          setShowCelebration(true)
          if (celebrationTimeoutRef.current !== null) window.clearTimeout(celebrationTimeoutRef.current)
          celebrationTimeoutRef.current = window.setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS)
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
              setHimFacingLeft(dirX < 0)
            }
            setHim({ x: nextPlayer.x - dirX * ESCORT_TRAIL_OFFSET, y: nextPlayer.y - dirY * ESCORT_TRAIL_OFFSET })
            setIsMoving(true)

            walkFrameCounterRef.current += 1
            if (walkFrameCounterRef.current >= WALK_FRAME_SKIP) {
              walkFrameCounterRef.current = 0
              setWalkFrame((f) => (f === 0 ? 1 : 0))
              setHimWalkFrame((f) => (f === 0 ? 1 : 0))
            }
          }
        }

        frameRef.current = requestAnimationFrame(step)
        return
      }

      if (!modalBuilding) {
        const keys = pressedKeys.current
        let dx = 0
        let dy = 0
        if (keys.has('arrowup') || keys.has('w')) dy -= 1
        if (keys.has('arrowdown') || keys.has('s')) dy += 1
        if (keys.has('arrowleft') || keys.has('a')) dx -= 1
        if (keys.has('arrowright') || keys.has('d')) dx += 1

        if (dx !== 0 || dy !== 0) {
          const length = Math.hypot(dx, dy)
          const stepX = (dx / length) * MOVE_SPEED * dt
          const stepY = (dy / length) * MOVE_SPEED * dt

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

          if (moved) {
            walkFrameCounterRef.current += 1
            if (walkFrameCounterRef.current >= WALK_FRAME_SKIP) {
              walkFrameCounterRef.current = 0
              setWalkFrame((f) => (f === 0 ? 1 : 0))
            }
            setIsMoving(true)
          } else {
            walkFrameCounterRef.current = 0
            setIsMoving(false)
          }
        } else {
          walkFrameCounterRef.current = 0
          setIsMoving(false)
        }
      } else {
        walkFrameCounterRef.current = 0
        setIsMoving(false)
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
        const current = playerRef.current
        const caughtDist = Math.hypot(current.x - nextHimState.x, current.y - nextHimState.y)
        if (!modalBuilding && caughtDist < CATCH_RADIUS) {
          escortPathRef.current = buildPathToChurch(current)
          escortIndexRef.current = 0
          setIsEscorting(true)
          isEscortingRef.current = true
          pressedKeys.current.clear()
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
    }
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

  const spriteSrc = isMoving ? (walkFrame === 0 ? meWalk : meWalk2) : nearBuilding ? meBack : meFront
  const shouldMirror = isMoving && facingLeft
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

        {showCelebration && (
          <div
            className="town-celebration"
            style={{ left: `${(CHURCH_DOOR.x / MAP_WIDTH) * 100}%`, top: `${(CHURCH_DOOR.y / MAP_HEIGHT) * 100}%` }}
          >
            {CELEBRATION_PARTICLES.map((p, i) => (
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

          <ellipse cx={player.x} cy={player.y + PLAYER_HEIGHT / 2 - 4} rx={12} ry={5} className="player-shadow" />
          <image
            href={spriteSrc}
            x={player.x - PLAYER_WIDTH / 2}
            y={player.y - PLAYER_HEIGHT / 2}
            width={PLAYER_WIDTH}
            height={PLAYER_HEIGHT}
            transform={shouldMirror ? `scale(-1 1) translate(${-2 * player.x} 0)` : undefined}
            className="player-sprite"
          />
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
