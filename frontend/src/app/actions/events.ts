"use server";

/** Anonymous usage events (F8, F16). Sent from the web server, fire-and-forget: never blocks a screen, never sends free
 *  text, never stores an ip. The backend adds the role from the session. */
import { randomUUID } from "node:crypto";
import { api } from "@/lib/api";
import { getToken } from "@/lib/session";

type EventType = "search_performed" | "card_viewed" | "compare_opened" | "filter_used";

export async function recordEvent(type: EventType, props: { cardId?: string; area?: string; audience?: string } = {}) {
  const token = await getToken();
  if (!token) return;
  const body = { eventId: randomUUID(), type, occurredAt: new Date().toISOString(), ...props };
  void api("/api/v1/events", { method: "POST", token, body }).catch(() => undefined);
}
