import { BUILDINGS, MAP_HEIGHT, MAP_WIDTH } from './buildings'

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
export const ROUNDABOUT_CENTER: Point = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }
export const ROUNDABOUT_RADIUS = 70
export const ROUNDABOUT_ISLAND_RADIUS = 30

function doorPoint(building: (typeof BUILDINGS)[number]): Point {
  return { x: building.x + building.width / 2, y: building.y + building.height + 14 }
}

function pointOnRoundaboutEdge(door: Point): Point {
  const dx = door.x - ROUNDABOUT_CENTER.x
  const dy = door.y - ROUNDABOUT_CENTER.y
  const dist = Math.hypot(dx, dy) || 1
  return {
    x: ROUNDABOUT_CENTER.x + (dx / dist) * ROUNDABOUT_RADIUS,
    y: ROUNDABOUT_CENTER.y + (dy / dist) * ROUNDABOUT_RADIUS,
  }
}

// Each building gets a straight road arm running from its door to the edge of
// the central roundabout, so every building is reachable only by road.
export const ROAD_SEGMENTS: RoadSegment[] = BUILDINGS.map((building) => {
  const door = doorPoint(building)
  const edge = pointOnRoundaboutEdge(door)
  return { id: `road-${building.id}`, x1: door.x, y1: door.y, x2: edge.x, y2: edge.y }
})

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
  const distToCenter = Math.hypot(point.x - ROUNDABOUT_CENTER.x, point.y - ROUNDABOUT_CENTER.y)
  if (distToCenter <= ROUNDABOUT_RADIUS) return true

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

export const CAR_RADIUS = 13

// One parked car per road arm, offset to one side of the centerline so there's
// still room on the other side to drive around it.
export const PARKED_CARS: ParkedCar[] = ROAD_SEGMENTS.map((segment, index) => {
  const dx = segment.x2 - segment.x1
  const dy = segment.y2 - segment.y1
  const length = Math.hypot(dx, dy) || 1
  const dirX = dx / length
  const dirY = dy / length
  const perpX = -dirY
  const perpY = dirX
  const t = 0.55
  const midX = segment.x1 + dx * t
  const midY = segment.y1 + dy * t
  const offset = 11
  const colors = ['#4a7fd1', '#d14a4a', '#d1a74a', '#7a4ad1']
  return {
    id: `car-${segment.id}`,
    x: midX + perpX * offset,
    y: midY + perpY * offset,
    angle: (Math.atan2(dirY, dirX) * 180) / Math.PI,
    color: colors[index % colors.length],
  }
})
