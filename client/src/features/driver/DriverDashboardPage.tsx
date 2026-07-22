import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MY_VEHICLE } from '../../graphql/queries/vehicle.queries';
import { END_DUTY, START_DUTY, UPDATE_VEHICLE_LOCATION } from '../../graphql/mutations/vehicle.mutations';
import type { Vehicle } from '../../graphql/types';

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

  if (loading) return <p>{t('common.loading')}</p>;

  if (!vehicle) {
    return (
      <div>
        <h1>{t('role.DRIVER')}</h1>
        <p>{t('garbage.noVehicleAssigned')}</p>
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

  return (
    <div>
      <h1>{vehicle.registrationNumber}</h1>
      <div className="admin-panel">
        <p>
          <strong>{t('auth.ward')}:</strong> {vehicle.ward.name}
        </p>
        <p>
          <strong>{t('admin.vehicles.status')}:</strong>{' '}
          {vehicle.onDuty ? t('admin.vehicles.onDuty') : t('admin.vehicles.offDuty')}
        </p>
        {vehicle.onDuty && !locationError && <p className="form-success">{t('garbage.sharingLocation')}</p>}
        {locationError && <p className="form-error">{locationError}</p>}
        <div className="action-row">
          <button type="button" onClick={handleToggleDuty} disabled={starting || ending}>
            {vehicle.onDuty ? t('garbage.endDuty') : t('garbage.startDuty')}
          </button>
        </div>
      </div>
    </div>
  );
}
