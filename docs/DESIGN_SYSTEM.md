# FlowCanvas Design System

## Source of Truth
The Stitch-generated HTML files in `/stitch-reference/` are the visual source of truth.
The Tailwind config in `tailwind.config.ts` is the code source of truth.
When they conflict, Tailwind config wins.

## Tailwind Config
Colors are defined in `tailwind.config.ts` via the `namedColors` object. Key tokens:

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-container-lowest` | `#0e0e0d` | Canvas background |
| `surface-container-low` | `#1b1c1a` | Deepest inset areas |
| `surface-container` | `#1f201e` | Sidebars, app shell |
| `surface-container-high` | `#2a2a29` | Cards, task nodes |
| `surface-container-highest` | `#353533` | Modals, command palette |
| `on-surface` | `#e5e2df` | Primary text |
| `on-surface-variant` | `#bec8ca` | Secondary text |
| `primary` | `#8ad2de` | Teal accent (dark mode) |
| `on-primary` | `#00363d` | Text on teal buttons |
| `outline` | `#899294` | Muted labels, metadata |
| `outline-variant` | `#3f484a` | Dividers |

### Project Accent Palette
Assign exactly one per project — never mix on a single card:

| Name | Hex | Tailwind usage |
|------|-----|----------------|
| Coral | `#E05C5C` | Project header tint, cluster label |
| Amber | `#E8AF34` | Blocked status, critical path |
| Violet | `#A86FDF` | In Review status |
| Sky Blue | `#5591C7` | Secondary project accent |
| Mint | `#6DAA45` | Done status |

## Typography Tokens

| Class | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `text-section-header` | 11px | 600 | Geist | Uppercase section labels, 0.08em tracking |
| `text-mono-label` | 12px | 400 | JetBrains Mono | IDs, effort, timestamps |
| `text-body-sm` | 13px | 400 | Geist | Secondary body, captions |
| `text-body-md` | 14px | 400 | Geist | Primary body, task titles |
| `text-headline-sm` | 18px | 500 | Geist | Panel titles (task detail) |
| `text-display-lg` | 32px | 600 | Geist | Dashboard KPI numbers, -0.02em tracking |

**Font loading:** Geist Sans for UI; JetBrains Mono for `font-mono-label` only. Do not use Geist Mono.

## Layout Constants

| Element | Dimension |
|---------|-----------|
| Top bar | `h-12` (48px) |
| Left sidebar | `w-[260px]` fixed |
| Right task panel | `w-[360px]` fixed, hidden by default |
| Compact list row | `h-8` (32px) |
| Status dot | `w-2 h-2` (8px) |
| Grid spacing | 4px base — use Tailwind `p-1` through `p-10` only |

## Component Patterns

### Task Card (Canvas — Z2+)
- Background: `bg-surface-container-high`
- Border: `border border-white/[0.08]`
- Radius: `rounded-xl`
- Status: box-shadow glow OR `border-t-2` accent — **never** `border-l-*` / `border-r-*`
- In progress glow: `shadow-[0_0_0_1px_rgba(79,152,163,0.4)]`

### Sidebar Nav (Active Item)
- **Correct:** `bg-primary/10` + left pill indicator (`w-1 rounded-full bg-primary`)
- **Wrong (Stitch):** `border-r-2 border-primary`

### Buttons
- Primary: `bg-primary text-on-primary rounded-lg px-4 py-2 text-body-sm font-medium`
- Ghost: `border border-white/10 text-on-surface-variant hover:bg-white/5 rounded-lg`
- Destructive: `border border-[#DD6974]/40 text-[#DD6974] hover:bg-[#DD6974]/10 rounded-lg`

### Load Ring (Workload)
SVG `<circle>` with `strokeDasharray` — not CSS `border-*` tricks:
- Green: load &lt; 60%
- Amber: 60–80%
- Red: &gt; 80% with `animate-pulse`

## Canvas Background
Dot grid applied to canvas container only:
```css
background-color: #0E0D0C;
background-image: radial-gradient(circle, rgba(205,204,202,0.04) 1px, transparent 1px);
background-size: 24px 24px;
```

## Icons
**Lucide React only.** Map common Stitch Material Symbol names:

| Stitch / Material | Lucide |
|-------------------|--------|
| search | `Search` |
| add | `Plus` |
| close | `X` |
| chevron_right | `ChevronRight` |
| person | `User` |
| link | `Link2` |
| warning | `AlertTriangle` |
| check_circle | `CheckCircle2` |

## Stitch Deviations to Fix in Code
1. Material Symbols → Lucide React everywhere
2. `border-r-2 border-primary` on active nav → `bg-primary/10` + left pill
3. `backdrop-filter: blur()` on canvas nodes → remove entirely
4. Build Sprint Z2 sidebar → revert to App Shell (S1) sidebar layout
5. Inline hex in `style={{}}` → Tailwind token classes
6. JetBrains Mono confirmed for labels — not Geist Mono

## Reference Screen
Design System Preview (Stitch ID: `f9dd1b75fea74388b3d0dab298364ba3`) — color swatches and type specimen only; do not copy component structure verbatim.
