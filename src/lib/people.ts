import type { Member, User } from '../types';

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function isSameMember(member: Member, user: Pick<User, 'displayName' | 'username' | 'id'>): boolean {
  return Boolean(
    (member.authUserId && member.authUserId === user.id) ||
    (member.username && normalize(member.username) === normalize(user.username)) ||
    normalize(member.displayName) === normalize(user.displayName) ||
    normalize(member.name) === normalize(user.displayName)
  );
}

export function memberMatchesPersonField(member: Member | null | undefined, id?: string, displayName?: string): boolean {
  if (!member) return false;
  if (id && member.id === id) return true;
  if (!id && displayName) {
    const target = normalize(displayName);
    return normalize(member.displayName) === target || normalize(member.name) === target;
  }
  return false;
}

export function resolveMemberForUser(
  user: Pick<User, 'displayName' | 'username' | 'id'> | null | undefined,
  members: Member[],
): Member | null {
  if (!user) return null;

  return (
    members.find((member) => member.authUserId === user.id) ??
    members.find((member) => normalize(member.username) === normalize(user.username)) ??
    members.find((member) => normalize(member.displayName) === normalize(user.displayName)) ??
    members.find((member) => normalize(member.name) === normalize(user.displayName)) ??
    null
  );
}

export function roleToUserRole(role?: string): User['role'] {
  const normalized = normalize(role);
  if (normalized.includes('chairman') || normalized.includes('president') || normalized.includes('admin')) {
    return 'Super Admin';
  }
  if (normalized.includes('secretary')) return 'Executive Admin';
  if (normalized.includes('lead') || normalized.includes('co-chair')) return 'Team Lead';
  return 'Member';
}
