// Selected papers written in collaboration (not first-author), shown on the
// home page. Edit this list as new papers come out.
export interface PaperEntry {
  title: string
  authors: string
  venue?: string
  url?: string
}

export const SELECTED_PAPERS: PaperEntry[] = [
  {
    title: 'Paper Title Here',
    authors: 'First Author, Second Author, Elayne Cardoso, et al.',
    venue: 'Journal / Conference, Year',
    url: 'https://example.com/paper',
  },
]
