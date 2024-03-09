import { db } from "@/lib/db";
import { AccountParamsProps } from "@/types/Account";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: AccountParamsProps) {
  const account = await db.account.findUnique({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: any, { params }: AccountParamsProps) {
  const data = await request.json();
  await db.account.update({
    where: {
      id: params.id,
    },
    data: data,
  });

  return NextResponse.json("Updating Account " + params.id);
}

export async function DELETE(request: any, { params }: AccountParamsProps) {
  try {
    const accountDeleted = await db.account.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(accountDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
