import { redirect } from "next/navigation";

export default function LegacyContractMattersPage() {
  redirect("/master-list/status");
}
