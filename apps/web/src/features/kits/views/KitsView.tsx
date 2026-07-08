import { type ComponentType, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Gift,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Box,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/LoadingState";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUpdateKit, useCreateKit, usePlatformKits, type PlatformKitTemplate, type UiKit } from "../model";
import { kitPickedIndices } from "../wizard/kitDraft";
import { KitDetailDialog } from "../KitDetailDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { KitsVm } from "../controllers/useKitsController";
import { KitsEmptyState } from "./KitsEmptyState";
import scaleYourGiftingImg from "../../../../assets/scale_your_gifting.png";
import wellnessKitImg from "../../../../assets/wellness-kit.png";
import workFromHomeKitImg from "../../../../assets/work-from-home-kit.png";
import kitPreviewImg from "../../../../assets/kit-preview.png";
import "../kits-page.css";

type StatCardProps = {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

type KitRow = {
  id: string;
  name: string;
  description: string;
  audience: string;
  image: string;
  items: number;
  status: "live" | "draft" | "archived";
  lastSent: string;
  sentDate: string;
  featured?: boolean;
  /** Present only for real workspace kits; absent for default sample rows. */
  kit?: UiKit;
  platformKit?: PlatformKitTemplate;
};

// Helper for formatting date strings
function formatDateString(dateStr?: string) {
  if (!dateStr || dateStr === "Never sent" || dateStr === "Recent") return dateStr || "Never sent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}
function getCuratedKitMeta(kit: any) {
  try {
    if (!kit.designNotes) return null;
    const parsed = JSON.parse(kit.designNotes);
    if (parsed && parsed.curated) {
      return parsed;
    }
  } catch (e) {}
  return null;
}

const mockHistoryRows: KitRow[] = [
  {
    id: "hist-1",
    name: "Freshers",
    description: "Custom kit created in your workspace.",
    audience: "Workspace",
    image: kitPreviewImg,
    items: 1,
    status: "live",
    lastSent: "Recently",
    sentDate: "Recent",
  },
  {
    id: "hist-2",
    name: "Welcome Kit",
    description: "New joiner welcome kit with essentials to get started.",
    audience: "Workspace",
    image: scaleYourGiftingImg,
    items: 4,
    status: "live",
    lastSent: "Recently",
    sentDate: "Recent",
  },
  {
    id: "hist-3",
    name: "Welcome Kit",
    description: "New joiner welcome kit with essentials to get started.",
    audience: "Workspace",
    image: scaleYourGiftingImg,
    items: 4,
    status: "live",
    lastSent: "Never sent",
    sentDate: "Never sent",
  },
  {
    id: "hist-4",
    name: "Diwali Gift Box",
    description: "Celebrate the festival of lights with our special Diwali kit.",
    audience: "Workspace",
    image: wellnessKitImg,
    items: 5,
    status: "live",
    lastSent: "12 days ago",
    sentDate: "May 28, 2026",
  },
  {
    id: "hist-5",
    name: "Client Appreciation Kit",
    description: "A premium kit to thank and delight your top clients.",
    audience: "Workspace",
    image: kitPreviewImg,
    items: 3,
    status: "live",
    lastSent: "5 days ago",
    sentDate: "May 25, 2026",
  },
  {
    id: "hist-6",
    name: "Welcome Kit",
    description: "New joiner welcome kit with essentials to get started.",
    audience: "Workspace",
    image: scaleYourGiftingImg,
    items: 4,
    status: "live",
    lastSent: "20 days ago",
    sentDate: "May 10, 2026",
  },
  {
    id: "hist-7",
    name: "Employee Milestone Kit",
    description: "Recognize milestones and celebrate achievements.",
    audience: "Workspace",
    image: workFromHomeKitImg,
    items: 4,
    status: "draft",
    lastSent: "-",
    sentDate: "Never sent",
  }
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, delta, icon: Icon }: StatCardProps) {
  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e3e8e4",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        flex: 1,
        minWidth: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5b665f" }}>{label}</span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#eef7f2",
            color: "var(--brand)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--disp)", color: "#07140f", lineHeight: 1 }}>
          {value}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 10,
            background: "#eef7f2",
            color: "var(--brand)",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 12,
            border: "1px solid #d0ebd0",
          }}
        >
          <span style={{ fontSize: 9 }}>▲</span> {delta}
        </div>
      </div>
    </article>
  );
}

