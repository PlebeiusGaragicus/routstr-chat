export default function Offline() {
  return (
    <main className="min-h-dvh grid place-items-center bg-background text-foreground p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-3">Offline</h1>
        <p className="opacity-80">
          You’re offline. Some features may be unavailable. We’ll reconnect as
          soon as you’re back online.
        </p>
      </div>
    </main>
  );
}
