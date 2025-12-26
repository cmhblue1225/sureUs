"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  User,
  Network,
  Calendar,
  MessageSquare,
  Megaphone,
  MessageCircle,
  ScanFace,
  Settings,
  LogOut,
  UserPlus,
  Shield,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { checkIsAdmin } from "@/lib/utils/auth";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "내 프로필", href: "/profile", icon: User },
  { name: "네트워크", href: "/network", icon: Network },
  { name: "캘린더", href: "/calendar", icon: Calendar },
  { name: "게시판", href: "/board", icon: MessageSquare },
  { name: "공지사항", href: "/announcements", icon: Megaphone },
  { name: "메시지", href: "/messages", icon: MessageCircle },
  { name: "슈아유?", href: "/face-recognition", icon: ScanFace },
  { name: "설정", href: "/settings", icon: Settings },
];

const adminNavigation = [
  { name: "기수 관리", href: "/admin/cohorts", icon: Users },
  { name: "신입사원 관리", href: "/admin/employees", icon: UserPlus },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const adminStatus = await checkIsAdmin(supabase);
      setIsAdmin(adminStatus);
    }
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-card border-r transition-all duration-300 ease-in-out overflow-hidden",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b transition-all duration-300 ease-in-out",
        isCollapsed ? "px-2 justify-center" : "px-4 justify-center"
      )}>
        <Link href="/dashboard" className="flex items-center justify-center overflow-hidden">
          <img
            src="/logo.png"
            alt="sureUs"
            className={cn(
              "object-contain transition-all duration-300 ease-in-out",
              isCollapsed ? "h-10 w-10" : "h-12 w-auto max-w-[180px]"
            )}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 transition-all duration-300 ease-in-out">
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
                "flex items-center text-sm font-medium rounded-md transition-all duration-300 ease-in-out overflow-hidden",
                isCollapsed ? "w-10 h-10 justify-center p-0" : "py-2 px-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                  isCollapsed ? "w-0 opacity-0 ml-0" : "w-[150px] opacity-100 ml-3"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {isAdmin && (
          <>
            <div
              className={cn(
                "mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground flex items-center gap-2",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Shield className="w-3 h-3 flex-shrink-0" />
              <span
                className={cn(
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  isCollapsed ? "w-0 opacity-0" : "opacity-100"
                )}
              >
                관리자 메뉴
              </span>
            </div>
            {adminNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center text-sm font-medium rounded-md transition-all duration-300 ease-in-out overflow-hidden",
                    isCollapsed ? "w-10 h-10 justify-center p-0" : "py-2 px-3",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
                      isCollapsed ? "w-0 opacity-0 ml-0" : "w-[150px] opacity-100 ml-3"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout button */}
      <div className="border-t p-2 transition-all duration-300 ease-in-out">
        <button
          onClick={handleLogout}
          title={isCollapsed ? "로그아웃" : undefined}
          aria-label="로그아웃"
          className={cn(
            "flex items-center text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed ? "w-10 h-10 justify-center p-0" : "py-2 px-3 w-full"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden",
              isCollapsed ? "w-0 opacity-0 ml-0" : "w-[150px] opacity-100 ml-3"
            )}
          >
            로그아웃
          </span>
        </button>
      </div>
    </div>
  );
}
