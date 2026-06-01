import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getProjectsWithBudget } from "@/lib/data";
import { toPaymentMatterRows } from "@/lib/master-list-mappers";
import { PaymentMattersList } from "@/components/master-list/payment-matters-list";
import { MasterListHeader, MasterListViewPills } from "@/components/master-list/master-list-header";

export default async function MasterListPaymentMattersPage() {
  const session = await auth();
  const user = session!.user;
  const raw = await getProjectsWithBudget(user);
  const rows = toPaymentMatterRows(raw);

  return (
    <div className="space-y-6">
      <MasterListHeader view="payment-matters" />
      <MasterListViewPills active="payment-matters" />
      <Suspense fallback={<div className="h-96 rounded-xl border border-slate-200 bg-white animate-pulse" />}>
        <PaymentMattersList rows={rows} />
      </Suspense>
    </div>
  );
}
