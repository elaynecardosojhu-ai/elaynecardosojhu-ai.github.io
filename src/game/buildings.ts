export type DoorSide = 'top' | 'bottom'

export interface Building {
  id: string
  label: string
  sublabel: string
  x: number
  y: number
  width: number
  height: number
  doorSide: DoorSide
  route?: string
  flavor: string
  returnFlavor: string
}

export const MAP_WIDTH = 900
export const MAP_HEIGHT = 600

// Coordinates are hand-placed to roughly match the landmarks visible in
// src/assets/town-background.jpg (university quad top-left, bank with coins
// far left, airport top-right, gym + supermarket center-right, house bottom-
// center). Nudge x/y/width/height here if a hitbox drifts off its building.
export const BUILDINGS: Building[] = [
  {
    id: 'university',
    label: 'The University',
    sublabel: 'Projects & Research',
    x: 259,
    y: 135,
    width: 130,
    height: 90,
    doorSide: 'bottom',
    route: '/projects',
    flavor: 'You step onto campus to review the latest experiments and write-ups.',
    returnFlavor: 'Back on campus — the research keeps evolving.',
  },
  {
    id: 'bank',
    label: 'The Bank',
    sublabel: 'Resume',
    x: 8,
    y: 200,
    width: 110,
    height: 80,
    doorSide: 'bottom',
    route: '/resume',
    flavor: 'You pull your employment and education record from the vault.',
    returnFlavor: 'The teller already knows your file by heart.',
  },
  {
    id: 'airport',
    label: 'The Airport',
    sublabel: 'Contact',
    x: 646,
    y: 105,
    width: 130,
    height: 90,
    doorSide: 'bottom',
    route: '/contact',
    flavor: 'You check the arrivals board — looks like someone wants to get in touch.',
    returnFlavor: 'Still no new arrivals, but the gate is always open.',
  },
  {
    id: 'house',
    label: 'The House',
    sublabel: 'About Me',
    x: 413,
    y: 422,
    width: 110,
    height: 80,
    doorSide: 'top',
    route: '/about',
    flavor: 'You head home and put your feet up. This is where the story starts.',
    returnFlavor: "Back home again — nothing's changed, but it's good to visit.",
  },
  {
    id: 'gym',
    label: 'The Gym',
    sublabel: 'Just for fun',
    x: 512,
    y: 220,
    width: 110,
    height: 90,
    doorSide: 'bottom',
    flavor: 'You sneak in a quick workout. Discipline off the clock helps the work on it.',
    returnFlavor: 'Still keeping up the habit.',
  },
  {
    id: 'supermarket',
    label: 'The Supermarket',
    sublabel: 'Just for fun',
    x: 701,
    y: 220,
    width: 110,
    height: 90,
    doorSide: 'bottom',
    flavor: 'You grab a coffee and some snacks — fuel for the next sprint.',
    returnFlavor: 'Same shelves, same snacks, still good.',
  },
]
