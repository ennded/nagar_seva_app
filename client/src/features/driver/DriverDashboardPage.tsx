import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Truck, MapPin, Radio, Navigation2 } from 'lucide-react';
import { MY_VEHICLE } from '../../graphql/queries/vehicle.queries';
import { END_DUTY, START_DUTY, UPDATE_VEHICLE_LOCATION } from '../../graphql/mutations/vehicle.mutations';
import type { Vehicle } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

const LOCATION_UPDATE_INTERVAL_MS = 10_000;

export function DriverDashboardPage() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery<{ myVehicle: Vehicle | null }>(MY_VEHICLE);
  const [startDuty, { loading: starting }] = useMutation(START_DUTY);
  const [endDuty, { loading: ending }] = useMutation(END_DUTY);
  const [updateLocation] = useMutation(UPDATE_VEHICLE_LOCATION);
  const [locationError, setLocationError] = useState<string | null>(null);
  const lastSentAt = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  const vehicle = data?.myVehicle;

  useEffect(() => {
    if (!vehicle?.onDuty) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationError(null);
        const now = Date.now();
        if (now - lastSentAt.current < LOCATION_UPDATE_INTERVAL_MS) return;
        lastSentAt.current = now;
        updateLocation({ variables: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => setLocationError(t('garbage.locationError')),
      { enableHighAccuracy: true },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [vehicle?.onDuty, updateLocation, t]);

  if (loading) {
    return (
      <div>
        <h1>{t('role.DRIVER')}</h1>
        <Skeleton variant="tiles" count={3} />
        <Card>
          <Skeleton variant="text" count={2} />
        </Card>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div>
        <h1>{t('role.DRIVER')}</h1>
        <Card>
          <EmptyState icon={Truck} message={t('garbage.noVehicleAssigned')} />
        </Card>
      </div>
    );
  }

  async function handleToggleDuty() {
    if (vehicle!.onDuty) {
      await endDuty();
    } else {
      await startDuty();
    }
    refetch();
  }

  const tiles = [
    { Icon: Truck, value: vehicle.registrationNumber, label: t('admin.vehicles.registrationNumber') },
    { Icon: MapPin, value: vehicle.ward.name, label: t('auth.ward') },
    {
      Icon: Radio,
      value: vehicle.onDuty ? t('admin.vehicles.onDuty') : t('admin.vehicles.offDuty'),
      label: t('admin.vehicles.status'),
    },
  ];

  return (
    <div>
      <h1>{t('role.DRIVER')}</h1>

      <section className="stats-row">
        {tiles.map((tile) => (
          <div key={tile.label} className="stat-tile">
            <div className="stat-tile-icon">
              <tile.Icon size={20} color="#0B3D66" />
            </div>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </section>

      <Card title={t('garbage.title')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
          <Badge tone={vehicle.onDuty ? 'success' : 'neutral'}>
            {vehicle.onDuty ? t('admin.vehicles.onDuty') : t('admin.vehicles.offDuty')}
          </Badge>
          {vehicle.onDuty && !locationError && (
            <span className="form-success" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation2 size={14} />
              {t('garbage.sharingLocation')}
            </span>
          )}
        </div>
        {locationError && <p className="form-error">{locationError}</p>}
        <div className="action-row">
          <button type="button" onClick={handleToggleDuty} disabled={starting || ending}>
            {vehicle.onDuty ? t('garbage.endDuty') : t('garbage.startDuty')}
          </button>
        </div>
      </Card>
    </div>
  );
}
