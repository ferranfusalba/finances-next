import { NextResponse } from "next/server";

type Props = {
  params: {
    accountId: string;
  };
};

export function GET(request: any, { params }: Props) {
  return NextResponse.json("Searching Account " + params.accountId);
}
