import {
  Book,
  Briefcase,
  Bus,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  Headphones,
  HeartPulse,
  Home,
  Lightbulb,
  Package,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tv2,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps a category's `iconName` (stored in the DB) to a Lucide icon component.
 * Keys are lowercase + kebab-case to match the seed migration and any future
 * icons the picker emits.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  // Seed data (V2__seed_data.sql) — do not remove or rename without a migration.
  utensils:      UtensilsCrossed,
  car:           Car,
  zap:           Zap,
  film:          Tv2,
  'heart-pulse': HeartPulse,
  briefcase:     Briefcase,
  package:       Package,

  // Extended catalog — surfaced by the icon picker.
  plane:         Plane,
  bus:           Bus,
  fuel:          Fuel,
  home:          Home,
  shopping:      ShoppingBag,
  shirt:         Shirt,
  coffee:        Coffee,
  food:          Utensils,
  gym:           Dumbbell,
  health:        HeartPulse,
  movie:         Film,
  music:         Headphones,
  game:          Gamepad2,
  phone:         Phone,
  wifi:          Wifi,
  lightbulb:     Lightbulb,
  book:          Book,
  gift:          Gift,
  sparkles:      Sparkles,
  savings:       PiggyBank,
  card:          CreditCard,
  wallet:        Wallet,
};

export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return Receipt;
  return categoryIconMap[iconName] ?? Receipt;
}

/**
 * Catalog surfaced by the icon picker. The order here is the order users see.
 * Each entry pairs the stored name (the DB key) with a human-readable label
 * for search + accessibility. Seed-data icons come first so the existing
 * Food/Transport/etc. categories show familiar choices at the top.
 */
export const ICON_CATALOG: Array<{ name: string; label: string; Icon: LucideIcon }> = [
  { name: 'utensils',    label: 'Food',          Icon: UtensilsCrossed },
  { name: 'coffee',      label: 'Coffee',        Icon: Coffee },
  { name: 'car',         label: 'Car',           Icon: Car },
  { name: 'bus',         label: 'Bus',           Icon: Bus },
  { name: 'plane',       label: 'Travel',        Icon: Plane },
  { name: 'fuel',        label: 'Fuel',          Icon: Fuel },
  { name: 'home',        label: 'Home',          Icon: Home },
  { name: 'shopping',    label: 'Shopping',      Icon: ShoppingBag },
  { name: 'shirt',       label: 'Clothing',      Icon: Shirt },
  { name: 'gift',        label: 'Gifts',         Icon: Gift },
  { name: 'film',        label: 'Movies',        Icon: Tv2 },
  { name: 'music',       label: 'Music',         Icon: Headphones },
  { name: 'game',        label: 'Games',         Icon: Gamepad2 },
  { name: 'sparkles',    label: 'Entertainment', Icon: Sparkles },
  { name: 'heart-pulse', label: 'Healthcare',    Icon: HeartPulse },
  { name: 'gym',         label: 'Fitness',       Icon: Dumbbell },
  { name: 'briefcase',   label: 'Work',          Icon: Briefcase },
  { name: 'book',        label: 'Education',     Icon: Book },
  { name: 'phone',       label: 'Phone',         Icon: Phone },
  { name: 'wifi',        label: 'Internet',      Icon: Wifi },
  { name: 'lightbulb',   label: 'Utilities',     Icon: Lightbulb },
  { name: 'zap',         label: 'Electricity',   Icon: Zap },
  { name: 'savings',     label: 'Savings',       Icon: PiggyBank },
  { name: 'card',        label: 'Card',          Icon: CreditCard },
  { name: 'wallet',      label: 'Wallet',        Icon: Wallet },
  { name: 'package',     label: 'Other',         Icon: Package },
];

/**
 * Builds a 15% opacity background colour from a category hex.
 * "26" in hex = 38/255 ≈ 0.15 → an 8-digit hex like #FF6B6B26.
 * Used as an inline style for the small category-icon tiles.
 */
export function getCategoryBg(colourHex: string): string {
  return colourHex + '26';
}
