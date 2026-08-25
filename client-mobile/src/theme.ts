// Matches client/src/index.css — swap these when the citizen design arrives.
export const colors = {
  navy: '#0B3D66',
  navyLight: '#E7EEF5',
  orange: '#E07A1F',
  green: '#1E8A5F',
  greenLight: '#E4F4EC',
  red: '#DC2626',
  text: '#1A2430',
  muted: '#6B7684',
  border: '#E2E8EF',
  background: '#F6F8FA',
  white: '#FFFFFF',
  // Per-role accents, from the design system's role-* tokens (driver-mock/_ds colors.css).
  cyan: '#0891B2',
  cyanLight: '#E3F4F7',
  purple: '#6B46C1',
  purpleLight: '#EFE9FB',
  amber: '#D97706',
  amberLight: '#FCEEE1',
  redLight: '#FBEAEA',
  // Badge tones, exact match to the design system's Badge/StatusBadge/PriorityBadge components.
  warning: '#B85B12',
  warningLight: '#FCEEE1',
  info: '#1D4ED8',
  infoLight: '#DBEAFE',
};

// Public Sans (UI/body) + Source Serif 4 (headings) — loaded via @expo-google-fonts in App.tsx.
// RN's custom-font model needs the exact weighted font file as fontFamily (fontWeight alone does
// nothing once a custom family is set), so every "bold heading" style should reference one of
// these instead of combining a generic fontFamily with fontWeight.
export const fonts = {
  sansRegular: 'PublicSans_400Regular',
  sansMedium: 'PublicSans_500Medium',
  sansSemibold: 'PublicSans_600SemiBold',
  sansBold: 'PublicSans_700Bold',
  sansExtraBold: 'PublicSans_800ExtraBold',
  serifBold: 'SourceSerif4_700Bold',
  serifExtraBold: 'SourceSerif4_800ExtraBold',
};

export const spacing = (n: number) => n * 4;
