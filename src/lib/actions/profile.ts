"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

// Nominatim exige um User-Agent identificável (impossível setar no browser) e
// bloqueia chamadas client-side com facilidade. Geocodificar no servidor é mais
// confiável e cumpre a política. Ver: política de uso do Nominatim.
const NOMINATIM_UA =
  "TrocasCopaSorocaba/1.0 (+https://trocascopasorocaba.com; contato@trocascopasorocaba.com)";

/**
 * Cidade (nome) → coordenadas, via Nominatim no servidor.
 * NUNCA lança: retorna null em qualquer falha pra não derrubar o transition do
 * cliente (a causa do "This page couldn't load" no onboarding).
 */
export async function geocodeCityAction(
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const clean = city.trim();
  if (!clean) return null;
  try {
    const q = encodeURIComponent(`${clean}, SP, Brasil`);
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&limit=1&accept-language=pt-BR`,
      { headers: { "User-Agent": NOMINATIM_UA }, cache: "no-store" },
    );
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const lat = Number.parseFloat(arr[0].lat);
    const lng = Number.parseFloat(arr[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function updateProfileAction(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const bioRaw = String(formData.get("bio") ?? "").trim();
  const bio = bioRaw === "" ? null : bioRaw;

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return { error: "Username deve ter 3-30 caracteres (letras minúsculas, números, _)." };
  }
  if (full_name.length < 2) return { error: "Nome muito curto." };

  // Upsert protege contra o caso (raro) de profile não existir pro user
  // (ex: backfill incompleto, race com o trigger). PK = id.
  const { error } = await supabase
    .from("trocas_profiles")
    .upsert({ id: user.id, username, full_name, bio }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") return { error: "Esse username já está em uso." };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function setLocationAction(
  latitude: number,
  longitude: number,
  city: string,
  state: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  if (!/^[A-Z]{2}$/.test(state)) return { error: "UF inválida." };
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { error: "Coordenadas inválidas." };
  }

  // .update() (não .upsert()): o profile já existe nesse ponto (criado no passo
  // 1 do onboarding, que preenche username/full_name NOT NULL). Um upsert aqui
  // sem esses campos quebra o type-check (Insert exige username/full_name) e
  // falharia o NOT NULL em runtime — foi o que travou o build em 55891ba.
  const { error } = await supabase
    .from("trocas_profiles")
    .update({
      location: `SRID=4326;POINT(${longitude} ${latitude})` as unknown as null,
      location_updated_at: new Date().toISOString(),
      city,
      state,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Pode ter destravado a indicação (localização agora preenchida)
  try {
    await supabase.rpc("trocas_check_referral_effective", {});
  } catch {
    // best-effort
  }

  revalidatePath("/", "layout");
  return {};
}

export async function setAvatarAction(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecione uma imagem." };
  if (file.size > 2 * 1024 * 1024) return { error: "Imagem maior que 2MB." };
  if (!file.type.startsWith("image/")) return { error: "Arquivo inválido." };

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${user.id}/avatar.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("trocas-avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) return { error: upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("trocas-avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("trocas_profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
