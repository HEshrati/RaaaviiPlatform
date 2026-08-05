/**
 * Streaming AI — از طریق Next.js proxy
 */

export async function streamAI(
  prompt: string,
  onChunk: (text: string) => void,
  onDone?: () => void,
  options?: { model?: string; maxTokens?: number }
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resp = await fetch("/api/ai", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options?.model || "gpt-4o",
      max_tokens: options?.maxTokens || 2000,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === "[DONE]") { onDone?.(); return; }
      try {
        const json = JSON.parse(data);
        const text = json.choices?.[0]?.delta?.content || "";
        if (text) onChunk(text);
      } catch {}
    }
  }
  onDone?.();
}
