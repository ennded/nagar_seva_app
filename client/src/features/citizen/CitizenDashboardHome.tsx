import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  CalendarPlus,
  ClipboardList,
  Megaphone,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import { ANNOUNCEMENTS, EMERGENCY_CONTACTS } from '../../graphql/queries/public.queries';
import type { Announcement, EmergencyContact, RequestUnion } from '../../graphql/types';
import { StatusBadge } from '../../components/StatusBadge';
import { NAVY, NAVY_DARK, NAVY_LIGHT, ORANGE, GREEN, GREEN_LIGHT, TEXT, MUTED, BORDER } from '../landing/palette';

const TERMINAL_STATUSES = new Set(['CLOSED', 'REJECTED']);

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function CitizenDashboardHome() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: requestsData } = useQuery<{ myRequests: RequestUnion[] }>(MY_REQUESTS);
  const { data: announcementsData } = useQuery<{ announcements: Announcement[] }>(ANNOUNCEMENTS, {
    variables: { citySlug },
  });
  const { data: contactsData } = useQuery<{ emergencyContacts: EmergencyContact[] }>(EMERGENCY_CONTACTS, {
    variables: { citySlug },
  });

  const requests = requestsData?.myRequests ?? [];
  const complaints = requests.filter((r) => r.__typename === 'Complaint');
  const appointments = requests.filter((r) => r.__typename === 'Appointment');

  const stats = [
    {
      Icon: ClipboardList,
      value: complaints.filter((r) => !TERMINAL_STATUSES.has(r.status)).length,
      label: t('citizenHome.stats.inProgress'),
      color: NAVY,
      bg: NAVY_LIGHT,
    },
    {
      Icon: ShieldCheck,
      value: complaints.filter((r) => r.status === 'CLOSED').length,
      label: t('citizenHome.stats.resolved'),
      color: GREEN,
      bg: GREEN_LIGHT,
    },
    {
      Icon: CalendarPlus,
      value: appointments.filter((r) => !TERMINAL_STATUSES.has(r.status)).length,
      label: t('citizenHome.stats.upcoming'),
      color: ORANGE,
      bg: '#FBE9D8',
    },
    {
      Icon: Sparkles,
      value: requests.length,
      label: t('citizenHome.stats.totalRequests'),
      color: '#6B46C1',
      bg: '#EFE9FB',
    },
  ];

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentAnnouncements = (announcementsData?.announcements ?? []).slice(0, 3);
  const contacts = contactsData?.emergencyContacts ?? [];
  const helplineOrder = ['FIRE', 'POLICE', 'AMBULANCE'];
  const helplineContacts = helplineOrder
    .map((cat) => contacts.find((c) => c.category === cat))
    .filter((c): c is EmergencyContact => Boolean(c));

  const quickActions = [
    { to: `/${citySlug}/citizen/new-complaint`, Icon: PlusCircle, color: NAVY, bg: NAVY_LIGHT, key: 'registerComplaint' as const },
    { to: `/${citySlug}/citizen/requests`, Icon: ClipboardList, color: GREEN, bg: GREEN_LIGHT, key: 'trackComplaint' as const },
    { to: `/${citySlug}/citizen/new-appointment`, Icon: CalendarPlus, color: ORANGE, bg: '#FBE9D8', key: 'bookAppointment' as const },
    { to: `/${citySlug}/citizen/garbage`, Icon: Trash2, color: '#0891B2', bg: '#E3F4F7', key: 'garbageTracking' as const },
    { to: `/${citySlug}/citizen/notices`, Icon: Megaphone, color: '#6B46C1', bg: '#EFE9FB', key: 'notices' as const },
    { to: `/${citySlug}/citizen/emergency-contacts`, Icon: Phone, color: '#DC2626', bg: '#FBEAEA', key: 'emergencyContacts' as const },
  ];

  const trustItems = [
    { Icon: ShieldCheck, key: 'secure' as const },
    { Icon: ClipboardList, key: 'transparent' as const },
    { Icon: Users, key: 'citizenFirst' as const },
    { Icon: Sparkles, key: 'accessible' as const },
  ];

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const term = search.trim();
    navigate(`/${citySlug}/citizen/requests${term ? `?q=${encodeURIComponent(term)}` : ''}`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 20,
          overflow: 'hidden',
          background: `linear-gradient(120deg, ${NAVY_DARK} 0%, ${NAVY} 55%, ${GREEN} 140%)`,
          padding: '32px 28px',
          color: '#FFFFFF',
        }}
      >
        {session?.user.ward && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#D8E2EC', marginBottom: 10 }}>
            <MapPin size={14} />
            {session.user.ward.name}
          </div>
        )}
        <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>
          {t(`citizenHome.greeting.${greetingKey()}`, { name: session?.user.name?.split(' ')[0] ?? '' })}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#D8E2EC', marginTop: 6 }}>{t('citizenHome.tagline')}</div>
        <div style={{ fontSize: 14, color: '#CBD8E6', marginTop: 4, maxWidth: 560 }}>{t('citizenHome.subtitle')}</div>

        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            marginTop: 20,
            maxWidth: 520,
            padding: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            borderRadius: 0,
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', borderRadius: 12, padding: '0 14px' }}>
            <Search size={16} color={MUTED} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('citizenHome.searchPlaceholder') ?? ''}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '12px 0', fontSize: 14, minHeight: 'unset' }}
            />
          </div>
          <button
            type="submit"
            style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 12, padding: '0 20px', background: ORANGE, color: '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer', minHeight: 'unset', boxShadow: 'none' }}
          >
            {t('citizenHome.search')}
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 28 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.Icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: '#D8E2EC', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 12 }}>{t('citizenHome.quickActions.title')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {quickActions.map(({ to, Icon, color, bg, key }) => (
            <Link
              key={key}
              to={to}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, textDecoration: 'none' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: TEXT }}>{t(`citizenHome.quickActions.${key}.title`)}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{t(`citizenHome.quickActions.${key}.desc`)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{t('citizenHome.recentComplaints.title')}</div>
            <Link to={`/${citySlug}/citizen/requests`} style={{ fontSize: 13, fontWeight: 700, color: NAVY, textDecoration: 'none' }}>
              {t('citizenHome.recentComplaints.viewAll')}
            </Link>
          </div>
          {recentComplaints.length === 0 && <div style={{ fontSize: 13, color: MUTED }}>{t('citizenHome.recentComplaints.empty')}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentComplaints.map((r) => (
              <Link
                key={r.id}
                to={`/${citySlug}/citizen/requests/${r.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textDecoration: 'none', paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{r.__typename === 'Complaint' ? r.title : ''}</div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{t('citizenHome.announcements.title')}</div>
            <Link to={`/${citySlug}/citizen/notices`} style={{ fontSize: 13, fontWeight: 700, color: NAVY, textDecoration: 'none' }}>
              {t('citizenHome.announcements.viewAll')}
            </Link>
          </div>
          {recentAnnouncements.length === 0 && <div style={{ fontSize: 13, color: MUTED }}>{t('citizenHome.announcements.empty')}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentAnnouncements.map((a) => (
              <div key={a.id} style={{ paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                  {new Date(a.publishedAt ?? a.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#FBEAEA', border: '1px solid #F5C6C6', borderRadius: 14, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Phone size={16} color="#DC2626" />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#7A1F1F' }}>{t('citizenHome.emergencyHelpline.title')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {helplineContacts.map((c) => (
              <a
                key={c.id}
                href={`tel:${c.phoneNumber}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#7A1F1F', textDecoration: 'none' }}
              >
                <span>{c.name}</span>
                <span>{c.phoneNumber}</span>
              </a>
            ))}
          </div>
          <Link
            to={`/${citySlug}/citizen/emergency-contacts`}
            style={{ display: 'block', marginTop: 14, textAlign: 'center', background: '#DC2626', color: '#FFFFFF', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 800, textDecoration: 'none' }}
          >
            {t('citizenHome.emergencyHelpline.viewAll')}
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {trustItems.map(({ Icon, key }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: NAVY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={NAVY} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: TEXT }}>{t(`citizenHome.trust.${key}.title`)}</div>
              <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{t(`citizenHome.trust.${key}.desc`)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
