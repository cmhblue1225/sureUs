"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  userName?: string;
  avatarUrl?: string;
}

export function Header({ userName, avatarUrl }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        {/* Page title or breadcrumbs can go here */}
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
