# Stitch HTML Reference

Place all 11 exported HTML screens from Google Stitch here.

**Stitch Project:** FlowCanvas Spatial Task Engine  
**Project ID:** `12965505653231340695`

## Expected files

| File | Screen | Stitch ID |
|------|--------|-----------|
| `S1-app-shell.html` | App Shell | `f3902dd11e7742608aa2ccb49e506928` |
| `S2-design-system.html` | Design System | `f9dd1b75fea74388b3d0dab298364ba3` |
| `S3-org-overview-z0.html` | Org Overview Z0 | `bbdb07f9dd094322ace6c866a5c88c72` |
| `S4-annual-hackathon-z1.html` | Annual Hackathon Z1 | `e02fee94e21f4c87992c63c205a9536c` |
| `S5-build-sprint-z2.html` | Build Sprint Z2 | `6750383872354b3099646bf16118d7df` |
| `S6-task-detail-v1.html` | Task Detail v1 | `43869487e31f4e17895bc3bc23013b7e` |
| `S7-blocking-chain.html` | Blocking Chain | `d7a77f62f54b4a72afae4e8f46f0c280` |
| `S8-workload-heatmap.html` | Workload Heatmap | `6bd837ddccd144f38d0917d7466ea2fb` |
| `S9-dashboard.html` | Dashboard | `810111cb912f49e79633edffdff434d4` |
| `S10-command-palette.html` | Command Palette | `1d94aa9d22634a31be6b7a135b2d6f3d` |
| `S11-task-detail-v2.html` | Task Detail v2 (preferred) | `f98abd8088e946eaa4db7279798c580e` |

## Usage rules

1. **Extract structure and spacing** — not verbatim class soup
2. **Replace** Material Symbols → Lucide React
3. **Do not copy** Z2 sidebar from S5 — use S1 shell
4. **Remove** `backdrop-filter` from any node markup
5. **Convert** inline hex → Tailwind tokens from `tailwind.config.ts`

Add at top of each HTML file:
```html
<!-- Stitch Screen: S5 Build Sprint Z2 | ID: 6750383872354b3099646bf16118d7df -->
```
