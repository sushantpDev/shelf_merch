import { Link } from "react-router";
import { DocsHeading, DocsShell } from "../DocsShell";
import { useDocsMeta } from "../useDocsMeta";

export function ZohoPeopleExampleWorkflowPage() {
  useDocsMeta({
    title: "Example Employee Onboarding Workflow · ShelfMerch for Zoho People",
    description:
      "Example workflow showing how Zoho People and ShelfMerch can support employee onboarding kits and gifts. Not a customer case study.",
    canonicalPath: "/case-studies/zoho-people",
    ogTitle: "Example Onboarding Workflow with Zoho People and ShelfMerch",
    ogDescription:
      "An illustrative workflow for syncing employees and preparing onboarding kits. Not a specific customer result.",
  });

  return (
    <DocsShell
      activePath="/case-studies/zoho-people"
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Zoho People docs", to: "/docs/zoho-people" },
        { label: "Example Workflow" },
      ]}
    >
      <span className="docs-badge">Example Workflow</span>
      <h1>Example Employee Onboarding Workflow with Zoho People and ShelfMerch</h1>
      <div className="docs-callout">
        This page demonstrates an <strong>example workflow</strong> and does <strong>not</strong>{" "}
        represent a specific customer result. It is not a verified customer case study.
      </div>

      <DocsHeading id="workflow">Example workflow</DocsHeading>
      <ol>
        <li>HR adds an employee in Zoho People.</li>
        <li>An administrator synchronizes employees with ShelfMerch.</li>
        <li>ShelfMerch updates or creates the employee contact.</li>
        <li>HR selects the employee as an onboarding recipient.</li>
        <li>A welcome kit or corporate gift is prepared.</li>
        <li>Delivery is tracked in ShelfMerch.</li>
      </ol>

      <DocsHeading id="benefits">Benefits of this approach</DocsHeading>
      <ul>
        <li>Reduced manual data entry</li>
        <li>More accurate recipient information</li>
        <li>Faster onboarding preparation</li>
        <li>Centralised employee gifting</li>
        <li>Fewer duplicate records</li>
      </ul>

      <p>
        <Link className="docs-cta" to="/docs/zoho-people/user-guide">
          Read the User Guide
        </Link>
        <Link className="docs-cta docs-cta--ghost" to="/docs/zoho-people">
          Documentation home
        </Link>
      </p>
      <p>
        Questions? <a href="mailto:support@shelfmerch.com">support@shelfmerch.com</a>
      </p>
    </DocsShell>
  );
}
