import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AdminHeader } from './AdminHeader';
import { STAFF_BY_CITY } from '../../graphql/queries/staff.queries';
import { WARDS_BY_CITY, DEPARTMENTS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_STAFF_USER, SET_STAFF_ACTIVE, DELETE_STAFF_USER } from '../../graphql/mutations/admin.mutations';
import type { DepartmentRef, Role, UserFields, WardRef } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { AdminTabParamList, StaffStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = CompositeScreenProps<
  NativeStackScreenProps<StaffStackParamList, 'StaffList'>,
  BottomTabScreenProps<AdminTabParamList>
>;

const NEW_ROLES: Role[] = ['OFFICER', 'NAGARSEVAK', 'NAGARADHYAKSH', 'DRIVER'];
const FILTER_ROLES: (Role | null)[] = [null, 'OFFICER', 'NAGARSEVAK', 'NAGARADHYAKSH', 'DRIVER'];
const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Admin', OFFICER: 'Officer', NAGARSEVAK: 'Nagarsevak', NAGARADHYAKSH: 'Nagaradhyaksh', DRIVER: 'Driver', CITIZEN: 'Citizen' };
const ROLE_COLOR: Record<Role, { bg: string; fg: string }> = {
  ADMIN: { bg: colors.greenLight, fg: colors.green },
  OFFICER: { bg: colors.purpleLight, fg: colors.purple },
  NAGARSEVAK: { bg: colors.amberLight, fg: colors.amber },
  NAGARADHYAKSH: { bg: colors.redLight, fg: colors.red },
  DRIVER: { bg: colors.cyanLight, fg: colors.cyan },
  CITIZEN: { bg: colors.navyLight, fg: colors.navy },
};

// A9 — account provisioning for Officer/Nagarsevak/Nagaradhyaksh/Driver. Tap a role and the scope
// field becomes Ward, Department, or neither. Filter, deactivate, delete. Also hosts the links
// into Wards/Departments/Vehicles, since "City setup" has no other tab slot to live in.
export function AdminStaffScreen({ navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const [filterRole, setFilterRole] = useState<Role | null>(null);
  const { data, loading } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY, { variables: { role: filterRole ?? undefined }, pollInterval: 30_000 });
  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const { data: deptsData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(DEPARTMENTS_BY_CITY, { variables: { citySlug }, skip: !citySlug });

  const [createStaffUser, { loading: creating }] = useMutation(CREATE_STAFF_USER, { refetchQueries: [{ query: STAFF_BY_CITY, variables: { role: filterRole ?? undefined } }] });
  const [setStaffActive] = useMutation(SET_STAFF_ACTIVE, { refetchQueries: [{ query: STAFF_BY_CITY, variables: { role: filterRole ?? undefined } }] });
  const [deleteStaffUser] = useMutation(DELETE_STAFF_USER, { refetchQueries: [{ query: STAFF_BY_CITY, variables: { role: filterRole ?? undefined } }] });

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [newRole, setNewRole] = useState<Role>('OFFICER');
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [scopePickerOpen, setScopePickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const scopeKind: 'ward' | 'department' | 'none' = newRole === 'NAGARSEVAK' ? 'ward' : newRole === 'OFFICER' ? 'department' : 'none';
  const scopeOptions = scopeKind === 'ward' ? (wardsData?.wardsByCity ?? []) : scopeKind === 'department' ? (deptsData?.departmentsByCity ?? []) : [];
  const scopeLabel = scopeOptions.find((o) => o.id === scopeId)?.name ?? (scopeKind === 'none' ? 'Whole city — no selection needed' : 'Select…');

  function selectRole(role: Role) {
    setNewRole(role);
    setScopeId(null);
    setScopePickerOpen(false);
  }

  async function handleCreate() {
    setFormError(null);
    if (scopeKind !== 'none' && !scopeId) {
      setFormError(scopeKind === 'ward' ? 'Pick a ward' : 'Pick a department');
      return;
    }
    try {
      await createStaffUser({
        variables: {
          input: {
            name,
            mobile,
            role: newRole,
            wardId: scopeKind === 'ward' ? scopeId : undefined,
            departmentId: scopeKind === 'department' ? scopeId : undefined,
          },
        },
      });
      setName('');
      setMobile('');
      setScopeId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create staff account');
    }
  }

  const canCreate = name.trim().length > 0 && mobile.trim().length === 10;

  return (
    <View style={styles.root}>
      <AdminHeader onBellPress={() => navigation.navigate('DashboardTab', { screen: 'Notifications' })} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.linkRow}>
          <Pressable onPress={() => navigation.navigate('Wards')} style={styles.linkChip}>
            <Text style={styles.linkChipText}>Wards</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Departments')} style={styles.linkChip}>
            <Text style={styles.linkChipText}>Departments</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Vehicles')} style={styles.linkChip}>
            <Text style={styles.linkChipText}>Vehicles</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Staff</Text>
        <Text style={styles.subtitle}>Staff cannot self-register. Every Officer, Nagarsevak, Nagaradhyaksh and Driver account is created here.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>New staff account</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Mobile</Text>
          <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="10-digit mobile" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={10} />
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleGrid}>
            {NEW_ROLES.map((r) => {
              const active = r === newRole;
              return (
                <Pressable key={r} onPress={() => selectRole(r)} style={[styles.roleButton, active && styles.roleButtonActive]}>
                  <Text style={[styles.roleButtonLabel, active && styles.roleButtonLabelActive]}>{ROLE_LABEL[r]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.label}>{scopeKind === 'ward' ? 'Ward' : scopeKind === 'department' ? 'Department' : 'Scope'}</Text>
          <Pressable
            disabled={scopeKind === 'none'}
            onPress={() => setScopePickerOpen((o) => !o)}
            style={[styles.scopeField, scopeKind === 'none' && styles.scopeFieldDisabled]}
          >
            <Text style={[styles.scopeFieldText, scopeKind === 'none' && styles.scopeFieldTextMuted]}>{scopeLabel}</Text>
            {scopeKind !== 'none' && <Text style={styles.scopeChevron}>{scopePickerOpen ? '︿' : '﹀'}</Text>}
          </Pressable>
          {scopePickerOpen && scopeKind !== 'none' && (
            <View style={styles.scopeOptions}>
              {scopeOptions.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    setScopeId(o.id);
                    setScopePickerOpen(false);
                  }}
                  style={styles.scopeOptionRow}
                >
                  <Text style={styles.scopeOptionText}>{o.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={styles.hint}>
            {scopeKind === 'ward'
              ? 'A Nagarsevak monitors exactly one ward.'
              : scopeKind === 'department'
                ? 'Officers are scoped to one department and only see requests assigned to them.'
                : newRole === 'NAGARADHYAKSH'
                  ? 'City-level role; no ward or department to pick.'
                  : "A driver's ward follows the vehicle assigned on the Vehicles screen."}
          </Text>
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable disabled={!canCreate || creating} onPress={handleCreate} style={({ pressed }) => [styles.addButton, (!canCreate || creating) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.addLabel}>{creating ? 'Adding…' : 'Add Staff'}</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {FILTER_ROLES.map((r, i) => {
            const active = r === filterRole;
            return (
              <Pressable key={r ?? 'all'} onPress={() => setFilterRole(r)} style={[styles.filterPill, active && styles.filterPillActive]}>
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{r ? ROLE_LABEL[r] : `All ${FILTER_ROLES.length}`}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.green} />
        ) : (
          (data?.staffByCity ?? []).map((p) => {
            const roleColor = ROLE_COLOR[p.role];
            const initials = p.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <View key={p.id} style={styles.staffCard}>
                <View style={styles.staffTop}>
                  <View style={[styles.avatar, { backgroundColor: roleColor.bg }]}>
                    <Text style={[styles.avatarText, { color: roleColor.fg }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{p.name}</Text>
                    <Text style={styles.staffMeta}>
                      {ROLE_LABEL[p.role]}
                      {p.department ? ` · ${p.department.name}` : ''}
                      {p.ward ? ` · ${p.ward.name}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.stateBadge, { backgroundColor: p.isActive ? colors.greenLight : colors.background }]}>
                    <Text style={[styles.stateText, { color: p.isActive ? colors.green : colors.muted }]}>{p.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
                <View style={styles.staffActions}>
                  <Pressable
                    onPress={() => setStaffActive({ variables: { id: p.id, isActive: !p.isActive } })}
                    style={styles.staffActionButton}
                  >
                    <Text style={styles.staffActionLabel}>{p.isActive ? 'Deactivate' : 'Activate'}</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteStaffUser({ variables: { id: p.id } })} style={styles.staffActionButton}>
                    <Text style={[styles.staffActionLabel, { color: colors.red }]}>Delete</Text>
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
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  linkRow: { flexDirection: 'row', gap: 8 },
  linkChip: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  linkChipText: { fontSize: 12.5, fontFamily: fonts.sansExtraBold, color: colors.green },
  title: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.text, marginTop: 4 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontFamily: fonts.sansExtraBold, color: colors.text },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 13 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  roleButton: { minWidth: '47%', flexGrow: 1, minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  roleButtonActive: { backgroundColor: colors.green, borderColor: colors.green },
  roleButtonLabel: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.text },
  roleButtonLabelActive: { color: colors.white },
  scopeField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, marginTop: 8 },
  scopeFieldDisabled: { opacity: 0.7 },
  scopeFieldText: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text },
  scopeFieldTextMuted: { color: colors.muted, fontFamily: fonts.sansSemibold },
  scopeChevron: { fontSize: 14, color: colors.muted },
  scopeOptions: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, marginTop: 6, overflow: 'hidden' },
  scopeOptionRow: { paddingHorizontal: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  scopeOptionText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  hint: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 9, lineHeight: 17 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  addButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  addLabel: { color: colors.white, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  filterPillActive: { backgroundColor: colors.green, borderColor: colors.green },
  filterLabel: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.text },
  filterLabelActive: { color: colors.white },
  staffCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  staffTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: fonts.sansExtraBold },
  staffName: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  staffMeta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  stateBadge: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  stateText: { fontSize: 11, fontFamily: fonts.sansExtraBold },
  staffActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  staffActionButton: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  staffActionLabel: { fontSize: 13, fontFamily: fonts.sansExtraBold, color: colors.text },
});
