import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import meCharacter from '../assets/me-character.png'
import townBackground from '../assets/town-profile.jpg'
import { BUILDINGS, MAP_HEIGHT, MAP_WIDTH, type Building } from './buildings'
import {
  doorPoint,
  isOnRoad,
  ROAD_HALF_WIDTH,
  ROAD_SEGMENTS,
  ROAD2_Y,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TownMap() {
  const { visited, visit } = useTownState()
  const [player, setPlayer] = useState<Point>({ x: VERTICAL_ROAD_X, y: ROAD2_Y })
  const [facingLeft, setFacingLeft] = useState(false)
  const [nearBuilding, setNearBuilding] = useState<Building | null>(null)
  const [modalBuilding, setModalBuilding] = useState<Building | null>(null)
  const [justVisited, setJustVisited] = useState(false)
  const today = formatToday()

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
          if (!isOnRoad({ x: nextX, y: nextY })) {
            nextX = current.x
          }
          nextY = clamp(current.y + stepY, PLAYER_RADIUS, MAP_HEIGHT - PLAYER_RADIUS)
          if (!isOnRoad({ x: nextX, y: nextY })) {
            nextY = current.y
          }

          if (nextX !== current.x || nextY !== current.y) {
            setPlayer({ x: nextX, y: nextY })
            if (nextX !== current.x) setFacingLeft(nextX < current.x)
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
    const gained = visit(building.id)
    setJustVisited(gained)
    setModalBuilding(building)
  }

  return (
    <div className="town">
      <div className="town-map-wrap">
        <img src={townBackground} alt="" className="town-map-wrap__background" />
        <div className="town-hud-date">{today}</div>
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

          {BUILDINGS.map((building) => {
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

          <ellipse cx={player.x} cy={player.y + PLAYER_HEIGHT / 2 - 4} rx={12} ry={5} className="player-shadow" />
          <image
            href={meCharacter}
            x={player.x - PLAYER_WIDTH / 2}
            y={player.y - PLAYER_HEIGHT / 2}
            width={PLAYER_WIDTH}
            height={PLAYER_HEIGHT}
            transform={facingLeft ? `scale(-1 1) translate(${-2 * player.x} 0)` : undefined}
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
