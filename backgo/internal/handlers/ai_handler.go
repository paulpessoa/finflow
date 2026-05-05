package handlers

import (
	"bufio"
	"encoding/json"
	"finflow-backgo/internal/repository"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AIHandler struct {
	transactionRepo *repository.TransactionRepository
}

func NewAIHandler(transactionRepo *repository.TransactionRepository) *AIHandler {
	return &AIHandler{transactionRepo: transactionRepo}
}

type AIResponse struct {
	Rating     string         `json:"rating"`
	Insights   []string       `json:"insights"`
	ActionPlan []string       `json:"actionPlan"`
	ChartData  []AIChartData  `json:"chartData"`
}

type AIChartData struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

func (h *AIHandler) GetInsights(c *gin.Context) {
	userId := c.GetString("userId")
	groqApiKey := os.Getenv("GROQ_API_KEY")
	if groqApiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Serviço de IA não configurado"})
		return
	}

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	summary, err := h.transactionRepo.GetSummary(userId, &thirtyDaysAgo, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar dados financeiros"})
		return
	}

	if summary.Income == 0 && summary.Expense == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transações insuficientes para análise"})
		return
	}

	financialContext := map[string]interface{}{
		"totalIncome":  summary.Income,
		"totalExpense": summary.Expense,
		"balance":      summary.Income - summary.Expense,
		"byCategory":   summary.ByCategory,
	}

	systemPrompt := `Você é um Consultor Financeiro Sênior da plataforma FinFlow. 
Analise exclusivamente os dados financeiros do usuário e retorne um objeto JSON.
FORMATO OBRIGATÓRIO (JSON):
{
  "rating": "Saudável" | "Alerta" | "Crítico",
  "insights": ["string"],
  "actionPlan": ["string"],
  "chartData": [{"label": "string", "value": number}]
}`

	userPrompt := fmt.Sprintf("Dados dos últimos 30 dias:\n%v\nRetorne apenas o JSON.", financialContext)

	payload := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"response_format": map[string]string{"type": "json_object"},
		"temperature":     0.2,
	}

	jsonPayload, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", strings.NewReader(string(jsonPayload)))
	req.Header.Set("Authorization", "Bearer "+groqApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA indisponível"})
		return
	}
	defer resp.Body.Close()

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar resposta da IA"})
		return
	}

	var aiResult AIResponse
	if err := json.Unmarshal([]byte(groqResp.Choices[0].Message.Content), &aiResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "IA retornou formato inválido"})
		return
	}

	c.JSON(http.StatusOK, aiResult)
}

func (h *AIHandler) AskStreaming(c *gin.Context) {
	userId := c.GetString("userId")
	groqApiKey := os.Getenv("GROQ_API_KEY")

	var reqBody struct {
		Question string `json:"question"`
	}
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pergunta é obrigatória"})
		return
	}

	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	summary, _ := h.transactionRepo.GetSummary(userId, &thirtyDaysAgo, nil)
	financialContext := fmt.Sprintf("Renda: %.2f, Gasto: %.2f, Saldo: %.2f", summary.Income, summary.Expense, summary.Income-summary.Expense)

	payload := map[string]interface{}{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{"role": "system", "content": "Você é um Consultor Financeiro. Responda com base no contexto: " + financialContext},
			{"role": "user", "content": reqBody.Question},
		},
		"stream":      true,
		"temperature": 0.3,
	}

	jsonPayload, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", strings.NewReader(string(jsonPayload)))
	req.Header.Set("Authorization", "Bearer "+groqApiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "IA indisponível"})
		return
	}
	defer resp.Body.Close()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" || line == "data: [DONE]" {
			continue
		}

		if strings.HasPrefix(line, "data: ") {
			jsonData := strings.TrimPrefix(line, "data: ")
			var chunk struct {
				Choices []struct {
					Delta struct {
						Content string `json:"content"`
					} `json:"delta"`
				} `json:"choices"`
			}
			if err := json.Unmarshal([]byte(jsonData), &chunk); err == nil {
				if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
					c.Writer.WriteString(chunk.Choices[0].Delta.Content)
					c.Writer.Flush()
				}
			}
		}
	}
}
