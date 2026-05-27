import { randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "./client";
import { inviteTokens, users } from "./schema";

const INVITE_TTL_DAYS = 7;

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

export async function createInviteRecord(input: {
  orgId: string;
  email: string;
  role?: string;
  createdBy?: string | null;
}) {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const [row] = await db
    .insert(inviteTokens)
    .values({
      orgId: input.orgId,
      email: input.email.toLowerCase().trim(),
      token,
      role: input.role ?? "member",
      createdBy: input.createdBy ?? null,
      expiresAt,
    })
    .returning();

  return row;
}

export async function getInviteByToken(token: string) {
  const [row] = await db
    .select()
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token));
  return row ?? null;
}

export function isInviteValid(invite: {
  acceptedAt: Date | null;
  expiresAt: Date;
}): boolean {
  if (invite.acceptedAt) return false;
  return invite.expiresAt.getTime() > Date.now();
}

export async function acceptInviteRecord(
  token: string,
  authUserId: string,
  name: string,
) {
  const invite = await getInviteByToken(token);
  if (!invite || !isInviteValid(invite)) {
    return null;
  }

  const normalizedEmail = invite.email.toLowerCase().trim();
  const displayName = name.trim() || normalizedEmail.split("@")[0] || "Member";
  const initials = initialsFromName(displayName);

  const existingByAuth = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId));
  if (existingByAuth[0] && existingByAuth[0].orgId !== invite.orgId) {
    throw new Error("Auth user already linked to another organization");
  }

  const existingByEmail = await db
    .select()
    .from(users)
    .where(
      and(eq(users.orgId, invite.orgId), eq(users.email, normalizedEmail)),
    );

  let domainUser = existingByEmail[0];

  if (domainUser) {
    const [updated] = await db
      .update(users)
      .set({
        authUserId,
        name: displayName,
        initials,
        role: invite.role,
      })
      .where(eq(users.id, domainUser.id))
      .returning();
    domainUser = updated ?? domainUser;
  } else {
    const [created] = await db
      .insert(users)
      .values({
        orgId: invite.orgId,
        email: normalizedEmail,
        name: displayName,
        initials,
        role: invite.role,
        authUserId,
      })
      .returning();
    domainUser = created;
  }

  await db
    .update(inviteTokens)
    .set({ acceptedAt: new Date() })
    .where(eq(inviteTokens.id, invite.id));

  return domainUser;
}

export async function getDomainUserByAuthUserId(authUserId: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUserId));
  return row ?? null;
}

export async function getPendingInvitesForOrg(orgId: string) {
  return db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.orgId, orgId),
        isNull(inviteTokens.acceptedAt),
        gt(inviteTokens.expiresAt, new Date()),
      ),
    );
}
