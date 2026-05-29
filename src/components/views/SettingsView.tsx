"use client";

import { useCallback, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import { getEffectiveOrgId } from "@/lib/api/orgId";
import { formatQueryError } from "@/lib/formatQueryError";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { useUIStore } from "@/stores/ui.store";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="text-body-sm flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-on-surface-variant hover:bg-white/5"
      aria-label={`Copy ${label}`}
    >
      <Copy size={12} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SettingsView() {
  const graph = useOrgGraphData();
  const requestInvitePanel = useUIStore((s) => s.requestInvitePanel);

  if (graph.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(graph.error)}
        onRetry={() => void graph.refetch()}
      />
    );
  }

  const org = graph.data?.org;
  const users = graph.data?.users ?? [];
  const orgRoles = graph.data?.orgRoles ?? [];
  const effectiveOrgId = getEffectiveOrgId();

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-surface-container-low p-6">
      <h1 className="text-headline-sm mb-6 font-medium text-on-surface">
        Settings
      </h1>

      <section className="mb-8 max-w-2xl">
        <h2 className="text-section-header mb-3 text-on-surface-variant">
          Organisation
        </h2>
        <div className="rounded-xl border border-white/[0.08] bg-surface-container-high p-4">
          <p className="text-body-md text-on-surface">{org?.name ?? "—"}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="font-mono-label text-mono-label break-all text-on-surface-variant">
              {(org?.id ?? effectiveOrgId) || "No org ID"}
            </code>
            {org?.id || effectiveOrgId ? (
              <CopyButton
                value={org?.id ?? effectiveOrgId}
                label="organisation ID"
              />
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-8 max-w-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-section-header text-on-surface-variant">
            Members
          </h2>
          <button
            type="button"
            onClick={() => requestInvitePanel()}
            className="text-body-sm flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-medium text-on-primary"
          >
            <UserPlus size={14} />
            Invite new member
          </button>
        </div>
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/[0.08] bg-surface-container-high">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-body-sm font-bold text-on-surface">
                {user.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-on-surface">{user.name}</p>
                <p className="text-body-sm truncate text-on-surface-variant">
                  {user.email}
                </p>
              </div>
              <span className="font-mono-label shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-mono-label text-on-surface-variant capitalize">
                {user.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 max-w-2xl">
        <h2 className="text-section-header mb-3 text-on-surface-variant">
          Roles
        </h2>
        <div className="flex flex-wrap gap-2">
          {orgRoles.length > 0 ? (
            orgRoles.map((role) => (
              <span
                key={role.id}
                className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 text-body-sm text-on-surface"
              >
                {role.title}
              </span>
            ))
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              No custom roles defined
            </p>
          )}
          <button
            type="button"
            disabled
            className="rounded-full border border-dashed border-white/10 px-3 py-1 text-body-sm text-outline"
            title="Coming soon"
          >
            + Add role
          </button>
        </div>
      </section>

      {process.env.NODE_ENV === "development" ? (
        <section className="max-w-2xl">
          <h2 className="text-section-header mb-3 text-on-surface-variant">
            Environment
          </h2>
          <div className="space-y-3 rounded-xl border border-white/[0.08] bg-surface-container-high p-4">
            <EnvRow
              label="NEXT_PUBLIC_ORG_ID"
              value={process.env.NEXT_PUBLIC_ORG_ID ?? ""}
            />
            <EnvRow
              label="NEXT_PUBLIC_API_URL"
              value={process.env.NEXT_PUBLIC_API_URL ?? ""}
            />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-mono-label text-mono-label text-on-surface-variant">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="font-mono-label text-mono-label break-all text-on-surface">
          {value || "(unset)"}
        </code>
        {value ? <CopyButton value={value} label={label} /> : null}
      </div>
    </div>
  );
}
