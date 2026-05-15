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

    async def get_insights_json(self, financial_data: dict) -> dict:
        if not self.api_key:
            return {"error": "GROQ_API_KEY não configurada."}

        system_prompt = (
            "Você é um Consultor Financeiro Sênior da plataforma FinFlow. "
            "Sua função é analisar exclusivamente os dados financeiros do usuário e retornar um objeto JSON. "
            "Rejeite qualquer pergunta ou assunto fora de finanças pessoais. "
            "\n\n"
            "Regras Inegociáveis de Análise:\n"
            "1. Regra dos 30%: Se (totalIncome - totalExpense) > (totalIncome * 0.3), você DEVE incluir uma sugestão de investimento conservador (ex: Tesouro Direto, CDB) no actionPlan ou insights.\n"
            "2. Categoria Dominante: Identifique a categoria com maior gasto. Se passar de 20% do totalIncome, crie um passo de redução no actionPlan.\n"
            "3. Renda Variável: Se achar apropriado com base no risco, sugira focar em reserva de emergência.\n"
            "4. actionPlan: Deve ter NO MÁXIMO 3 passos pragmáticos para executar esta semana.\n\n"
            "FORMATO DE RESPOSTA OBRIGATÓRIO (JSON STRICT):\n"
            "{\n"
            "  \"rating\": \"Saudável\" | \"Alerta\" | \"Crítico\",\n"
            "  \"insights\": [\"insight 1\", \"insight 2\"],\n"
            "  \"actionPlan\": [\"ação 1\", \"ação 2\", \"ação 3\"],\n"
            "  \"chartData\": [{\"label\": \"Nome Categoria\", \"value\": 150}]\n"
            "}\n"
            "O chartData deve resumir as principais despesas proporcionalmente para facilitar a visualização."
        )

        user_prompt = f"### USER DATA START ###\n{json.dumps(financial_data, indent=2)}\n### USER DATA END ###\nAnalise os dados e retorne o JSON estruturado."

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
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, headers=headers, json=payload, timeout=60.0)
                if response.status_code != 200:
                    return {"error": f"Erro na API do Groq: {response.status_code}"}
                
                res_data = response.json()
                content = res_data["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                return {"error": f"Erro na conexão com AI: {str(e)}"}

    async def stream_ask(self, question: str, financial_context: dict) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "Erro: GROQ_API_KEY não configurada."
            return

        system_prompt = (
            "Você é um Consultor Financeiro Sênior do FinFlow.\n"
            "Analise a pergunta do usuário baseando-se estritamente nos dados financeiros fornecidos abaixo.\n"
            "Seja conciso, direto e profissional. Rejeite qualquer assunto extra-financeiro.\n\n"
            f"DADOS DO USUÁRIO (ÚLTIMOS 30 DIAS):\n{json.dumps(financial_context, indent=2)}"
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
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
