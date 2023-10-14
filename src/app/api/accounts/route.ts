import { NextResponse } from "next/server";

// with Response
export function GET() {
  return new Response("GET works!");
}

// with NextResponse
export function POST() {
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
