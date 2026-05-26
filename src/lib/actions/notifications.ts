"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function markNotificationReadAction(id: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.rpc("trocas_mark_notification_read", {
    p_id: id,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function markAllNotificationsReadAction(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.rpc("trocas_mark_all_notifications_read");
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
