import { useCallback, useRef, useState } from 'react'
import { CURRENT_BOOKS } from '../data/books'
import { SELECTED_PAPERS } from '../data/papers'
import profilePic from '../assets/profile-pic.jpg'
import './HomeSections.css'

const DEFAULT_SIDEBAR_WIDTH = 400
const MIN_SIDEBAR_WIDTH = 260
const MAX_SIDEBAR_WIDTH = 560

type TabId = 'about' | 'books' | 'papers' | 'game'

const TABS: { id: TabId; label: string }[] = [
  { id: 'about', label: 'About me' },
  { id: 'books', label: 'Books I am reading' },
  { id: 'papers', label: 'Selected papers' },
  { id: 'game', label: 'About the game' },
]

// Homepage shown below the game: a sticky left sidebar (photo, name/title,
// contact info, resizable by dragging its right edge) next to a session
// area on the right. The session area has a top nav bar linking to About
// me / Books / Papers -- clicking a link swaps the content shown below it,
// instead of scrolling. Edit the JSX below for About copy, and
// src/data/books.ts / src/data/papers.ts for the reading list and papers.
export default function HomeSections() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [activeTab, setActiveTab] = useState<TabId>('about')
  const draggingRef = useRef(false)

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, event.clientX))
    setSidebarWidth(next)
  }, [])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }, [])

  return (
    <div className="home-layout">
      <aside className="home-sidebar" style={{ width: sidebarWidth }}>
        <img className="home-sidebar__photo" src={profilePic} alt="Elayne" />
        <h1 className="home-sidebar__name">Elayne Cardoso de Morais, M.A.</h1>
        <p className="home-sidebar__role">Research Software Engineer | Sociologist</p>
        <ul className="home-contact__links">
          <li>
            <svg className="home-contact__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2-8 5-8-5h16Zm0 12H4V8l8 5 8-5v10Z"
              />
            </svg>
            <span>elaynecardoso.jhu at gmail.com</span>
          </li>
          <li>
            <svg className="home-contact__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z"
              />
            </svg>
            <a href="https://www.linkedin.com/in/elaynemorais" target="_blank" rel="noreferrer">
              linkedin.com/in/elaynemorais
            </a>
          </li>
          <li>
            <svg className="home-contact__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.03a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
              />
            </svg>
            <a href="https://elaynecardosojhu-ai.github.io/" target="_blank" rel="noreferrer">
              github.com/elaynecardosojhu-ai
            </a>
          </li>
          <li>
            <svg className="home-contact__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
              />
            </svg>
            <span>Campinas / SP / Brazil</span>
          </li>
        </ul>
        <div
          className="home-sidebar__resizer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
      </aside>

      <div className="home-content">
        <nav className="home-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`home-tabs__link${activeTab === tab.id ? ' home-tabs__link--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className={`home-session${activeTab === 'about' ? ' home-session--about' : ''}`}>
          {activeTab === 'about' && (
            <div className="home-section__inner home-section__inner--about">
              <h2 className="home-section__title">A little about me</h2>
              <p>
                I'm a computer scientist, sociologist, researcher, and teacher, fascinated by how
                people perceive the world around them and how media, social media, and emerging
                technologies like AI shape the way we think, interact, and understand society.
              </p>
              <p>
                Over the years, I've worked primarily in academic environments, moving between
                computer science, the social sciences, and education. Today, I work at the
                intersection of software engineering and artificial intelligence, helping bring
                solutions developed in research environments into production in industry.
              </p>
              <p>
                When I'm not working, I'm usually being a pet mom to two dogs and a cat, swimming,
                reading a book, or exploring the worlds of Assassin's Creed (huge fan). I'm always
                looking for something new to learn, build, or explore.
              </p>
            </div>
          )}

          {activeTab === 'books' && (
            <div className="home-section__inner">
              <h2 className="home-section__title">Books I am reading</h2>
              <p className="home-section__subtitle">
                Reading multiple books at once (and sometimes refusing to finish them because they
                are too good!)
              </p>
              <ul className="home-books">
                {CURRENT_BOOKS.map((book) => (
                  <li key={book.title} className="home-books__item">
                    {(book.coverId || book.coverUrl) && (
                      <a
                        className="home-books__cover-link"
                        href={book.url ?? `https://books.google.com/books?id=${book.coverId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="home-books__cover"
                          src={
                            book.coverUrl ??
                            `https://books.google.com/books/content?id=${book.coverId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`
                          }
                          alt={`Cover of ${book.title}`}
                          loading="lazy"
                        />
                      </a>
                    )}
                    <div className="home-books__info">
                      <p className="home-books__title">
                        {book.url ? (
                          <a href={book.url} target="_blank" rel="noreferrer">
                            {book.title}
                          </a>
                        ) : (
                          book.title
                        )}
                      </p>
                      <span className="home-books__author">{book.author}</span>
                      {book.note && <p className="home-books__note">{book.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'papers' && (
            <div className="home-section__inner">
              <h2 className="home-section__title">Selected papers (in collaboration)</h2>
              <p className="home-papers__intro">
                I collaborate with researchers throughout the development of their projects,
                providing technical input and helping address challenges that arise along the
                way. This includes investigating data inconsistencies, improving data workflows,
                evaluating technical approaches, refactoring research code, and making solutions
                more robust and maintainable. I participate in the papers revision prior to
                submission, providing feedback on technical aspects, methodology implementation,
                and the clarity of how the work is presented. I ultimately lead the deployment of
                resulting solutions from experimental environments into production, making them
                available for practical use by teams in the industry.
              </p>
              <ul className="home-papers">
                {SELECTED_PAPERS.map((paper) => (
                  <li key={paper.title} className="home-papers__item">
                    <p className="home-papers__title">
                      {paper.url ? (
                        <a href={paper.url} target="_blank" rel="noreferrer">
                          {paper.title}
                        </a>
                      ) : (
                        paper.title
                      )}
                    </p>
                    <p className="home-papers__authors">{paper.authors}</p>
                    {paper.venue && <p className="home-papers__venue">{paper.venue}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'game' && (
            <div className="home-section__inner">
              <h2 className="home-game__heading">Concept</h2>
              <p>
                The game in this homepage is a small playable retelling of my own path. Each
                building is a real stop along the way. Walking around the town, collecting a
                diploma, taking on jobs, and saving up for a car is a lighthearted way of tracing
                how I got from student to researcher to software engineer.
              </p>

              <h2 className="home-game__heading">Curious how to build it?</h2>
              <p>
                Here's a walkthrough of the ideas behind it, with small code snippets along the
                way.
              </p>

              <h3 className="home-game__subheading">1. The stack</h3>
              <p>
                It's built with React, TypeScript and Vite — no game engine involved. The whole
                map is just SVG shapes drawn over a background image, animated with plain CSS.
              </p>

              <h3 className="home-game__subheading">2. The world is just data</h3>
              <p>
                Instead of hard-coding each building into the page, every building is one entry in
                a plain list: where it sits, how big it is, and what text it shows. Adding a new
                building means adding one object to this list — the map draws itself from it.
              </p>
              <pre className="home-game__code">
                <code>{`const BUILDINGS = [
  { id: 'house', label: 'House', x: 400, y: 340, width: 130, height: 90 },
  { id: 'airport', label: 'Airport', x: 430, y: 200, width: 220, height: 90 },
  // ...
]`}</code>
              </pre>

              <h3 className="home-game__subheading">3. One loop runs the whole game</h3>
              <p>
                Every frame, the game reads which keys are pressed, moves the player a little, and
                checks what's nearby — then draws the result. This repeats continuously via{' '}
                <code>requestAnimationFrame</code>, the browser's way of saying "call me right
                before the next screen paint."
              </p>
              <pre className="home-game__code">
                <code>{`function loop() {
  updatePlayerPosition()
  checkNearbyBuildings()
  requestAnimationFrame(loop)
}`}</code>
              </pre>

              <h3 className="home-game__subheading">5. Milestones unlock each other</h3>
              <p>
                The diploma, the jobs, and the car aren't independent — each is only available once
                the one before it is done. That's just a chain of simple true/false checks.
              </p>
              <pre className="home-game__code">
                <code>{`const nextJobAvailable = hasHat && collectedJobs.size < JOBS.length`}</code>
              </pre>

              <h3 className="home-game__subheading">7. Shipping it</h3>
              <p>
                There's no backend. <code>vite build</code> turns everything into plain
                HTML/CSS/JS, which gets hosted directly on GitHub Pages.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

