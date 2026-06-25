import { createFileRoute } from "@tanstack/react-router";
import { ContactsPage } from "@/features/contacts/ContactsPage";

export const Route = createFileRoute("/app/contacts")({
  component: ContactsPage,
});
