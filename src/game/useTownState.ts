import { useCallback, useEffect, useState } from 'react'
import type { StatKey } from './buildings'

export type Stats = Record<StatKey, number>

const STATS_KEY = 'town-stats'
const VISITED_KEY = 'town-visited'
const DEFAULT_STATS: Stats = { money: 50, knowledge: 50, happiness: 50 }

function loadStats(): Stats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    if (!raw) return { ...DEFAULT_STATS }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

function loadVisited(): Set<string> {
  try {
    const raw = window.localStorage.getItem(VISITED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function useTownState() {
  const [stats, setStats] = useState<Stats>(() => loadStats())
  const [visited, setVisited] = useState<Set<string>>(() => loadVisited())

  useEffect(() => {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  }, [stats])

  useEffect(() => {
    window.localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]))
  }, [visited])

  const visit = useCallback(
    (buildingId: string, statDelta: Partial<Record<StatKey, number>>) => {
      const alreadyVisited = visited.has(buildingId)
      if (!alreadyVisited) {
        setStats((prev) => {
          const next = { ...prev }
          for (const key of Object.keys(statDelta) as StatKey[]) {
            const delta = statDelta[key] ?? 0
            next[key] = Math.min(100, Math.max(0, prev[key] + delta))
          }
          return next
        })
        setVisited((prev) => new Set(prev).add(buildingId))
      }
      return !alreadyVisited
    },
    [visited],
  )

  return { stats, visited, visit }
}
