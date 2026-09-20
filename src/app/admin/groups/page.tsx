import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getAdminCatalogSnapshot } from "@/lib/catalog/data";
import { redirect } from "next/navigation";
import GroupsView from "./GroupsView";
import { getNotice } from "@/lib/admin/notices";

export const dynamic = "force-dynamic";

export default async function GroupsPage({ searchParams }: { searchParams: Promise<any> }) {
  const authState = await isAdminAuthenticated();
  if (!authState) {
    redirect("/admin");
  }

  const catalog = await getAdminCatalogSnapshot();
  const notice = getNotice(await searchParams);

  return <GroupsView groups={catalog.groups} categories={catalog.categories} notice={notice} />;
}
