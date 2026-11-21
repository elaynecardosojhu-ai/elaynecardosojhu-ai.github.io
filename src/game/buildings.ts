export type StatKey = 'money' | 'knowledge' | 'happiness'

export interface Building {
  id: string
  label: string
  sublabel: string
  color: string
  roofColor: string
  x: number
  y: number
  width: number
  height: number
  route: string
  flavor: string
  returnFlavor: string
  statDelta: Partial<Record<StatKey, number>>
}

export const MAP_WIDTH = 900
export const MAP_HEIGHT = 600

export const BUILDINGS: Building[] = [
  {
    id: 'about',
    label: "Elayne's House",
    sublabel: 'About Me',
    color: '#f2c14e',
    roofColor: '#c0392b',
    x: 70,
    y: 380,
    width: 150,
    height: 110,
    route: '/about',
    flavor: 'You head home and put your feet up. This is where the story starts.',
    returnFlavor: "Back home again — nothing's changed, but it's good to visit.",
    statDelta: { happiness: 10 },
  },
  {
    id: 'projects',
    label: 'Research Lab',
    sublabel: 'Projects & Research',
    color: '#6fa8dc',
    roofColor: '#1c4587',
    x: 680,
    y: 380,
    width: 160,
    height: 120,
    route: '/projects',
    flavor: 'You clock in at the lab to review the latest experiments and write-ups.',
    returnFlavor: 'Back at the lab — the research keeps evolving.',
    statDelta: { knowledge: 15 },
  },
  {
    id: 'resume',
    label: 'Records Office',
    sublabel: 'Resume',
    color: '#b4a7d6',
    roofColor: '#45277a',
    x: 70,
    y: 80,
    width: 150,
    height: 110,
    route: '/resume',
    flavor: 'You pull the employment and education records from the file room.',
    returnFlavor: 'The clerk already knows your file by heart.',
    statDelta: { knowledge: 5, money: 5 },
  },
  {
    id: 'contact',
    label: 'Post Office',
    sublabel: 'Contact',
    color: '#93c47d',
    roofColor: '#38761d',
    x: 670,
    y: 80,
    width: 150,
    height: 110,
    route: '/contact',
    flavor: 'You check the mailbox — looks like someone wants to get in touch.',
    returnFlavor: 'Still no new mail, but the door is always open.',
    statDelta: { happiness: 5, money: 5 },
  },
]
