"use client";

/** Last resort: an error in the root layout itself. No dictionary is available here, so the text is Polish and English. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pl">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", background: "#F7F2EB", color: "#141414" }}>
        <h1>Coś poszło nie tak / Something went wrong</h1>
        <p>Spróbuj ponownie. / Please try again.</p>
        {error.digest && <p style={{ fontSize: "0.8rem", color: "#5A544D" }}>ID: {error.digest}</p>}
        <button type="button" onClick={reset} style={{ padding: "0.6rem 1.4rem", borderRadius: 999, background: "#001A49", color: "#fff", border: 0, cursor: "pointer" }}>Spróbuj ponownie / Try again</button>
      </body>
    </html>
  );
}
