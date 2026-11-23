// Books currently being read, shown in the "Books I am reading" section on
// the home page. Edit this list whenever the reading pile changes, then
// commit + redeploy -- see the note in src/sections/HomeSections.tsx for why
// this is a plain data file instead of an editable form.
export interface BookEntry {
  title: string
  author: string
  note?: string
}

export const CURRENT_BOOKS: BookEntry[] = [
  { title: 'Book Title Here', author: 'Author Name', note: 'Why you love it / where you are in it.' },
  { title: 'Another Book Title', author: 'Author Name' },
  { title: 'Yet Another Title', author: 'Author Name', note: 'This is the one you refuse to finish.' },
]
