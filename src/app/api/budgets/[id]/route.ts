import { prisma } from "@/libs/prisma";
import { NextResponse } from "next/server";

type Props = {
  params: {
    id: number;
  };
};

export async function GET(request: any, { params }: Props) {
  const budget = await prisma.budget.findUnique({
    where: {
      id: Number(params.id),
    },
  });

  return NextResponse.json(budget);
}

export async function PUT(request: any, { params }: Props) {
  const data = await request.json();
  await prisma.budget.update({
    where: {
      id: Number(params.id),
    },
    data: data,
  });

  return NextResponse.json("Updating Budget " + params.id);
}

export async function DELETE(request: any, { params }: Props) {
  try {
    const budgetDeleted = await prisma.budget.delete({
      where: {
        id: Number(params.id),
      },
    });

    return NextResponse.json(budgetDeleted);
  } catch (error: any) {
    return NextResponse.json(error.message);
  }
}
