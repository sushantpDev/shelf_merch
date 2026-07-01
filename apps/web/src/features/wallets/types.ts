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
    inviteStatus?: "unassigned" | "pending" | "active";
  };
  /** Included in budget setup when true (default). */
  selected?: boolean;
};

/** A funding document selected in the wallet wizard. */
export type WalletUploadFile = {
  name: string;
  size: number;
  source: "device" | "cloud";
  file?: File;
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
  uploadFile: WalletUploadFile | null;
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
export type WizardMode = "create" | "edit";

/** `wallet` = step 1 only (create + PO). `allocate` = departments → budget → managers → review. */
export type WizardFlow = "wallet" | "allocate";

export type WizardState = {
  flow: WizardFlow;
  /** `create` = brand-new wallet; `edit` = change existing wallet / departments. */
  mode: WizardMode;
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

export const ALLOC_STEPS = [
  "Departments",
  "Allocate Budget",
  "Assign Managers",
  "Review & Finish",
] as const;

export const ALLOC_STEP_MIN = 2;
export const ALLOC_STEP_MAX = 5;

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

/** Departments included in the current setup flow. */
export const isDeptSelected = (d: WizardDept): boolean => d.selected === true;

export const selectedDepartments = (departments: WizardDept[]): WizardDept[] =>
  departments.filter(isDeptSelected);

const MONGO_ID = /^[a-f0-9]{24}$/i;

/** Department already stored on the API (vs a temporary wizard id). */
export const isPersistedDept = (d: WizardDept): boolean => MONGO_ID.test(String(d.id));

/** Departments that should be created/updated when finishing setup. */
export const departmentsToSync = (departments: WizardDept[]): WizardDept[] =>
  departments.filter((d) => isDeptSelected(d) || isPersistedDept(d));

/** Sum of active allocations for selected departments in the wizard. */
export const totalAlloc = (departments: WizardDept[]): number =>
  selectedDepartments(departments).reduce((sum, d) => sum + (d.allocated || 0), 0);

/** Sum of all persisted department allocations (dashboard view). */
export const totalAllocatedAmount = (departments: WizardDept[]): number =>
  departments.reduce((sum, d) => sum + (d.allocated || 0), 0);

/** Allocations that count against the wallet total inside the wizard. */
export const wizardCommittedAllocations = (
  departments: WizardDept[],
  mode: WizardMode,
): number => (mode === "create" ? totalAlloc(departments) : totalAllocatedAmount(departments));

/** Unallocated balance on the dashboard: total − all department allocations. */
export const remainingWalletBalance = (walletTotal: number, departments: WizardDept[]): number =>
  walletTotal - totalAllocatedAmount(departments);

/** Unallocated balance during the wizard (create vs edit semantics). */
export const remainingWalletBalanceForWizard = (
  walletTotal: number,
  departments: WizardDept[],
  mode: WizardMode,
): number => walletTotal - wizardCommittedAllocations(departments, mode);

/** Percentage of wallet total, capped for display when over budget. */
export const pctOfWalletTotal = (part: number, total: number): string => {
  if (!total || part <= 0) return "0%";
  const pct = (part / total) * 100;
  if (pct > 999) return "999%+";
  return `${Math.round(pct)}%`;
};

/** Format an amount as a localized "en-IN" integer for an editable input. */
export const amtInput = (n: number): string => (n ? n.toLocaleString("en-IN") : "");
