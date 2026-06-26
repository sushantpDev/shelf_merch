import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Ban,
  ChevronDown,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Search,
  SquareArrowOutUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { UiContact } from "@/services/mappers";
import { ContactFormDialog } from "./ContactFormDialog";
import { useContacts, useUpdateContact } from "./hooks";
import { contactToForm, ROLES } from "./types";

type ContactsTab = "permissions" | "directory";
type SortKey = "email" | "name" | "integrated";
type SortDir = "asc" | "desc";

function permissionLabel(role: string) {
  if (role === "Owner") return "Owner";
  if (role === "Admin") return "Admin";
  if (role === "Sender") return "Sender";
  if (role === "Member") return "Member";
  return "Non-Member";
}

function integratedLabel(c: UiContact) {
  if (c.employeeCode) return "HRIS";
  return "—";
}

function roleCounts(contacts: UiContact[]) {
  let admins = 0;
  let senders = 0;
  let members = 0;
  for (const c of contacts) {
    if (c.role === "Owner" || c.role === "Admin") admins += 1;
    else if (c.role === "Sender") senders += 1;
    else members += 1;
  }
  return { admins, senders, members };
}

function sortContacts(list: UiContact[], key: SortKey, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av =
      key === "email" ? a.email : key === "name" ? a.name : integratedLabel(a);
    const bv =
      key === "email" ? b.email : key === "name" ? b.name : integratedLabel(b);
    return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
  });
}

function emptyCell(value?: string) {
  const v = (value ?? "").trim();
  return v ? v : "—";
}

