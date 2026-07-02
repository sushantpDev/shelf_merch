import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Box, Coins, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UiKit } from "@/services/mappers";

const ICON_CHIP: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "var(--brand-50)",
  color: "var(--brand)",
  display: "grid",
  placeItems: "center",
};

/** "Send Gift" chooser: pick points or a kit, then a kit to send. */
export function SendGiftDialog({
  open,
  kits,
  onOpenChange,
}: {
  open: boolean;
  kits: UiKit[];
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [view, setView] = useState<"choose" | "kit">("choose");
  const availableKits = kits.filter((k) => k.id);

  function close() {
    onOpenChange(false);
    setView("choose");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setView("choose");
      }}
    >
      <DialogContent className="sm-modal" style={{ maxWidth: view === "kit" ? 620 : 560 }}>
        <div className="modal-pad">
          {view === "choose" ? (
            <>
              <div className="eyebrow">Send a gift</div>
              <DialogTitle style={{ fontSize: 20 }}>What would you like to send?</DialogTitle>
              <p className="muted" style={{ fontSize: 13, margin: "6px 0 18px" }}>
                Choose how you'd like to delight your people. You can fine-tune recipients and
                branding on the next step.
              </p>
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <button
                  type="button"
                  className="optcard"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}
                  onClick={() => {
                    close();
                    navigate({ to: "/app/campaigns/send-points" });
                  }}
                >
                  <div style={ICON_CHIP}>
                    <Coins size={20} />
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 2 }}>Send points</h4>
                    <p>Let recipients pick their own swag from your branded shop.</p>
                  </div>
                </button>
                <button
                  type="button"
                  className="optcard"
                  style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}
                  onClick={() => setView("kit")}
                >
                  <div style={ICON_CHIP}>
                    <Box size={20} />
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 2 }}>Send a kit</h4>
                    <p>Ship a ready-made bundle of branded items to addresses.</p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow">Send a kit</div>
              <DialogTitle style={{ fontSize: 20 }}>Choose a kit to send</DialogTitle>
              <p className="muted" style={{ fontSize: 13, margin: "6px 0 18px" }}>
                Select one of your existing kits, or create a new kit.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {availableKits.length > 0 ? (
                  availableKits.map((k) => (
                    <div
                      key={k.id}
                      className="card"
                      style={{
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <div style={{ ...ICON_CHIP, flex: "none" }}>
                        <Box size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{k.name}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                          {k.items} item{k.items === 1 ? "" : "s"} · {k.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-dark btn-sm"
                        onClick={() => {
                          close();
                          navigate({ to: "/app/kits/$id/send", params: { id: k.id } });
                        }}
                      >
                        Select
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="card empty" style={{ padding: 24 }}>
                    <h3>No kits available</h3>
                    <p>Create a kit before starting this send.</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-brand btn-block"
                style={{ marginTop: 16 }}
                onClick={() => {
                  close();
                  navigate({ to: "/app/kits/new" });
                }}
              >
                <Plus size={16} /> Create a new kit
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
