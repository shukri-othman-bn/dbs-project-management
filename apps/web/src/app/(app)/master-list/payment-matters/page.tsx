import { redirect } from "next/navigation";

export default function LegacyPaymentMattersPage() {
  redirect("/master-list/payment-claims");
}
