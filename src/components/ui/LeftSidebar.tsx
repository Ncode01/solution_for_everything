"use client";

import { Bookmark, Settings } from "lucide-react";
import type { ProjectAccentColor } from "@/types";

const PROJECTS: Array<{
  id: string;
  name: string;
  color: ProjectAccentColor;
  active?: boolean;
}> = [
  { id: "1", name: "Annual Hackathon", color: "coral", active: true },
  { id: "2", name: "Platform Migration", color: "amber" },
  { id: "3", name: "Design System v2", color: "violet" },
  { id: "4", name: "API Gateway", color: "sky" },
];

const PEOPLE: Array<{
  id: string;
  name: string;
  initials: string;
  loadColor: string;
}> = [
  { id: "1", name: "Alex K.", initials: "AK", loadColor: "bg-mint" },
  { id: "2", name: "Jordan M.", initials: "JM", loadColor: "bg-amber" },
  { id: "3", name: "Riley T.", initials: "RT", loadColor: "bg-destructive" },
];

const BOOKMARKS = [
  { id: "1", name: "Org Overview" },
  { id: "2", name: "Sprint Board" },
];

const accentDot: Record<ProjectAccentColor, string> = {
  coral: "bg-coral",
  amber: "bg-amber",
  violet: "bg-violet",
  sky: "bg-sky",
  mint: "bg-mint",
};

export function LeftSidebar() {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/5 bg-surface-container py-3">
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        <section>
          <h2 className="text-section-header mb-2 px-3 text-on-surface-variant">
            PROJECTS
          </h2>
          <ul>
            {PROJECTS.map((project) => {
              const isActive = project.active;
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    className={
                      isActive
                        ? "text-body-sm mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary"
                        : "text-body-sm mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-on-surface-variant hover:bg-white/5"
                    }
                  >
                    {isActive && (
                      <span
                        className="h-4 w-1 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                    {!isActive && <span className="w-1 shrink-0" aria-hidden />}
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${accentDot[project.color]}`}
                    />
                    <span className="truncate">{project.name}</span>
                    {isActive && (
                      <span className="text-section-header ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        Active
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className="text-section-header mb-2 px-3 text-on-surface-variant">
            PEOPLE
          </h2>
          <ul>
            {PEOPLE.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  className="text-body-sm flex w-full items-center gap-3 px-3 py-2 text-on-surface hover:bg-white/5"
                >
                  <span className="text-body-sm flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-medium text-on-surface">
                    {person.initials}
                  </span>
                  <span className="truncate">{person.name}</span>
                  <span
                    className={`ml-auto h-2 w-2 shrink-0 rounded-full ${person.loadColor}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className="text-section-header mb-2 px-3 text-on-surface-variant">
            CANVAS BOOKMARKS
          </h2>
          <ul>
            {BOOKMARKS.map((bookmark) => (
              <li key={bookmark.id}>
                <button
                  type="button"
                  className="text-body-sm flex w-full items-center gap-2 px-3 py-2 text-on-surface-variant hover:bg-white/5"
                >
                  <Bookmark size={14} className="shrink-0" />
                  <span className="truncate">{bookmark.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-auto border-t border-white/5 px-3 pt-3">
        <button
          type="button"
          className="text-body-sm flex w-full items-center gap-3 py-2"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-body-sm font-bold text-on-tertiary-container">
            SL
          </span>
          <span className="text-on-surface">Sarah L.</span>
          <Settings
            size={14}
            className="ml-auto text-on-surface-variant"
          />
        </button>
      </div>
    </aside>
  );
}
