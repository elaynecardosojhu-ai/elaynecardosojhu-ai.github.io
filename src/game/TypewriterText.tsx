import { useEffect, useRef, useState } from 'react'

const TYPE_SPEED_MS = 35

interface TypewriterTextProps {
  text: string
  className?: string
}

// Types out `text` one letter at a time in a monospace "terminal" font, with
// a blinking cursor that disappears once the full sentence has been typed.
// Re-types from scratch whenever `text` changes.
export default function TypewriterText({ text, className }: TypewriterTextProps) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    setShown('')
    setDone(false)
    let i = 0
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
        setDone(true)
      }
    }, TYPE_SPEED_MS)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
    }
  }, [text])

  return (
    <span className={`typewriter-text${className ? ` ${className}` : ''}`}>
      {shown}
      {!done && <span className="typewriter-text__cursor">_</span>}
    </span>
  )
}
