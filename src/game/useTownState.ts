import { useCallback, useEffect, useState } from 'react'

const VISITED_KEY = 'town-visited'

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
  const [visited, setVisited] = useState<Set<string>>(() => loadVisited())

  useEffect(() => {
    window.localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]))
  }, [visited])

  const visit = useCallback(
    (buildingId: string) => {
      const alreadyVisited = visited.has(buildingId)
      if (!alreadyVisited) {
        setVisited((prev) => new Set(prev).add(buildingId))
      }
      return !alreadyVisited
    },
    [visited],
  )

  return { visited, visit }
}
