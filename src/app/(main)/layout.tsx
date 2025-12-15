import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";

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
    <ClientLayoutWrapper
      userName={userData?.name}
      avatarUrl={userData?.avatar_url || undefined}
    >
      {children}
    </ClientLayoutWrapper>
  );
}
