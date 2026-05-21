import {
  UtensilsCrossed,
  Car,
  Zap,
  Tv2,
  HeartPulse,
  Briefcase,
  Package,
  Plane,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps a category's `iconName` (stored in the DB) to a Lucide icon component.
 * Keep entries lowercase + kebab-case to match how the seed data is shaped.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  utensils:      UtensilsCrossed,
  car:           Car,
  zap:           Zap,
  film:          Tv2,
  'heart-pulse': HeartPulse,
  briefcase:     Briefcase,
  package:       Package,
  plane:         Plane,
};

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Receipt;
  return categoryIconMap[iconName] ?? Receipt;
}

/**
 * Builds a 15% opacity background colour from a category hex.
 * "26" in hex = 38/255 ≈ 0.15 → an 8-digit hex like #FF6B6B26.
 * Used as an inline style for the small category-icon tiles.
 */
export function getCategoryBg(colourHex: string): string {
  return colourHex + '26';
}
