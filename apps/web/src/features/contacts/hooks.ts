import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addContactFlow,
  importContactsFlow,
  refreshContactsFlow,
  updateContactFlow,
  type ContactImportStatus,
} from "@/services/api-bridge";
import type { UiContact } from "@/services/mappers";
import { toContactPayload, type ContactFormValues } from "./types";

export const CONTACTS_QUERY_KEY = ["contacts"] as const;

/** Contacts list — seeded from the workspace snapshot to avoid a load flash. */
export function useContacts(initialData?: UiContact[]) {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEY,
    queryFn: refreshContactsFlow,
    initialData,
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ContactFormValues) => addContactFlow(toContactPayload(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY }),
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ContactFormValues }) =>
      updateContactFlow(id, toContactPayload(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY }),
  });
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onStatus }: { file: File; onStatus?: (s: ContactImportStatus) => void }) =>
      importContactsFlow(file, onStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY }),
  });
}
