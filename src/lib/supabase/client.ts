import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { env } from "@/lib/env";

export const createClient = () =>
  createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
