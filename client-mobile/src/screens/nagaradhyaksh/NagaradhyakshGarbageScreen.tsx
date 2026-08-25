import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Truck } from 'lucide-react-native';
import { VehicleMap, type MapMarker } from '../../components/VehicleMap';
import { VEHICLES_BY_CITY } from '../../graphql/queries/staff.queries';
import type { ProfileStackParamList } from '../../navigation/nagaradhyakshTypes';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Garbage'>;

interface CityVehicle {
  id: string;
  registrationNumber: string;
  onDuty: boolean;
  locationUpdatedAt: string | null;
  currentLat: number | null;
  currentLng: number | null;
  ward: { name: string };
  driver: { name: string } | null;
}

function relativeTime(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// P9 — city-wide fleet: every vehicle, its ward, driver and duty state. Real data from
// vehiclesByCity.
export function NagaradhyakshGarbageScreen({ navigation }: Props) {
  const { data, loading } = useQuery<{ vehiclesByCity: CityVehicle[] }>(VEHICLES_BY_CITY, { pollInterval: 15_000 });

  const vehicles = data?.vehiclesByCity ?? [];
  const onDutyCount = vehicles.filter((v) => v.onDuty).length;

  const markers: MapMarker[] = useMemo(
    () =>
      vehicles
        .filter((v) => v.currentLat != null && v.currentLng != null)
        .map((v) => ({
          id: v.id,
          lat: v.currentLat as number,
          lng: v.currentLng as number,
          label: `${v.registrationNumber} · ${v.ward.name}`,
          color: v.onDuty ? '#1E8A5F' : '#5B6670',
        })),
    [vehicles],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backLabel}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Garbage Monitoring</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.red} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{onDutyCount}</Text>
                <Text style={styles.statLabel}>On duty now</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{vehicles.length}</Text>
                <Text style={styles.statLabel}>Total vehicles</Text>
              </View>
            </View>
            {markers.length > 0 && <VehicleMap markers={markers} height={220} />}
            {vehicles.map((v) => (
              <View key={v.id} style={styles.card}>
                <View style={styles.iconWrap}>
                  <Truck size={18} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reg}>{v.registrationNumber}</Text>
                  <Text style={styles.meta}>
                    {v.ward.name} · {v.driver ? v.driver.name : 'unassigned'}
                    {v.onDuty && v.locationUpdatedAt ? ` · ${relativeTime(v.locationUpdatedAt)}` : ''}
                  </Text>
                </View>
                <View style={[styles.badge, v.onDuty ? styles.badgeOn : styles.badgeOff]}>
                  <View style={[styles.dot, { backgroundColor: v.onDuty ? colors.green : colors.muted }]} />
                  <Text style={[styles.badgeText, { color: v.onDuty ? colors.green : colors.muted }]}>{v.onDuty ? 'On duty' : 'Off duty'}</Text>
                </View>
              </View>
            ))}
          </>
        )}
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
  bodyContent: { padding: 18, gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  statTile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  statValue: { fontSize: 22, fontFamily: fonts.serifExtraBold, color: colors.text },
  statLabel: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansBold },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 13 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  reg: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.text },
  meta: { fontSize: 11.5, color: colors.muted, fontFamily: fonts.sansSemibold, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  badgeOn: { backgroundColor: colors.greenLight },
  badgeOff: { backgroundColor: colors.background },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontFamily: fonts.sansExtraBold },
});
