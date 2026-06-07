import { redirect } from "next/navigation";
import { DEFAULT_MASTER_LIST_VIEW } from "@/lib/master-list-views";

export default function MasterListPage() {
  redirect(`/master-list/${DEFAULT_MASTER_LIST_VIEW}`);
}
