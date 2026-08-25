import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { Check, AlertTriangle } from 'lucide-react-native';
import { ANNOUNCEMENTS_ADMIN } from '../../graphql/queries/announcement.queries';
import { CREATE_ANNOUNCEMENT } from '../../graphql/mutations/announcement.mutations';
import type { Announcement } from '../../graphql/types';
import { colors, fonts } from '../../theme';

// P10 — the mockup models two outcomes ("Publish Emergency Notice" vs "Send to Admin for
// Publishing", with a draft-queue explanation for non-emergency notices). I checked the actual
// resolver (createAnnouncement's nagaradhyaksh branch in announcement.resolvers.ts): it sets
// status:'published' unconditionally, with no draft path at all, regardless of isEmergency. So
// this always publishes immediately — the emergency checkbox only controls the isEmergency
// badge, not whether it goes live. Copy reflects what actually happens, not the mockup's
// two-outcome design.
export function NagaradhyakshAnnouncementsScreen() {
  const { data, loading } = useQuery<{ announcementsAdmin: Announcement[] }>(ANNOUNCEMENTS_ADMIN);
  const [createAnnouncement, { loading: publishing }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }],
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [published, setPublished] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handlePublish() {
    setFormError(null);
    setPublished(false);
    try {
      await createAnnouncement({ variables: { input: { title, body, isEmergency: emergency } } });
      setTitle('');
      setBody('');
      setEmergency(false);
      setPublished(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish');
    }
  }

  const canPublish = title.trim().length > 0 && body.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Notice title" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Body</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Write the notice…"
            placeholderTextColor={colors.muted}
            multiline
          />
          <Pressable onPress={() => setEmergency((e) => !e)} style={[styles.emergencyRow, emergency && styles.emergencyRowActive]}>
            <View style={[styles.checkbox, emergency && styles.checkboxActive]}>
              {emergency && <Check size={13} color={colors.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyLabel}>Mark as emergency</Text>
              <Text style={styles.emergencyHint}>Adds the Emergency badge citizens see. This publishes to the whole city either way.</Text>
            </View>
          </Pressable>
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable
            disabled={!canPublish || publishing}
            onPress={handlePublish}
            style={({ pressed }) => [styles.publishButton, (!canPublish || publishing) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.publishLabel}>{publishing ? 'Publishing…' : 'Publish to City'}</Text>
          </Pressable>
          {published && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Published. Every citizen in the city is notified now.</Text>
            </View>
          )}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.red} />
        ) : (
          (data?.announcementsAdmin ?? []).map((n) => (
            <View key={n.id} style={styles.noticeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{n.title}</Text>
                <Text style={styles.noticeMeta}>
                  {n.publishedAt ? `Published ${new Date(n.publishedAt).toLocaleDateString()}` : 'Draft · awaiting Admin publish'}
                </Text>
              </View>
              {n.isEmergency && (
                <View style={styles.emergencyBadge}>
                  <AlertTriangle size={11} color={colors.red} />
                  <Text style={styles.emergencyBadgeText}>Emergency</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.red },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 10 },
  titleInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 13, minHeight: 52, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  bodyInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 13, minHeight: 76, fontSize: 13.5, lineHeight: 20, color: colors.text, marginTop: 8, textAlignVertical: 'top' },
  emergencyRow: { flexDirection: 'row', gap: 11, marginTop: 14, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  emergencyRowActive: { borderColor: colors.red, backgroundColor: colors.redLight },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.red, borderColor: colors.red },
  checkmark: { color: colors.white, fontSize: 13, fontFamily: fonts.sansExtraBold },
  emergencyLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  emergencyHint: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3, lineHeight: 16 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  publishButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  publishLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  successBanner: { backgroundColor: colors.greenLight, borderRadius: 10, padding: 12, marginTop: 12 },
  successText: { color: colors.green, fontSize: 13, fontFamily: fonts.sansBold },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text },
  noticeMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  emergencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.redLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  emergencyBadgeText: { color: colors.red, fontSize: 10.5, fontFamily: fonts.sansExtraBold },
});
