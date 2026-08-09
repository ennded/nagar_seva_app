import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import { MY_WARD_VEHICLE } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import { VehicleMap } from '../../components/VehicleMap';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { NAVY, TEXT, MUTED, BORDER } from '../landing/palette';

export function GarbageTrackingPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ myWardVehicle: Vehicle | null }>(MY_WARD_VEHICLE, {
    pollInterval: 10_000,
  });
  const vehicle = data?.myWardVehicle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 800, color: TEXT }}>
        {t('garbage.title')}
      </div>

      {loading && <p style={{ fontSize: 14, color: MUTED }}>{t('common.loading')}</p>}

      {!loading && !vehicle && <EmptyState icon={Truck} message={t('garbage.noVehicle')} />}

      {!loading && vehicle && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              background: NAVY,
              borderRadius: 16,
              padding: 20,
              color: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={22} color="#FFFFFF" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#CBD8E6', fontWeight: 600 }}>
                  {t('garbage.vehicleFor')} {vehicle.ward.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{vehicle.registrationNumber}</div>
                {vehicle.driver && (
                  <div style={{ fontSize: 13, color: '#CBD8E6', marginTop: 2 }}>
                    {t('garbage.driver')}: {vehicle.driver.name}
                  </div>
                )}
              </div>
            </div>
            <Badge tone={vehicle.onDuty ? 'success' : 'neutral'}>{vehicle.onDuty ? t('garbage.onDuty') : t('garbage.offDuty')}</Badge>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{t('garbage.liveLocation')}</div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <VehicleMap vehicle={vehicle} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
