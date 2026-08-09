import { Trash2, Construction, Droplet, Lightbulb, Waves, Plus } from 'lucide-react';

export const COMPLAINT_CATEGORIES = ['garbage', 'roads', 'water_supply', 'streetlight', 'drainage', 'other'] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const CATEGORY_ICON: Record<ComplaintCategory, typeof Trash2> = {
  garbage: Trash2,
  roads: Construction,
  water_supply: Droplet,
  streetlight: Lightbulb,
  drainage: Waves,
  other: Plus,
};
