import type { Route } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantPublicContext } from "@/lib/tenant-public";
import HomeClient from "./home-client";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const tenant = await getTenantPublicContext();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const role = (user as any)?.app_metadata?.role;

  if (role === "superadmin") {
    redirect("/superadmin" as Route);
  }

  if (role === "admin") {
    redirect("/admin" as Route);
  }

  return <HomeClient branding={tenant.branding} />;
}
