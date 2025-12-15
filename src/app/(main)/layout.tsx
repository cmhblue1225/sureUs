import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single<{ name: string; avatar_url: string | null }>();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={userData?.name}
          avatarUrl={userData?.avatar_url || undefined}
        />
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
