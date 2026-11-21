import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BUILDINGS, MAP_HEIGHT, MAP_WIDTH, type Building } from './buildings'
import { useTownState } from './useTownState'
import './TownMap.css'

const PLAYER_RADIUS = 12
const MOVE_SPEED = 240 // px per second
const DOOR_TRIGGER_RADIUS = 46

interface Point {
  x: number
  y: number
}

function doorPoint(building: Building): Point {
  return { x: building.x + building.width / 2, y: building.y + building.height + 14 }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function intersectsBuilding(point: Point, building: Building) {
  return (
    point.x + PLAYER_RADIUS > building.x &&
    point.x - PLAYER_RADIUS < building.x + building.width &&
    point.y + PLAYER_RADIUS > building.y &&
    point.y - PLAYER_RADIUS < building.y + building.height
  )
}

export default function TownMap() {
  const { stats, visited, visit } = useTownState()
  const [player, setPlayer] = useState<Point>({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 })
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
          if (BUILDINGS.some((b) => intersectsBuilding({ x: nextX, y: nextY }, b))) {
            nextX = current.x
          }
          nextY = clamp(current.y + stepY, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS)
          if (BUILDINGS.some((b) => intersectsBuilding({ x: nextX, y: nextY }, b))) {
            nextY = current.y
          }

          if (nextX !== current.x || nextY !== current.y) {
            setPlayer({ x: nextX, y: nextY })
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
          Walk with arrow keys / WASD. Press Enter near a building to go inside.
        </div>
      </div>

      <svg
        className="town-map"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label="A small town map with four buildings connected by roads"
      >
        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="town-map__grass" />

        {/* roads: a ring around the central park with spurs to each building */}
        <rect x={220} y={220} width={460} height={160} rx={10} className="town-map__road" />
        {BUILDINGS.map((b) => {
          const door = doorPoint(b)
          const ringX = clamp(door.x, 240, 660)
          const ringY = clamp(door.y, 240, 360)
          return (
            <line
              key={`road-${b.id}`}
              x1={door.x}
              y1={door.y}
              x2={ringX}
              y2={ringY}
              className="town-map__road-spur"
            />
          )
        })}

        <rect x={320} y={260} width={260} height={80} rx={8} className="town-map__park" />
        <text x={450} y={305} textAnchor="middle" className="town-map__park-label">
          Town Square
        </text>

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

        <circle cx={player.x} cy={player.y} r={PLAYER_RADIUS} className="player" />
      </svg>

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
