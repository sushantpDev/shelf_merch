import { useEffect, useState } from "react";
import { useForm, type FieldErrors, type Resolver, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAddContact, useUpdateContact } from "../model";
import type { UiContact } from "../model";
import {
  ADD_ROLES,
  EMPTY_CONTACT,
  ROLES,
  contactSchema,
  contactToForm,
  type ContactFormValues,
} from "../types";

export type ContactFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  contact?: UiContact;
  canImportContacts?: boolean;
};

export type ContactFormVm = {
  open: boolean;
  mode: "add" | "edit";
  tab: "manual" | "csv";
  canImportContacts: boolean;
  roleOptions: readonly string[];
  busy: boolean;
  register: UseFormRegister<ContactFormValues>;
  errors: FieldErrors<ContactFormValues>;
  onOpenChange: (open: boolean) => void;
  onTab: (tab: "manual" | "csv") => void;
  onSubmit: React.FormEventHandler;
  onCancel: () => void;
  onImportDone: () => void;
};

/** Controller for the add/edit contact dialog: react-hook-form + add/update flows. */
export function useContactFormController({
  open,
  onOpenChange,
  mode,
  contact,
  canImportContacts = true,
}: ContactFormProps): ContactFormVm {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const addContact = useAddContact();
  const updateContact = useUpdateContact();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    // zod `.default("")` fields make the schema's input type wider than the
    // inferred output; the resolver runs identically, so assert the form type.
    resolver: zodResolver(contactSchema) as Resolver<ContactFormValues>,
    defaultValues: EMPTY_CONTACT,
  });

  // Reset the form whenever the dialog opens or the target contact changes.
  useEffect(() => {
    if (!open) return;
    setTab("manual");
    reset(mode === "edit" && contact ? contactToForm(contact) : EMPTY_CONTACT);
  }, [open, mode, contact, reset]);

  async function submit(values: ContactFormValues) {
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

  return {
    open,
    mode,
    tab,
    canImportContacts,
    roleOptions: mode === "edit" ? ROLES : ADD_ROLES,
    busy: addContact.isPending || updateContact.isPending,
    register,
    errors,
    onOpenChange,
    onTab: setTab,
    onSubmit: handleSubmit(submit),
    onCancel: () => onOpenChange(false),
    onImportDone: () => onOpenChange(false),
  };
}
