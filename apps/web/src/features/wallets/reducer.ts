import {
  ALLOC_STEP_MAX,
  ALLOC_STEP_MIN,
  ORG_FALLBACK,
  QUICK_ADD_DESCRIPTIONS,
  ORG_ROLES,
  isDeptSelected,
  isPersistedDept,
  selectedDepartments,
  type OrgSnapshot,
  type SentInvite,
  type WizardDept,
  type WalletUploadFile,
  type WizardState,
} from "./types";

/** Seed allocate-funds wizard (steps 2–5) from the workspace snapshot. */
export function seedAllocateWizard(org: OrgSnapshot, startStep = 2): WizardState {
  const step = Math.max(ALLOC_STEP_MIN, Math.min(ALLOC_STEP_MAX, startStep));
  return {
    flow: "allocate",
    mode: "edit",
    step,
    done: false,
    wallet: {
      ...org.wallet,
      uploaded: org.wallet.uploaded ?? false,
      uploadFile: org.wallet.uploadFile ?? null,
      pay: org.wallet.pay || "card",
    },
    departments: org.departments.map((d) => ({
      ...d,
      selected: false,
      mgr: { ...d.mgr },
    })),
    seq: org.departments.length + 1,
    colorIdx: 0,
    sentInvites: [],
  };
}

/** @deprecated Use seedAllocateWizard — kept for compatibility. */
export function seedWizard(org: OrgSnapshot, startStep: number): WizardState {
  return seedAllocateWizard(org, startStep);
}

/** Fresh wizard for a brand-new wallet — step 1 only (PO upload). */
export function seedNewWizard(): WizardState {
  return {
    flow: "wallet",
    mode: "create",
    step: 1,
    done: false,
    wallet: {
      name: "",
      amount: 0,
      start: "",
      end: "",
      funding: "upload",
      docType: "Purchase Order",
      docNumber: "",
      uploaded: false,
      uploadFile: null,
      pay: "card",
    },
    departments: [],
    seq: 1,
    colorIdx: 0,
    sentInvites: [],
  };
}

function nextColor(state: WizardState): { color: string; colorIdx: number } {
  return {
    color: ORG_FALLBACK[state.colorIdx % ORG_FALLBACK.length],
    colorIdx: state.colorIdx + 1,
  };
}

function newDept(id: number, color: string, fields: Partial<WizardDept>): WizardDept {
  return {
    id,
    name: "",
    desc: "Department merchandise and campaigns.",
    users: 10,
    allocated: 0,
    color,
    mgr: { name: "", email: "", mobile: "", role: "Operations Manager", invite: true },
    selected: false,
    ...fields,
  };
}

export type WizardAction =
  | { type: "goto"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "walletField"; field: keyof WizardState["wallet"]; value: string | number | boolean }
  | { type: "setUploadFile"; file: WalletUploadFile | null }
  | { type: "quickAddDept"; name: string }
  | { type: "addDept"; name: string; desc: string; users: number }
  | { type: "updateDept"; id: string | number; name: string; desc: string; users: number }
  | { type: "deleteDept"; id: string | number }
  | { type: "toggleDeptSelect"; id: string | number }
  | { type: "setAlloc"; id: string | number; amount: number }
  | { type: "splitEven" }
  | { type: "mgrField"; id: string | number; field: keyof WizardDept["mgr"]; value: string }
  | { type: "toggleInvite"; id: string | number }
  | { type: "finished"; walletId: string; invites: SentInvite[] };

