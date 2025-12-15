"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils/cn";

interface ClientLayoutWrapperProps {
  children: ReactNode;
  userName?: string;
  avatarUrl?: string;
}

function LayoutContent({ children, userName, avatarUrl }: ClientLayoutWrapperProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isCollapsed ? "ml-0" : "ml-0"
        )}
      >
        <Header userName={userName} avatarUrl={avatarUrl} />
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ClientLayoutWrapper({ children, userName, avatarUrl }: ClientLayoutWrapperProps) {
  return (
    <SidebarProvider>
      <LayoutContent userName={userName} avatarUrl={avatarUrl}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}
