import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { appRouter } from "./app/router";
import "./styles.css";

// React 19 StrictMode double-mounts effects in dev; the app uses imperative portals
// and document-level listeners in a few places, so we mount without StrictMode.
ReactDOM.createRoot(document.getElementById("root")!).render(<RouterProvider router={appRouter} />);
