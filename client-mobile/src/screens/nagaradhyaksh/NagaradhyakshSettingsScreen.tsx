import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

const SETTINGS = [
  { key: 'highPriority', label: 'High priority complaints', hint: 'Notify as soon as one is registered' },
  { key: 'escalations', label: 'Escalations', hint: 'Anything a Nagarsevak escalates to this office' },
  { key: 'dailySummary', label: 'Daily summary', hint: 'One digest at 8 pm' },
  { key: 'emergencyAlerts', label: 'Emergency alerts', hint: 'Always on for city-wide emergencies' },
];

// P14 — the one screen only this role has. Built visually to match, but there is no backend
// field anywhere for per-category notification preferences — these toggles are local UI state
// only, same honesty tradeoff as the language toggle on Profile: they don't currently change
// what notifications you actually receive.
export function NagaradhyakshSettingsScreen({ navigation }: Props) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    highPriority: true,
    escalations: true,
    dailySummary: false,
    emergencyAlerts: true,
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          {SETTINGS.map((s, i) => (
            <View key={s.key} style={[styles.row, i < SETTINGS.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{s.label}</Text>
                <Text style={styles.rowHint}>{s.hint}</Text>
              </View>
              <Pressable
                onPress={() => setToggles((t) => ({ ...t, [s.key]: !t[s.key] }))}
                style={[styles.switch, toggles[s.key] && styles.switchOn]}
              >
                <View style={[styles.knob, toggles[s.key] && styles.knobOn]} />
              </Pressable>
            </View>
          ))}
        </View>
        <Text style={styles.note}>These preferences aren't wired up to notification delivery yet — toggling them here doesn't change what you receive.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.red },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  rowHint: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  switch: { width: 46, height: 28, borderRadius: 999, backgroundColor: '#D5DBE1', padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: colors.red },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white, alignSelf: 'flex-start' },
  knobOn: { alignSelf: 'flex-end' },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18, fontFamily: fonts.sansSemibold },
});
