import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabBar } from "@/components/tab-bar";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import {
  countUnreadNotifications,
  listMyNotifications,
} from "@/lib/notifications/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("trocas_profiles")
    .select("username, full_name, avatar_url, location")
    .eq("id", user.id)
    .single();

  if (!profile || profile.username.startsWith("user") || !profile.location) {
    redirect("/onboarding");
  }

  const [unread, items] = await Promise.all([
    countUnreadNotifications(),
    listMyNotifications(),
  ]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar: visível >= md */}
      <DesktopSidebar
        fullName={profile.full_name}
        username={profile.username}
        avatarUrl={profile.avatar_url}
        userId={user.id}
        unreadNotifications={unread}
        initialNotifications={items}
      />

      {/* Sino flutuante mobile (canto superior direito; só < md) */}
      <div className="fixed right-3 top-3 z-30 md:hidden">
        <NotificationsBell
          userId={user.id}
          initialUnreadCount={unread}
          initialItems={items}
          variant="floating"
        />
      </div>

      {/* Conteúdo principal */}
      <div className="flex min-h-dvh flex-col pb-16 md:ml-60 md:pb-0">
        <div className="mx-auto w-full max-w-md flex-1 md:max-w-5xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>

      {/* Mobile tab bar: visível < md */}
      <div className="md:hidden">
        <TabBar />
      </div>
    </div>
  );
}
