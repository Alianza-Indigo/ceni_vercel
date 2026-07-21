import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ calmMode: z.boolean() });

/** Persists the calm-mode preference on the user profile (if logged in). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    // Anonymous visitors keep the preference in localStorage only.
    return NextResponse.json({ saved: false });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { calmMode: parsed.data.calmMode },
  });
  return NextResponse.json({ saved: true });
}
