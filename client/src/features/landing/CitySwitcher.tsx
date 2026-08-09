import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import type { City } from "../../graphql/types";
import { BORDER, MUTED, NAVY, NAVY_LIGHT, TEXT } from "./palette";

interface CitySwitcherProps {
  cities: City[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export function CitySwitcher({
  cities,
  selectedSlug,
  onSelect,
}: CitySwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const selectedCity = cities.find((c) => c.slug === selectedSlug);
  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function handlePick(slug: string) {
    onSelect(slug);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: `1.5px solid ${NAVY}`,
          borderRadius: 100,
          padding: "8px 14px",
          fontSize: 14,
          fontWeight: 700,
          color: TEXT,
          background: "#FFFFFF",
          cursor: "pointer",
          fontFamily: "inherit",
          minHeight: "unset",
          boxShadow: "none",
          whiteSpace: "nowrap",
        }}
      >
        <MapPin size={15} color={NAVY} />
        {selectedCity?.name ?? ""}
        <ChevronDown size={15} color={MUTED} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 260,
            background: "#FFFFFF",
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            boxShadow: "0 12px 32px rgba(20,24,28,0.16)",
            padding: 12,
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: "8px 10px",
            }}
          >
            <Search size={15} color={MUTED} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("landing.searchCity")}
              className="bare-select"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
                width: "100%",
                fontFamily: "inherit",
                minHeight: "unset",
                padding: 0,
                color: TEXT,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: MUTED,
              margin: "12px 6px 6px",
              textTransform: "uppercase",
            }}
          >
            {t("landing.popularCities")}
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.map((c) => {
              const selected = c.slug === selectedSlug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => handlePick(c.slug)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 10px",
                    border: "none",
                    borderRadius: 8,
                    background: selected ? NAVY_LIGHT : "transparent",
                    color: TEXT,
                    fontSize: 14,
                    fontWeight: selected ? 700 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    minHeight: "unset",
                    boxShadow: "none",
                    textAlign: "left",
                  }}
                >
                  {c.name}
                  {selected && <Check size={15} color={NAVY} />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div
                style={{ padding: "10px 10px", fontSize: 13, color: MUTED }}
              >
                {t("landing.noSearchResults")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
