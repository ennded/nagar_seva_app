import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Truck } from 'lucide-react-native';
import { STAFF_BY_CITY, VEHICLES_BY_CITY } from '../../graphql/queries/staff.queries';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { CREATE_VEHICLE, ASSIGN_VEHICLE_DRIVER } from '../../graphql/mutations/admin.mutations';
import type { UserFields, WardRef } from '../../graphql/types';
import { getSavedCitySlug } from '../../storage/citySlug';
import type { StaffStackParamList } from '../../navigation/adminTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<StaffStackParamList, 'Vehicles'>;

interface CityVehicle {
  id: string;
  registrationNumber: string;
  onDuty: boolean;
  ward: { id: string; name: string };
  driver: { id: string; name: string } | null;
}

// A10 — create a vehicle, assign a driver. A driver sees only an empty state until this is done.
export function AdminVehiclesScreen({ navigation }: Props) {
  const citySlug = getSavedCitySlug() ?? '';
  const { data, loading } = useQuery<{ vehiclesByCity: CityVehicle[] }>(VEHICLES_BY_CITY, { pollInterval: 20_000 });
  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug }, skip: !citySlug });
  const { data: driversData } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY, { variables: { role: 'DRIVER' } });

  const [createVehicle, { loading: creating }] = useMutation(CREATE_VEHICLE, { refetchQueries: [{ query: VEHICLES_BY_CITY }] });
  const [assignVehicleDriver] = useMutation(ASSIGN_VEHICLE_DRIVER, { refetchQueries: [{ query: VEHICLES_BY_CITY }] });

  const [registration, setRegistration] = useState('');
  const [wardId, setWardId] = useState<string | null>(null);
  const [wardPickerOpen, setWardPickerOpen] = useState(false);
  const [assigningVehicleId, setAssigningVehicleId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate() {
    setFormError(null);
    if (!wardId) {
      setFormError('Pick a ward');
      return;
    }
    try {
      await createVehicle({ variables: { input: { registrationNumber: registration, wardId } } });
      setRegistration('');
      setWardId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create vehicle');
    }
  }

  const wardLabel = wardsData?.wardsByCity.find((w) => w.id === wardId)?.name ?? 'Select a ward…';
  const drivers = driversData?.staffByCity ?? [];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Staff</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Vehicles</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.subtitle}>A driver only sees a duty screen once you assign them a vehicle.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Registration number</Text>
          <TextInput
            style={styles.input}
            value={registration}
            onChangeText={setRegistration}
            placeholder="MH 15 GA 0000"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
          />
          <Text style={styles.label}>Ward</Text>
          <Pressable onPress={() => setWardPickerOpen((o) => !o)} style={styles.scopeField}>
            <Text style={[styles.scopeFieldText, !wardId && styles.scopeFieldTextMuted]}>{wardLabel}</Text>
            <Text style={styles.scopeChevron}>{wardPickerOpen ? '︿' : '﹀'}</Text>
          </Pressable>
          {wardPickerOpen && (
            <View style={styles.scopeOptions}>
              {(wardsData?.wardsByCity ?? []).map((w) => (
                <Pressable
                  key={w.id}
                  onPress={() => {
                    setWardId(w.id);
                    setWardPickerOpen(false);
                  }}
                  style={styles.scopeOptionRow}
                >
                  <Text style={styles.scopeOptionText}>{w.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {formError && <Text style={styles.error}>{formError}</Text>}
          <Pressable
            disabled={!registration.trim() || creating}
            onPress={handleCreate}
            style={({ pressed }) => [styles.addButton, (!registration.trim() || creating) && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.addLabel}>{creating ? 'Adding…' : 'Add Vehicle'}</Text>
          </Pressable>
        </View>

        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 12 }} color={colors.green} />
        ) : (
          (data?.vehiclesByCity ?? []).map((v) => (
            <View key={v.id} style={styles.vehicleCard}>
              <View style={styles.vehicleTop}>
                <View style={styles.iconWrap}>
                  <Truck size={18} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reg}>{v.registrationNumber}</Text>
                  <Text style={styles.meta}>
                    {v.ward.name} · {v.driver ? v.driver.name : 'no driver'}
                  </Text>
                </View>
                <View style={[styles.badge, v.onDuty ? styles.badgeOn : styles.badgeOff]}>
                  <View style={[styles.dot, { backgroundColor: v.onDuty ? colors.green : colors.muted }]} />
                  <Text style={[styles.badgeText, { color: v.onDuty ? colors.green : colors.muted }]}>{v.onDuty ? 'On duty' : 'Off duty'}</Text>
                </View>
              </View>
              {!v.driver && (
                <>
                  <Pressable onPress={() => setAssigningVehicleId(assigningVehicleId === v.id ? null : v.id)} style={styles.assignButton}>
                    <Text style={styles.assignLabel}>Assign a driver</Text>
                  </Pressable>
                  {assigningVehicleId === v.id && (
                    <View style={styles.scopeOptions}>
                      {drivers.length === 0 ? (
                        <Text style={styles.noDrivers}>No driver accounts yet — add one from Staff.</Text>
                      ) : (
                        drivers.map((d) => (
                          <Pressable
                            key={d.id}
                            onPress={() => {
                              assignVehicleDriver({ variables: { vehicleId: v.id, driverId: d.id } });
                              setAssigningVehicleId(null);
                            }}
                            style={styles.scopeOptionRow}
                          >
                            <Text style={styles.scopeOptionText}>{d.name}</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  )}
                </>
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
  header: { paddingTop: 52, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: colors.green },
  backButton: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.white },
  headerTitle: { fontSize: 19, fontFamily: fonts.serifExtraBold, color: colors.white },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 12 },
  subtitle: { fontSize: 13, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16 },
  label: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, textTransform: 'uppercase', letterSpacing: 0.4, color: colors.muted, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text, marginTop: 8 },
  scopeField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, backgroundColor: '#F5F7FA', borderRadius: 11, paddingHorizontal: 13, minHeight: 50, marginTop: 8 },
  scopeFieldText: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.text },
  scopeFieldTextMuted: { color: colors.muted, fontFamily: fonts.sansSemibold },
  scopeChevron: { fontSize: 14, color: colors.muted },
  scopeOptions: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, marginTop: 8, overflow: 'hidden' },
  scopeOptionRow: { paddingHorizontal: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  scopeOptionText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.text },
  noDrivers: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansSemibold, padding: 13 },
  error: { color: colors.red, fontSize: 13, marginTop: 10 },
  addButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  addLabel: { color: colors.white, fontSize: 15.5, fontFamily: fonts.sansExtraBold },
  vehicleCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 13 },
  vehicleTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.cyanLight, alignItems: 'center', justifyContent: 'center' },
  reg: { fontSize: 14.5, fontFamily: fonts.sansExtraBold, color: colors.text },
  meta: { fontSize: 12, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  badgeOn: { backgroundColor: colors.greenLight },
  badgeOff: { backgroundColor: colors.background },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontFamily: fonts.sansExtraBold },
  assignButton: { minHeight: 46, marginTop: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.green, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  assignLabel: { fontSize: 13.5, fontFamily: fonts.sansExtraBold, color: colors.green },
});
