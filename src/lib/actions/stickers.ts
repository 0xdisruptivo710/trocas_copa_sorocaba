"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

const MAX_COUNT = 99;

export async function setStickerQuantity(
  stickerCode: string,
  delta: 1 | -1,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: current } = await supabase
    .from("trocas_user_stickers")
    .select("owned_count, is_priority")
    .eq("user_id", user.id)
    .eq("sticker_code", stickerCode)
    .maybeSingle();

  const currentCount = current?.owned_count ?? 0;
  const newCount = Math.max(0, Math.min(MAX_COUNT, currentCount + delta));

  if (newCount === currentCount) return {};

  if (current) {
    const { error } = await supabase
      .from("trocas_user_stickers")
      .update({ owned_count: newCount })
      .eq("user_id", user.id)
      .eq("sticker_code", stickerCode);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("trocas_user_stickers").insert({
      user_id: user.id,
      sticker_code: stickerCode,
      owned_count: newCount,
      is_priority: false,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/album");
  revalidatePath("/", "layout");
  return {};
}

export async function togglePriority(stickerCode: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: current } = await supabase
    .from("trocas_user_stickers")
    .select("is_priority, owned_count")
    .eq("user_id", user.id)
    .eq("sticker_code", stickerCode)
    .maybeSingle();

  const next = !(current?.is_priority ?? false);

  if (current) {
    const { error } = await supabase
      .from("trocas_user_stickers")
      .update({ is_priority: next })
      .eq("user_id", user.id)
      .eq("sticker_code", stickerCode);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("trocas_user_stickers").insert({
      user_id: user.id,
      sticker_code: stickerCode,
      owned_count: 0,
      is_priority: next,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/album");
  return {};
}
