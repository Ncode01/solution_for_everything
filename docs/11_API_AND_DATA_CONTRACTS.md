# Local Data Contracts

There is no network API in Phase Two. "Contracts" here are the in-app interfaces between components, the `useAppData()` context, and localStorage.

## useAppData() (src/state/AppDataContext.tsx)

Exposes the full `AppData` plus CRUD helpers. Every write persists to localStorage immediately.

```
data: AppData   // projects, members, meetings, sponsors, budgets,
                // transactions, approvals, fileLinks, reports

saveProject(p)      deleteProject(id)
saveMember(m)       deleteMember(id)
saveMeeting(m)      deleteMeeting(id)
saveSponsor(s)      deleteSponsor(id)
saveBudget(b)       deleteBudget(id)
saveTransaction(t)  deleteTransaction(id)
saveApproval(a)     deleteApproval(id)
saveFileLink(f)     deleteFileLink(id)
saveReport(r)       deleteReport(id)
replaceAll(data)    // used by import
resetData()         // restore seed
```

`saveX` performs upsert by `id` (create if new, replace if existing).

## Form Payloads

Each form builds a full record object matching the type in `src/types/index.ts` and calls the matching `saveX`. New records generate an `id` (e.g. `crypto.randomUUID()`), set timestamps where the type requires them (`createdAt`, `submittedDate`, `generatedDate`), and default optional fields to empty.

## Storage Contract (src/lib/storage.ts)

```
loadAppData(): AppData            // reads all keys; seeds on first run
saveAppData(data): void           // writes all keys + rccs_last_saved
getLastSaved(): string | null
exportData(): string              // JSON string of AppData
parseImportedData(json): AppData  // validates; throws on invalid
importData(json): AppData         // parse + persist
resetToSeedData(): AppData
```

Import validation: parsed JSON must be an object; each known collection must be an array (missing ones default to `[]`). Anything else throws, and the UI shows an error rather than crashing.

## Search / Attention Contracts

- `globalSearch(data, query, limit)` → `SearchResult[]` `{ type, id, title, subtitle, route }`
- `buildAttention(data)` → `AttentionGroup[]` `{ key, label, items[] }`; `countAttention(groups)` → number for the topbar badge.
