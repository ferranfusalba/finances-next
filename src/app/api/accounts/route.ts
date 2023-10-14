import { NextResponse } from "next/server";

// with Response
export function GET() {
  return new Response("GET works!");
}

// with NextResponse
export async function POST(request: any) {
  const data = await request.json();
  console.log(data); // Server console

  return NextResponse.json({
    message: "POST works!",
  });
}

export function PUT() {
  return NextResponse.json({
    message: "PUT works!",
  });
}

export function DELETE() {
  return NextResponse.json({
    message: "DELETE works!",
  });
}
