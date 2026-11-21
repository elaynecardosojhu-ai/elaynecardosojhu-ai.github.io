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

// The artwork has two distinct street levels: a lower main street (where the
// bus/cars are, serving the bank/house/gym/supermarket) and an upper street
// in front of the campus/courthouse/airport cluster. A short connector ties
// them together through the roundabout so every building is reachable.
export const LOWER_TRUNK_Y = 330
export const LOWER_TRUNK_X1 = 20
export const LOWER_TRUNK_X2 = MAP_WIDTH - 20

export const UPPER_TRUNK_Y = 252
export const UPPER_TRUNK_X1 = 135
export const UPPER_TRUNK_X2 = 785

export const ROUNDABOUT_CENTER: Point = { x: 216, y: LOWER_TRUNK_Y }
export const ROUNDABOUT_RADIUS = 55
export const ROUNDABOUT_ISLAND_RADIUS = 24

const UPPER_NETWORK_IDS = new Set(['university', 'courthouse', 'airport'])

export function doorPoint(building: Building): Point {
  const cx = building.x + building.width / 2
  return building.doorSide === 'top' ? { x: cx, y: building.y - 10 } : { x: cx, y: building.y + building.height + 10 }
}

export const ROAD_SEGMENTS: RoadSegment[] = [
  { id: 'trunk-lower', x1: LOWER_TRUNK_X1, y1: LOWER_TRUNK_Y, x2: LOWER_TRUNK_X2, y2: LOWER_TRUNK_Y },
  { id: 'trunk-upper', x1: UPPER_TRUNK_X1, y1: UPPER_TRUNK_Y, x2: UPPER_TRUNK_X2, y2: UPPER_TRUNK_Y },
  { id: 'connector', x1: ROUNDABOUT_CENTER.x, y1: LOWER_TRUNK_Y, x2: ROUNDABOUT_CENTER.x, y2: UPPER_TRUNK_Y },
  ...BUILDINGS.map((building) => {
    const door = doorPoint(building)
    const trunkY = UPPER_NETWORK_IDS.has(building.id) ? UPPER_TRUNK_Y : LOWER_TRUNK_Y
    return { id: `spur-${building.id}`, x1: door.x, y1: trunkY, x2: door.x, y2: door.y }
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

// No parked NPC cars on the road anymore — just the player's car.
export const PARKED_CARS: ParkedCar[] = []
