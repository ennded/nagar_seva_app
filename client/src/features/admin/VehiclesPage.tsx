import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { STAFF_BY_CITY } from '../../graphql/queries/admin.queries';
import { VEHICLES_BY_CITY } from '../../graphql/queries/vehicle.queries';
import { ASSIGN_VEHICLE_DRIVER, CREATE_VEHICLE } from '../../graphql/mutations/vehicle.mutations';
import type { UserFields, Vehicle, WardRef } from '../../graphql/types';
import { useAuth } from '../auth/AuthContext';

export function VehiclesPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const citySlug = session!.citySlug;

  const [wardId, setWardId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [driverId, setDriverId] = useState('');

  const { data: vehiclesData, loading } = useQuery<{ vehiclesByCity: Vehicle[] }>(VEHICLES_BY_CITY);
  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, { variables: { citySlug } });
  const { data: driversData } = useQuery<{ staffByCity: UserFields[] }>(STAFF_BY_CITY, {
    variables: { role: 'DRIVER' },
  });

  const [createVehicle, { loading: creating, error }] = useMutation(CREATE_VEHICLE, {
    refetchQueries: [{ query: VEHICLES_BY_CITY }],
  });
  const [assignVehicleDriver] = useMutation(ASSIGN_VEHICLE_DRIVER, {
    refetchQueries: [{ query: VEHICLES_BY_CITY }],
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createVehicle({ variables: { input: { registrationNumber, wardId, driverId: driverId || undefined } } });
    setRegistrationNumber('');
    setWardId('');
    setDriverId('');
  }

  return (
    <div>
      <h1>{t('admin.vehicles.title')}</h1>

      <div className="admin-panel">
        <h2>{t('admin.vehicles.add')}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t('admin.vehicles.registrationNumber')}
            <input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
          </label>
          <label>
            {t('auth.ward')}
            <select value={wardId} onChange={(e) => setWardId(e.target.value)} required>
              <option value="" disabled>
                {t('auth.selectWard')}
              </option>
              {wardsData?.wardsByCity.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('admin.vehicles.driver')}
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">{t('admin.vehicles.unassigned')}</option>
              {driversData?.staffByCity.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.mobile})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={creating}>
            {t('admin.vehicles.add')}
          </button>
        </form>
        {error && <p className="form-error">{error.message}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : vehiclesData?.vehiclesByCity.length === 0 ? (
          <p>{t('admin.vehicles.empty')}</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.vehicles.registrationNumber')}</th>
                <th>{t('auth.ward')}</th>
                <th>{t('admin.vehicles.driver')}</th>
                <th>{t('admin.vehicles.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehiclesData?.vehiclesByCity.map((v) => (
                <tr key={v.id}>
                  <td>{v.registrationNumber}</td>
                  <td>{v.ward.name}</td>
                  <td>{v.driver?.name ?? '—'}</td>
                  <td>{v.onDuty ? t('admin.vehicles.onDuty') : t('admin.vehicles.offDuty')}</td>
                  <td>
                    {!v.driver && (
                      <select
                        defaultValue=""
                        onChange={(e) => e.target.value && assignVehicleDriver({ variables: { vehicleId: v.id, driverId: e.target.value } })}
                      >
                        <option value="" disabled>
                          {t('admin.vehicles.assignDriver')}
                        </option>
                        {driversData?.staffByCity.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
