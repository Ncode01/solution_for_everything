import { and, eq } from "drizzle-orm";
import { db } from "./client";
import { canvasPositions } from "./schema";

export async function getViewport(orgId: string, authUserId: string) {
  const rows = await db
    .select()
    .from(canvasPositions)
    .where(
      and(
        eq(canvasPositions.orgId, orgId),
        eq(canvasPositions.authUserId, authUserId),
      ),
    );
  return rows[0] ?? null;
}

export async function upsertViewport(
  orgId: string,
  authUserId: string,
  viewport: { viewportX: number; viewportY: number; viewportZoom: number },
) {
  const existing = await getViewport(orgId, authUserId);

  if (existing) {
    const [row] = await db
      .update(canvasPositions)
      .set({
        viewportX: viewport.viewportX,
        viewportY: viewport.viewportY,
        viewportZoom: viewport.viewportZoom,
        updatedAt: new Date(),
      })
      .where(eq(canvasPositions.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(canvasPositions)
    .values({
      orgId,
      authUserId,
      viewportX: viewport.viewportX,
      viewportY: viewport.viewportY,
      viewportZoom: viewport.viewportZoom,
    })
    .returning();
  return row;
}
