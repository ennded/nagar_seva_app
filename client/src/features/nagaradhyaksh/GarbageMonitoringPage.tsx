import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react';
import { VEHICLES_BY_CITY } from '../../graphql/queries/vehicle.queries';
import type { Vehicle } from '../../graphql/types';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export function GarbageMonitoringPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ vehiclesByCity: Vehicle[] }>(VEHICLES_BY_CITY);
  const vehicles = data?.vehiclesByCity ?? [];

  return (
    <div>
      <h1>{t('nagaradhyaksh.garbageMonitoring.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.garbageMonitoring.subtitle')}</p>

      <Card>
        {loading ? (
          <Skeleton variant="rows" count={5} />
        ) : vehicles.length === 0 ? (
          <EmptyState icon={Truck} message={t('nagaradhyaksh.garbageMonitoring.noData')} />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>{t('nagaradhyaksh.garbageMonitoring.vehicle')}</th>
                <th>{t('nagaradhyaksh.garbageMonitoring.driver')}</th>
                <th>{t('nagaradhyaksh.garbageMonitoring.ward')}</th>
                <th>{t('nagaradhyaksh.garbageMonitoring.status')}</th>
                <th>{t('nagaradhyaksh.garbageMonitoring.lastUpdate')}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.registrationNumber}</td>
                  <td>{v.driver?.name ?? t('nagaradhyaksh.garbageMonitoring.noDriver')}</td>
                  <td>{v.ward.name}</td>
                  <td>
                    <Badge tone={v.onDuty ? 'success' : 'neutral'}>
                      {v.onDuty ? t('nagaradhyaksh.garbageMonitoring.onDuty') : t('nagaradhyaksh.garbageMonitoring.offDuty')}
                    </Badge>
                  </td>
                  <td>{v.locationUpdatedAt ? new Date(v.locationUpdatedAt).toLocaleString() : t('nagaradhyaksh.garbageMonitoring.never')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
