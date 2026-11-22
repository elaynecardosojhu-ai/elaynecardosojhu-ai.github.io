export interface Building {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  route?: string
  flavor: string
  returnFlavor: string
  /** Skip rendering a door marker / proximity trigger for this building. */
  noStop?: boolean
  /** Nudge the computed door point horizontally to better meet the artwork's door. */
  doorOffsetX?: number
}

// Matches the aspect ratio of src/assets/town-profile.jpg (1672 x 941).
export const MAP_WIDTH = 900
export const MAP_HEIGHT = 507

// Coordinates are hand-placed to roughly match the buildings visible in
// src/assets/town-profile.jpg, which already has every building labeled on
// its sign, so the map itself doesn't need to draw text labels — just a
// door marker near each entrance. Nudge x/y/width/height here if a hitbox
// drifts off its building. Every building's door faces straight down onto
// the road below its row.
export const BUILDINGS: Building[] = [
  // Row 1 — top street: Church, TJSP, Elite School, Kenlo Software
  {
    id: 'church',
    label: 'Church',
    x: 90,
    y: 60,
    width: 110,
    height: 90,
    flavor: 'A quiet moment to catch your breath before the next chapter.',
    returnFlavor: 'Still peaceful in here.',
  },
  {
    id: 'tjsp',
    label: 'TJSP',
    x: 220,
    y: 60,
    width: 100,
    height: 90,
    flavor: 'Yes, I worked here! True story.',
    returnFlavor: 'Still standing tall — good memories in this building.',
  },
  {
    id: 'elite-school',
    label: 'Elite School',
    x: 330,
    y: 60,
    width: 130,
    height: 90,
    doorOffsetX: 18,
    flavor: 'Where it all started — early mornings, uniforms, and a lot of homework.',
    returnFlavor: 'Still hear the school bell every time I walk by.',
  },
  {
    id: 'kenlo-software',
    label: 'Kenlo Software',
    x: 510,
    y: 60,
    width: 130,
    height: 90,
    doorOffsetX: 18,
    flavor: "This is where I currently work — building software, one feature at a time.",
    returnFlavor: 'Still clocked in — the work keeps evolving.',
  },

  // Row 2 — middle street: University Unicamp, Airport, Bank
  {
    id: 'unicamp',
    label: 'Unicamp',
    x: 40,
    y: 200,
    width: 170,
    height: 90,
    route: '/resume',
    flavor: 'You walk through the quad, remembering lectures and late nights in the library. Time to check the transcript.',
    returnFlavor: 'Back on campus — some things never change.',
  },
  {
    id: 'airport',
    label: 'Airport',
    x: 430,
    y: 200,
    width: 220,
    height: 90,
    route: '/contact',
    flavor: 'You check the arrivals board — looks like someone wants to get in touch.',
    returnFlavor: 'Still no new arrivals, but the gate is always open.',
  },
  {
    id: 'bank',
    label: 'Bank',
    x: 720,
    y: 200,
    width: 130,
    height: 90,
    flavor: 'You think about setting up a way for people to support your work... maybe a Pix/donation link soon.',
    returnFlavor: 'Still just an idea — support options coming soon!',
  },

  // Row 3 — bottom street: Gym, Supermarket, House, Hospital, Park
  {
    id: 'gym',
    label: 'Gym',
    x: 40,
    y: 340,
    width: 120,
    height: 90,
    flavor: 'You sneak in a quick workout. Discipline off the clock helps the work on it.',
    returnFlavor: 'Still keeping up the habit.',
  },
  {
    id: 'supermarket',
    label: 'Supermarket',
    x: 180,
    y: 340,
    width: 150,
    height: 90,
    flavor: 'You grab a coffee and some snacks — fuel for the next sprint.',
    returnFlavor: 'Same shelves, same snacks, still good.',
  },
  {
    id: 'house',
    label: 'House',
    x: 400,
    y: 340,
    width: 130,
    height: 90,
    route: '/about',
    flavor: 'You head home and put your feet up. This is where the story starts.',
    returnFlavor: "Back home again — nothing's changed, but it's good to visit.",
  },
  {
    id: 'hospital',
    label: 'Hospital',
    x: 600,
    y: 340,
    width: 140,
    height: 90,
    doorOffsetX: -140,
    flavor: "A reminder to take care of yourself — health comes before deadlines.",
    returnFlavor: 'All good here, just a check-up.',
  },
  {
    id: 'park',
    label: 'Park',
    x: 780,
    y: 340,
    width: 110,
    height: 90,
    flavor: 'You sit by the pond for a minute. Even side quests need a break sometimes.',
    returnFlavor: 'Still peaceful by the water.',
  },
]
