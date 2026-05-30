import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/orgs/first`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ orgId: null, orgName: null }, { status: 200 });
    }
    const data = (await res.json()) as { id: string; name: string };
    return NextResponse.json({ orgId: data.id, orgName: data.name });
  } catch {
    return NextResponse.json({ orgId: null, orgName: null }, { status: 200 });
  }
}