// function ProgressBanner() {
//   return (
//     <div
//       style={{
//         background: "#f9fafb",
//         border: "1px solid #e3e8e4",
//         borderRadius: 12,
//         padding: "16px 24px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         gap: 16,
//         marginBottom: 24,
//         flexWrap: "wrap",
//       }}
//     >
      {/* <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#eef7f2",
            color: "var(--brand)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          1
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Box size={18} color="var(--brand)" />
        </div> */}
        {/* <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#101a15" }}>Create a kit</div>
          <div style={{ fontSize: 11, color: "#5b665f", lineHeight: 1.3 }}>
            Choose products from catalog and name kit.
          </div>
        </div>
      </div>
      <div style={{ color: "#d9e0dc", fontSize: 20, fontWeight: 300, userSelect: "none" }}>›</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#eef7f2",
            color: "var(--brand)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          2
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Users size={18} color="var(--brand)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#101a15" }}>Add recipients</div>
          <div style={{ fontSize: 11, color: "#5b665f", lineHeight: 1.3 }}>
            Select employees or import contacts.
          </div>
        </div>
      </div>
      <div style={{ color: "#d9e0dc", fontSize: 20, fontWeight: 300, userSelect: "none" }}>›</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 220 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#eef7f2",
            color: "var(--brand)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          3
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Send size={18} color="var(--brand)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#101a15" }}>Send &amp; track</div>
          <div style={{ fontSize: 11, color: "#5b665f", lineHeight: 1.3 }}>
            Launch your kit and monitor delivery status.
          </div>
        </div> */}
      {/* </div>
    </div> */}
  // );
// }

// ─── Main view ───────────────────────────────────────────────────────────────

