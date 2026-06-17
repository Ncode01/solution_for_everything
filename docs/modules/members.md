# Module: Members

## Purpose
Track RCCS members so work isn't dumped on the same 3 people. Shows who is in which committee, their skills, and current workload.

## Screens
- `/members` — list + filters + detail modal

## Data Used
- `members` collection; cross-referenced with project tasks and meeting action items for assigned-work counts.

## Main Actions
- List/search members
- Filter by committee and workload
- Create / edit / delete (with confirm) a member
- View member detail (role, committee, skills, workload, active projects, assigned tasks, action items)

## Member Card Shows
- Name / display name, role, committee
- Workload badge, availability
- Skills, active project count, assigned task count

## Acceptance Criteria
- [x] Members page works
- [x] Create / edit / delete with confirmation
- [x] Filter by committee / workload
- [x] Card/detail show workload and assigned work

## Linked Files
- `src/features/members/MembersPage.tsx`
- `src/features/members/MemberForm.tsx`
- `src/state/AppDataContext.tsx`