export function wizardReducer(state: WizardState, action: WizardState | WizardAction): WizardState {
  // A bare WizardState (no `type`) replaces the whole state — used on (re)seed.
  if (!("type" in action)) return action;

  switch (action.type) {
    case "goto": {
      if (state.flow === "wallet") return { ...state, step: 1 };
      const step = Math.max(ALLOC_STEP_MIN, Math.min(ALLOC_STEP_MAX, action.step));
      return { ...state, step };
    }
    case "next":
      if (state.flow === "wallet") return state;
      return { ...state, step: Math.min(state.step + 1, ALLOC_STEP_MAX) };
    case "back":
      if (state.flow === "wallet") return state;
      return { ...state, step: Math.max(state.step - 1, ALLOC_STEP_MIN) };
    case "walletField":
      return { ...state, wallet: { ...state.wallet, [action.field]: action.value } };
    case "setUploadFile":
      return {
        ...state,
        wallet: {
          ...state.wallet,
          uploadFile: action.file,
          uploaded: action.file !== null,
        },
      };
    case "quickAddDept": {
      if (state.departments.some((d) => d.name.toLowerCase() === action.name.toLowerCase())) {
        return state;
      }
      const { color, colorIdx } = nextColor(state);
      const role = ORG_ROLES.find((r) => r.startsWith(action.name)) || "Operations Manager";
      return {
        ...state,
        colorIdx,
        seq: state.seq + 1,
        departments: [
          ...state.departments,
          newDept(state.seq, color, {
            name: action.name,
            desc: QUICK_ADD_DESCRIPTIONS[action.name] || "Department merchandise and campaigns.",
            mgr: { name: "", email: "", mobile: "", role, invite: true },
          }),
        ],
      };
    }
    case "addDept": {
      const { color, colorIdx } = nextColor(state);
      return {
        ...state,
        colorIdx,
        seq: state.seq + 1,
        departments: [
          ...state.departments,
          newDept(state.seq, color, {
            name: action.name,
            desc: action.desc,
            users: action.users,
          }),
        ],
      };
    }
    case "updateDept":
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id)
            ? { ...d, name: action.name, desc: action.desc, users: action.users }
            : d,
        ),
      };
    case "deleteDept":
      if (state.departments.length <= 1) return state;
      return {
        ...state,
        departments: state.departments.filter((d) => String(d.id) !== String(action.id)),
      };
    case "toggleDeptSelect": {
      const target = state.departments.find((d) => String(d.id) === String(action.id));
      if (!target) return state;
      const turningOff = target.selected === true;
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id)
            ? {
                ...d,
                selected: !turningOff,
                allocated:
                  turningOff && (state.mode === "create" || !isPersistedDept(d)) ? 0 : d.allocated,
              }
            : d,
        ),
      };
    }
    case "setAlloc":
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id) ? { ...d, allocated: action.amount } : d,
        ),
      };
    case "splitEven": {
      const total = state.wallet.amount;
      const active = selectedDepartments(state.departments);
      const n = active.length;
      if (!n) return state;
      const committedElsewhere =
        state.mode === "edit"
          ? state.departments
              .filter((d) => !isDeptSelected(d))
              .reduce((sum, d) => sum + (d.allocated || 0), 0)
          : 0;
      const pool = Math.max(0, total - committedElsewhere);
      const base = Math.floor(pool / n / 1000) * 1000;
      const activeIds = new Set(active.map((d) => String(d.id)));
      return {
        ...state,
        departments: state.departments.map((d) => {
          if (!activeIds.has(String(d.id))) return d;
          const idx = active.findIndex((a) => String(a.id) === String(d.id));
          return {
            ...d,
            allocated: idx === n - 1 ? pool - base * (n - 1) : base,
          };
        }),
      };
    }
    case "mgrField":
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id)
            ? { ...d, mgr: { ...d.mgr, [action.field]: action.value } }
            : d,
        ),
      };
    case "toggleInvite":
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id)
            ? { ...d, mgr: { ...d.mgr, invite: !d.mgr.invite } }
            : d,
        ),
      };
    case "finished":
      return {
        ...state,
        done: true,
        wallet: { ...state.wallet, id: action.walletId, status: "active" },
        sentInvites: action.invites,
      };
    default:
      return state;
  }
}
