import { AiProvider, StreamParams } from "../AiProvider";

export class GroqProvider implements AiProvider {
  name = "Groq";

  async streamChat({ systemPrompt, userPrompt, onChunk, onComplete, onError }: StreamParams): Promise<void> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY não configurada.");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: true,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Groq API: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Não foi possível iniciar o reader do stream.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.replace(/^data: /, "").trim();
          if (cleanLine === "" || cleanLine === "[DONE]") continue;

          try {
            const parsed = JSON.parse(cleanLine);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignora linhas incompletas de JSON
          }
        }
      }

      onComplete();
    } catch (error) {
      onError(error);
    }
  }
}
