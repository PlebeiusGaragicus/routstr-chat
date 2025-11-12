export default function Offline() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "#181818",
        color: "white",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Offline
        </h1>
        <p style={{ opacity: 0.8 }}>
          You’re offline. Some features may be unavailable. We’ll reconnect as soon as
          you’re back online.
        </p>
      </div>
    </main>
  );
}