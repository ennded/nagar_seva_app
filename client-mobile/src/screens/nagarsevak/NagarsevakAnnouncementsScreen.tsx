import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { WARD_ANNOUNCEMENTS } from '../../graphql/queries/announcement.queries';
import { CREATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../graphql/mutations/announcement.mutations';
import type { Announcement } from '../../graphql/types';
import { useAuth } from '../../auth/AuthContext';
import { colors, fonts } from '../../theme';

// N8 — the one publishing power this role has: notices go straight to the ward with no Admin
// approval step (createAnnouncement's nagarsevak branch sets status:'published' immediately).
export function NagarsevakAnnouncementsScreen() {
  const { session } = useAuth();
  const { data, loading } = useQuery<{ wardAnnouncements: Announcement[] }>(WARD_ANNOUNCEMENTS);
  const [createAnnouncement, { loading: publishing }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: WARD_ANNOUNCEMENTS }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, { refetchQueries: [{ query: WARD_ANNOUNCEMENTS }] });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handlePublish() {
    setFormError(null);
    setPublished(false);
    try {
      await createAnnouncement({ variables: { input: { title, body } } });
      setTitle('');
      setBody('');
      setPublished(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAnnouncement({ variables: { id } });
    } catch {
      // Refetch already re-syncs the list either way.
    }
  }

  const canPublish = title.trim().length > 0 && body.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ward Announcements</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>
          Publishes straight to {session?.user.ward?.name ?? 'your ward'} citizens — no Admin approval step for ward
          notices.
        </Text>

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
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable
            disabled={!canPublish || publishing}
            onPress={handlePublish}
            style={({ pressed }) => [styles.publishButton, (!canPublish || publishing) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.publishLabel}>{publishing ? 'Publishing…' : `Publish to ${session?.user.ward?.name ?? 'Ward'}`}</Text>
          </Pressable>
          {published && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Published. Ward citizens can see it in Notices now.</Text>
            </View>
          )}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.amber} />
        ) : (
          (data?.wardAnnouncements ?? []).map((n) => (
            <View key={n.id} style={styles.noticeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{n.title}</Text>
                <Text style={styles.noticeMeta}>
                  {n.publishedAt ? `Published ${new Date(n.publishedAt).toLocaleDateString()}` : 'Draft'}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(n.id)}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.amber },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 10 },
  titleInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 13, minHeight: 52, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  bodyInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 13, minHeight: 76, fontSize: 13.5, lineHeight: 20, color: colors.text, marginTop: 8, textAlignVertical: 'top' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  publishButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  publishLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  successBanner: { backgroundColor: colors.greenLight, borderRadius: 10, padding: 12, marginTop: 12 },
  successText: { color: colors.green, fontSize: 13, fontFamily: fonts.sansBold },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text },
  noticeMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  deleteLabel: { color: colors.red, fontSize: 12.5, fontFamily: fonts.sansExtraBold },
});
