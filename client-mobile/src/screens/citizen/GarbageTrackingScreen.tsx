import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { VehicleMap, type MapMarker } from '../../components/VehicleMap';
import { MY_WARD_VEHICLE } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'GarbageTracking'>;

// S9.1 (live, 10s refresh) / S9.2 (no vehicle, also covers load failure) — vehicle is resolved
// server-side from the citizen's ward. Location is a free OpenStreetMap pin (VehicleMap) plus the
// raw coordinates and freshness underneath, so the numbers stay visible even if the map tiles
// fail to load.
export function GarbageTrackingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<{ myWardVehicle: Vehicle | null }>(MY_WARD_VEHICLE, {
    pollInterval: 10_000,
  });
  const vehicle = data?.myWardVehicle;

  const markers: MapMarker[] = useMemo(
    () =>
      vehicle && vehicle.currentLat != null && vehicle.currentLng != null
        ? [{ id: vehicle.id, lat: vehicle.currentLat, lng: vehicle.currentLng, label: vehicle.registrationNumber, color: vehicle.onDuty ? '#1E8A5F' : '#5B6670' }]
        : [],
    [vehicle],
  );

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.navy} />
      </Screen>
    );
  }

  if (error || !vehicle) {
    return (
      <Screen>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Truck size={32} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>{t('garbageTracking.noVehicleTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('garbageTracking.noVehicleBody')}</Text>
          <Button
            label={t('garbageTracking.reportComplaint')}
            onPress={() => navigation.navigate('ComplaintWizard', { category: 'garbage' })}
          />
        </View>
      </Screen>
    );
  }

  const age = vehicle.locationUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(vehicle.locationUpdatedAt).getTime()) / 1000))
    : null;

  return (
    <Screen>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}>
            <Truck size={21} color={colors.cyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reg}>{vehicle.registrationNumber}</Text>
            <Text style={styles.driverLine}>
              {vehicle.driver ? t('garbageTracking.driverPrefix', { name: vehicle.driver.name }) : t('garbageTracking.driverNotAssigned')} · {vehicle.ward.name}
            </Text>
          </View>
          <View style={[styles.dutyBadge, vehicle.onDuty ? styles.dutyOn : styles.dutyOff]}>
            {vehicle.onDuty && <View style={styles.dutyDot} />}
            <Text style={[styles.dutyText, vehicle.onDuty ? styles.dutyTextOn : styles.dutyTextOff]}>
              {vehicle.onDuty ? t('garbageTracking.onDuty') : t('garbageTracking.offDuty')}
            </Text>
          </View>
        </View>
      </View>

      {markers.length > 0 && <VehicleMap markers={markers} height={200} />}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('garbageTracking.lastReportedPosition')}</Text>
        {vehicle.currentLat != null && vehicle.currentLng != null ? (
          <>
            <View style={styles.coordsRow}>
              <View style={styles.coordCell}>
                <Text style={styles.coordLabel}>{t('garbageTracking.latitude')}</Text>
                <Text style={styles.coordValue}>{vehicle.currentLat.toFixed(5)}</Text>
              </View>
              <View style={styles.coordCell}>
                <Text style={styles.coordLabel}>{t('garbageTracking.longitude')}</Text>
                <Text style={styles.coordValue}>{vehicle.currentLng.toFixed(5)}</Text>
              </View>
            </View>
            <View style={styles.freshRow}>
              <View style={styles.freshDot} />
              <Text style={styles.freshText}>
                {age !== null ? t('garbageTracking.updatedSecondsAgo', { seconds: age }) : t('garbageTracking.updated')}
                {t('garbageTracking.refreshesEvery10s')}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.freshText}>{t('garbageTracking.noLocationYet')}</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 12, marginTop: 60, paddingHorizontal: 26 },
  emptyIconWrap: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.serifExtraBold, fontSize: 20, color: colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 17 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.cyanLight, alignItems: 'center', justifyContent: 'center' },
  reg: { fontFamily: 'ui-monospace', fontSize: 18, fontWeight: '800', color: colors.text },
  driverLine: { fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: fonts.sansSemibold },
  dutyBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dutyOn: { backgroundColor: colors.greenLight },
  dutyOff: { backgroundColor: colors.background },
  dutyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  dutyText: { fontSize: 11.5, fontFamily: fonts.sansExtraBold },
  dutyTextOn: { color: '#146848' },
  dutyTextOff: { color: colors.muted },
  sectionLabel: { fontSize: 11.5, fontFamily: fonts.sansExtraBold, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.muted },
  coordsRow: { flexDirection: 'row', gap: 12, marginTop: 13 },
  coordCell: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 12, padding: 13 },
  coordLabel: { fontSize: 11, fontFamily: fonts.sansExtraBold, color: colors.muted },
  coordValue: { fontFamily: 'ui-monospace', fontSize: 17, fontWeight: '800', color: colors.navy, marginTop: 5 },
  freshRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  freshDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  freshText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.muted },
});
