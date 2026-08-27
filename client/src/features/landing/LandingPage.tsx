import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { GovTopBar } from "../../components/GovTopBar";
import { Footer } from "../../components/Footer";
import {
  User,
  Users,
  FileText,
  Bell,
  BarChart3,
  Trash2,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { CitySwitcher } from "./CitySwitcher";
import {
  CITIES,
  CITY_BY_SLUG,
  DEPARTMENTS_BY_CITY,
  PUBLIC_DASHBOARD_STATS,
} from "../../graphql/queries/public.queries";
import type {
  City,
  DepartmentRef,
  PublicDashboardStats,
} from "../../graphql/types";
import {
  NAVY,
  GREEN,
  BG,
  TEXT,
  MUTED,
  BORDER,
  NAVY_LIGHT,
  GREEN_LIGHT,
} from "./palette";
import { AboutSection } from "./sections/AboutSection";
import { ServicesSection } from "./sections/ServicesSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";
import { FAQSection } from "./sections/FAQSection";
import { ContactSection } from "./sections/ContactSection";

const ROLE_META = [
  {
    id: "citizen",
    key: "citizen",
    Icon: User,
    iconBg: NAVY_LIGHT,
    iconColor: NAVY,
    btn: NAVY,
    to: (city: string) => `/${city}/login`,
  },
  {
    id: "admin",
    key: "admin",
    Icon: Users,
    iconBg: GREEN_LIGHT,
    iconColor: GREEN,
    btn: GREEN,
    to: (city: string) => `/${city}/staff-login/admin`,
  },
  {
    id: "officer",
    key: "officer",
    Icon: FileText,
    iconBg: "#EFE9FB",
    iconColor: "#6B46C1",
    btn: "#6B46C1",
    to: (city: string) => `/${city}/staff-login/officer`,
  },
  {
    id: "nagarsevak",
    key: "nagarsevak",
    Icon: Bell,
    iconBg: "#FCEEE1",
    iconColor: "#D97706",
    btn: "#D97706",
    to: (city: string) => `/${city}/staff-login/nagarsevak`,
  },
  {
    id: "nagaradhyaksh",
    key: "nagaradhyaksh",
    Icon: BarChart3,
    iconBg: "#FBEAEA",
    iconColor: "#DC2626",
    btn: "#DC2626",
    to: (city: string) => `/${city}/staff-login/nagaradhyaksh`,
  },
  {
    id: "driver",
    key: "driver",
    Icon: Trash2,
    iconBg: "#E3F4F7",
    iconColor: "#0891B2",
    btn: "#0891B2",
    to: (city: string) => `/${city}/staff-login/driver`,
  },
];

export function LandingPage() {
  const { citySlug: paramSlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: citiesData,
    loading: citiesLoading,
    error: citiesError,
    refetch: refetchCities,
  } = useQuery<{
    cities: City[];
  }>(CITIES);

  // A cold backend (Render free-tier services waking up) surfaces as a query error, not an empty
  // result — retry with backoff instead of treating it the same as "genuinely zero cities onboarded".
  const retryCountRef = useRef(0);
  useEffect(() => {
    if (!citiesError) {
      retryCountRef.current = 0;
      return;
    }
    const delay = Math.min(5000 * 2 ** retryCountRef.current, 30000);
    const timer = setTimeout(() => {
      retryCountRef.current += 1;
      refetchCities().catch(() => {});
    }, delay);
    return () => clearTimeout(timer);
  }, [citiesError, refetchCities]);

  const citySlug = paramSlug || citiesData?.cities[0]?.slug || "";

  const { data: cityData, loading: cityLoading } = useQuery<{
    cityBySlug: City | null;
  }>(CITY_BY_SLUG, {
    variables: { slug: citySlug },
    skip: !citySlug,
  });
  const { data: statsData } = useQuery<{
    publicDashboardStats: PublicDashboardStats;
  }>(PUBLIC_DASHBOARD_STATS, {
    variables: { citySlug },
    skip: !cityData?.cityBySlug,
  });
  const { data: deptData } = useQuery<{ departmentsByCity: DepartmentRef[] }>(
    DEPARTMENTS_BY_CITY,
    {
      variables: { citySlug },
      skip: !cityData?.cityBySlug,
    },
  );

  if (citiesLoading || (citySlug && cityLoading))
    return (
      <p style={{ padding: 40, fontFamily: "Public Sans, sans-serif" }}>
        {t("common.loading")}
      </p>
    );
  if (citiesError) {
    return (
      <div style={{ padding: 40, fontFamily: "Public Sans, sans-serif" }}>
        <p>{t("landing.connecting")}</p>
        <button
          type="button"
          onClick={() => refetchCities().catch(() => {})}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            border: "none",
            borderRadius: 8,
            background: NAVY,
            color: "#FFFFFF",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("landing.retryNow")}
        </button>
      </div>
    );
  }
  if (!citiesData?.cities.length) {
    return (
      <p style={{ padding: 40, fontFamily: "Public Sans, sans-serif" }}>
        {t("landing.noCities")}
      </p>
    );
  }
  if (!cityData?.cityBySlug) {
    return (
      <p style={{ padding: 40, fontFamily: "Public Sans, sans-serif" }}>
        {t("marketing.cityNotFound", { citySlug })}
      </p>
    );
  }

  const city = cityData.cityBySlug;
  const cities = citiesData.cities;
  const stats = statsData?.publicDashboardStats;

  const landingStats = [
    {
      Icon: User,
      value: stats ? stats.totalCitizens.toLocaleString("en-IN") : "—",
      label: t("marketing.stats.citizensServed"),
    },
    {
      Icon: FileText,
      value: stats
        ? stats.totalResolvedComplaints.toLocaleString("en-IN")
        : "—",
      label: t("marketing.stats.complaintsResolved"),
    },
    {
      Icon: MapPin,
      value: stats ? String(stats.totalWards) : "—",
      label: t("marketing.stats.wards"),
    },
    {
      Icon: Users,
      value: deptData ? String(deptData.departmentsByCity.length) : "—",
      label: t("marketing.stats.departments"),
    },
    { Icon: Bell, value: "24x7", label: t("marketing.stats.digitalServices") },
  ];

  const ROLES = ROLE_META.map((r) => ({
    ...r,
    label: t(`marketing.roles.${r.key}.label`),
    desc: t(`marketing.roles.${r.key}.desc`),
  }));

  function scrollToId(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const NAV_LINKS = [
    { label: t("marketing.nav.home"), id: "roles" },
    { label: t("marketing.nav.about"), id: "about" },
    { label: t("marketing.nav.services"), id: "services" },
    { label: t("marketing.nav.howItWorks"), id: "how-it-works" },
    { label: t("marketing.nav.notices"), id: null },
    { label: t("marketing.nav.contact"), id: "contact" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Public Sans', system-ui, sans-serif",
        width: "100%",
        background: BG,
      }}
    >
      <GovTopBar />

      <div
        style={{
          width: "100%",
          background: "#FFFFFF",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1360,
            padding: "14px 24px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt=""
              width={50}
              height={50}
              style={{ flexShrink: 0 }}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: TEXT,
                  lineHeight: 1.1,
                }}
              >
                नगर सेवा
              </div>
              <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 600 }}>
                आपले शहर, आपली जबाबदारी
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <CitySwitcher
              cities={cities}
              selectedSlug={city.slug}
              onSelect={(slug) => navigate(`/${slug}`)}
            />
          </div>
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 1360,
            padding: "0 24px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            overflowX: "auto",
          }}
        >
          {NAV_LINKS.map(({ label, id }, i) => (
            <button
              key={label}
              type="button"
              onClick={() => id && scrollToId(id)}
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: i === 0 ? NAVY : TEXT,
                borderBottom: i === 0 ? `2px solid ${NAVY}` : "none",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                padding: "8px 14px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: "transparent",
                boxShadow: "none",
                minHeight: "unset",
                cursor: id ? "pointer" : "default",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(120deg, ${NAVY} 0%, #14538c 55%, ${GREEN} 130%)`,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/images/hero-building.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, transparent 30%, rgba(0,0,0,0.55) 55%, #000 78%)",
            maskImage:
              "linear-gradient(90deg, transparent 0%, transparent 30%, rgba(0,0,0,0.55) 55%, #000 78%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(11,61,102,0.35) 0%, rgba(20,83,140,0.25) 55%, rgba(30,138,95,0.15) 130%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 32%, rgba(255,255,255,0.35) 58%, rgba(255,255,255,0.05) 78%)",
          }}
        />
        <div
          style={{
            width: "100%",
            maxWidth: 1360,
            padding: "64px 24px 100px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: GREEN_LIGHT,
              color: GREEN,
              padding: "8px 16px",
              borderRadius: 100,
              fontSize: 13.5,
              fontWeight: 700,
            }}
          >
            {t("marketing.hero.badge")}
          </div>
          <div
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 46,
              fontWeight: 800,
              color: TEXT,
              lineHeight: 1.18,
              marginTop: 20,
              maxWidth: 620,
            }}
          >
            {t("marketing.hero.headlinePrefix")}{" "}
            <span style={{ color: NAVY }}>
              {t("marketing.hero.headlineHighlight")}
            </span>
          </div>
          <div
            style={{
              fontSize: 17,
              color: "#3A4450",
              marginTop: 16,
              maxWidth: 520,
              lineHeight: 1.6,
            }}
          >
            {t("marketing.hero.subtitle")}
          </div>
          <button
            onClick={() => scrollToId("roles")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 28,
              height: 56,
              padding: "0 26px",
              border: "none",
              borderRadius: 14,
              background: NAVY,
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 800,
              fontFamily: "inherit",
              cursor: "pointer",
              minHeight: "unset",
              boxShadow: "none",
            }}
          >
            {t("marketing.hero.cta")}
            <ChevronRight size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 1360,
          padding: "0 24px",
          marginTop: -40,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 18,
            boxShadow: "0 20px 50px rgba(20,24,28,0.12)",
            padding: "28px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
          }}
        >
          {landingStats.map((s) => (
            <div
              key={s.label}
              style={{ display: "flex", alignItems: "center", gap: 14 }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: NAVY_LIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <s.Icon size={22} color={NAVY} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: TEXT,
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: MUTED,
                    fontWeight: 600,
                    marginTop: 3,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="roles"
        style={{
          width: "100%",
          maxWidth: 1360,
          padding: "64px 24px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Source Serif 4', serif",
            fontSize: 28,
            fontWeight: 800,
            color: TEXT,
            textAlign: "center",
          }}
        >
          {t("marketing.roles.title")}
        </div>
        <div
          style={{
            fontSize: 15.5,
            color: MUTED,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {t("marketing.roles.subtitle")}
        </div>
        <div
          style={{
            width: "100%",
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 16,
          }}
        >
          {ROLES.map((role) => (
            <div
              key={role.id}
              style={{
                border: `1px solid ${BORDER}`,
                background: "#FFFFFF",
                borderRadius: 18,
                padding: "26px 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 14,
                height: "100%",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: role.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <role.Icon size={30} color={role.iconColor} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: TEXT }}>
                  {role.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: MUTED,
                    marginTop: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {role.desc}
                </div>
              </div>
              <button
                onClick={() => navigate(role.to(citySlug))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  justifyContent: "center",
                  height: 46,
                  border: "none",
                  borderRadius: 12,
                  background: role.btn,
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  marginTop: "auto",
                  minHeight: "unset",
                  boxShadow: "none",
                }}
              >
                {t("marketing.roles.selectRole")}
                <ChevronRight size={15} color="#FFFFFF" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <AboutSection />
      <ServicesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection city={city} />

      <Footer citySlug={citySlug} />
    </div>
  );
}
