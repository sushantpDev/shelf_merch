import {
  ArrowUpDown,
  Ban,
  ChevronDown,
  HelpCircle,
  Search,
  SquareArrowOutUpRight,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { ContactFormDialog } from "../ContactFormDialog";
import { ROLES } from "../types";
import type { UiContact } from "../model";
import {
  integratedLabel,
  type ContactsVm,
  type SortKey,
} from "../controllers/useContactsController";

const FOOTER_LINKS = [
  "Terms of use",
  "Cookie preferences",
  "Accessibility support",
  "Explore features",
  "Help center",
  "Contact us",
];

const FILTER_OPTIONS: [string, string][] = [
  ["all", "All roles"],
  ["Owner", "Owner"],
  ["Admin", "Admin"],
  ["Sender", "Sender"],
  ["Member", "Member"],
  ["Non-Member", "Non-Member"],
];

function permissionLabel(role: string) {
  if (role === "Owner") return "Owner";
  if (role === "Admin") return "Admin";
  if (role === "Sender") return "Sender";
  if (role === "Member") return "Member";
  return "Non-Member";
}

function emptyCell(value?: string) {
  const v = (value ?? "").trim();
  return v ? v : "—";
}

function SortHead({
  label,
  col,
  className,
  sortKey,
  onToggleSort,
}: {
  label: string;
  col?: SortKey;
  className?: string;
  sortKey: SortKey;
  onToggleSort: (key: SortKey) => void;
}) {
  const active = col && sortKey === col;
  return (
    <th className={className}>
      {col ? (
        <button type="button" className="contacts-th-sort" onClick={() => onToggleSort(col)}>
          {label}
          <ArrowUpDown size={12} className={active ? "on" : ""} aria-hidden="true" />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

/** Contacts screen: role summary, search/filter toolbar, permissions/directory table. */
export function ContactsView(vm: ContactsVm) {
  return (
    <>
      <div className="contacts-page">
        <div className="contacts-top">
          <h1>Workspace Contacts</h1>
          <div className="contacts-top-actions">
            <div className="contacts-stats" aria-label="Contact role summary">
              <span>
                <b>Admins</b> {vm.counts.admins}
              </span>
              <span>
                <b>Senders</b> {vm.counts.senders}
              </span>
              <span>
                <b>Members</b> {vm.counts.members}
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
            {vm.canManageContacts ? (
              <div className="contacts-top-btns">
                <button
                  type="button"
                  className="btn btn-ghost contacts-add-btn"
                  onClick={() => vm.onAddOpen("manual")}
                >
                  <UserPlus size={15} aria-hidden="true" />
                  Add contacts
                </button>
                <button
                  type="button"
                  className="btn btn-brand contacts-add-btn"
                  onClick={() => vm.onAddOpen("csv")}
                >
                  <Upload size={15} aria-hidden="true" />
                  Import
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {vm.isLoading ? (
          <LoadingState message="Loading contacts…" fullScreen={false} />
        ) : vm.errorMessage ? (
          <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
            {vm.errorMessage}
          </div>
        ) : (
          <div className="contacts-shell">
            <div className="contacts-main-tabs" role="tablist" aria-label="Contacts views">
              <button
                type="button"
                role="tab"
                className={vm.tab === "permissions" ? "on" : ""}
                aria-selected={vm.tab === "permissions"}
                onClick={() => vm.onTab("permissions")}
              >
                Manage permissions
              </button>
              <button
                type="button"
                role="tab"
                className={vm.tab === "directory" ? "on" : ""}
                aria-selected={vm.tab === "directory"}
                onClick={() => vm.onTab("directory")}
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
                    value={vm.query}
                    onChange={(e) => vm.onQuery(e.target.value)}
                  />
                </div>
                <div className="contacts-filter-wrap">
                  <button
                    type="button"
                    className="contacts-filter-btn"
                    aria-expanded={vm.filterOpen}
                    onClick={() => vm.onFilterOpenChange(!vm.filterOpen)}
                  >
                    Filter by
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {vm.filterOpen && (
                    <div className="contacts-filter-menu" role="menu">
                      {FILTER_OPTIONS.map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="menuitem"
                          className={vm.roleFilter === value ? "on" : ""}
                          onClick={() => vm.onRoleFilter(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {vm.filtered.length === 0 ? (
                <div className="contacts-empty">
                  <h3>
                    {vm.query || vm.roleFilter !== "all"
                      ? "No matching contacts"
                      : "No contacts yet"}
                  </h3>
                  <p className="muted">
                    {vm.query || vm.roleFilter !== "all"
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
                            checked={vm.allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = vm.someSelected && !vm.allSelected;
                            }}
                            onChange={vm.onToggleAll}
                          />
                        </th>
                        <SortHead
                          label="Email"
                          col="email"
                          sortKey={vm.sortKey}
                          onToggleSort={vm.onToggleSort}
                        />
                        <SortHead
                          label="Name"
                          col="name"
                          sortKey={vm.sortKey}
                          onToggleSort={vm.onToggleSort}
                        />
                        <th>Role</th>
                        <th>Dept</th>
                        {vm.tab === "permissions" && (
                          <SortHead
                            label="Integrated with"
                            col="integrated"
                            sortKey={vm.sortKey}
                            onToggleSort={vm.onToggleSort}
                          />
                        )}
                        <th>Home address</th>
                        <th className="contacts-th-actions" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {vm.filtered.map((c: UiContact, i) => (
                        <tr key={c.id} className={i % 2 === 0 ? "zebra" : ""}>
                          <td className="contacts-td-check">
                            <input
                              type="checkbox"
                              aria-label={`Select ${c.name || c.email}`}
                              checked={vm.selected.has(c.id)}
                              disabled={c.role === "Owner"}
                              onChange={() => vm.onToggleOne(c.id)}
                            />
                          </td>
                          <td className="contacts-td-email">{c.email}</td>
                          <td className="contacts-td-name">{emptyCell(c.name)}</td>
                          <td className="contacts-td-role">
                            {c.role === "Owner" || !vm.canManageContactRoles ? (
                              <span className="contacts-role-text">{permissionLabel(c.role)}</span>
                            ) : (
                              <select
                                className="contacts-role-select"
                                value={c.role}
                                disabled={vm.isRolePending}
                                onChange={(e) => vm.onRoleChange(c, e.target.value)}
                              >
                                {ROLES.filter((r) => r !== "Owner").map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          {vm.tab === "permissions" ? (
                            <>
                              <td className="contacts-td-muted">{emptyCell(c.department)}</td>
                              <td className="contacts-td-muted">{integratedLabel(c)}</td>
                            </>
                          ) : (
                            <td className="contacts-td-muted">{emptyCell(c.department)}</td>
                          )}
                          <td className="contacts-td-muted">{emptyCell(c.loc)}</td>
                          <td className="contacts-td-actions">
                            {vm.canManageContacts ? (
                              <>
                                <button
                                  type="button"
                                  className="contacts-row-action"
                                  aria-label={`Restrict ${c.name || c.email}`}
                                  disabled={c.role === "Owner"}
                                  onClick={vm.onRestrict}
                                >
                                  <Ban size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="contacts-row-action"
                                  aria-label={`Edit ${c.name || c.email}`}
                                  onClick={() => vm.onEdit(c)}
                                >
                                  <SquareArrowOutUpRight size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="contacts-row-action contacts-row-action--danger"
                                  aria-label={`Delete ${c.name || c.email}`}
                                  disabled={c.role === "Owner" || vm.isDeletePending}
                                  onClick={() => vm.onDelete(c)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            ) : null}
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
            {FOOTER_LINKS.map((link) => (
              <button key={link} type="button" onClick={() => vm.onFooterLink(link)}>
                {link}
              </button>
            ))}
          </nav>
        </footer>
      </div>

      <ContactFormDialog
        open={vm.adding}
        onOpenChange={vm.onAddOpenChange}
        mode="add"
        canImportContacts
        initialTab={vm.addInitialTab}
      />
      <ContactFormDialog
        open={vm.editing !== null}
        onOpenChange={vm.onEditOpenChange}
        mode="edit"
        contact={vm.editing ?? undefined}
      />
    </>
  );
}
