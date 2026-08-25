import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_DEPARTMENT, DELETE_DEPARTMENT } from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { StaffStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<StaffStackParamList, 'Departments'>;

// A8 — officers belong to a department, and complaints are routed to one.
export function AdminDepartmentsScreen({ navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const { data, loading } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const [createDepartment, { loading: creating }] = useMutation(CREATE_DEPARTMENT, {
    refetchQueries: [{ query: DEPARTMENTS_BY_CITY, variables: { citySlug } }],
  });
  const [deleteDepartment] = useMutation(DELETE_DEPARTMENT, { refetchQueries: [{ query: DEPARTMENTS_BY_CITY, variables: { citySlug } }] });

  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate() {
    setFormError(null);
    try {
      await createDepartment({ variables: { name } });
      setName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create department');
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Staff</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Departments</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>Officers belong to a department, and complaints are routed into one.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Department name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Water Works" placeholderTextColor={colors.muted} />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable disabled={!name.trim() || creating} onPress={handleCreate} style={({ pressed }) => [styles.addButton, (!name.trim() || creating) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.addLabel}>{creating ? 'Adding…' : 'Add Department'}</Text>
          </Pressable>
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.green} />
        ) : (
          (data?.departmentsByCity ?? []).map((d) => (
            <View key={d.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{d.name}</Text>
                {d.description && <Text style={styles.rowMeta}>{d.description}</Text>}
              </View>
              <Pressable onPress={() => deleteDepartment({ variables: { id: d.id } })}>
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
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  addButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  addLabel: { color: colors.white, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  rowName: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  rowMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  deleteLabel: { color: colors.red, fontSize: 12.5, fontFamily: fonts.sansExtraBold },
});
