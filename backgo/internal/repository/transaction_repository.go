package repository

import (
	"finflow-backgo/internal/models"
	"time"

	"gorm.io/gorm"
)

type TransactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

type ListParams struct {
	UserID     string
	Type       string
	CategoryID string
	From       *time.Time
	To         *time.Time
	Page       int
	Limit      int
}

func (r *TransactionRepository) List(params ListParams) ([]models.Transaction, int64, error) {
	var transactions []models.Transaction
	var total int64

	query := r.db.Model(&models.Transaction{}).Where("\"userId\" = ?", params.UserID)

	if params.Type != "" {
		query = query.Where("type = ?", params.Type)
	}
	if params.CategoryID != "" {
		query = query.Where("\"categoryId\" = ?", params.CategoryID)
	}
	if params.From != nil {
		query = query.Where("date >= ?", params.From)
	}
	if params.To != nil {
		query = query.Where("date <= ?", params.To)
	}

	query.Count(&total)

	offset := (params.Page - 1) * params.Limit
	err := query.Preload("Category").
		Order("date desc").
		Offset(offset).
		Limit(params.Limit).
		Find(&transactions).Error

	return transactions, total, err
}

func (r *TransactionRepository) Create(t *models.Transaction) error {
	return r.db.Create(t).Error
}

func (r *TransactionRepository) FindByID(id, userID string) (*models.Transaction, error) {
	var t models.Transaction
	err := r.db.Where("id = ? AND \"userId\" = ?", id, userID).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TransactionRepository) Update(t *models.Transaction) error {
	return r.db.Save(t).Error
}

func (r *TransactionRepository) Delete(id, userID string) error {
	return r.db.Where("id = ? AND \"userId\" = ?", id, userID).Delete(&models.Transaction{}).Error
}

type SummaryResult struct {
	Income     float64
	Expense    float64
	ByCategory []CategorySummary
}

type CategorySummary struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Color string  `json:"color"`
	Icon  string  `json:"icon"`
	Total float64 `json:"total"`
}

func (r *TransactionRepository) GetSummary(userID string, from, to *time.Time) (*SummaryResult, error) {
	summary := &SummaryResult{
		ByCategory: make([]CategorySummary, 0),
	}

	query := r.db.Model(&models.Transaction{}).Where("\"userId\" = ?", userID)
	if from != nil {
		query = query.Where("date >= ?", from)
	}
	if to != nil {
		query = query.Where("date <= ?", to)
	}

	// Income total
	r.db.Model(&models.Transaction{}).
		Where("\"userId\" = ? AND type = ?", userID, models.Income).
		Where(query).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.Income)

	// Expense total
	r.db.Model(&models.Transaction{}).
		Where("\"userId\" = ? AND type = ?", userID, models.Expense).
		Where(query).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.Expense)

	// By Category
	type categoryRaw struct {
		CategoryID string
		Total      float64
	}
	var rawByCat []categoryRaw
	r.db.Model(&models.Transaction{}).
		Where("\"userId\" = ? AND type = ?", userID, models.Expense).
		Where(query).
		Select("\"categoryId\", SUM(amount) as total").
		Group("\"categoryId\"").
		Order("total desc").
		Scan(&rawByCat)

	for _, raw := range rawByCat {
		var cat models.Category
		if err := r.db.First(&cat, "id = ?", raw.CategoryID).Error; err == nil {
			summary.ByCategory = append(summary.ByCategory, CategorySummary{
				ID:    cat.ID,
				Name:  cat.Name,
				Color: cat.Color,
				Icon:  cat.Icon,
				Total: raw.Total,
			})
		}
	}

	return summary, nil
}
