import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabBar } from "@/components/tab-bar";
import { PageTransition } from "@/components/motion/page-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, location")
    .eq("id", user.id)
    .single();

  if (!profile || profile.username.startsWith("user") || !profile.location) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-16">
      <div className="flex-1">
        <PageTransition>{children}</PageTransition>
      </div>
      <TabBar />
    </div>
  );
}
