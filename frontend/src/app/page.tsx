import { apiGet } from "@/lib/api";

// Task F0 and F1 replace this page. It shows that the API client works against the mock or the backend.
export default async function Home() {
  let cardCount: number | null = null;
  try {
    const res = await apiGet<{ data: { cardCount: number } }>("/api/v1/stats/overview");
    cardCount = res.data.cardCount;
  } catch {
    cardCount = null;
  }
  return (
    <>
      <h1 className="text-4xl font-bold">Radar Innowacji</h1>
      <p>Innovation Radar. Frontend scaffold.</p>
      <p>{cardCount === null ? "The API is not reachable." : `The API reports ${cardCount} cards.`}</p>
    </>
  );
}
