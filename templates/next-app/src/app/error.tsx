"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main role="alert">
      <h1>Something went wrong</h1>
      <button onClick={() => reset()}>Try again</button>
    </main>
  );
}
