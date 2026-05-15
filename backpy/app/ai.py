import httpx
import json
import os
from typing import AsyncGenerator

class AiService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = "llama-3.3-70b-versatile"
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def stream_insights(self, transactions_data: str) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "Erro: GROQ_API_KEY não configurada."
            return

        system_prompt = (
            "Você é um consultor financeiro sênior da FinFlow. "
            "Sua tarefa é analisar as transações do usuário e fornecer insights acionáveis, "
            "curtos e motivadores. Identifique padrões de gastos, sugira economias e dê um feedback geral."
        )
        
        user_prompt = f"Aqui estão minhas transações recentes:\n{transactions_data}\n\nPor favor, analise-as e me dê dicas."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "stream": True,
            "temperature": 0.3,
        }

        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", self.base_url, headers=headers, json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        yield f"Erro na API do Groq: {response.status_code}"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            clean_line = line[6:].strip()
                            if clean_line == "[DONE]":
                                break
                            
                            try:
                                data = json.loads(clean_line)
                                content = data["choices"][0]["delta"].get("content", "")
                                if content:
                                    yield content
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                yield f"Erro na conexão com AI: {str(e)}"
