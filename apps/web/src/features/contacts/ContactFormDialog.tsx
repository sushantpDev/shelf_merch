import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UiContact } from "@/services/mappers";
import { useAddContact, useUpdateContact } from "./hooks";
import { ImportContactsPanel } from "./ImportContactsPanel";
import {
  ADD_ROLES,
  COUNTRIES,
  EMPTY_CONTACT,
  ROLES,
  contactSchema,
  contactToForm,
  type ContactFormValues,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  contact?: UiContact;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mut3" style={{ color: "var(--danger)", fontSize: 11, marginTop: 4 }}>
      {message}
    </div>
  );
}

export function ContactFormDialog({ open, onOpenChange, mode, contact }: Props) {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const addContact = useAddContact();
  const updateContact = useUpdateContact();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: EMPTY_CONTACT,
  });

  // Reset the form whenever the dialog opens or the target contact changes.
  useEffect(() => {
    if (!open) return;
    setTab("manual");
    reset(mode === "edit" && contact ? contactToForm(contact) : EMPTY_CONTACT);
  }, [open, mode, contact, reset]);

  const roleOptions = mode === "edit" ? ROLES : ADD_ROLES;
  const busy = addContact.isPending || updateContact.isPending;

  async function onSubmit(values: ContactFormValues) {
    try {
      if (mode === "edit" && contact) {
        await updateContact.mutateAsync({ id: contact.id, values });
        toast.success("Recipient details saved");
      } else {
        await addContact.mutateAsync(values);
        toast.success("Added contact successfully");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save contact");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm-modal">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Fix recipient information" : "Add contacts"}
          </DialogTitle>
          {mode === "edit" && (
            <DialogDescription>
              Update this person's details so they can be added to orders. HRIS-synced fields will
              override manual entries.
            </DialogDescription>
          )}
        </DialogHeader>

        {mode === "add" && (
          <div className="tabs" style={{ maxWidth: 280, margin: "4px 0 16px" }}>
            {(
              [
                ["manual", "Manually"],
                ["csv", "Upload file"],
              ] as const
            ).map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={tab === key ? "on" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === "add" && tab === "csv" ? (
          <ImportContactsPanel onDone={() => onOpenChange(false)} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-first">
                  First name
                </label>
                <input id="ac-first" className="inp" {...register("firstName")} />
                <FieldError message={errors.firstName?.message} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-last">
                  Last name
                </label>
                <input id="ac-last" className="inp" {...register("lastName")} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-email">
                  Email
                </label>
                <input id="ac-email" type="email" className="inp" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-phone">
                  Phone
                </label>
                <input id="ac-phone" className="inp" {...register("phone")} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-role">
                  Role
                </label>
                <select id="ac-role" className="inp" style={{ height: 40 }} {...register("role")}>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-dept">
                  Department
                </label>
                <input id="ac-dept" className="inp" {...register("department")} />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-emp">
                  Employee Code
                </label>
                <input id="ac-emp" className="inp" {...register("employeeCode")} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-country">
                  Country
                </label>
                <select
                  id="ac-country"
                  className="inp"
                  style={{ height: 40 }}
                  {...register("country")}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="lbl" htmlFor="ac-address">
                Address
              </label>
              <input id="ac-address" className="inp" {...register("line1")} />
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-city">
                  City
                </label>
                <input id="ac-city" className="inp" {...register("city")} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-state">
                  State
                </label>
                <input id="ac-state" className="inp" {...register("state")} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="lbl" htmlFor="ac-pin">
                  PIN Code
                </label>
                <input id="ac-pin" className="inp" {...register("pincode")} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-brand btn-block" disabled={busy}>
                {busy ? "Saving…" : mode === "edit" ? "Save" : "Add contacts"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
