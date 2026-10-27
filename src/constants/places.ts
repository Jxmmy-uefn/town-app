import type { Href } from 'expo-router';

export type Place = {
  id: string;
  name: string;
  blurb: string;
  href: Href;
  /** Position on the town map, as a fraction of its width and height. */
  x: number;
  y: number;
  color: string;
};

// Colored blocks stand in for the AI-generated art until it exists.
export const PLACES: Place[] = [
  { id: 'arcade', name: 'Arcade', blurb: 'Play games, earn coins', href: '/arcade', x: 0.08, y: 0.1, color: '#E8735A' },
  { id: 'shop', name: 'Shop', blurb: 'Clothes and furniture', href: '/shop', x: 0.55, y: 0.18, color: '#F2B84B' },
  { id: 'town-hall', name: 'Town Hall', blurb: 'Rules and news', href: '/town-hall', x: 0.3, y: 0.42, color: '#7A8CE0' },
  { id: 'park', name: 'Park', blurb: 'Friends and chat', href: '/park', x: 0.08, y: 0.7, color: '#5DB37E' },
  { id: 'house', name: 'Your House', blurb: 'Decorate your room', href: '/house', x: 0.55, y: 0.66, color: '#C77DBA' },
];
