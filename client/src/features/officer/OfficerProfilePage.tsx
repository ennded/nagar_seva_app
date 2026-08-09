import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { ME } from '../../graphql/queries/auth.queries';
import { UPDATE_MY_AVAILABILITY } from '../../graphql/mutations/officer.mutations';
import type { UserFields } from '../../graphql/types';
import { Skeleton } from '../../components/ui/Skeleton';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DaySlot {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function defaultSlots(): DaySlot[] {
  return DAYS.map(() => ({ enabled: false, startTime: '10:00', endTime: '16:00' }));
}

export function OfficerProfilePage() {
  const { t } = useTranslation();
  const { data, loading } = useQuery<{ me: UserFields | null }>(ME);
  const [updateAvailability, { loading: saving, error }] = useMutation(UPDATE_MY_AVAILABILITY);
  const [slots, setSlots] = useState<DaySlot[]>(defaultSlots());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.me) return;
    const next = defaultSlots();
    for (const a of data.me.availability) {
      next[a.dayOfWeek] = { enabled: true, startTime: a.startTime, endTime: a.endTime };
    }
    setSlots(next);
  }, [data?.me]);

  function updateDay(index: number, patch: Partial<DaySlot>) {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    const input = slots
      .map((s, dayOfWeek) => ({ dayOfWeek, ...s }))
      .filter((s) => s.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
    await updateAvailability({ variables: { slots: input } });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <Skeleton variant="rows" count={5} />;

  const me = data?.me;

  return (
    <div>
      <h1>{t('officer.profile.title')}</h1>

      {me && (
        <div className="admin-panel">
          <p>
            <strong>{t('auth.name')}:</strong> {me.name}
          </p>
          <p>
            <strong>{t('officer.profile.mobile')}:</strong> {me.mobile}
          </p>
          {me.email && (
            <p>
              <strong>{t('officer.profile.email')}:</strong> {me.email}
            </p>
          )}
          {me.department && (
            <p>
              <strong>{t('officer.profile.department')}:</strong> {me.department.name}
            </p>
          )}
          {me.ward && (
            <p>
              <strong>{t('officer.profile.ward')}:</strong> {me.ward.name}
            </p>
          )}
        </div>
      )}

      <div className="admin-panel">
        <h2>{t('officer.nav.availability')}</h2>
        <p>{t('officer.availabilityIntro')}</p>
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Available</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, i) => (
              <tr key={day}>
                <td>{day}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={slots[i].enabled}
                    onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                    style={{ width: 22, height: 22, minHeight: 'unset' }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={slots[i].startTime}
                    disabled={!slots[i].enabled}
                    onChange={(e) => updateDay(i, { startTime: e.target.value })}
                    style={{ maxWidth: 130 }}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={slots[i].endTime}
                    disabled={!slots[i].enabled}
                    onChange={(e) => updateDay(i, { endTime: e.target.value })}
                    style={{ maxWidth: 130 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <p className="form-error">{error.message}</p>}
        {saved && <p className="form-success">{t('officer.availabilitySaved')}</p>}
        <div className="action-row">
          <button type="button" onClick={handleSave} disabled={saving}>
            {t('officer.saveAvailability')}
          </button>
        </div>
      </div>
    </div>
  );
}
