import { redirect } from "next/navigation";

export default function MasterListPage() {
  redirect("/master-list/by-status");
}
