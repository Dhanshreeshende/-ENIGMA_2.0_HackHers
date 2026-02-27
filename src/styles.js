// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
export const C = {
  bg: "#020617",
  surface: "#111827",
  surfaceDeep: "#0B1220",
  secondaryBg: "#020B1A",
  accent: "#7C3AED",
  accentDim: "rgba(124, 58, 237, 0.12)",
  accentGlow: "rgba(124, 58, 237, 0.3)",
  danger: "#EF4444",
  warn: "#F59E0B",
  purple: "#8B5CF6",
  cyan: "#0EA5E9",
  text: "#E5E7EB",
  textMuted: "#6B7280",
  textDim: "#9CA3AF",
  border: "#1F2937",
  borderHover: "rgba(124, 58, 237, 0.4)",
};

export const S = {
  app: {
    display: "flex", height: "100vh", width: "100vw",
    background: C.bg, color: C.text,
    fontFamily: "Inter, sans-serif",
    overflow: "hidden", position: "relative",
  },
  sidebar: {
    width: 230, flexShrink: 0,
    background: C.surfaceDeep,
    borderRight: `1px solid ${C.border}`,
    display: "flex", flexDirection: "column",
    zIndex: 10,
  },
  logo: {
    padding: "20px 18px",
    borderBottom: `1px solid ${C.border}`,
    fontSize: 16, fontWeight: 800, letterSpacing: -0.5,
    display: "flex", alignItems: "center", gap: 12,
    fontFamily: "Inter, sans-serif",
    color: C.accent,
  },
  navSection: {
    fontSize: 11, color: C.textMuted,
    letterSpacing: 1, textTransform: "uppercase",
    padding: "16px 18px 8px", fontFamily: "Inter, sans-serif", fontWeight: 600,
  },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px", cursor: "pointer", borderRadius: 8,
    margin: "2px 10px", fontSize: 13, fontFamily: "Inter, sans-serif",
    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
    color: active ? C.accent : C.textDim,
    background: active ? C.accentDim : "transparent",
    border: active ? `1px solid rgba(124, 58, 237, 0.3)` : "1px solid transparent",
    fontWeight: active ? 600 : 500,
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
  }),
  navIcon: (active) => ({
    width: 28, height: 28, borderRadius: 6, display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: 14,
    background: active ? C.accent : "rgba(0,0,0,0.05)",
    color: active ? C.bg : C.textMuted,
    flexShrink: 0, transition: "all 0.2s",
  }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  topbar: {
    height: 58, display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
    background: C.bg,
    borderBottom: `1px solid ${C.border}`,
    flexShrink: 0,
  },
  content: { flex: 1, overflowY: "auto", padding: "24px", overflowX: "hidden" },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
  },
  cardTitle: {
    fontWeight: 700, fontSize: 14, letterSpacing: -0.2,
    color: C.text, marginBottom: 16, fontFamily: "Inter, sans-serif",
  },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 8, border: "none",
    cursor: "pointer", fontSize: 13,
    fontFamily: "Inter, sans-serif",
    fontWeight: 600, transition: "all 0.2s",
    ...(variant === "primary" ? {
      background: `linear-gradient(135deg, #6366F1, #8B5CF6)`,
      color: "#FFFFFF", boxShadow: `0 4px 12px rgba(124, 58, 237, 0.3)`,
    } : variant === "danger" ? {
      background: "#FEF2F2", color: C.danger,
      border: `1px solid #FCA5A5`,
    } : {
      background: C.bg, color: C.text,
      border: `1px solid ${C.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    }),
  }),
  label: {
    fontSize: 12, color: C.textMuted,
    letterSpacing: 0.5, textTransform: "uppercase",
    fontFamily: "Inter, sans-serif", fontWeight: 600
  },
  val: { color: C.text, fontWeight: 600, fontFamily: "Inter, sans-serif" },
  metric: {
    textAlign: "center", padding: "16px 12px",
    background: C.surfaceDeep, borderRadius: 10,
    border: `1px solid ${C.border}`,
    position: "relative", overflow: "hidden",
  },
  metricVal: {
    display: "block", fontSize: 24, color: C.accent,
    fontWeight: 700, fontFamily: "Inter, sans-serif",
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5,
    color: C.textMuted, marginTop: 4, fontWeight: 600,
    fontFamily: "Inter, sans-serif",
  },
  infoBox: (variant = "default") => ({
    padding: "12px 16px", borderRadius: 8, fontSize: 13,
    lineHeight: 1.6, color: C.text, fontFamily: "Inter, sans-serif",
    background: variant === "warn" ? "#FFFBEB"
      : variant === "danger" ? "#FEF2F2"
        : C.accentDim,
    borderLeft: `4px solid ${variant === "warn" ? C.warn : variant === "danger" ? C.danger : C.accent}`,
    border: `1px solid ${variant === "warn" ? "#FDE68A" : variant === "danger" ? "#FECACA" : "rgba(124, 58, 237, 0.2)"}`,
  }),
  range: {
    width: "100%", cursor: "pointer", accentColor: C.accent,
  },
  select: {
    width: "100%", background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text, padding: "8px 12px", borderRadius: 8,
    fontFamily: "Inter, sans-serif", fontSize: 13, cursor: "pointer",
    outline: "none", transition: "border-color 0.2s",
  },
  canvasWrap: {
    borderRadius: 12, overflow: "hidden",
    background: C.surfaceDeep,
    border: `1px solid ${C.border}`,
    position: "relative",
  },
};
