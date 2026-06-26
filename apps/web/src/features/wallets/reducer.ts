import {
  ORG_FALLBACK,
  QUICK_ADD_DESCRIPTIONS,
  ORG_ROLES,
  type OrgSnapshot,
  type SentInvite,
  type WizardDept,
  type WizardState,
} from "./types";

/** Seed wizard state from the API workspace snapshot at the given start step. */
export function seedWizard(org: OrgSnapshot, startStep: number): WizardState {
  return {
    step: startStep,
    done: false,
    wallet: {
      uploaded: false,
      pay: "card",
      ...org.wallet,
    },
    departments: org.departments.map((d) => ({
      ...d,
      mgr: { ...d.mgr },
    })),
    seq: org.departments.length + 1,
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
    ...fields,
  };
}

export type WizardAction =
  | { type: "goto"; step: number }
  | { type: "next" }
  | { type: "back" }
  | { type: "walletField"; field: keyof WizardState["wallet"]; value: string | number | boolean }
  | { type: "quickAddDept"; name: string }
  | { type: "addDept"; name: string; desc: string; users: number }
  | { type: "updateDept"; id: string | number; name: string; desc: string; users: number }
  | { type: "deleteDept"; id: string | number }
  | { type: "setAlloc"; id: string | number; amount: number }
  | { type: "splitEven" }
  | { type: "mgrField"; id: string | number; field: keyof WizardDept["mgr"]; value: string }
  | { type: "toggleInvite"; id: string | number }
  | { type: "finished"; walletId: string; invites: SentInvite[] };

export function wizardReducer(state: WizardState, action: WizardState | WizardAction): WizardState {
  // A bare WizardState (no `type`) replaces the whole state — used on (re)seed.
  if (!("type" in action)) return action;

  switch (action.type) {
    case "goto":
      return { ...state, step: action.step };
    case "next":
      return { ...state, step: Math.min(state.step + 1, 5) };
    case "back":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "walletField":
      return { ...state, wallet: { ...state.wallet, [action.field]: action.value } };
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
    case "setAlloc":
      return {
        ...state,
        departments: state.departments.map((d) =>
          String(d.id) === String(action.id) ? { ...d, allocated: action.amount } : d,
        ),
      };
    case "splitEven": {
      const total = state.wallet.amount;
      const n = state.departments.length;
      const base = Math.floor(total / n / 1000) * 1000;
      return {
        ...state,
        departments: state.departments.map((d, i) => ({
          ...d,
          allocated: i === n - 1 ? total - base * (n - 1) : base,
        })),
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
