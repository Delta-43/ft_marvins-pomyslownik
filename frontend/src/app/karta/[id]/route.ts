import { NextResponse } from "next/server";

/** Old card address: the card now opens in place on the results screen. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.redirect(new URL(`/wyniki?karta=${encodeURIComponent(id)}`, request.url));
}
