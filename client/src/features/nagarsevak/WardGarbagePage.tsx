import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import { MY_WARD_VEHICLE } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import { VehicleMap } from '../../components/VehicleMap';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export function WardGarbagePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ myWardVehicle: Vehicle | null }>(MY_WARD_VEHICLE, {
    pollInterval: 10_000,
  });
  const vehicle = data?.myWardVehicle;

  return (
    <div>
      <h1>{t('garbage.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('monitor.garbageSubtitle')}</p>

      {loading && <Skeleton variant="rows" count={3} />}

      {!loading && !vehicle && <EmptyState icon={Truck} message={t('garbage.noVehicle')} />}

      {!loading && vehicle && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              background: 'var(--color-primary)',
              borderRadius: 16,
              padding: 20,
              color: '#FFFFFF',
              margin: '1.5rem 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={22} color="#FFFFFF" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#CBD8E6', fontWeight: 600 }}>
                  {vehicle.onDuty ? t('garbage.driverOnRoute') : t('garbage.offDuty')}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                  {vehicle.driver ? `${vehicle.driver.name} · ` : ''}
                  {vehicle.registrationNumber}
                </div>
              </div>
            </div>
            <Badge tone={vehicle.onDuty ? 'success' : 'neutral'}>{vehicle.onDuty ? t('garbage.onDuty') : t('garbage.offDuty')}</Badge>
          </div>

          <VehicleMap vehicle={vehicle} />
        </>
      )}
    </div>
  );
}
