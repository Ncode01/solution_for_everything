import React from 'react';

interface LiveCockpitProps {
  header: React.ReactNode;
  problems: React.ReactNode;
  timeline: React.ReactNode;
  checklist: React.ReactNode;
  rail?: React.ReactNode;
}

export default function LiveCockpit({
  header,
  problems,
  timeline,
  checklist,
  rail,
}: LiveCockpitProps) {
  return (
    <div className="space-y-4">
      <div className="solid-panel sticky top-2 z-20 rounded-[var(--radius-xl)] p-4">{header}</div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          {problems}
          {checklist}
        </div>
        <div className="space-y-4">
          {timeline}
          {rail}
        </div>
      </div>
    </div>
  );
}
