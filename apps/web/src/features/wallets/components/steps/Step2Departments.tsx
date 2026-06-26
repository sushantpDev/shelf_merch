import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ORG_SUGG, type WizardDept } from "../../types";
import { DepartmentModal } from "../DepartmentModal";
import type { StepProps } from "./StepProps";

export function Step2Departments({ state, dispatch }: StepProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WizardDept | null>(null);

  const used = state.departments.map((d) => d.name.toLowerCase());

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(d: WizardDept) {
    setEditing(d);
    setModalOpen(true);
  }
  function handleDelete(d: WizardDept) {
    if (state.departments.length <= 1) {
      toast.error("Keep at least one department");
      return;
    }
    dispatch({ type: "deleteDept", id: d.id });
  }
  function handleSave(values: { name: string; desc: string; users: number }) {
    if (editing) {
      dispatch({ type: "updateDept", id: editing.id, ...values });
    } else {
      dispatch({ type: "addDept", ...values });
    }
  }

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 18 }}>Create departments</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Departments act as cost centers that consume the merchandise budget. Add the teams that
          will run campaigns and order swag.
        </p>
      </div>

      <label className="lbl">Quick add suggestions</label>
      <div style={{ margin: "6px 0 18px" }}>
        {ORG_SUGG.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${used.includes(s.toLowerCase()) ? "used" : ""}`}
            onClick={() => {
              dispatch({ type: "quickAddDept", name: s });
              if (!used.includes(s.toLowerCase())) toast.success(`${s} added`);
            }}
          >
            <span className="plus">+</span> {s}
          </button>
        ))}
      </div>

      <div className="dept-grid">
        {state.departments.map((d) => (
          <div key={d.id} className="dept-card">
            <div className="row" style={{ gap: 11, alignItems: "center" }}>
              <div className="dc-swatch" style={{ background: d.color }}>
                {d.name.charAt(0)}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</div>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "12px 0", minHeight: 34 }}>
              {d.desc}
            </p>
            <div
              className="row"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--line)",
                paddingTop: 12,
              }}
            >
              <div className="mut3" style={{ fontSize: 12 }}>
                Expected users · <b style={{ color: "var(--ink)" }}>{d.users}</b>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <button
                  type="button"
                  className="iconbtn"
                  aria-label={`Edit ${d.name}`}
                  onClick={() => openEdit(d)}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  aria-label={`Delete ${d.name}`}
                  onClick={() => handleDelete(d)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="add-dept" onClick={openAdd}>
          <div className="pc">
            <Plus size={18} />
          </div>
          <span>Add another department</span>
        </button>
      </div>

      <DepartmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dept={editing ?? undefined}
        onSave={handleSave}
      />
    </>
  );
}
