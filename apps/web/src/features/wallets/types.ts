import type { WorkspaceSnapshot } from "@/services/workspace-api";

/** A department (cost center) as edited inside the wizard. */
export type WizardDept = {
  id: string | number;
  name: string;
  desc: string;
  users: number;
  allocated: number;
  spent?: number;
  color: string;
  mgr: {
    name: string;
    email: string;
    mobile: string;
    role: string;
    invite: boolean;
  };
};

/** The merchandise-budget wallet as edited inside the wizard. */
export type WizardWallet = {
  id?: string;
  name: string;
  amount: number;
  status?: string;
  start: string;
  end: string;
  funding: string;
  docType: string;
  docNumber: string;
  uploaded: boolean;
  pay: string;
};

/** Invite link returned by the API after finishing setup. */
export type SentInvite = {
  email: string;
  name: string;
  entityName: string;
  inviteToken?: string;
};

/** Ephemeral organization-setup wizard state (was the legacy mutable `S.org`). */
export type WizardState = {
  step: number;
  done: boolean;
  wallet: WizardWallet;
  departments: WizardDept[];
  seq: number;
  colorIdx: number;
  sentInvites: SentInvite[];
};

export type OrgSnapshot = WorkspaceSnapshot["org"];

export const ORG_ROLES = [
  "Marketing Manager",
  "Sales Manager",
  "HR Manager",
  "Admin Manager",
  "Customer Success Manager",
  "Operations Manager",
] as const;

export const ORG_SUGG = [
  "Marketing",
  "Sales",
  "HR",
  "Admin",
  "Customer Success",
  "Engineering",
  "Finance",
  "Operations",
] as const;

export const ORG_FALLBACK = [
  "#DB2777",
  "#0891B2",
  "#65A30D",
  "#9333EA",
  "#EA580C",
  "#0D9488",
] as const;

export const ORG_STEPS = [
  "Create Wallet",
  "Departments",
  "Allocate Budget",
  "Assign Managers",
  "Review & Finish",
] as const;

export const QUICK_ADD_DESCRIPTIONS: Record<string, string> = {
  Engineering: "Team merchandise, hackathon kits and dev swag.",
  Finance: "Audit, compliance and finance team merchandise.",
  Operations: "Operational supplies and field team kits.",
};

/** Parse a money string ("₹12,000") into a number. */
export const parseAmt = (s: string | number): number =>
  parseInt(String(s).replace(/[^\d]/g, "") || "0", 10);

/** Format an ISO date ("2026-04-01") into "01 Apr 2026". */
export const fmtDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(`${iso}T00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Total budget allocated across all departments. */
export const totalAlloc = (departments: WizardDept[]): number =>
  departments.reduce((sum, d) => sum + (d.allocated || 0), 0);

/** Format an amount as a localized "en-IN" integer for an editable input. */
export const amtInput = (n: number): string => (n ? n.toLocaleString("en-IN") : "");
