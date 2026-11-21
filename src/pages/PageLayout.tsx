import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './PageLayout.css'

interface PageLayoutProps {
  title: string
  children: ReactNode
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="page">
      <Link to="/" className="page__back">
        ← Back to town
      </Link>
      <h1>{title}</h1>
      <div className="page__content">{children}</div>
    </div>
  )
}
