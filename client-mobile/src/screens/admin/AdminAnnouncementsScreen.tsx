import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ANNOUNCEMENTS_ADMIN } from '../../graphql/queries/announcement.queries';
import { CREATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../graphql/mutations/announcement.mutations';
import { PUBLISH_ANNOUNCEMENT } from '../../graphql/mutations/admin.mutations';
import type { Announcement } from '../../graphql/types';
import type { AdminTabParamList, AnnouncementsStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<AnnouncementsStackParamList, 'Announcements'>,
  BottomTabScreenProps<AdminTabParamList>
>;

// A11 — new notices save as drafts (createAnnouncement's default branch for Admin sets no status
// override, and the Announcement model defaults to 'draft'). Publishing is a separate, deliberate
// action — and the same list carries drafts written by the Nagaradhyaksh, since
// announcementsAdmin returns every announcement in the city regardless of who created it.
export function AdminAnnouncementsScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ announcementsAdmin: Announcement[] }>(ANNOUNCEMENTS_ADMIN);
  const [createAnnouncement, { loading: saving }] = useMutation(CREATE_ANNOUNCEMENT, { refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }] });
  const [publishAnnouncement] = useMutation(PUBLISH_ANNOUNCEMENT, { refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }] });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, { refetchQueries: [{ query: ANNOUNCEMENTS_ADMIN }] });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSaveDraft() {
    setFormError(null);
    setSaved(false);
    try {
      await createAnnouncement({ variables: { input: { title, body } } });
      setTitle('');
      setBody('');
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save draft');
    }
  }

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Pressable onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.contactsLink}>Contacts</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>
          New notices are saved as drafts. Publishing is a separate, deliberate action — and you also publish drafts
          written by the Nagaradhyaksh.
        </Text>
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} placeholder="Notice title" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Body</Text>
          <TextInput style={styles.bodyInput} value={body} onChangeText={setBody} placeholder="Write the notice…" placeholderTextColor={colors.muted} multiline />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable disabled={!canSave || saving} onPress={handleSaveDraft} style={({ pressed }) => [styles.saveButton, (!canSave || saving) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.saveLabel}>{saving ? 'Saving…' : 'Save as Draft'}</Text>
          </Pressable>
          {saved && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>Saved as a draft. It appears below with a Publish button.</Text>
            </View>
          )}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.green} />
        ) : (
          (data?.announcementsAdmin ?? []).map((n) => {
            const isDraft = n.status !== 'published';
            return (
              <View key={n.id} style={styles.noticeCard}>
                <View style={styles.noticeTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    <Text style={styles.noticeMeta}>
                      {isDraft ? 'Draft · awaiting publish' : `Published ${n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ''}`}
                    </Text>
                  </View>
                  <View style={[styles.stateBadge, { backgroundColor: isDraft ? colors.background : colors.greenLight }]}>
                    <Text style={[styles.stateText, { color: isDraft ? colors.muted : colors.green }]}>{isDraft ? 'Draft' : 'Published'}</Text>
                  </View>
                </View>
                <View style={styles.noticeActions}>
                  {isDraft && (
                    <Pressable onPress={() => publishAnnouncement({ variables: { id: n.id } })} style={styles.publishButton}>
                      <Text style={styles.publishLabel}>Publish</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => deleteAnnouncement({ variables: { id: n.id } })} style={styles.deleteButton}>
                    <Text style={styles.deleteLabel}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.green },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  contactsLink: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.white, textDecorationLine: 'underline' },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 10 },
  titleInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 13, minHeight: 52, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  bodyInput: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 13, minHeight: 76, fontSize: 13.5, lineHeight: 20, color: colors.text, marginTop: 8, textAlignVertical: 'top' },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  saveButton: { minHeight: 54, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  saveLabel: { color: colors.white, fontSize: 16, fontFamily: fonts.sansExtraBold },
  successBanner: { backgroundColor: colors.greenLight, borderRadius: 10, padding: 12, marginTop: 12 },
  successText: { color: colors.green, fontSize: 13, fontFamily: fonts.sansBold },
  noticeCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  noticeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeTitle: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text, lineHeight: 19 },
  noticeMeta: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 4 },
  stateBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  stateText: { fontSize: 10.5, fontFamily: fonts.sansExtraBold },
  noticeActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  publishButton: { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  publishLabel: { color: colors.white, fontSize: 13, fontFamily: fonts.sansExtraBold },
  deleteButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.red, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { color: colors.red, fontSize: 13, fontFamily: fonts.sansExtraBold },
});
