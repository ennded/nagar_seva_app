import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { MY_WARD_VEHICLE } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import { VehicleMap } from '../../components/VehicleMap';

export function GarbageTrackingPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ myWardVehicle: Vehicle | null }>(MY_WARD_VEHICLE);

  if (loading) return <p>{t('common.loading')}</p>;
  const vehicle = data?.myWardVehicle;

  return (
    <div>
      <h1>{t('garbage.title')}</h1>
      {!vehicle ? (
        <p>{t('garbage.noVehicle')}</p>
      ) : (
        <div className="admin-panel">
          <p>
            <strong>{t('garbage.vehicleFor')}:</strong> {vehicle.ward.name} ({vehicle.registrationNumber})
          </p>
          {vehicle.driver && (
            <p>
              <strong>{t('garbage.driver')}:</strong> {vehicle.driver.name}
            </p>
          )}
          <VehicleMap vehicle={vehicle} />
        </div>
      )}
    </div>
  );
}
