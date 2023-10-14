import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

type Props = {
  params: {
    id: number;
  };
};

export async function GET(request: any, { params }: Props) {
  const account = await prisma.account.findUnique({
    where: {
      id: Number(params.id),
    },
  });

  return NextResponse.json(account);
}

export async function PUT(request: any, { params }: Props) {
  const data = await request.json();
  await prisma.account.update({
    where: {
      id: Number(params.id),
    },
    data: data,
  });

  return NextResponse.json("Updating Account " + params.id);
}

export async function DELETE(request: any, { params }: Props) {
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
