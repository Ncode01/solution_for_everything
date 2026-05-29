"use client";

import { colors, typography } from "@/design-system";

export function SchoolsView() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <p className={`${typography.scale.md.class} ${colors.text.primary}`}>
        Network schools view — database schema coming in a future migration.
      </p>
      <p className={`${typography.scale.sm.class} ${colors.text.secondary} max-w-md text-center`}>
        Schools, mentors, and resource packages will appear here once the
        network_schools tables are added.
      </p>
    </div>
  );
}
