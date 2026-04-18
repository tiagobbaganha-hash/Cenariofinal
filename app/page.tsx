import { supabase } from "@/lib/supabaseClient";

export default async function Page() {
  const { data, error } = await supabase
    .from("v_front_markets_v3")
    .select("id,title,category,status_text,closes_at,options_count")
    .eq("status_text", "open")
    .order("featured", { ascending: false })
    .order("closes_at", { ascending: true });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Erro</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Mercados abertos</h1>
      <ul>
        {(data ?? []).map((m) => (
          <li key={m.id} style={{ marginBottom: 12 }}>
            <b>{m.title}</b> — {m.category} — fecha em {String(m.closes_at)} — opções:{" "}
            {m.options_count}
          </li>
        ))}
      </ul>
    </main>
  );
}