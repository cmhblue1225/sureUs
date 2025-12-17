"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkIsAdmin } from "@/lib/utils/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeRegistrationForm } from "@/components/admin/EmployeeRegistrationForm";
import { CSVUploadSection } from "@/components/admin/CSVUploadSection";
import { EmployeeListTable } from "@/components/admin/EmployeeListTable";
import { Loader2, UserPlus, List, FileSpreadsheet } from "lucide-react";

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const isAdminUser = await checkIsAdmin(supabase);

      if (!isAdminUser) {
        router.replace("/");
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    }

    checkAdmin();
  }, [router]);

  function handleRegistrationSuccess() {
    setRefreshTrigger((prev) => prev + 1);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6" />
          신입사원 관리
        </h1>
        <p className="text-muted-foreground mt-1">
          신입사원 계정을 생성하고 관리합니다.
        </p>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="register" className="space-y-6">
        <TabsList>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            일괄 등록
          </TabsTrigger>
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            CSV 업로드
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            등록 현황
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <EmployeeRegistrationForm onSuccess={handleRegistrationSuccess} />
        </TabsContent>

        <TabsContent value="csv">
          <CSVUploadSection onSuccess={handleRegistrationSuccess} />
        </TabsContent>

        <TabsContent value="list">
          <EmployeeListTable refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
