// Module M4 — Food & Drinks (SRS 3.5, FR-FOOD-01 to 11). No backend
// endpoint exists for this module (see docs/HANDOFF.md), so this static
// list is the design's own content from two user-supplied screenshots
// ("food" list and "food-detail" for Asanka Local). Only Asanka Local
// has a menu — the other three restaurants were list-view only, so
// their detail pages show an honest empty state rather than invented
// menus.
export type MenuItem = { name: string; price: string; description: string };
export type MenuSection = { category: string; items: MenuItem[] };

export type Restaurant = {
  slug: string;
  name: string;
  cuisine: string;
  priceTier: string;
  distanceKm: number;
  rating: number;
  status?: 'Open' | 'Closed';
  menu?: MenuSection[];
};

export const restaurants: Restaurant[] = [
  {
    slug: 'asanka-local',
    name: 'Asanka Local',
    cuisine: 'Ghanaian',
    priceTier: '¢¢¢',
    distanceKm: 0.8,
    rating: 4.6,
    status: 'Open',
    menu: [
      {
        category: 'Main Dishes',
        items: [
          {
            name: 'Jollof Rice with Grilled Chicken',
            price: 'GHS 45',
            description: 'Spicy rice with perfectly grilled chicken',
          },
          {
            name: 'Banku with Tilapia',
            price: 'GHS 55',
            description: 'Traditional banku served with grilled tilapia',
          },
        ],
      },
      {
        category: 'Sides',
        items: [
          {
            name: 'Fried Plantain',
            price: 'GHS 15',
            description: 'Sweet ripe plantain fried to perfection',
          },
          { name: 'Kelewele', price: 'GHS 20', description: 'Spicy fried plantain cubes' },
        ],
      },
    ],
  },
  {
    slug: 'the-silk-route',
    name: 'The Silk Route',
    cuisine: 'Continental',
    priceTier: '¢¢¢',
    distanceKm: 1.2,
    rating: 4.8,
  },
  {
    slug: 'dynasty-chinese',
    name: 'Dynasty Chinese',
    cuisine: 'Chinese',
    priceTier: '¢¢¢',
    distanceKm: 2.1,
    rating: 4.5,
  },
  {
    slug: 'tante-marie',
    name: 'Tante Marie',
    cuisine: 'Continental',
    priceTier: '¢¢¢',
    distanceKm: 1.5,
    rating: 4.7,
  },
];
