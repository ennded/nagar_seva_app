import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import type { RequestPriority } from '../graphql/types';

// Exact match to the design system's PriorityBadge component (PRIORITY_TONE). Label text comes
// from the shared i18n `priority` namespace so every screen using this component translates
// automatically when the language is switched.
const PRIORITY_TONE: Record<RequestPriority, { bg: string; fg: string }> = {
  HIGH: { bg: colors.redLight, fg: colors.red },
  MEDIUM: { bg: colors.warningLight, fg: colors.warning },
  LOW: { bg: colors.greenLight, fg: colors.green },
};

export function PriorityBadge({ priority }: { priority: RequestPriority }) {
  const { t } = useTranslation();
  const tone = PRIORITY_TONE[priority];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{t(`priority.${priority}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontFamily: fonts.sansBold },
});
