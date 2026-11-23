import { CURRENT_BOOKS } from '../data/books'
import { SELECTED_PAPERS } from '../data/papers'
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
        <div className="home-section__inner">
          <h2 className="home-section__title">About me</h2>
          <p>
            Hi, I'm Elayne — welcome to my corner of the internet. (Placeholder bio — replace this
            with your real story: background, interests, what you're working toward.)
          </p>
        </div>
      </section>

      <section className="home-section home-section--books" id="books">
        <div className="home-section__inner">
          <h2 className="home-section__title">Books I am reading</h2>
          <p className="home-section__subtitle">
            Yes, I read multiple books at once, and some I refuse to finish because I love them so
            much.
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

      <section className="home-section home-section--contact" id="contact">
        <div className="home-section__inner">
          <h2 className="home-section__title">Contact me</h2>
          <div className="home-contact">
            <div className="home-contact__photo" aria-hidden="true">
              Photo
            </div>
            <p>(Placeholder — add your email, LinkedIn, or a contact form here.)</p>
          </div>
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
    </div>
  )
}
