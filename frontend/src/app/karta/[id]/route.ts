import { redirectTo } from "@/lib/redirect";

/** Old card address: the card now opens in place on the results screen. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return redirectTo(`/wyniki?karta=${encodeURIComponent(id)}`);
}
