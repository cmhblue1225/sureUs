"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  User,
  Search,
  Sparkles,
  Network,
  MessageCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "내 프로필", href: "/profile", icon: User },
  { name: "검색", href: "/search", icon: Search },
  { name: "추천", href: "/recommendations", icon: Sparkles },
  { name: "네트워크", href: "/network", icon: Network },
  { name: "메시지", href: "/messages", icon: MessageCircle },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed } = useSidebar();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b",
        isCollapsed ? "justify-center px-2" : "px-6"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="font-bold text-xl">sureNet</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 py-4 space-y-1",
        isCollapsed ? "px-2" : "px-3"
      )}>
        {navigation.map((item) => {
          // Special handling for profile: /profile/[id] is viewing OTHER user's profile
          // Only /profile and /profile/edit should highlight "내 프로필"
          let isActive: boolean;
          if (item.href === "/profile") {
            isActive = pathname === "/profile" || pathname === "/profile/edit";
          } else {
            isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          }
          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 py-2 text-sm font-medium rounded-md transition-colors",
                isCollapsed ? "justify-center px-2" : "px-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className={cn(
        "border-t",
        isCollapsed ? "p-2" : "p-3"
      )}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "로그아웃" : undefined}
          className={cn(
            "flex items-center gap-3 py-2 w-full text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
            isCollapsed ? "justify-center px-2" : "px-3"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>로그아웃</span>}
        </button>
      </div>
    </div>
  );
}
