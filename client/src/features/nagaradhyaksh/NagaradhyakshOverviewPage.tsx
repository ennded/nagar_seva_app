import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, CheckCircle2, Percent, Calendar, CalendarCheck, Truck } from 'lucide-react';
import { DASHBOARD_STATS } from '../../graphql/queries/admin.queries';
import { VEHICLES_BY_CITY } from '../../graphql/queries/vehicle.queries';
import type { DashboardStats, Vehicle } from '../../graphql/types';
import { Skeleton } from '../../components/ui/Skeleton';

export function NagaradhyakshOverviewPage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ dashboardStats: DashboardStats }>(DASHBOARD_STATS);
  const { data: vehicleData } = useQuery<{ vehiclesByCity: Vehicle[] }>(VEHICLES_BY_CITY);
  const stats = data?.dashboardStats;
  const activeVehicles = (vehicleData?.vehiclesByCity ?? []).filter((v) => v.onDuty).length;

  return (
    <div>
      <h1>{t('nagaradhyaksh.dashboard.title')}</h1>
      <p style={{ color: 'var(--color-muted)', marginTop: '-0.5rem' }}>{t('nagaradhyaksh.dashboard.subtitle')}</p>
      <div className="info-banner">{t('monitor.readOnlyNotice')}</div>

      {loading ? (
        <Skeleton variant="tiles" count={7} />
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            margin: '1.5rem 0',
          }}
        >
          {[
            { Icon: FileText, value: stats?.totalComplaints ?? 0, label: t('nagaradhyaksh.dashboard.totalComplaints') },
            { Icon: Clock, value: stats?.openComplaints ?? 0, label: t('nagaradhyaksh.dashboard.openComplaints') },
            { Icon: CheckCircle2, value: stats?.resolvedToday ?? 0, label: t('nagaradhyaksh.dashboard.resolvedToday') },
            { Icon: Percent, value: `${stats?.resolutionRate ?? 0}%`, label: t('nagaradhyaksh.dashboard.resolutionRate') },
            { Icon: Calendar, value: stats?.pendingAppointments ?? 0, label: t('nagaradhyaksh.dashboard.pendingAppointments') },
            { Icon: CalendarCheck, value: stats?.completedAppointments ?? 0, label: t('nagaradhyaksh.dashboard.completedAppointments') },
            { Icon: Truck, value: activeVehicles, label: t('nagaradhyaksh.dashboard.activeGarbageVehicles') },
          ].map((tile) => (
            <div key={tile.label} className="stat-tile" style={{ minWidth: 0 }}>
              <div className="stat-tile-icon">
                <tile.Icon size={20} color="#0B3D66" />
              </div>
              <strong>{tile.value}</strong>
              <span>{tile.label}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
