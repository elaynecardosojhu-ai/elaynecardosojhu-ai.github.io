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
// src/assets/town-background.jpg. The campus/courthouse/airport cluster sits
// along an "upper" road near the top of the image; bank/house/gym/supermarket
// sit along the "lower" main street — see roads.ts for how those connect.
// Nudge x/y/width/height here if a hitbox drifts off its building.
export const BUILDINGS: Building[] = [
  {
    id: 'university',
    label: 'The University',
    sublabel: 'Resume',
    x: 120,
    y: 50,
    width: 120,
    height: 70,
    doorSide: 'bottom',
    route: '/resume',
    flavor: 'You walk through the quad, remembering lectures and late nights in the library. Time to check the transcript.',
    returnFlavor: 'Back on campus — some things never change.',
  },
  {
    id: 'courthouse',
    label: 'The Courthouse',
    sublabel: 'Fun fact',
    x: 230,
    y: 160,
    width: 145,
    height: 85,
    doorSide: 'bottom',
    flavor: 'Yes, I worked here! True story.',
    returnFlavor: 'Still standing tall — good memories in this building.',
  },
  {
    id: 'bank',
    label: 'The Bank',
    sublabel: 'Support / Pix',
    x: 10,
    y: 215,
    width: 115,
    height: 85,
    doorSide: 'bottom',
    flavor: 'You think about setting up a way for people to support your work... maybe a Pix/donation link soon.',
    returnFlavor: 'Still just an idea — support options coming soon!',
  },
  {
    id: 'airport',
    label: 'The Airport',
    sublabel: 'International Experience',
    x: 660,
    y: 90,
    width: 125,
    height: 70,
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
    sublabel: 'Life Style',
    x: 500,
    y: 250,
    width: 120,
    height: 70,
    doorSide: 'bottom',
    flavor: 'You sneak in a quick workout. Discipline off the clock helps the work on it.',
    returnFlavor: 'Still keeping up the habit.',
  },
  {
    id: 'supermarket',
    label: 'The Supermarket',
    sublabel: 'Life Style',
    x: 705,
    y: 250,
    width: 120,
    height: 70,
    doorSide: 'bottom',
    flavor: 'You grab a coffee and some snacks — fuel for the next sprint.',
    returnFlavor: 'Same shelves, same snacks, still good.',
  },
]
