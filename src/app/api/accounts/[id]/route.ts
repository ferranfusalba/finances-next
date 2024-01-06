import { prisma } from "@/libs/prisma";
import { AccountParamsProps } from "@/types/Account";
import { NextResponse } from "next/server";

export async function GET(request: any, { params }: AccountParamsProps) {
  const account = await prisma.account.findUnique({
    where: {
      code: params.code,
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: any, { params }: AccountParamsProps) {
  const data = await request.json();
  await prisma.account.update({
    where: {
      id: Number(params.id),
    },
    data: data,
  });

  return NextResponse.json("Updating Account " + params.id);
}

export async function DELETE(request: any, { params }: AccountParamsProps) {
  try {
    const accountDeleted = await prisma.account.delete({
      where: {
        id: Number(params.id),
      },
    });

    return NextResponse.json(accountDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
