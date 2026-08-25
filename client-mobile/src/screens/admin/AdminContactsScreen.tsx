import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import { CREATE_EMERGENCY_CONTACT, DELETE_EMERGENCY_CONTACT } from '../../graphql/mutations/admin.mutations';
import type { EmergencyContact } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { AnnouncementsStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<AnnouncementsStackParamList, 'Contacts'>;

const CATEGORIES = ['POLICE', 'FIRE', 'AMBULANCE', 'MUNICIPALITY', 'WATER', 'ELECTRICITY'] as const;

// A12 — name, category, phone, display order. These numbers appear on the citizen app's
// emergency screen, in the order set here.
export function AdminContactsScreen({ navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const { data, loading } = useQuery<{ emergencyContacts: EmergencyContact[] }>(EMERGENCY_CONTACTS, { variables: { citySlug }, skip: !citySlug });
  const [createContact, { loading: creating }] = useMutation(CREATE_EMERGENCY_CONTACT, {
    refetchQueries: [{ query: EMERGENCY_CONTACTS, variables: { citySlug } }],
  });
  const [deleteContact] = useMutation(DELETE_EMERGENCY_CONTACT, { refetchQueries: [{ query: EMERGENCY_CONTACTS, variables: { citySlug } }] });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('POLICE');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate() {
    setFormError(null);
    try {
      await createContact({ variables: { input: { name, category, phoneNumber: phone, order: order ? Number(order) : undefined } } });
      setName('');
      setPhone('');
      setOrder('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add contact');
    }
  }

  const canCreate = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Announcements</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>These numbers appear on the citizen app's emergency screen, in the order set here.</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Fire Station" placeholderTextColor={colors.muted} />
            </View>
            <View style={{ width: 90 }}>
              <Text style={styles.label}>Order</Text>
              <TextInput style={styles.input} value={order} onChangeText={setOrder} placeholder="3" placeholderTextColor={colors.muted} keyboardType="number-pad" />
            </View>
          </View>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.categoryButton, active && styles.categoryButtonActive]}>
                  <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{c.charAt(0) + c.slice(1).toLowerCase()}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="101" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable disabled={!canCreate || creating} onPress={handleCreate} style={({ pressed }) => [styles.addButton, (!canCreate || creating) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.addLabel}>{creating ? 'Adding…' : 'Add Contact'}</Text>
          </Pressable>
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.green} />
        ) : (
          [...(data?.emergencyContacts ?? [])]
            .sort((a, b) => a.order - b.order)
            .map((c) => (
              <View key={c.id} style={styles.row}>
                <Text style={styles.rowOrder}>{c.order}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{c.name}</Text>
                  <Text style={styles.rowMeta}>
                    {c.category} · {c.phoneNumber}
                  </Text>
                </View>
                <Pressable onPress={() => deleteContact({ variables: { id: c.id } })}>
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
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.green },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  categoryButtonActive: { backgroundColor: colors.green, borderColor: colors.green },
  categoryLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.text },
  categoryLabelActive: { color: colors.white },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  addButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  addLabel: { color: colors.white, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  rowOrder: { width: 22, fontSize: 12, fontFamily: fonts.sansExtraBold, color: colors.muted },
  rowName: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  rowMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  deleteLabel: { color: colors.red, fontSize: 12.5, fontFamily: fonts.sansExtraBold },
});
