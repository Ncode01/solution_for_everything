# FlowCanvas API Contracts

**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

**Auth:** Mutations require Better Auth session cookie (`credentials: "include"`). Unauthenticated requests return `401 { "error": "Unauthorized" }`.

Types: `src/lib/api/types.ts` · Client: `src/lib/api/client.ts`

---

## Position endpoints

### `PATCH /api/orgs/:orgId/projects/:projectId/position`

**Auth:** Required

**Body:**

```json
{ "canvasX": 1200, "canvasY": 400 }
```

**Response `200`:**

```json
{ "id": "uuid", "canvasX": 1200, "canvasY": 400 }
```

**Errors:** `400` missing coordinates · `404` project not found

---

### `PATCH /api/orgs/:orgId/milestones/:milestoneId/position`

**Auth:** Required

**Body:**

```json
{ "canvasX": 800, "canvasY": 300 }
```

**Response `200`:**

```json
{ "id": "uuid", "canvasX": 800, "canvasY": 300 }
```

**Errors:** `400` missing coordinates · `404` milestone not found

---

## Project metadata

### `PATCH /api/orgs/:orgId/projects/:projectId`

**Auth:** Required

**Body (all optional):**

```json
{
  "name": "Annual Hackathon",
  "color": "coral",
  "status": "active",
  "projectType": "hackathon",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "isCollaborative": true,
  "canvasX": 100,
  "canvasY": 100
}
```

**Status values:** `planning` | `active` | `on_hold` | `completed` | `archived`

**Response `200`:** Full project row

**Errors:** `404` project not found

---

## Milestones

### `POST /api/orgs/:orgId/projects/:projectId/milestones`

**Auth:** Required

**Body:**

```json
{
  "title": "Registration opens",
  "date": "2026-03-01",
  "isHardDeadline": true,
  "description": null
}
```

**Response `201`:** Milestone with `daysUntil`

---

### `DELETE /api/orgs/:orgId/milestones/:milestoneId`

**Auth:** Required

**Response `200`:** Deleted milestone row

**Errors:** `404` not found

---

## Budget

### `POST /api/orgs/:orgId/projects/:projectId/budget`

**Auth:** Required

**Body:**

```json
{
  "label": "Sponsor grant",
  "type": "income",
  "amount": 500000,
  "confirmed": true
}
```

**Response `201`:** Budget entry row

---

### `DELETE /api/orgs/:orgId/budget-entries/:entryId`

**Auth:** Required

**Response `200`:** Deleted entry row

**Errors:** `404` not found

---

## Partner organisations

### `POST /api/orgs/:orgId/project-orgs`

**Auth:** Required

**Body:**

```json
{
  "projectId": "uuid",
  "orgName": "Partner University",
  "orgRole": "co-organizer"
}
```

**Response `201`:** `{ id, projectId, orgName, orgRole }`

---

### `DELETE /api/orgs/:orgId/project-orgs/:id`

**Auth:** Required

**Response `200`:** Deleted partner row

---

## Users & org roles

### `PATCH /api/orgs/:orgId/users/:userId`

**Auth:** Required

**Body:**

```json
{ "name": "Jane Doe", "role": "Lead organizer" }
```

**Response `200`:** Updated user row (initials recomputed from name)

---

### `POST /api/orgs/:orgId/org-roles`

**Auth:** Required

**Body:**

```json
{
  "userId": "uuid",
  "title": "Secretary",
  "rank": 2,
  "isTeacherInCharge": false
}
```

**Response `201`:** Org role row

**Errors:** `422` rank out of range (1–99) · `404` user not found

---

### `DELETE /api/orgs/:orgId/org-roles/:id`

**Auth:** Required

**Response `200`:** Deleted role row

---

## Related

- [API.md](./API.md) — full REST reference including tasks and viewport
- [ARCHITECTURE.md](./ARCHITECTURE.md) — client mutation and cache patterns
