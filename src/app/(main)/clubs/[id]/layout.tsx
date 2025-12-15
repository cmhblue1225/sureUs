"use client";

import { use } from "react";
import { ClubProvider } from "@/contexts/ClubContext";

interface ClubLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function ClubLayout({ children, params }: ClubLayoutProps) {
  const resolvedParams = use(params);

  return (
    <ClubProvider clubId={resolvedParams.id}>
      {children}
    </ClubProvider>
  );
}
