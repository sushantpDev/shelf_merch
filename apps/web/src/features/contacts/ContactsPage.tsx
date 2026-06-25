import { useMemo, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/tenant/PageHeader";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiContact } from "@/services/mappers";
import { ContactFormDialog } from "./ContactFormDialog";
import { useContacts } from "./hooks";

export function ContactsPage() {
  const workspace = useWorkspace();
  const { data: contacts, isLoading, isError, error } = useContacts(workspace.data?.contacts);

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UiContact | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts ?? [];
    return (contacts ?? []).filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [contacts, query]);

  return (
    <>
      <PageHeader
        title="Workspace Contacts"
        subtitle="People in your workspace, their roles, and gifting permissions."
        actions={
          <button type="button" className="btn btn-dark" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add contacts
          </button>
        }
      />

      {isLoading && !contacts ? (
        <LoadingState message="Loading contacts…" fullScreen={false} />
      ) : isError ? (
        <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
          {error instanceof Error ? error.message : "Could not load contacts"}
        </div>
      ) : (
        <div className="card" style={{ padding: 18 }}>
          <div className="search" style={{ marginBottom: 14 }}>
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search contacts"
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: "40px 0", textAlign: "center" }}>
              <h3>{query ? "No matching contacts" : "No contacts yet"}</h3>
              <p className="muted">
                {query
                  ? "Try a different name or email."
                  : "Add people to start sending gifts and points."}
              </p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Home address</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="muted">{c.email}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.role}</td>
                    <td className="muted">{c.loc || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="iconbtn"
                        style={{ width: 30, height: 30 }}
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setEditing(c)}
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ContactFormDialog open={adding} onOpenChange={setAdding} mode="add" />
      <ContactFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        contact={editing ?? undefined}
      />
    </>
  );
}
