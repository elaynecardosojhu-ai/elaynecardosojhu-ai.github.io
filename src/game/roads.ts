import { BUILDINGS, MAP_WIDTH, type Building } from './buildings'

export interface Point {
  x: number
  y: number
}

export interface RoadSegment {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export const ROAD_HALF_WIDTH = 20

// Main street running across the image, roughly where the road with the
// bus/cars sits in town-background.jpg. Every building connects to it with a
// straight spur dropped from its door.
export const TRUNK_Y = 330
export const TRUNK_X1 = 20
export const TRUNK_X2 = MAP_WIDTH - 20

export const ROUNDABOUT_CENTER: Point = { x: 216, y: TRUNK_Y }
export const ROUNDABOUT_RADIUS = 55
export const ROUNDABOUT_ISLAND_RADIUS = 24

export function doorPoint(building: Building): Point {
  const cx = building.x + building.width / 2
  return building.doorSide === 'top' ? { x: cx, y: building.y - 10 } : { x: cx, y: building.y + building.height + 10 }
}

export const ROAD_SEGMENTS: RoadSegment[] = [
  { id: 'trunk', x1: TRUNK_X1, y1: TRUNK_Y, x2: TRUNK_X2, y2: TRUNK_Y },
  ...BUILDINGS.map((building) => {
    const door = doorPoint(building)
    return { id: `spur-${building.id}`, x1: door.x, y1: TRUNK_Y, x2: door.x, y2: door.y }
  }),
]

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(point.x - a.x, point.y - a.y)
  let t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared
  t = Math.max(0, Math.min(1, t))
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return Math.hypot(point.x - projX, point.y - projY)
}

export function isOnRoad(point: Point): boolean {
  const distToRoundabout = Math.hypot(point.x - ROUNDABOUT_CENTER.x, point.y - ROUNDABOUT_CENTER.y)
  if (distToRoundabout <= ROUNDABOUT_RADIUS) return true

  return ROAD_SEGMENTS.some(
    (segment) =>
      distanceToSegment(point, { x: segment.x1, y: segment.y1 }, { x: segment.x2, y: segment.y2 }) <=
      ROAD_HALF_WIDTH,
  )
}

export interface ParkedCar {
  id: string
  x: number
  y: number
  angle: number
  color: string
}

export const CAR_RADIUS = 11

// One parked car per building spur (skips the trunk itself), offset to one
// side of the centerline so there's still room on the other side to drive
// around it.
export const PARKED_CARS: ParkedCar[] = ROAD_SEGMENTS.filter((segment) => segment.id !== 'trunk').map(
  (segment, index) => {
    const dx = segment.x2 - segment.x1
    const dy = segment.y2 - segment.y1
    const length = Math.hypot(dx, dy) || 1
    const dirX = dx / length
    const dirY = dy / length
    const perpX = -dirY
    const perpY = dirX
    const midX = segment.x1 + dx * 0.5
    const midY = segment.y1 + dy * 0.5
    const offset = 10
    const colors = ['#4a7fd1', '#d14a4a', '#d1a74a', '#7a4ad1', '#4ad17a', '#d14aa7']
    return {
      id: `car-${segment.id}`,
      x: midX + perpX * offset,
      y: midY + perpY * offset,
      angle: (Math.atan2(dirY, dirX) * 180) / Math.PI,
      color: colors[index % colors.length],
    }
  },
)
