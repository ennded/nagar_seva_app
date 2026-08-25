import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import * as Location from 'expo-location';
import { Trash2, LogOut, Truck, MapPin, Radio, Navigation2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { MY_VEHICLE } from '../../graphql/queries/vehicle.queries';
import { START_DUTY, END_DUTY, UPDATE_VEHICLE_LOCATION } from '../../graphql/mutations/vehicle.mutations';
import type { Vehicle } from '../../graphql/types';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverDashboard'>;

// D3 (no vehicle) / D4 (off duty) / D5 (on duty, sharing location) / D6 (GPS permission lost) —
// one screen, no menu, no tabs. While on duty a location watch pushes lat/lng roughly every 10s,
// which is what feeds the citizen garbage-tracking map, the Nagarsevak ward Garbage screen and
// the Nagaradhyaksh fleet view.
export function DriverDashboardScreen({ navigation }: Props) {
  const { session, logout } = useAuth();
  const { data, loading } = useQuery<{ myVehicle: Vehicle | null }>(MY_VEHICLE, { pollInterval: 15_000 });
  const [startDuty, { loading: starting }] = useMutation(START_DUTY);
  const [endDuty, { loading: ending }] = useMutation(END_DUTY);
  const [updateLocation] = useMutation(UPDATE_VEHICLE_LOCATION);
  const [gpsError, setGpsError] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const vehicle = data?.myVehicle;
  const onDuty = vehicle?.onDuty ?? false;

  useEffect(() => {
    if (!onDuty) {
      watchRef.current?.remove();
      watchRef.current = null;
      setGpsError(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setGpsError(true);
        return;
      }
      setGpsError(false);
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 0 },
        (loc) => {
          updateLocation({ variables: { lat: loc.coords.latitude, lng: loc.coords.longitude } }).catch(() =>
            setGpsError(true),
          );
        },
      ).catch(() => {
        setGpsError(true);
        return null;
      });
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [onDuty, updateLocation]);

  function handleLogout() {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  async function toggleDuty() {
    try {
      if (onDuty) {
        await endDuty();
      } else {
        await startDuty();
      }
    } catch {
      // Swallow — the button reverts to reflect actual server state on next poll/refetch.
    }
  }

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.cyan} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Trash2 size={20} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerKicker}>Sanitation Driver</Text>
          <Text style={styles.headerName}>{session?.user.name ?? 'Driver'}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {!vehicle ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Truck size={34} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>No vehicle assigned yet</Text>
            <Text style={styles.emptySubtitle}>
              Your Municipal Admin assigns a vehicle from the Vehicles screen. Nothing else loads until then.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statRow}>
              <View style={styles.statTile}>
                <Truck size={19} color={colors.cyan} />
                <Text style={styles.statValue}>{vehicle.registrationNumber}</Text>
                <Text style={styles.statLabel}>Vehicle</Text>
              </View>
              <View style={styles.statTile}>
                <MapPin size={19} color={colors.cyan} />
                <Text style={styles.statValue}>{vehicle.ward.name}</Text>
                <Text style={styles.statLabel}>Ward</Text>
              </View>
              <View style={styles.statTile}>
                <Radio size={19} color={onDuty ? colors.green : colors.muted} />
                <Text style={[styles.statValue, { color: onDuty ? colors.green : colors.muted }]}>
                  {onDuty ? 'On Duty' : 'Off Duty'}
                </Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            <View style={styles.dutyCard}>
              <View style={[styles.badge, { backgroundColor: onDuty ? colors.greenLight : colors.background }]}>
                <View style={[styles.badgeDot, { backgroundColor: onDuty ? colors.green : colors.muted }]} />
                <Text style={[styles.badgeLabel, { color: onDuty ? colors.green : colors.muted }]}>
                  {onDuty ? 'On Duty' : 'Off Duty'}
                </Text>
              </View>

              {onDuty && !gpsError && (
                <View style={styles.sharingBlock}>
                  <View style={styles.sharingLabelRow}>
                    <Navigation2 size={15} color={colors.green} />
                    <Text style={styles.sharingLabel}>Sharing location</Text>
                  </View>
                  <Text style={styles.sharingNote}>
                    Your position is sent every 10 seconds while on duty. Citizens in {vehicle.ward.name} can see the
                    vehicle moving on their tracking map.
                  </Text>
                </View>
              )}

              {!onDuty && (
                <Text style={styles.offNote}>
                  Location sharing is off. Citizens see this vehicle as off duty and no route is tracked.
                </Text>
              )}

              {gpsError && (
                <Text style={styles.gpsErrorText}>
                  Unable to get your location. Location sharing needs permission — open Settings and allow location
                  for Nagar Seva.
                </Text>
              )}

              <Pressable
                onPress={toggleDuty}
                disabled={starting || ending}
                style={({ pressed }) => [
                  styles.dutyButton,
                  { backgroundColor: onDuty ? colors.red : colors.cyan },
                  (starting || ending) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.dutyButtonLabel}>
                  {starting || ending ? 'Please wait…' : onDuty ? 'End Duty' : 'Start Duty'}
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: colors.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerKicker: { fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' },
  headerName: { fontFamily: fonts.serifExtraBold, fontSize: 19, color: colors.white, marginTop: 2 },
  logoutButton: { padding: 6, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 18, gap: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 20 },
  emptyIconWrap: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.serifExtraBold, fontSize: 23, color: colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, maxWidth: 290 },
  statRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  statValue: { fontFamily: fonts.sansExtraBold, fontSize: 15, color: colors.text, marginTop: 9, lineHeight: 19 },
  statLabel: { fontSize: 11, color: colors.muted, fontFamily: fonts.sansBold, marginTop: 4 },
  dutyCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, alignItems: 'center', gap: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  badgeDot: { width: 10, height: 10, borderRadius: 5 },
  badgeLabel: { fontSize: 14, fontFamily: fonts.sansExtraBold },
  sharingBlock: { alignItems: 'center', gap: 8 },
  sharingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sharingLabel: { fontSize: 14, fontFamily: fonts.sansExtraBold, color: colors.green },
  sharingNote: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, fontFamily: fonts.sansSemibold, maxWidth: 280 },
  offNote: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 19, fontFamily: fonts.sansSemibold, maxWidth: 280 },
  gpsErrorText: { fontSize: 13, color: colors.red, textAlign: 'left', width: '100%', lineHeight: 19 },
  dutyButton: { width: '100%', minHeight: 66, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  dutyButtonLabel: { color: colors.white, fontSize: 19, fontFamily: fonts.sansExtraBold },
});
