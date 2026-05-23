/**
 * Pure helpers safe for client + server. Não importa nada de supabase.
 */

export interface StickerCode {
  code: string;
  team_code: string;
  number: number;
  team_name: string;
}

export function parseStickerCode(code: string): { team_code: string; number: number } {
  const idx = code.lastIndexOf("-");
  if (idx === -1) return { team_code: code, number: 0 };
  return {
    team_code: code.slice(0, idx),
    number: Number(code.slice(idx + 1)),
  };
}

export type PickerScope = "owned" | "duplicates" | "missing" | "priority";