export function ContactsPage() {
  const workspace = useWorkspace();
  const { data: contacts, isLoading, isError, error } = useContacts(workspace.data?.contacts);
  const updateContact = useUpdateContact();

  const [tab, setTab] = useState<ContactsTab>("permissions");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("email");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<UiContact | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const counts = useMemo(() => roleCounts(contacts ?? []), [contacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = contacts ?? [];
    if (q) {
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "all") {
      list = list.filter((c) => c.role === roleFilter);
    }
    return sortContacts(list, sortKey, sortDir);
  }, [contacts, query, roleFilter, sortKey, sortDir]);

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id) || c.role === "Owner");
  const someSelected = filtered.some((c) => selected.has(c.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.filter((c) => c.role !== "Owner").map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onRoleChange(contact: UiContact, role: string) {
    if (contact.role === "Owner" || role === contact.role) return;
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        values: { ...contactToForm(contact), role: role as (typeof ROLES)[number] },
      });
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role");
    }
  }

  function SortHead({
    label,
    col,
    className,
  }: {
    label: string;
    col?: SortKey;
    className?: string;
  }) {
    const active = col && sortKey === col;
    return (
      <th className={className}>
        {col ? (
          <button type="button" className="contacts-th-sort" onClick={() => toggleSort(col)}>
            {label}
            <ArrowUpDown size={12} className={active ? "on" : ""} aria-hidden="true" />
          </button>
        ) : (
          label
        )}
      </th>
    );
  }

  return (
    <>
      <div className="contacts-page">
        <div className="contacts-top">
          <h1>Workspace Contacts</h1>
          <div className="contacts-top-actions">
            <div className="contacts-stats" aria-label="Contact role summary">
              <span>
                <b>Admins</b> {counts.admins}
              </span>
              <span>
                <b>Senders</b> {counts.senders}
              </span>
              <span>
                <b>Members</b> {counts.members}
              </span>
              <button
                type="button"
                className="contacts-stats-help"
                aria-label="Role summary help"
                title="Admins manage workspace settings. Senders can send gifts. Members can receive gifts."
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <button type="button" className="btn btn-dark contacts-add-btn" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add contacts
            </button>
            <button
              type="button"
              className="contacts-more-btn"
              aria-label="More actions"
              onClick={() => toast.message("Import and bulk actions — use Add contacts")}
            >
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {isLoading && !contacts ? (
          <LoadingState message="Loading contacts…" fullScreen={false} />
        ) : isError ? (
          <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
            {error instanceof Error ? error.message : "Could not load contacts"}
          </div>
        ) : (
          <div className="contacts-shell">
            <div className="contacts-main-tabs" role="tablist" aria-label="Contacts views">
              <button
                type="button"
                role="tab"
                className={tab === "permissions" ? "on" : ""}
                aria-selected={tab === "permissions"}
                onClick={() => setTab("permissions")}
              >
                Manage permissions
              </button>
              <button
                type="button"
                role="tab"
                className={tab === "directory" ? "on" : ""}
                aria-selected={tab === "directory"}
                onClick={() => setTab("directory")}
              >
                Workspace contacts
              </button>
            </div>

            <div className="contacts-panel">
              <div className="contacts-toolbar">
                <div className="search contacts-search">
                  <Search size={17} aria-hidden="true" />
                  <input
                    aria-label="Search contacts"
                    placeholder="Search by name or email"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="contacts-filter-wrap">
                  <button
                    type="button"
                    className="contacts-filter-btn"
                    aria-expanded={filterOpen}
                    onClick={() => setFilterOpen((o) => !o)}
                  >
                    Filter by
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {filterOpen && (
                    <div className="contacts-filter-menu" role="menu">
                      {[
                        ["all", "All roles"],
                        ["Owner", "Owner"],
                        ["Admin", "Admin"],
                        ["Sender", "Sender"],
                        ["Member", "Member"],
                        ["Non-Member", "Non-Member"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="menuitem"
                          className={roleFilter === value ? "on" : ""}
                          onClick={() => {
                            setRoleFilter(value);
                            setFilterOpen(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="contacts-empty">
                  <h3>{query || roleFilter !== "all" ? "No matching contacts" : "No contacts yet"}</h3>
                  <p className="muted">
                    {query || roleFilter !== "all"
                      ? "Try a different search or filter."
                      : "Add people to start sending gifts and points."}
                  </p>
                </div>
              ) : (
                <div className="contacts-table-wrap">
                  <table className="contacts-table">
                    <thead>
                      <tr>
                        <th className="contacts-th-check">
                          <input
                            type="checkbox"
                            aria-label="Select all contacts"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={toggleAll}
                          />
                        </th>
                        <SortHead label="Email" col="email" />
                        <SortHead label="Name" col="name" />
                        <th>Role</th>
                        {tab === "permissions" && <th>Permissions</th>}
                        {tab === "permissions" && (
                          <SortHead label="Integrated with" col="integrated" />
                        )}
                        <th>Home address</th>
                        <th className="contacts-th-actions" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? "zebra" : ""}>
                          <td className="contacts-td-check">
                            <input
                              type="checkbox"
                              aria-label={`Select ${c.name || c.email}`}
                              checked={selected.has(c.id)}
                              disabled={c.role === "Owner"}
                              onChange={() => toggleOne(c.id)}
                            />
                          </td>
                          <td className="contacts-td-email">{c.email}</td>
                          <td className="contacts-td-name">{emptyCell(c.name)}</td>
                          <td className="contacts-td-role">
                            {c.role === "Owner" ? (
                              <span className="contacts-role-text">Owner</span>
                            ) : (
                              <select
                                className="contacts-role-select"
                                value={c.role}
                                disabled={updateContact.isPending}
                                onChange={(e) => onRoleChange(c, e.target.value)}
                              >
                                {ROLES.filter((r) => r !== "Owner").map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          {tab === "permissions" && (
                            <td className="contacts-td-muted">{permissionLabel(c.role)}</td>
                          )}
                          {tab === "permissions" && (
                            <td className="contacts-td-muted">{integratedLabel(c)}</td>
                          )}
                          <td className="contacts-td-muted">{emptyCell(c.loc)}</td>
                          <td className="contacts-td-actions">
                            <button
                              type="button"
                              className="contacts-row-action"
                              aria-label={`Restrict ${c.name || c.email}`}
                              disabled={c.role === "Owner"}
                              onClick={() => toast.message("Contact restrictions — coming soon")}
                            >
                              <Ban size={15} />
                            </button>
                            <button
                              type="button"
                              className="contacts-row-action"
                              aria-label={`Edit ${c.name || c.email}`}
                              onClick={() => setEditing(c)}
                            >
                              <SquareArrowOutUpRight size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="contacts-footer">
          <span className="contacts-footer-brand">© Powered by Shelf Merch</span>
          <nav className="contacts-footer-links" aria-label="Footer">
            {[
              "Terms of use",
              "Cookie preferences",
              "Accessibility support",
              "Explore features",
              "Help center",
              "Contact us",
            ].map((link) => (
              <button
                key={link}
                type="button"
                onClick={() => toast.message(`${link} — coming soon`)}
              >
                {link}
              </button>
            ))}
          </nav>
        </footer>
      </div>

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
