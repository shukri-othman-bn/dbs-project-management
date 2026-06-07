import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import {
  toContractMatterProjectRow,
  toPaymentClaimsRows,
} from "@/lib/master-list-mappers";
import { PaymentClaimsList } from "@/components/master-list/payment-claims-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListPaymentClaimsPage() {
  const session = await auth();
  const user = session!.user;
  const raw = await getProjectsWithBudget(user);
  const projects = raw.map(toContractMatterProjectRow);
  const purchaseOrders = raw.flatMap(toPaymentClaimsRows);

  return (
    <div className="space-y-6">
      <MasterListHeader view="payment-claims" />
      <MasterListViewPills active="payment-claims" />
      <PaymentClaimsList projects={projects} purchaseOrders={purchaseOrders} />
    </div>
  );
}
