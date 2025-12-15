"use client";

import { User, Menu } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { useSidebar } from "./SidebarContext";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
}

export function Header({ userName, avatarUrl }: HeaderProps) {
  const { toggle } = useSidebar();

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="메뉴 토글"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName || "프로필"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          )}
          <span>{userName || "사용자"}</span>
        </Link>
      </div>
    </header>
  );
}
