import { useEffect, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { inr } from "@/components/platform/platform-ui";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import {
  fmtDate,
  deptPaletteColor,
  remainingWalletBalance,
  totalAllocatedAmount,
  type OrgSnapshot,
} from "../types";
import { AddFundsDialog } from "./AddFundsDialog";
import { Donut } from "./Donut";
import { WalletHistory } from "./WalletHistory";

/** Company-admin landing: merchandise wallet overview + departments table. */
export function OrgDashboard({
  account,
  org,
  hasWallets,
  onStart,
  onAllocate,
  openAddFundsOnMount,
}: {
  account: string;
  org: OrgSnapshot;
  hasWallets: boolean;
  onStart: () => void;
  onAllocate: (step?: number) => void;
  openAddFundsOnMount?: boolean;
}) {
  const { canWrite } = useTenantAccess();
  const canManageWallets = canWrite("wallets");
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const walletId = org.wallet.id;

  useEffect(() => {
    if (openAddFundsOnMount && walletId) {
      setAddFundsOpen(true);
    }
  }, [openAddFundsOnMount, walletId]);

  if (!org.active && !hasWallets) {
    return (
      <>
        <PageHeader
          title="Wallets"
          subtitle="Create your merchandise budget wallet, then allocate funds to departments."
        />
        <div className="card empty" style={{ padding: 50 }}>
          <div className="ic" aria-hidden="true">
            <Wallet size={34} color="var(--gray-300)" />
          </div>
          <h3>No merchandise wallet yet</h3>
          <p>
            Create your organization&apos;s merchandise budget wallet and upload a PO for finance
            approval.
          </p>
          <button
            type="button"
            className="btn btn-brand"
            style={{ marginTop: 16 }}
            onClick={onStart}
            disabled={!canManageWallets}
          >
            <Plus size={16} /> Create wallet
          </button>
        </div>
      </>
    );
  }

  const o = org.wallet;
  const fundingPending = o.fundingApproval === "pending";
  const total = o.amount;
  const alloc = totalAllocatedAmount(org.departments);
  const rem = o.unallocated ?? remainingWalletBalance(total, org.departments);
  const walletLive = o.status === "active";
  const depts = org.departments;
  const managersActive = depts.filter((d) => d.mgr.inviteStatus === "active").length;
  const managersPending = depts.filter((d) => d.mgr.inviteStatus === "pending").length;
  const canAllocate = Boolean(walletId) && !fundingPending && total > 0;
  const needsAllocation = canAllocate && !walletLive;

  function handleAllocateClick() {
    if (fundingPending) {
      toast.message("PO pending finance approval", {
        description: "Your balance will be available after platform finance approves your PO.",
      });
      return;
    }
    if (total <= 0) {
      toast.message("No wallet balance yet", {
        description: "Wait for finance to approve your funding request before allocating.",
      });
      return;
    }
    onAllocate(2);
  }

  return (
    <>
      <PageHeader
        title="Wallets"
        subtitle={`${o.name} · Organization merchandise budget · ${account}`}
        actions={
          canManageWallets ? (
            <div className="row" style={{ gap: 8 }}>
              {walletId && !fundingPending && (
                <button type="button" className="btn btn-brand" onClick={() => setAddFundsOpen(true)}>
                  <Plus size={16} /> Add funds
                </button>
              )}
              <button type="button" className="btn btn-brand" onClick={onStart}>
                <Plus size={16} /> Create wallet
              </button>
            </div>
          ) : undefined
        }
      />

      {fundingPending && (
        <div className="banner" style={{ marginBottom: 18 }}>
          <Wallet size={16} aria-hidden="true" />
          <div>
            <b>PO submitted for finance review.</b>{" "}
            {o.requestedAmount ? (
              <>
                {inr(o.requestedAmount)} will be credited to your wallet once platform finance
                approves your {o.docType || "document"} {o.docNumber ? `(${o.docNumber})` : ""}.
                After approval, use <b>Allocate funds</b> to split the budget across departments.
              </>
            ) : (
              <>Your funding request is awaiting platform finance approval.</>
            )}
          </div>
        </div>
      )}

      {needsAllocation && canManageWallets && (
        <div className="banner" style={{ marginBottom: 18 }}>
          <Wallet size={16} aria-hidden="true" />
          <div>
            <b>Wallet funded — allocation not finished.</b> Split your balance across departments
            and assign managers.{" "}
            <span className="lnk" role="button" tabIndex={0} onClick={handleAllocateClick}>
              Allocate funds
            </span>
          </div>
        </div>
      )}

      <div className="card wallet-balance-strip" style={{ padding: 0, marginBottom: 18 }}>
        <div
          className="row"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 22px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div>
            <div
              className="mut3"
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              Wallet balance
            </div>
            <div className="wallet-name-title">{o.name}</div>
          </div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            {walletLive ? (
              <span className="tag tag-live">
                <span className="dot" />
                Active
              </span>
            ) : fundingPending ? (
              <span className="tag tag-warn">Awaiting finance</span>
            ) : (
              <span className="tag tag-draft">Setup in progress</span>
            )}
            {canAllocate && canManageWallets && (
              <button type="button" className="wallet-allocate-link" onClick={handleAllocateClick}>
                Allocate funds
              </button>
            )}
          </div>
        </div>
        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="stat" style={{ flex: 1, padding: "18px 22px" }}>
            <div className="k">Total wallet cash</div>
            <div className="v num" style={{ fontSize: 26 }}>
              {inr(total)}
            </div>
            <div className="mut3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
              All cash in this wallet after funding and spend
            </div>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div className="stat" style={{ flex: 1, padding: "18px 22px" }}>
            <div className="k">Allocated to departments</div>
            <div className="v num" style={{ fontSize: 26 }}>
              {inr(alloc)}
            </div>
            <div className="mut3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
              Earmarked for cost-center budgets
            </div>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div className="stat" style={{ flex: 1, padding: "18px 22px" }}>
            <div className="k">Available to spend</div>
            <div className="v num" style={{ fontSize: 26, color: "var(--brand-d)" }}>
              {inr(rem)}
            </div>
            <div className="mut3" style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
              Unallocated — pay from wallet at checkout
            </div>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12.5, padding: "10px 22px 14px" }}>
          <span>
            {inr(alloc)} allocated + {inr(rem)} available = {inr(total)} total cash
          </span>
          <span style={{ margin: "0 8px" }}>·</span>
          <span>
            Valid {fmtDate(o.start)} → {fmtDate(o.end)} · Funded via{" "}
            {o.funding === "upload" ? `${o.docType} ${o.docNumber}` : "online payment"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div
            className="mut3"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".05em",
              marginBottom: 6,
            }}
          >
            Budget distribution
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Donut
              segments={depts.map((d, i) => ({
                color: deptPaletteColor(i),
                allocated: d.allocated,
              }))}
              centerValue={depts.length}
              centerLabel="Depts"
            />
            <div style={{ flex: 1 }}>
              {depts.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>
                  No departments yet.{" "}
                  {canAllocate && canManageWallets ? (
                    <span className="lnk" role="button" tabIndex={0} onClick={handleAllocateClick}>
                      Allocate funds
                    </span>
                  ) : null}{" "}
                  to add cost centers.
                </p>
              ) : (
                depts.map((d, i) => (
                  <div
                    key={d.id}
                    className="row"
                    style={{ justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}
                  >
                    <span className="row" style={{ gap: 6, alignItems: "center" }}>
                      <span
                        className="lc"
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 3,
                          background: deptPaletteColor(i),
                        }}
                      />
                      {d.name}
                    </span>
                    <b>{total ? Math.round((d.allocated / total) * 100) : 0}%</b>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="stat" style={{ padding: 0, marginBottom: 14 }}>
            <div className="k">Allocated to cost centers</div>
            <div className="v num">{inr(alloc)}</div>
          </div>
          <div className="stat" style={{ padding: 0 }}>
            <div className="k">Managers active</div>
            <div className="v num">
              {managersActive} / {depts.length || "—"}
              {managersPending > 0 ? (
                <span
                  className="mut3"
                  style={{ display: "block", fontSize: 11, fontWeight: 500, marginTop: 2 }}
                >
                  {managersPending} invite{managersPending === 1 ? "" : "s"} pending
                </span>
              ) : null}
            </div>
          </div>
          {canAllocate && canManageWallets && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 16 }}
              onClick={handleAllocateClick}
            >
              {depts.length ? "Edit allocation" : "Allocate funds"}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <h3 style={{ fontSize: 17, marginBottom: 14 }}>Budget Allocated</h3>
        {depts.length === 0 ? (
          <p className="muted" style={{ fontSize: 13.5 }}>
            No departments configured yet.
            {canAllocate ? " Use Allocate funds to set up cost centers and managers." : ""}
          </p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Department</th>
                <th>Manager</th>
                <th>Role</th>
                <th>Budget</th>
                <th>% of total</th>
                <th>Invite</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d, i) => (
                <tr key={d.id}>
                  <td>
                    <div className="row" style={{ gap: 9, alignItems: "center" }}>
                      <span
                        className="lc"
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 3,
                          background: deptPaletteColor(i),
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                    </div>
                  </td>
                  <td>
                    {d.mgr.name || d.mgr.email ? (
                      <>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {d.mgr.name || d.mgr.email.split("@")[0]}
                        </div>
                        {d.mgr.email ? (
                          <div className="mut3" style={{ fontSize: 11 }}>
                            {d.mgr.email}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>
                    {d.mgr.role || "—"}
                  </td>
                  <td className="num">{inr(d.allocated)}</td>
                  <td className="num">{total ? Math.round((d.allocated / total) * 100) : 0}%</td>
                  <td>
                    <ManagerInviteBadge status={d.mgr.inviteStatus ?? "unassigned"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {walletId && <WalletHistory walletId={walletId} />}

      {walletId && (
        <AddFundsDialog
          open={addFundsOpen}
          onOpenChange={setAddFundsOpen}
          walletId={walletId}
          walletName={o.name}
        />
      )}
    </>
  );
}

function ManagerInviteBadge({ status }: { status: "unassigned" | "pending" | "active" }) {
  if (status === "active") {
    return (
      <span className="tag tag-live">
        <span className="dot" />
        Active
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="tag tag-warn">
        <span className="dot" />
        Invite pending
      </span>
    );
  }
  return <span className="tag tag-draft">Not assigned</span>;
}
