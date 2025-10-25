const base =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : ""; // change to your domain when you deploy

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
