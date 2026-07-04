import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/tenant/PageHeader";
import type { BillingVm } from "../controllers/useBillingController";

export function BillingView({ onRequestAccess }: BillingVm) {
  return (
    <>
      <PageHeader title="Billing" subtitle="Manage invoices, GST details and payment methods." />
      <div className="card empty" style={{ padding: 50 }}>
        <div className="ic" aria-hidden="true">
          <CreditCard size={34} color="#15784C" />
        </div>
        <h3>Billing is coming together</h3>
        <p>This module is part of the Shelf Merch roadmap. Hook it up to your data to go live.</p>
        <button
          type="button"
          className="btn btn-soft"
          style={{ marginTop: 16 }}
          onClick={onRequestAccess}
        >
          Request early access
        </button>
      </div>
    </>
  );
}
