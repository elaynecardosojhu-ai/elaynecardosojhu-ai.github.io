import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import townBackground from '../assets/town-background.jpg'
import { BUILDINGS, MAP_HEIGHT, MAP_WIDTH, type Building } from './buildings'
import {
  CAR_RADIUS,
  isOnRoad,
  PARKED_CARS,
  ROAD_HALF_WIDTH,
  ROAD_SEGMENTS,
  ROUNDABOUT_CENTER,
  ROUNDABOUT_ISLAND_RADIUS,
  ROUNDABOUT_RADIUS,
  type Point,
} from './roads'
import { useTownState } from './useTownState'
import './TownMap.css'

const PLAYER_RADIUS = 10
const MOVE_SPEED = 220 // px per second
const DOOR_TRIGGER_RADIUS = 46
const CAR_COLLISION_GAP = 3

const TREES: Point[] = [
  { x: 40, y: 40 },
  { x: 860, y: 40 },
  { x: 40, y: 560 },
  { x: 860, y: 560 },
  { x: 300, y: 40 },
  { x: 600, y: 560 },
  { x: 40, y: 300 },
  { x: 860, y: 300 },
]

function doorPoint(building: Building): Point {
  return { x: building.x + building.width / 2, y: building.y + building.height + 14 }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hitsParkedCar(point: Point) {
  return PARKED_CARS.some(
    (car) => Math.hypot(point.x - car.x, point.y - car.y) < PLAYER_RADIUS + CAR_RADIUS + CAR_COLLISION_GAP,
  )
}

interface CarShapeProps {
  x: number
  y: number
  angle: number
  color: string
  className?: string
}

function CarShape({ x, y, angle, color, className }: CarShapeProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} className={className}>
      <rect x={-13} y={-7} width={26} height={14} rx={4} className="car__body" style={{ fill: color }} />
      <rect x={-5} y={-5} width={11} height={10} rx={2} className="car__window" />
    </g>
  )
}

export default function TownMap() {
  const { stats, visited, visit } = useTownState()
  const [player, setPlayer] = useState<Point>({ ...ROUNDABOUT_CENTER })
  const [facingAngle, setFacingAngle] = useState(0)
  const [nearBuilding, setNearBuilding] = useState<Building | null>(null)
  const [modalBuilding, setModalBuilding] = useState<Building | null>(null)
  const [justVisited, setJustVisited] = useState(false)

  const pressedKeys = useRef(new Set<string>())
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number | null>(null)
  const playerRef = useRef(player)
  playerRef.current = player

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
          let nextX = clamp(current.x + stepX, PLAYER_RADIUS, MAP_WIDTH - PLAYER_RADIUS)
          let nextY = current.y
          if (!isOnRoad({ x: nextX, y: nextY }) || hitsParkedCar({ x: nextX, y: nextY })) {
            nextX = current.x
          }
          nextY = clamp(current.y + stepY, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS)
          if (!isOnRoad({ x: nextX, y: nextY }) || hitsParkedCar({ x: nextX, y: nextY })) {
            nextY = current.y
          }

          if (nextX !== current.x || nextY !== current.y) {
            setPlayer({ x: nextX, y: nextY })
            setFacingAngle((Math.atan2(nextY - current.y, nextX - current.x) * 180) / Math.PI)
          }
        }
      }

      frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [modalBuilding])

  useEffect(() => {
    let closest: Building | null = null
    let closestDist = Infinity
    for (const building of BUILDINGS) {
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
    const gained = visit(building.id, building.statDelta)
    setJustVisited(gained)
    setModalBuilding(building)
  }

  const statBars = useMemo(
    () => [
      { key: 'money', label: '💰 Money', value: stats.money },
      { key: 'knowledge', label: '🧠 Knowledge', value: stats.knowledge },
      { key: 'happiness', label: '😊 Happiness', value: stats.happiness },
    ],
    [stats],
  )

  return (
    <div className="town">
      <div className="town-hud">
        <div className="town-hud__title">Elayne's Town</div>
        <div className="town-hud__stats">
          {statBars.map((stat) => (
            <div className="town-stat" key={stat.key}>
              <span className="town-stat__label">{stat.label}</span>
              <div className="town-stat__bar">
                <div className="town-stat__fill" style={{ width: `${stat.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="town-hud__hint">
          Drive along the roads with arrow keys / WASD — the other cars won't move, so steer around
          them. Press Enter near a building to go inside.
        </div>
      </div>

      <div className="town-map-wrap">
        <img src={townBackground} alt="" className="town-map-wrap__background" />
        <svg
          className="town-map"
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          role="img"
          aria-label="A small town map with a central roundabout and roads leading to four buildings"
        >
          <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="town-map__grass" />

        {TREES.map((tree, index) => (
          <circle key={`tree-${index}`} cx={tree.x} cy={tree.y} r={18} className="town-map__tree" />
        ))}

        {/* roads: straight arms from each building's door to the central roundabout */}
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

        <circle
          cx={ROUNDABOUT_CENTER.x}
          cy={ROUNDABOUT_CENTER.y}
          r={ROUNDABOUT_RADIUS}
          className="town-map__roundabout"
        />
        <circle
          cx={ROUNDABOUT_CENTER.x}
          cy={ROUNDABOUT_CENTER.y}
          r={ROUNDABOUT_ISLAND_RADIUS}
          className="town-map__roundabout-island"
        />

        {BUILDINGS.map((building) => (
          <g key={building.id} className={nearBuilding?.id === building.id ? 'building building--near' : 'building'}>
            <rect
              x={building.x}
              y={building.y}
              width={building.width}
              height={building.height}
              className="building__body"
              style={{ fill: building.color }}
            />
            <polygon
              points={`${building.x - 8},${building.y} ${building.x + building.width + 8},${building.y} ${building.x + building.width / 2},${building.y - 40}`}
              style={{ fill: building.roofColor }}
            />
            <rect
              x={building.x + building.width / 2 - 14}
              y={building.y + building.height - 36}
              width={28}
              height={36}
              className="building__door"
            />
            <text
              x={building.x + building.width / 2}
              y={building.y - 50}
              textAnchor="middle"
              className="building__label"
            >
              {building.label}
            </text>
            <text
              x={building.x + building.width / 2}
              y={building.y + building.height + 30}
              textAnchor="middle"
              className="building__sublabel"
            >
              {visited.has(building.id) ? '✓ ' : ''}
              {building.sublabel}
            </text>
          </g>
        ))}

        <circle cx={player.x} cy={player.y} r={PLAYER_RADIUS} className="player-shadow" />
        {PARKED_CARS.map((car) => (
          <CarShape key={car.id} x={car.x} y={car.y} angle={car.angle} color={car.color} className="car--npc" />
        ))}
        <CarShape x={player.x} y={player.y} angle={facingAngle} color="#e54b4b" className="car--player" />
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
            {justVisited && (
              <p className="town-modal__gains">
                {Object.entries(modalBuilding.statDelta)
                  .map(([key, value]) => `+${value} ${key}`)
                  .join('  ·  ')}
              </p>
            )}
            <div className="town-modal__actions">
              <button className="town-modal__secondary" onClick={() => setModalBuilding(null)}>
                Stay in town
              </button>
              <Link className="town-modal__primary" to={modalBuilding.route}>
                Go inside →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
