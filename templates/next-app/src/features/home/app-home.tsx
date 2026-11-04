export function AppHome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header>
        <p className="text-sm text-default-500">Frigiverse</p>
        <h1 className="text-3xl font-semibold">__APP_DISPLAY_NAME__</h1>
      </header>

      <section aria-labelledby="welcome-heading">
        <h2 id="welcome-heading" className="text-xl font-medium">
          Welcome
        </h2>
        <p>This is the starting point for __APP_DISPLAY_NAME__.</p>
      </section>
    </main>
  );
}
