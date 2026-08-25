import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../theme';
import type { RequestStatus } from '../graphql/types';

// Exact match to the design system's Badge/StatusBadge component (STATUS_TONE). Label text comes
// from the shared i18n `status` namespace so every screen using this component translates
// automatically when the language is switched.
const STATUS_TONE: Record<RequestStatus, { bg: string; fg: string }> = {
  REGISTERED: { bg: colors.navyLight, fg: colors.navy },
  VERIFIED: { bg: colors.infoLight, fg: colors.info },
  ASSIGNED: { bg: colors.warningLight, fg: colors.warning },
  IN_PROGRESS: { bg: colors.warningLight, fg: colors.warning },
  SCHEDULED: { bg: colors.infoLight, fg: colors.info },
  COMPLETED: { bg: colors.greenLight, fg: colors.green },
  CLOSED: { bg: colors.greenLight, fg: colors.green },
  REJECTED: { bg: colors.redLight, fg: colors.red },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontFamily: fonts.sansBold },
});
