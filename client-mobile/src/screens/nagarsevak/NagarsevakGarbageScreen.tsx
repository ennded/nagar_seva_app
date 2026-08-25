import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { Truck } from 'lucide-react-native';
import { VehicleMap, type MapMarker } from '../../components/VehicleMap';
import { MY_WARD_VEHICLE } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import { colors, fonts } from '../../theme';

// N7 — live duty state and last reported location of the ward's vehicle, shown on a free
// OpenStreetMap pin plus the raw coordinates underneath.
export function NagarsevakGarbageScreen() {
  const { data, loading } = useQuery<{ myWardVehicle: Vehicle | null }>(MY_WARD_VEHICLE, { pollInterval: 10_000 });
  const vehicle = data?.myWardVehicle;

  const markers: MapMarker[] = useMemo(
    () =>
      vehicle && vehicle.currentLat != null && vehicle.currentLng != null
        ? [{ id: vehicle.id, lat: vehicle.currentLat, lng: vehicle.currentLng, label: vehicle.registrationNumber, color: vehicle.onDuty ? '#1E8A5F' : '#5B6670' }]
        : [],
    [vehicle],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Garbage Vehicle</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {loading && !data ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.amber} />
        ) : !vehicle ? (
          <View style={styles.empty}>
            <Truck size={30} color={colors.muted} />
            <Text style={styles.emptyText}>No vehicle assigned to this ward yet.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardLabel}>Vehicle</Text>
                <Text style={styles.cardReg}>{vehicle.registrationNumber}</Text>
              </View>
              <View style={[styles.badge, vehicle.onDuty ? styles.badgeOn : styles.badgeOff]}>
                <View style={[styles.dot, { backgroundColor: vehicle.onDuty ? colors.green : colors.muted }]} />
                <Text style={[styles.badgeText, { color: vehicle.onDuty ? colors.green : colors.muted }]}>
                  {vehicle.onDuty ? 'On Duty' : 'Off Duty'}
                </Text>
              </View>
            </View>

            {markers.length > 0 ? (
              <VehicleMap markers={markers} height={180} />
            ) : (
              <View style={styles.locationBox}>
                <Text style={styles.updatedAt}>No location reported yet.</Text>
              </View>
            )}

            {vehicle.currentLat != null && vehicle.currentLng != null && (
              <View style={styles.coordsRow}>
                <Text style={styles.coords}>
                  {vehicle.currentLat.toFixed(5)}, {vehicle.currentLng.toFixed(5)}
                </Text>
                {vehicle.locationUpdatedAt && (
                  <Text style={styles.updatedAt}>Updated {new Date(vehicle.locationUpdatedAt).toLocaleTimeString()}</Text>
                )}
              </View>
            )}

            {vehicle.driver && (
              <Text style={styles.driverNote}>
                Driver {vehicle.driver.name}. Location updates roughly every 10 seconds while on duty.
              </Text>
            )}
          </View>
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
  bodyContent: { padding: 18 },
  empty: { alignItems: 'center', gap: 8, marginTop: 40 },
  emptyText: { fontSize: 13.5, color: colors.muted },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardReg: { fontSize: 20, fontFamily: fonts.sansExtraBold, color: colors.text, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  badgeOn: { backgroundColor: colors.greenLight },
  badgeOff: { backgroundColor: colors.background },
  dot: { width: 9, height: 9, borderRadius: 5 },
  badgeText: { fontSize: 12, fontFamily: fonts.sansExtraBold },
  locationBox: { height: 100, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  coordsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coords: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  updatedAt: { fontSize: 12, color: colors.muted },
  driverNote: { fontSize: 12.5, color: colors.muted, fontFamily: fonts.sansSemibold, lineHeight: 19 },
});
