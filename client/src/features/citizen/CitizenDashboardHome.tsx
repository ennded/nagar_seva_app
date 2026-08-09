import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  Megaphone,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { MY_REQUESTS } from "../../graphql/queries/request.queries";
import {
  ANNOUNCEMENTS,
  EMERGENCY_CONTACTS,
} from "../../graphql/queries/public.queries";
import type {
  Announcement,
  Complaint,
  EmergencyContact,
  RequestUnion,
} from "../../graphql/types";
import { StatusBadge } from "../../components/StatusBadge";
import {
  NAVY,
  NAVY_DARK,
  NAVY_LIGHT,
  ORANGE,
  GREEN,
  GREEN_LIGHT,
  TEXT,
  MUTED,
  BORDER,
} from "../landing/palette";
import { CATEGORY_ICON, type ComplaintCategory } from "./categoryIcons";

const TERMINAL_STATUSES = new Set(["CLOSED", "REJECTED"]);

function greetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function CitizenDashboardHome() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: requestsData } = useQuery<{ myRequests: RequestUnion[] }>(
    MY_REQUESTS,
  );
  const { data: announcementsData } = useQuery<{
    announcements: Announcement[];
  }>(ANNOUNCEMENTS, {
    variables: { citySlug },
  });
  const { data: contactsData } = useQuery<{
    emergencyContacts: EmergencyContact[];
  }>(EMERGENCY_CONTACTS, {
    variables: { citySlug },
  });

  const requests = requestsData?.myRequests ?? [];
  const complaints = requests.filter(
    (r): r is Complaint => r.__typename === "Complaint",
  );

  const recentComplaints = [...complaints]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  const recentAnnouncements = (announcementsData?.announcements ?? []).slice(
    0,
    3,
  );
  const contacts = contactsData?.emergencyContacts ?? [];
  const helplineOrder = ["FIRE", "POLICE", "AMBULANCE"];
  const helplineContacts = helplineOrder
    .map((cat) => contacts.find((c) => c.category === cat))
    .filter((c): c is EmergencyContact => Boolean(c));

  const quickActions = [
    {
      to: `/${citySlug}/citizen/new-complaint`,
      Icon: PlusCircle,
      color: NAVY,
      bg: NAVY_LIGHT,
      key: "registerComplaint" as const,
    },
    {
      to: `/${citySlug}/citizen/requests`,
      Icon: ClipboardList,
      color: GREEN,
      bg: GREEN_LIGHT,
      key: "trackComplaint" as const,
    },
    {
      to: `/${citySlug}/citizen/new-appointment`,
      Icon: CalendarPlus,
      color: ORANGE,
      bg: "#FBE9D8",
      key: "bookAppointment" as const,
    },
    {
      to: `/${citySlug}/citizen/garbage`,
      Icon: Trash2,
      color: NAVY,
      bg: NAVY_LIGHT,
      key: "garbageTracking" as const,
    },
    {
      to: `/${citySlug}/citizen/notices`,
      Icon: Megaphone,
      color: GREEN,
      bg: GREEN_LIGHT,
      key: "notices" as const,
    },
    {
      to: `/${citySlug}/citizen/emergency-contacts`,
      Icon: Phone,
      color: ORANGE,
      bg: "#FBE9D8",
      key: "emergencyContacts" as const,
    },
  ];

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    navigate(`/${citySlug}/citizen/requests?q=${encodeURIComponent(term)}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          overflow: "hidden",
          background: NAVY,
          minHeight: 340,
          padding: "40px 32px",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero-building.png)",
            backgroundSize: "contain",
            backgroundPosition: "right center",
            backgroundRepeat: "no-repeat",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, transparent 42%, rgba(0,0,0,0.5) 58%, #000 72%)",
            maskImage:
              "linear-gradient(90deg, transparent 0%, transparent 42%, rgba(0,0,0,0.5) 58%, #000 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${NAVY} 0%, ${NAVY} 28%, rgba(11,61,102,0.75) 38%, rgba(11,61,102,0.25) 52%, rgba(11,61,102,0) 70%)`,
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 520 }}>
          <div
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            {t(`citizenHome.greeting.${greetingKey()}`, {
              name: session?.user.name?.split(" ")[0] ?? "",
            })}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#CBD8E6",
              marginTop: 8,
              maxWidth: 480,
              lineHeight: 1.5,
            }}
          >
            {t("citizenHome.subtitle")}
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "row",
            gap: 8,
            marginTop: 24,
            maxWidth: 560,
            padding: 0,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            borderRadius: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "0 14px",
            }}
          >
            <Search size={16} color={MUTED} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("citizenHome.searchPlaceholder") ?? ""}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                boxShadow: "none",
                borderRadius: 0,
                background: "transparent",
                padding: "12px 0",
                fontSize: 14,
                minHeight: "unset",
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              borderRadius: 12,
              padding: "0 20px",
              background: NAVY_DARK,
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              minHeight: "unset",
              boxShadow: "none",
            }}
          >
            {t("citizenHome.search")}
          </button>
        </form>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>
            {t("citizenHome.quickActions.title")}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED }}>
            {t("citizenHome.quickActions.subtitle")}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {quickActions.map(({ to, Icon, color, bg, key }) => (
            <Link
              key={key}
              to={to}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "#FFFFFF",
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: 18,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={19} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: TEXT }}>
                  {t(`citizenHome.quickActions.${key}.title`)}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                  {t(`citizenHome.quickActions.${key}.desc`)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: NAVY,
                }}
              >
                {t("citizenHome.open")}
                <ChevronRight size={14} color={NAVY} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>
              {t("citizenHome.recentComplaints.title")}
            </div>
            <Link
              to={`/${citySlug}/citizen/requests`}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: NAVY,
                textDecoration: "none",
              }}
            >
              {t("citizenHome.recentComplaints.viewAll")}
            </Link>
          </div>
          {recentComplaints.length === 0 && (
            <div style={{ fontSize: 13, color: MUTED }}>
              {t("citizenHome.recentComplaints.empty")}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentComplaints.map((r) => {
              const CategoryIcon = CATEGORY_ICON[r.category as ComplaintCategory] ?? ClipboardList;
              return (
                <Link
                  key={r.id}
                  to={`/${citySlug}/citizen/requests/${r.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    paddingBottom: 12,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#F1F4F7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CategoryIcon size={17} color={NAVY} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: TEXT,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: MUTED,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.address}
                      {r.ward?.name ? ` · ${r.ward.name}` : ""}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "#FBEAEA",
              border: "1px solid #F5C6C6",
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Phone size={16} color="#DC2626" />
              <div style={{ fontSize: 15, fontWeight: 800, color: "#7A1F1F" }}>
                {t("citizenHome.emergencyHelpline.title")}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {helplineContacts.map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.phoneNumber}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#7A1F1F",
                    textDecoration: "none",
                  }}
                >
                  <span>{c.name}</span>
                  <span>{c.phoneNumber}</span>
                </a>
              ))}
            </div>
            <Link
              to={`/${citySlug}/citizen/emergency-contacts`}
              style={{
                display: "block",
                marginTop: 14,
                textAlign: "center",
                background: "#DC2626",
                color: "#FFFFFF",
                borderRadius: 10,
                padding: "10px 0",
                fontSize: 13.5,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {t("citizenHome.emergencyHelpline.viewAll")}
            </Link>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>
                {t("citizenHome.announcements.title")}
              </div>
              <Link
                to={`/${citySlug}/citizen/notices`}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: NAVY,
                  textDecoration: "none",
                }}
              >
                {t("citizenHome.announcements.viewAll")}
              </Link>
            </div>
            {recentAnnouncements.length === 0 && (
              <div style={{ fontSize: 13, color: MUTED }}>
                {t("citizenHome.announcements.empty")}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentAnnouncements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    paddingBottom: 10,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: TEXT }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                    {new Date(
                      a.publishedAt ?? a.createdAt,
                    ).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
