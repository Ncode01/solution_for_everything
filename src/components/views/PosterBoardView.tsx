"use client";

import { useMemo, useState } from "react";
import { ImageIcon, Search } from "lucide-react";
import { colors, typography } from "@/design-system";
import { skeletonVariants } from "@/design-system/components";
import { useOrgGraphData } from "@/lib/api/useOrgGraphData";
import type { ApiPoster } from "@/lib/api/types";
import { ViewErrorPanel } from "@/components/ui/ViewStatusPanel";
import { formatQueryError } from "@/lib/formatQueryError";

const PROJECT_COLOR_DOT: Record<string, string> = {
  coral: "bg-[#E05C5C]",
  amber: "bg-[#E8AF34]",
  violet: "bg-[#A86FDF]",
  sky: "bg-[#5591C7]",
  mint: "bg-[#6DAA45]",
};

function formatPosterDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PosterBoardView() {
  const graph = useOrgGraphData();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const projects = graph.data?.projects ?? [];
  const posters = graph.data?.posters ?? [];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const p of posters) {
      for (const t of p.tags) tags.add(t);
    }
    return [...tags].sort();
  }, [posters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posters.filter((poster) => {
      if (projectFilter !== "all" && poster.projectId !== projectFilter) {
        return false;
      }
      if (tagFilter !== "all" && !poster.tags.includes(tagFilter)) {
        return false;
      }
      if (!q) return true;
      return (
        poster.title.toLowerCase().includes(q) ||
        (poster.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [posters, projectFilter, tagFilter, search]);

  if (graph.isLoading) {
    return (
      <div className="hide-scrollbar h-full overflow-y-auto p-6">
        <div className="mb-4 h-10 w-full max-w-md animate-pulse rounded-lg bg-white/10" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-48 ${skeletonVariants.base}`} />
          ))}
        </div>
      </div>
    );
  }

  if (graph.isError) {
    return (
      <ViewErrorPanel
        message={formatQueryError(graph.error)}
        onRetry={() => graph.refetch()}
      />
    );
  }

  return (
    <div className="hide-scrollbar flex h-full flex-col overflow-hidden">
      <div
        className={`flex flex-wrap items-center gap-3 border-b px-6 py-4 ${colors.border.subtle}`}
      >
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={projectFilter === "all"}
            onClick={() => setProjectFilter("all")}
            label="All"
          />
          {projects.map((p) => (
            <FilterPill
              key={p.id}
              active={projectFilter === p.id}
              onClick={() => setProjectFilter(p.id)}
              label={p.name}
              dotClass={PROJECT_COLOR_DOT[p.color] ?? PROJECT_COLOR_DOT.sky}
            />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filter by tag"
            className={`rounded-lg border px-3 py-1.5 ${colors.bg.elevated} ${colors.border.subtle} ${typography.scale.sm.class} ${colors.text.secondary}`}
          >
            <option value="all">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${colors.bg.elevated} ${colors.border.subtle}`}
          >
            <Search size={14} className={colors.text.tertiary} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posters…"
              className={`w-40 bg-transparent outline-none ${typography.scale.sm.class} ${colors.text.primary}`}
            />
          </div>
        </div>
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
            <ImageIcon size={40} className={colors.text.tertiary} />
            <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
              No posters yet
            </p>
            <p className={`${typography.scale.sm.class} ${colors.text.tertiary}`}>
              Posters will appear here once created via ⌘K
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((poster) => (
              <PosterCard
                key={poster.id}
                poster={poster}
                projectName={
                  projects.find((p) => p.id === poster.projectId)?.name ??
                  "Project"
                }
                projectColor={
                  projects.find((p) => p.id === poster.projectId)?.color ??
                  "sky"
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  dotClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full px-3 py-1",
        typography.scale.sm.class,
        active
          ? "bg-[#6366F1]/20 text-[#F1F1F5]"
          : `${colors.bg.elevated} ${colors.text.secondary} hover:bg-white/5`,
      ].join(" ")}
    >
      {dotClass ? <span className={`h-2 w-2 rounded-full ${dotClass}`} /> : null}
      <span className="max-w-[140px] truncate">{label}</span>
    </button>
  );
}

function PosterCard({
  poster,
  projectName,
  projectColor,
}: {
  poster: ApiPoster;
  projectName: string;
  projectColor: string;
}) {
  const dot = PROJECT_COLOR_DOT[projectColor] ?? PROJECT_COLOR_DOT.sky;
  return (
    <article
      className={`overflow-hidden rounded-xl border ${colors.bg.elevated} ${colors.border.subtle}`}
    >
      {poster.imageUrl ? (
        <div
          className="aspect-video w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${poster.imageUrl})` }}
        />
      ) : null}
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
          <span className={`truncate ${typography.scale.xs.class} ${colors.text.tertiary}`}>
            {projectName}
          </span>
        </div>
        <h3 className={`mb-1 line-clamp-2 ${typography.scale.base.class} text-white`}>
          {poster.title}
        </h3>
        {poster.description ? (
          <p
            className={`mb-3 line-clamp-2 ${typography.scale.sm.class} ${colors.text.tertiary}`}
          >
            {poster.description}
          </p>
        ) : null}
        <div className="mb-2 flex flex-wrap gap-1">
          {poster.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 ${typography.scale.xs.class} ${colors.bg.surface} ${colors.text.secondary}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className={`${typography.scale.xs.class} ${colors.text.tertiary}`}>
          {formatPosterDate(poster.createdAt)}
        </p>
      </div>
    </article>
  );
}
