"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

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

  const { error } = await supabase
    .from("trocas_profiles")
    .update({ username, full_name, bio })
    .eq("id", user.id);

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
