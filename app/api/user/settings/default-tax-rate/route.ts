import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const rate = parseFloat(data.defaultTaxRate);

  if (isNaN(rate) || rate < 0 || rate > 100) {
    return NextResponse.json(
      { error: "Invalid tax rate" },
      { status: 400 },
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: { defaultTaxRate: rate },
  });

  return NextResponse.json({ defaultTaxRate: rate });
}