export function KitsView(vm: KitsVm) {
  const navigate = useNavigate();
  const { data: workspace } = useWorkspace();
  const updateKit = useUpdateKit();
  const createKit = useCreateKit();
  const { data: platformKits } = usePlatformKits();

  const [activeSection, setActiveSection] = useState<"recent" | "customized" | "curated">("recent");
  const [previewKit, setPreviewKit] = useState<UiKit | null>(null);
  const [curatedPreviewKit, setCuratedPreviewKit] = useState<PlatformKitTemplate | null>(null);

  // Recent Activity section states
  const [recentTab, setRecentTab] = useState<"all" | "live" | "draft" | "archived">("all");
  const [recentSearch, setRecentSearch] = useState("");
  const [recentSort, setRecentSort] = useState<"name" | "items" | "newest">("newest");
  const [recentPage, setRecentPage] = useState(1);

  // Customized Kits section states
  const [customTab, setCustomTab] = useState<"all" | "live" | "draft" | "archived">("all");
  const [customSearch, setCustomSearch] = useState("");
  const [customSort, setCustomSort] = useState<"name" | "items" | "newest">("newest");
  const [customPage, setCustomPage] = useState(1);

  // Curated Kits section states
  const [curatedTab, setCuratedTab] = useState<"all" | "live" | "draft" | "archived">("all");
  const [curatedSearch, setCuratedSearch] = useState("");
  const [curatedSort, setCuratedSort] = useState<"name" | "items" | "newest">("newest");
  const [curatedPage, setCuratedPage] = useState(1);

  const { canCreateKits, canSendKits } = vm;

  /** Map real workspace kits into KitRow shape */
  const workspaceRows = useMemo<KitRow[]>(() => {
    return vm.kits
      .filter((kit) => !getCuratedKitMeta(kit))
      .map((kit): KitRow => ({
        id: kit.id,
        name: kit.name,
        description: "Custom kit created in your workspace.",
        audience: "Workspace",
        image: kitPreviewImg,
        items: kit.items,
        status: kit.status === "live" ? "live" : kit.status === "archived" ? "archived" : "draft",
        lastSent: kit.sent ? "Recently" : "-",
        sentDate: kit.sent ? "Recent" : "Never sent",
        kit,
      }));
  }, [vm.kits]);

  /** Map platform curated kits into KitRow shape */
  const curatedKitsRows = useMemo<KitRow[]>(() => {
    if (!platformKits) return [];
    return platformKits.map((kit): KitRow => {
      const coverImg = kit.imageUrls?.[0] ? resolveMediaUrl(kit.imageUrls[0]) : kitPreviewImg;
      const matchedWk = vm.kits.find((wk) => {
        const meta = getCuratedKitMeta(wk);
        return meta?.originalId === kit._id;
      });

      return {
        id: matchedWk ? matchedWk.id : kit._id,
        name: matchedWk ? matchedWk.name : kit.name,
        description: kit.description || "",
        audience: "Platform",
        image: coverImg,
        items: kit.items?.length ?? 0,
        status: matchedWk
          ? (matchedWk.status === "live" ? "live" : matchedWk.status === "archived" ? "archived" : "draft")
          : "live",
        lastSent: matchedWk?.sent ? "Recently" : "-",
        sentDate: matchedWk?.sent ? "Recent" : "Never sent",
        platformKit: kit,
        kit: matchedWk,
      };
    });
  }, [platformKits, vm.kits]);

  /** Workspace kits first, then the curated templates. */
  const allKits = useMemo<KitRow[]>(
    () => [...workspaceRows, ...curatedKitsRows],
    [workspaceRows, curatedKitsRows],
  );

  const stats = useMemo(() => {
    const live = allKits.filter((k) => k.status === "live").length;
    const drafts = allKits.filter((k) => k.status === "draft").length;
    const archived = allKits.filter((k) => k.status === "archived").length;
    return { total: live + drafts + archived, live, drafts, archived };
  }, [allKits]);

  // Construct complete Recent Activity history rows
  const recentActivityRows = useMemo<KitRow[]>(() => {
    const campaignRows: KitRow[] = (workspace?.campaigns ?? [])
      .filter((c) => c.type !== "send_points")
      .map((c) => {
        const matchedKit = vm.kits.find((k) => k.name === c.name);
        return {
          id: c.id,
          name: c.name,
          description: "Custom kit created in your workspace.",
          audience: "Workspace",
          image: matchedKit?.artworkUrl ? resolveMediaUrl(matchedKit.artworkUrl) : kitPreviewImg,
          items: matchedKit?.items ?? 3,
          status: c.status === "draft" ? "draft" : "live",
          lastSent: c.createdAt ? "Recently" : "Recently",
          sentDate: c.createdAt ? formatDateString(c.createdAt) : "Recent",
          kit: matchedKit,
        };
      });

    return [...campaignRows, ...mockHistoryRows];
  }, [workspace?.campaigns, vm.kits]);

  // Filtered & Sorted Recent Activity
  const processedRecentRows = useMemo(() => {
    let list = [...recentActivityRows];
    if (recentTab === "all") {
      list = list.filter((r) => r.status !== "archived");
    } else {
      list = list.filter((r) => r.status === recentTab);
    }
    if (recentSearch.trim()) {
      const q = recentSearch.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    if (recentSort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (recentSort === "items") {
      list.sort((a, b) => b.items - a.items);
    }
    return list;
  }, [recentActivityRows, recentTab, recentSearch, recentSort]);

  // Filtered & Sorted Customized Kits
  const processedCustomRows = useMemo(() => {
    let list = [...workspaceRows];
    if (customTab === "all") {
      list = list.filter((r) => r.status !== "archived");
    } else {
      list = list.filter((r) => r.status === customTab);
    }
    if (customSearch.trim()) {
      const q = customSearch.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    if (customSort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (customSort === "items") {
      list.sort((a, b) => b.items - a.items);
    }
    return list;
  }, [workspaceRows, customTab, customSearch, customSort]);

  // Filtered & Sorted Curated Kits
  const processedCuratedRows = useMemo(() => {
    let list = [...curatedKitsRows];
    if (curatedTab === "all") {
      list = list.filter((r) => r.status !== "archived");
    } else {
      list = list.filter((r) => r.status === curatedTab);
    }
    if (curatedSearch.trim()) {
      const q = curatedSearch.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    if (curatedSort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (curatedSort === "items") {
      list.sort((a, b) => b.items - a.items);
    }
    return list;
  }, [curatedKitsRows, curatedTab, curatedSearch, curatedSort]);

  const RECENT_ITEMS_PER_PAGE = 8;
  const GRID_ITEMS_PER_PAGE = 8;

  // Pagination bounds
  const recentTotalPages = Math.max(1, Math.ceil(processedRecentRows.length / RECENT_ITEMS_PER_PAGE));
  const paginatedRecentRows = useMemo(() => {
    const start = (recentPage - 1) * RECENT_ITEMS_PER_PAGE;
    return processedRecentRows.slice(start, start + RECENT_ITEMS_PER_PAGE);
  }, [processedRecentRows, recentPage]);

  const customTotalPages = Math.max(1, Math.ceil(processedCustomRows.length / GRID_ITEMS_PER_PAGE));
  const paginatedCustomRows = useMemo(() => {
    const start = (customPage - 1) * GRID_ITEMS_PER_PAGE;
    return processedCustomRows.slice(start, start + GRID_ITEMS_PER_PAGE);
  }, [processedCustomRows, customPage]);

  const curatedTotalPages = Math.max(1, Math.ceil(processedCuratedRows.length / GRID_ITEMS_PER_PAGE));
  const paginatedCuratedRows = useMemo(() => {
    const start = (curatedPage - 1) * GRID_ITEMS_PER_PAGE;
    return processedCuratedRows.slice(start, start + GRID_ITEMS_PER_PAGE);
  }, [processedCuratedRows, curatedPage]);

  // ── Handlers for Curated Action & Send ──

  const handleSendCuratedKit = async (kit: PlatformKitTemplate) => {
    const catalog = workspace?.catalogProducts ?? [];
    const pickedIndices: number[] = [];
    if (kit.items) {
      for (const item of kit.items) {
        const pid = String(item.catalogProductId ?? "");
        if (!pid) continue;
        const idx = catalog.findIndex((p) => p.id === pid);
        if (idx >= 0 && !pickedIndices.includes(idx)) pickedIndices.push(idx);
      }
    }
    if (pickedIndices.length === 0 && catalog.length > 0) {
      pickedIndices.push(0);
    }
    const packaging = kit.packaging === "none" ? "none" : "box";
    const designNotes = JSON.stringify({
      curated: true,
      originalId: kit._id,
      description: kit.description || "",
      imageUrls: kit.imageUrls || [],
    });

    try {
      const created = await createKit.mutateAsync({
        name: kit.name,
        pickedIndices,
        catalog,
        packaging,
        designNotes,
      });
      toast.success(`Temporary kit "${created.name}" created`);
      navigate(`/app/kits/${created.id}/send`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create temporary kit");
    }
  };

  const handleCuratedAction = async (kit: PlatformKitTemplate, status: "archived" | "draft" | "live") => {
    const catalog = workspace?.catalogProducts ?? [];
    const pickedIndices: number[] = [];
    if (kit.items) {
      for (const item of kit.items) {
        const pid = String(item.catalogProductId ?? "");
        if (!pid) continue;
        const idx = catalog.findIndex((p) => p.id === pid);
        if (idx >= 0 && !pickedIndices.includes(idx)) pickedIndices.push(idx);
      }
    }
    if (pickedIndices.length === 0 && catalog.length > 0) {
      pickedIndices.push(0);
    }
    const packaging = kit.packaging === "none" ? "none" : "box";
    const designNotes = JSON.stringify({
      curated: true,
      originalId: kit._id,
      description: kit.description || "",
      imageUrls: kit.imageUrls || [],
    });

    try {
      const created = await createKit.mutateAsync({
        name: kit.name,
        pickedIndices,
        catalog,
        packaging,
        designNotes,
      });
      await updateKit.mutateAsync({
        id: created.id,
        pickedIndices,
        catalog,
        status,
      });
      toast.success(`Kit updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update kit status");
    }
  };

  // ── Early returns ──
  if (vm.isLoading) return <LoadingState message="Loading kits..." fullScreen={false} />;
  if (vm.errorMessage) {
    return (
      <div className="card" style={{ padding: 16, color: "var(--danger)" }}>
        {vm.errorMessage}
      </div>
    );
  }

  if (vm.isEmpty) {
    return <KitsEmptyState contactCount={vm.contactCount} canCreateKits={vm.canCreateKits} />;
  }

  // Nested actions component for row options
  function ThreeDotMenu({ kitRow }: { kitRow: KitRow }) {
    const [open, setOpen] = useState(false);

    const handleAction = async (status: "archived" | "draft" | "live") => {
      setOpen(false);

      if (kitRow.platformKit && !kitRow.kit) {
        handleCuratedAction(kitRow.platformKit, status);
        return;
      }

      const activeKit = kitRow.kit;
      if (!activeKit) {
        toast.info("Actions only available for custom workspace kits.");
        return;
      }
      try {
        const catalog = workspace?.catalogProducts ?? [];
        const pickedIndices = kitPickedIndices(activeKit, catalog);
        await updateKit.mutateAsync({
          id: activeKit.id,
          pickedIndices,
          catalog,
          status,
        });
        toast.success(`Kit updated to ${status}`);
      } catch (err) {
        toast.error("Failed to update kit status");
      }
    };

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            background: "transparent",
            border: "1px solid #d9e0dc",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          <MoreVertical size={16} />
        </button>
        {open && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 90 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: "100%",
                marginBottom: 4,
                background: "#fff",
                border: "1px solid #d9e0dc",
                borderRadius: 6,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 100,
                minWidth: 140,
                display: "flex",
                flexDirection: "column",
                padding: 4,
              }}
            >
              {kitRow.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => handleAction("archived")}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  Archive
                </button>
              )}
              {kitRow.status !== "draft" && (
                <button
                  type="button"
                  onClick={() => handleAction("draft")}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  Mark as Draft
                </button>
              )}
              {kitRow.status !== "live" && (
                <button
                  type="button"
                  onClick={() => handleAction("live")}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  Mark as Live
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="kits-dashboard" aria-label="Kits and Items dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Hero Row */}
        <div className="kits-hero-row" style={{ margin: "0 0 10px" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#052f22" }}>Kits &amp; Items</h1>
            <p style={{ margin: "8px 0 0", color: "#5b665f" }}>
              Create reusable gift kits with your products and send them at scale.
            </p>
          </div>
          {canCreateKits && (
            <Link to="/app/kits/new" className="kits-create-btn" style={{ height: 40 }}>
              <Plus size={16} strokeWidth={2.4} />
              Create a kit
            </Link>
          )}
        </div>

        {/* Progress Banner */}
        {/* <ProgressBanner /> */}

        {/* Stats Grid */}
        <div className="kits-stats-grid" style={{ margin: "0 0 12px" }}>
          <StatCard label="Total kits" value={String(stats.total)} delta="18% vs last month" icon={Gift} />
          <StatCard label="Live kits" value={String(stats.live)} delta="22% vs last month" icon={Sparkles} />
          <StatCard label="Sent this month" value="312" delta="29% vs last month" icon={Send} />
          <StatCard label="Recipients reached" value="1,842" delta="35% vs last month" icon={Users} />
        </div>

        {/* Top-Level Section Navigation Switcher */}
        <div
          style={{
            display: "flex",
            gap: 32,
            borderBottom: "1px solid #d9e0dc",
            margin: "12px 0 0",
            paddingBottom: 0,
          }}
        >
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: activeSection === "recent" ? "var(--brand)" : "#5b665f",
              borderBottom: activeSection === "recent" ? "3px solid var(--brand)" : "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => setActiveSection("recent")}
          >
            Recent Activity
          </button>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: activeSection === "customized" ? "var(--brand)" : "#5b665f",
              borderBottom: activeSection === "customized" ? "3px solid var(--brand)" : "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => setActiveSection("customized")}
          >
            Customised Kits
          </button>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              color: activeSection === "curated" ? "var(--brand)" : "#5b665f",
              borderBottom: activeSection === "curated" ? "3px solid var(--brand)" : "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => setActiveSection("curated")}
          >
            Curated Kits
          </button>
        </div>

        {/* Section Heading */}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#052f22", margin: "12px 0 0" }}>
          {activeSection === "recent"
            ? "Recent activity"
            : activeSection === "customized"
              ? "Customised Kits"
              : "Curated Kits"}
        </h2>

        {/* ── SECTION 1: RECENT ACTIVITY ── */}
        {activeSection === "recent" && (
          <div className="kits-list-card">
            {/* Toolbar */}
            <div className="kits-list-toolbar">
              <div className="kits-tabs" aria-label="Kit filters">
                {(["all", "live", "draft", "archived"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`kits-tab${recentTab === tab ? " kits-tab--active" : ""}`}
                    onClick={() => {
                      setRecentTab(tab);
                      setRecentPage(1);
                    }}
                  >
                    {tab === "all" ? "All kits" : tab === "draft" ? "Drafts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span>
                      {tab === "all"
                        ? recentActivityRows.filter((r) => r.status !== "archived").length
                        : recentActivityRows.filter((r) => r.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="kits-tools">
                <div className="kits-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    placeholder="Search kits"
                    value={recentSearch}
                    onChange={(e) => {
                      setRecentSearch(e.target.value);
                      setRecentPage(1);
                    }}
                  />
                </div>
                <button type="button" className="kits-tool-btn">
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <select
                    value={recentSort}
                    onChange={(e) => {
                      setRecentSort(e.target.value as any);
                      setRecentPage(1);
                    }}
                    style={{
                      padding: "0 28px 0 12px",
                      borderRadius: 8,
                      border: "1px solid #d9e0dc",
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      height: 40,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="name">Sort: Name</option>
                    <option value="items">Sort: Items</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: 10,
                      pointerEvents: "none",
                      color: "#24312a",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="kits-table" role="table" aria-label="Recent activity list">
              {paginatedRecentRows.length > 0 ? (
                paginatedRecentRows.map((row) => (
                  <div className="kits-table__row" role="row" key={row.id}>
                    <div className="kits-kit-cell">
                      {row.kit ? (
                        <Link to={`/app/kits/${row.id}`}>
                          <img src={row.image} alt="" />
                        </Link>
                      ) : (
                        <img src={row.image} alt="" />
                      )}
                      <div>
                        <div className="kits-kit-title">
                          {row.kit ? (
                            <Link to={`/app/kits/${row.id}`} className="lnk">
                              {row.name}
                            </Link>
                          ) : (
                            <span>{row.name}</span>
                          )}
                          {row.featured && (
                            <span className="kits-featured">
                              <Star size={11} fill="currentColor" /> Featured
                            </span>
                          )}
                        </div>
                        <p>{row.description}</p>
                        <span className="kits-audience">{row.audience}</span>
                      </div>
                    </div>

                    <div className="kits-metric-cell">
                      <span>Items</span>
                      <strong>{row.items}</strong>
                    </div>

                    <div className="kits-metric-cell">
                      <span>Status</span>
                      <strong className={`kits-status kits-status--${row.status}`}>
                        <i />
                        {row.status === "live" ? "Live" : row.status === "archived" ? "Archived" : "Draft"}
                      </strong>
                    </div>

                    <div className="kits-sent-cell">
                      <span>Last sent</span>
                      <strong>{row.lastSent}</strong>
                      <em>{row.sentDate}</em>
                    </div>

                    <div className="kits-row-actions">
                      {canCreateKits && (
                        row.kit ? (
                          <Link to={`/app/kits/${row.id}/edit`} className="kits-row-btn">
                            Edit
                          </Link>
                        ) : (
                          <Link to="/app/kits/new" className="kits-row-btn">
                            Edit
                          </Link>
                        )
                      )}

                      {canSendKits && (
                        row.kit ? (
                          <Link to={`/app/kits/${row.id}/send`} className="kits-send-btn">
                            Send
                          </Link>
                        ) : (
                          <Link to="/app/kits/new" className="kits-send-btn">
                            Send
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#5b665f" }}>
                  No recent activity matches the current filters.
                </div>
              )}
            </div>

            {/* Pagination footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderTop: "1px solid #e6ebe7",
              }}
            >
              <span style={{ fontSize: 13, color: "#5b665f" }}>
                Showing {processedRecentRows.length > 0 ? (recentPage - 1) * RECENT_ITEMS_PER_PAGE + 1 : 0} to{" "}
                {Math.min(processedRecentRows.length, recentPage * RECENT_ITEMS_PER_PAGE)} of{" "}
                {processedRecentRows.length} records
              </span>
              {recentTotalPages > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={recentPage === 1}
                    onClick={() => setRecentPage(recentPage - 1)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d9e0dc",
                      background: "transparent",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: recentPage === 1 ? "not-allowed" : "pointer",
                      opacity: recentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={recentPage === recentTotalPages}
                    onClick={() => setRecentPage(recentPage + 1)}
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #d9e0dc",
                      background: "transparent",
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: recentPage === recentTotalPages ? "not-allowed" : "pointer",
                      opacity: recentPage === recentTotalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 2: CUSTOMIZED KITS ── */}
        {activeSection === "customized" && (
          <div>
            {/* Toolbar */}
            <div
              className="kits-list-toolbar"
              style={{ border: "1px solid #e0e6e1", borderRadius: "12px 12px 0 0", background: "#fff" }}
            >
              <div className="kits-tabs" aria-label="Kit filters">
                {(["all", "live", "draft", "archived"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`kits-tab${customTab === tab ? " kits-tab--active" : ""}`}
                    onClick={() => {
                      setCustomTab(tab);
                      setCustomPage(1);
                    }}
                  >
                    {tab === "all" ? "All kits" : tab === "draft" ? "Drafts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span>
                      {tab === "all"
                        ? workspaceRows.filter((r) => r.status !== "archived").length
                        : workspaceRows.filter((r) => r.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="kits-tools">
                <div className="kits-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    placeholder="Search kits"
                    value={customSearch}
                    onChange={(e) => {
                      setCustomSearch(e.target.value);
                      setCustomPage(1);
                    }}
                  />
                </div>
                <button type="button" className="kits-tool-btn">
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <select
                    value={customSort}
                    onChange={(e) => {
                      setCustomSort(e.target.value as any);
                      setCustomPage(1);
                    }}
                    style={{
                      padding: "0 28px 0 12px",
                      borderRadius: 8,
                      border: "1px solid #d9e0dc",
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      height: 40,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="name">Sort: Name</option>
                    <option value="items">Sort: Items</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: 10,
                      pointerEvents: "none",
                      color: "#24312a",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div
              style={{
                background: "#fff",
                borderLeft: "1px solid #e0e6e1",
                borderRight: "1px solid #e0e6e1",
                borderBottom: "1px solid #e0e6e1",
                padding: 24,
                borderRadius: "0 0 12px 12px",
              }}
            >
              {paginatedCustomRows.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                  {paginatedCustomRows.map((row) => (
                    <div
                      key={row.id}
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: 0,
                        overflow: "hidden",
                        borderRadius: 12,
                        border: "1px solid #e0e6e1",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          height: 180,
                          background: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 16,
                        }}
                      >
                        {row.kit ? (
                          <Link
                            to={`/app/kits/${row.id}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={row.image}
                              alt=""
                              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                            />
                          </Link>
                        ) : (
                          <img
                            src={row.image}
                            alt=""
                            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          padding: 16,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#101a15", margin: "0 0 6px 0" }}>
                            {row.name}
                          </h4>
                          <div
                            className="muted"
                            style={{
                              fontSize: 11,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 12,
                              marginBottom: 16,
                              color: "#5b665f",
                            }}
                          >
                            <span>
                              <b>ITEMS:</b> {row.items}
                            </span>
                            <span>
                              <b>STATUS:</b>{" "}
                              <span
                                className={`kits-status kits-status--${row.status}`}
                                style={{ display: "inline-flex", alignItems: "center", height: 18, fontSize: 10, padding: "0 6px" }}
                              >
                                <i style={{ marginRight: 4 }} />
                                {row.status === "live" ? "Live" : row.status === "archived" ? "Archived" : "Draft"}
                              </span>
                            </span>
                            <span>
                              <b>LAST SENT:</b> {row.lastSent}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {canCreateKits && (
                            row.kit ? (
                              <Link
                                to={`/app/kits/${row.id}/edit`}
                                className="btn btn-ghost btn-sm"
                                style={{
                                  flex: 1,
                                  border: "1px solid #d9e0dc",
                                  height: 32,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 6,
                                  color: "#24312a",
                                }}
                              >
                                Edit
                              </Link>
                            ) : (
                              <Link
                                to="/app/kits/new"
                                className="btn btn-ghost btn-sm"
                                style={{
                                  flex: 1,
                                  border: "1px solid #d9e0dc",
                                  height: 32,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 6,
                                  color: "#24312a",
                                }}
                              >
                                Edit
                              </Link>
                            )
                          )}
                          {canSendKits && (
                            row.kit ? (
                              <Link
                                to={`/app/kits/${row.id}/send`}
                                className="btn btn-brand btn-sm"
                                style={{
                                  flex: 1,
                                  height: 32,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 6,
                                }}
                              >
                                Send
                              </Link>
                            ) : (
                              <Link
                                to="/app/kits/new"
                                className="btn btn-brand btn-sm"
                                style={{
                                  flex: 1,
                                  height: 32,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 6,
                                }}
                              >
                                Send
                              </Link>
                            )
                          )}
                          <ThreeDotMenu kitRow={row} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#5b665f" }}>
                  No customized kits found. Create a kit to get started!
                </div>
              )}

              {/* Pagination controls */}
              {customTotalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid #e6ebe7",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#5b665f" }}>
                    Showing {processedCustomRows.length > 0 ? (customPage - 1) * GRID_ITEMS_PER_PAGE + 1 : 0} to{" "}
                    {Math.min(processedCustomRows.length, customPage * GRID_ITEMS_PER_PAGE)} of{" "}
                    {processedCustomRows.length} kits
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={customPage === 1}
                      onClick={() => setCustomPage(customPage - 1)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d9e0dc",
                        background: "transparent",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: customPage === 1 ? "not-allowed" : "pointer",
                        opacity: customPage === 1 ? 0.5 : 1,
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={customPage === customTotalPages}
                      onClick={() => setCustomPage(customPage + 1)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d9e0dc",
                        background: "transparent",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: customPage === customTotalPages ? "not-allowed" : "pointer",
                        opacity: customPage === customTotalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 3: CURATED KITS ── */}
        {activeSection === "curated" && (
          <div>
            {/* Toolbar */}
            <div
              className="kits-list-toolbar"
              style={{ border: "1px solid #e0e6e1", borderRadius: "12px 12px 0 0", background: "#fff" }}
            >
              <div className="kits-tabs" aria-label="Kit filters">
                {(["all", "live", "draft", "archived"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`kits-tab${curatedTab === tab ? " kits-tab--active" : ""}`}
                    onClick={() => {
                      setCuratedTab(tab);
                      setCuratedPage(1);
                    }}
                  >
                    {tab === "all" ? "All kits" : tab === "draft" ? "Drafts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    <span>
                      {tab === "all"
                        ? curatedKitsRows.filter((r) => r.status !== "archived").length
                        : curatedKitsRows.filter((r) => r.status === tab).length}
                    </span>
                  </button>
                ))}
              </div>

              <div className="kits-tools">
                <div className="kits-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    placeholder="Search kits"
                    value={curatedSearch}
                    onChange={(e) => {
                      setCuratedSearch(e.target.value);
                      setCuratedPage(1);
                    }}
                  />
                </div>
                <button type="button" className="kits-tool-btn">
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <select
                    value={curatedSort}
                    onChange={(e) => {
                      setCuratedSort(e.target.value as any);
                      setCuratedPage(1);
                    }}
                    style={{
                      padding: "0 28px 0 12px",
                      borderRadius: 8,
                      border: "1px solid #d9e0dc",
                      background: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      height: 40,
                      appearance: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="name">Sort: Name</option>
                    <option value="items">Sort: Items</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: "absolute",
                      right: 10,
                      pointerEvents: "none",
                      color: "#24312a",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div
              style={{
                background: "#fff",
                borderLeft: "1px solid #e0e6e1",
                borderRight: "1px solid #e0e6e1",
                borderBottom: "1px solid #e0e6e1",
                padding: 24,
                borderRadius: "0 0 12px 12px",
              }}
            >
              {paginatedCuratedRows.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                  {paginatedCuratedRows.map((row) => (
                    <div
                      key={row.id}
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        padding: 0,
                        overflow: "hidden",
                        borderRadius: 12,
                        border: "1px solid #e0e6e1",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          height: 180,
                          background: "#f9fafb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 16,
                        }}
                      >
                        <img
                          src={row.image}
                          alt=""
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <div
                        style={{
                          padding: 16,
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#101a15", margin: "0 0 6px 0" }}>
                            {row.name}
                          </h4>
                          <div
                            className="muted"
                            style={{
                              fontSize: 11,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 12,
                              marginBottom: 16,
                              color: "#5b665f",
                            }}
                          >
                            <span>
                              <b>ITEMS:</b> {row.items}
                            </span>
                            <span>
                              <b>STATUS:</b>{" "}
                              <span
                                className={`kits-status kits-status--${row.status}`}
                                style={{ display: "inline-flex", alignItems: "center", height: 18, fontSize: 10, padding: "0 6px" }}
                              >
                                <i style={{ marginRight: 4 }} />
                                {row.status === "live" ? "Live" : row.status === "archived" ? "Archived" : "Draft"}
                              </span>
                            </span>
                            <span>
                              <b>LAST SENT:</b> {row.lastSent}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (row.platformKit) {
                                setCuratedPreviewKit(row.platformKit);
                              }
                            }}
                            style={{
                              flex: 1,
                              border: "1px solid #d9e0dc",
                              height: 32,
                              fontSize: 13,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 6,
                              color: "#24312a",
                            }}
                          >
                            Preview
                          </button>
                          {canSendKits && (
                            <button
                              type="button"
                              className="btn btn-brand btn-sm"
                              onClick={() => {
                                if (row.platformKit) {
                                  handleSendCuratedKit(row.platformKit);
                                }
                              }}
                              style={{
                                flex: 1,
                                height: 32,
                                fontSize: 13,
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 6,
                              }}
                            >
                              Send
                            </button>
                          )}
                          <ThreeDotMenu kitRow={row} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#5b665f" }}>
                  No curated kits match your filters.
                </div>
              )}

              {/* Pagination controls */}
              {curatedTotalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: "1px solid #e6ebe7",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#5b665f" }}>
                    Showing {processedCuratedRows.length > 0 ? (curatedPage - 1) * GRID_ITEMS_PER_PAGE + 1 : 0} to{" "}
                    {Math.min(processedCuratedRows.length, curatedPage * GRID_ITEMS_PER_PAGE)} of{" "}
                    {processedCuratedRows.length} kits
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={curatedPage === 1}
                      onClick={() => setCuratedPage(curatedPage - 1)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d9e0dc",
                        background: "transparent",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: curatedPage === 1 ? "not-allowed" : "pointer",
                        opacity: curatedPage === 1 ? 0.5 : 1,
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={curatedPage === curatedTotalPages}
                      onClick={() => setCuratedPage(curatedPage + 1)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #d9e0dc",
                        background: "transparent",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: curatedPage === curatedTotalPages ? "not-allowed" : "pointer",
                        opacity: curatedPage === curatedTotalPages ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Kit Preview Modal */}
      {previewKit && (
        <KitDetailDialog
          kit={previewKit}
          catalog={workspace?.catalogProducts ?? []}
          onOpenChange={(open) => setPreviewKit(open ? previewKit : null)}
        />
      )}

      {/* Curated Kit Centered Modal */}
      {curatedPreviewKit && (
        <Dialog open={curatedPreviewKit !== null} onOpenChange={(open) => setCuratedPreviewKit(open ? curatedPreviewKit : null)}>
          <DialogContent
            className="sm-modal"
            style={{
              maxWidth: (curatedPreviewKit.imageUrls && curatedPreviewKit.imageUrls.length > 4) ? 850 : 640,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="modal-pad" style={{ padding: "24px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <DialogTitle style={{ fontSize: 20, fontWeight: 800, color: "#052f22", margin: 0 }}>
                  {curatedPreviewKit.name}
                </DialogTitle>
              </div>
              
              <p style={{ color: "#5b665f", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
                {curatedPreviewKit.description || "No description available."}
              </p>

              <div style={{ borderBottom: "1px solid #e3e8e4", marginBottom: 16 }} />

              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#5b665f", marginBottom: 12 }}>
                  Included Products ({Math.max(0, (curatedPreviewKit.imageUrls?.length ?? 0) - 1)})
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                  {curatedPreviewKit.imageUrls && curatedPreviewKit.imageUrls.slice(1).map((imgUrl, i) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #e3e8e4",
                        borderRadius: 8,
                        padding: 12,
                        background: "#f9fafb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        aspectRatio: "1"
                      }}
                    >
                      <img
                        src={resolveMediaUrl(imgUrl)}
                        alt=""
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCuratedPreviewKit(null)}
                  style={{ border: "1px solid #d9e0dc", padding: "8px 24px", borderRadius: 6, fontWeight: 700 }}
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
