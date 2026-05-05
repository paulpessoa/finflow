package handlers

import (
	"finflow-backgo/internal/models"
	"finflow-backgo/internal/repository"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	repo *repository.TransactionRepository
}

func NewTransactionHandler(repo *repository.TransactionRepository) *TransactionHandler {
	return &TransactionHandler{repo: repo}
}

func (h *TransactionHandler) List(c *gin.Context) {
	userId := c.GetString("userId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	tType := c.Query("type")
	catId := c.Query("categoryId")
	fromStr := c.Query("from")
	toStr := c.Query("to")

	params := repository.ListParams{
		UserID:     userId,
		Page:       page,
		Limit:      limit,
		Type:       tType,
		CategoryID: catId,
	}

	if fromStr != "" {
		if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
			params.From = &t
		} else if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			params.From = &t
		}
	}
	if toStr != "" {
		if t, err := time.Parse(time.RFC3339, toStr); err == nil {
			params.To = &t
		} else if t, err := time.Parse("2006-01-02", toStr); err == nil {
			params.To = &t
		}
	}

	transactions, total, err := h.repo.List(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar transações"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": transactions,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

func (h *TransactionHandler) Summary(c *gin.Context) {
	userId := c.GetString("userId")
	fromStr := c.Query("from")
	toStr := c.Query("to")

	var from, to *time.Time
	if fromStr != "" {
		if t, err := time.Parse(time.RFC3339, fromStr); err == nil {
			from = &t
		} else if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = &t
		}
	}
	if toStr != "" {
		if t, err := time.Parse(time.RFC3339, toStr); err == nil {
			to = &t
		} else if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = &t
		}
	}

	summary, err := h.repo.GetSummary(userId, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar resumo"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"income":     summary.Income,
		"expense":    summary.Expense,
		"balance":    summary.Income - summary.Expense,
		"byCategory": summary.ByCategory,
	})
}

type createTransactionRequest struct {
	Description string  `json:"description" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	Type        string  `json:"type" binding:"required,oneof=INCOME EXPENSE"`
	Date        string  `json:"date" binding:"required"`
	CategoryID  string  `json:"categoryId" binding:"required"`
	Notes       string  `json:"notes"`
}

func (h *TransactionHandler) Create(c *gin.Context) {
	userId := c.GetString("userId")
	var req createTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos", "details": err.Error()})
		return
	}

	date, err := time.Parse(time.RFC3339, req.Date)
	if err != nil {
		date, err = time.Parse("2006-01-02", req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de data inválido"})
			return
		}
	}

	transaction := &models.Transaction{
		Description: req.Description,
		Amount:      req.Amount,
		Type:        models.TransactionType(req.Type),
		Date:        date,
		Notes:       req.Notes,
		UserID:      userId,
		CategoryID:  req.CategoryID,
	}

	if err := h.repo.Create(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar transação"})
		return
	}

	c.JSON(http.StatusCreated, transaction)
}

type updateTransactionRequest struct {
	Description string   `json:"description"`
	Amount      *float64 `json:"amount"`
	Type        string   `json:"type" binding:"omitempty,oneof=INCOME EXPENSE"`
	Date        string   `json:"date"`
	CategoryID  string   `json:"categoryId"`
	Notes       *string  `json:"notes"`
}

func (h *TransactionHandler) Update(c *gin.Context) {
	userId := c.GetString("userId")
	id := c.Param("id")

	var req updateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos", "details": err.Error()})
		return
	}

	transaction, err := h.repo.FindByID(id, userId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transação não encontrada"})
		return
	}

	if req.Description != "" {
		transaction.Description = req.Description
	}
	if req.Amount != nil {
		transaction.Amount = *req.Amount
	}
	if req.Type != "" {
		transaction.Type = models.TransactionType(req.Type)
	}
	if req.CategoryID != "" {
		transaction.CategoryID = req.CategoryID
	}
	if req.Notes != nil {
		transaction.Notes = *req.Notes
	}
	if req.Date != "" {
		date, err := time.Parse(time.RFC3339, req.Date)
		if err != nil {
			date, err = time.Parse("2006-01-02", req.Date)
			if err == nil {
				transaction.Date = date
			}
		} else {
			transaction.Date = date
		}
	}

	if err := h.repo.Update(transaction); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar transação"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

func (h *TransactionHandler) Delete(c *gin.Context) {
	userId := c.GetString("userId")
	id := c.Param("id")

	if err := h.repo.Delete(id, userId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar transação"})
		return
	}

	c.Status(http.StatusNoContent)
}
