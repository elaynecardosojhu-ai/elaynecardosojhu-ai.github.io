import { CURRENT_BOOKS } from '../data/books'
import { SELECTED_PAPERS } from '../data/papers'
import profilePic from '../assets/profile-pic.jpg'
import './HomeSections.css'

// Homepage sections shown below the game, each a full-bleed panel in its own
// flat color from a same-tone complementary palette (sharp edges, no
// gradient). Sections use position: sticky so that as you scroll, each new
// section slides up and over the previous one -- a stacked-card effect.
// Content here is placeholder -- edit the JSX below for About/Contact copy,
// and src/data/books.ts / src/data/papers.ts for the reading list and papers.
export default function HomeSections() {
  return (
    <div className="home-sections">
      <section className="home-section home-section--about" id="about">
        <div className="home-section__inner home-section__inner--about">
          <img className="home-about__photo" src={profilePic} alt="Elayne" />
          <div>
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
        </div>
      </section>

      <section className="home-section home-section--books" id="books">
        <div className="home-section__inner">
          <h2 className="home-section__title">Books I am reading</h2>
          <p className="home-section__subtitle">
            Reading multiple books at once (and sometimes refusing to finish them because they are
            too good!)
          </p>
          <ul className="home-books">
            {CURRENT_BOOKS.map((book) => (
              <li key={book.title} className="home-books__item">
                {book.coverId && (
                  <a
                    className="home-books__cover-link"
                    href={book.url ?? `https://books.google.com/books?id=${book.coverId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      className="home-books__cover"
                      src={`https://books.google.com/books/content?id=${book.coverId}&printsec=frontcover&img=1&zoom=1&source=gbs_api`}
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
      </section>

      <section className="home-section home-section--papers" id="papers">
        <div className="home-section__inner">
          <h2 className="home-section__title">Selected papers (in collaboration)</h2>
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
      </section>

      <section className="home-section home-section--contact" id="contact">
        <div className="home-section__inner">
          <h2 className="home-section__title">Let's connect!</h2>
          <div className="home-contact">
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
            </ul>
            <div className="home-contact__map">
              <iframe
                title="R. Saturnino de Brito, 573 - Cidade Universitária, Campinas - SP"
                src="https://maps.google.com/maps?q=R.%20Saturnino%20de%20Brito%2C%20573%2C%20Cidade%20Universit%C3%A1ria%2C%20Campinas%20-%20SP%2C%2013083-889&t=&z=16&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
