import { BUILDINGS, type Building } from './buildings'

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

// Three horizontal streets (one per building row) linked by a single
// vertical street, matching the ladder layout of town-profile.jpg.
export const ROAD_X1 = 20
export const ROAD_X2 = 880

export const ROAD1_Y = 160 // TJSP / Elite School / Kenlo Software
export const ROAD2_Y = 300 // Unicamp / Airport / Bank
export const ROAD3_Y = 440 // Gym / Supermarket / House / Hospital / Park

export const VERTICAL_ROAD_X = 330
export const VERTICAL_ROAD_Y1 = ROAD1_Y
export const VERTICAL_ROAD_Y2 = ROAD3_Y

const ROW_TRUNK_Y: Record<number, number> = {
  60: ROAD1_Y,
  200: ROAD2_Y,
  340: ROAD3_Y,
}

export function doorPoint(building: Building): Point {
  return { x: building.x + building.width / 2, y: building.y + building.height + 10 }
}

export const ROAD_SEGMENTS: RoadSegment[] = [
  { id: 'road-1', x1: ROAD_X1, y1: ROAD1_Y, x2: ROAD_X2, y2: ROAD1_Y },
  { id: 'road-2', x1: ROAD_X1, y1: ROAD2_Y, x2: ROAD_X2, y2: ROAD2_Y },
  { id: 'road-3', x1: ROAD_X1, y1: ROAD3_Y, x2: ROAD_X2, y2: ROAD3_Y },
  { id: 'road-vertical', x1: VERTICAL_ROAD_X, y1: VERTICAL_ROAD_Y1, x2: VERTICAL_ROAD_X, y2: VERTICAL_ROAD_Y2 },
  ...BUILDINGS.map((building) => {
    const door = doorPoint(building)
    const trunkY = ROW_TRUNK_Y[building.y] ?? ROAD3_Y
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
  return ROAD_SEGMENTS.some(
    (segment) =>
      distanceToSegment(point, { x: segment.x1, y: segment.y1 }, { x: segment.x2, y: segment.y2 }) <=
      ROAD_HALF_WIDTH,
  )
}
