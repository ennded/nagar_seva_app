import { Trash2, Construction, Droplets, Lightbulb, Waves, CircleEllipsis } from 'lucide-react-native';

// Same category set as the citizen ComplaintWizard's category picker.
const CATEGORY_ICON: Record<string, typeof Trash2> = {
  garbage: Trash2,
  roads: Construction,
  water_supply: Droplets,
  streetlight: Lightbulb,
  drainage: Waves,
  other: CircleEllipsis,
};

export function categoryIcon(category: string): typeof Trash2 {
  return CATEGORY_ICON[category] ?? CircleEllipsis;
}
