// Books currently being read, shown in the "Books I am reading" section on
// the home page. Edit this list whenever the reading pile changes, then
// commit + redeploy -- see the note in src/sections/HomeSections.tsx for why
// this is a plain data file instead of an editable form.
//
// `coverId` is the Google Books volume id (the `id=...` param in a
// books.google.com URL) -- used to build a cover thumbnail via Google's
// public content endpoint, no API key needed.
export interface BookEntry {
  title: string
  author: string
  note?: string
  url?: string
  coverId?: string
}

export const CURRENT_BOOKS: BookEntry[] = [
  {
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    url: 'https://books.google.com.br/books?id=tlhFtmTixvwC&pg=PT25&source=gbs_toc_r&cad=1#v=onepage&q&f=false',
    coverId: 'tlhFtmTixvwC',
  },
  {
    title: 'There Is No Antimemetics Division',
    author: 'qntm',
    url: 'https://books.google.com.br/books?id=rGxMEQAAQBAJ&pg=PA3&source=gbs_toc_r&cad=1#v=onepage&q&f=false',
    coverId: 'rGxMEQAAQBAJ',
  },
  {
    title: 'Quincas Borba',
    author: 'Machado de Assis',
    url: 'https://books.google.com.br/books?id=9PqnBAAAQBAJ&pg=PT70&source=gbs_toc_r&cad=1#v=onepage&q&f=false',
    coverId: '9PqnBAAAQBAJ',
  },
  {
    title: 'Bambino a Roma',
    author: 'Chico Buarque, Raul Loureiro (ill.)',
    url: 'https://www.amazon.com.br/dp/8535938761',
  },
]
