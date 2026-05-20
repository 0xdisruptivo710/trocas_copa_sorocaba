/**
 * Frontend-only metadata for teams: background colors derived from flags,
 * group labels. Source of truth for IDs/names stays in the DB.
 *
 * Tailwind arbitrary class values can't be derived at runtime, so we use
 * inline style for the per-team color fills.
 */

export const TEAM_COLORS: Record<string, { bg: string; fg: string }> = {
  FWC: { bg: "#1d4ed8", fg: "#ffffff" },
  MEX: { bg: "#006847", fg: "#ffffff" },
  RSA: { bg: "#007a4d", fg: "#ffffff" },
  KOR: { bg: "#003478", fg: "#ffffff" },
  CZE: { bg: "#11457e", fg: "#ffffff" },
  CAN: { bg: "#d52b1e", fg: "#ffffff" },
  BIH: { bg: "#002395", fg: "#ffffff" },
  QAT: { bg: "#8a1538", fg: "#ffffff" },
  SUI: { bg: "#d52b1e", fg: "#ffffff" },
  BRA: { bg: "#009c3b", fg: "#ffdf00" },
  MAR: { bg: "#c1272d", fg: "#006233" },
  HAI: { bg: "#00209f", fg: "#d21034" },
  SCO: { bg: "#0065bf", fg: "#ffffff" },
  USA: { bg: "#bf0a30", fg: "#ffffff" },
  PAR: { bg: "#d52b1e", fg: "#ffffff" },
  AUS: { bg: "#00843d", fg: "#ffffff" },
  TUR: { bg: "#e30a17", fg: "#ffffff" },
  GER: { bg: "#000000", fg: "#ffce00" },
  CUW: { bg: "#002868", fg: "#ffffff" },
  CIV: { bg: "#ff7900", fg: "#ffffff" },
  ECU: { bg: "#ffd100", fg: "#0072ce" },
  NED: { bg: "#ae1c28", fg: "#ffffff" },
  JPN: { bg: "#bc002d", fg: "#ffffff" },
  SWE: { bg: "#006aa7", fg: "#fecc00" },
  TUN: { bg: "#e70013", fg: "#ffffff" },
  BEL: { bg: "#ed2939", fg: "#fae042" },
  EGY: { bg: "#ce1126", fg: "#ffffff" },
  IRN: { bg: "#239f40", fg: "#ffffff" },
  NZL: { bg: "#000000", fg: "#ffffff" },
  ESP: { bg: "#aa151b", fg: "#f1bf00" },
  CPV: { bg: "#003893", fg: "#ffffff" },
  KSA: { bg: "#006c35", fg: "#ffffff" },
  URU: { bg: "#7fb2e5", fg: "#ffffff" },
  FRA: { bg: "#0055a4", fg: "#ffffff" },
  SEN: { bg: "#00853f", fg: "#fdef42" },
  IRQ: { bg: "#ce1126", fg: "#ffffff" },
  NOR: { bg: "#ba0c2f", fg: "#ffffff" },
  ARG: { bg: "#75aadb", fg: "#ffffff" },
  ALG: { bg: "#006233", fg: "#ffffff" },
  AUT: { bg: "#ed2939", fg: "#ffffff" },
  JOR: { bg: "#000000", fg: "#ffffff" },
  POR: { bg: "#046a38", fg: "#da291c" },
  COD: { bg: "#007fff", fg: "#ffffff" },
  UZB: { bg: "#1eb53a", fg: "#ffffff" },
  COL: { bg: "#ffcd00", fg: "#003893" },
  ENG: { bg: "#ffffff", fg: "#ce1124" },
  CRO: { bg: "#171796", fg: "#ffffff" },
  GHA: { bg: "#006b3f", fg: "#fcd116" },
  PAN: { bg: "#d72828", fg: "#ffffff" },
  CC: { bg: "#e61a27", fg: "#ffffff" },
};

export const GROUP_LABELS = [
  "FWC",
  "Grupo A",
  "Grupo B",
  "Grupo C",
  "Grupo D",
  "Grupo E",
  "Grupo F",
  "Grupo G",
  "Grupo H",
  "Grupo I",
  "Grupo J",
  "Grupo K",
  "Grupo L",
  "Coca-Cola",
] as const;

export type GroupLabel = (typeof GROUP_LABELS)[number];

export function formatStickerNumber(stickerCode: string, number: number): string {
  // FWC-0 displays as "00", everything else uses the raw number
  if (stickerCode === "FWC-0") return "00";
  return String(number);
}
