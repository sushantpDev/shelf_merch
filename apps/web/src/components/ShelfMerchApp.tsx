import { useEffect } from "react";
// Shared in-memory state object surfaced from the engine (see src/lib/shelf-merch.js)
import { mountShelfMerch } from "@/lib/shelf-merch";
import { LoadingState } from "@/components/LoadingState";
import "@/styles/shelf-merch.css";

/**
 * Hosts the Shelf Merch view engine inside React. The engine renders
 * imperatively into the #app / #toast / #layer slots below; React owns the
 * lifecycle (mount/unmount + route placement), and the engine owns the DOM
 * inside its slots. This keeps the original UI/UX 1:1.
 */
export default function ShelfMerchApp() {
  useEffect(() => {
    mountShelfMerch();
  }, []);

  return (
    <>
      <div id="app">
        <LoadingState message="Loading workspace…" />
      </div>
      <div id="toast" />
      <div id="layer" />
    </>
  );
}
