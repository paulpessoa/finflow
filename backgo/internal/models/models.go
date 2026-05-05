package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionType string

const (
	Income  TransactionType = "INCOME"
	Expense TransactionType = "EXPENSE"
)

type User struct {
	ID           string         `gorm:"primaryKey;type:text" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Name         string         `gorm:"not null" json:"name"`
	PasswordHash string         `gorm:"column:passwordHash;not null" json:"-"`
	CreatedAt    time.Time      `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt    time.Time      `gorm:"column:updatedAt" json:"updatedAt"`
	Transactions []Transaction  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"transactions,omitempty"`
}

func (User) TableName() string {
	return "User"
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return
}

type Category struct {
	ID           string         `gorm:"primaryKey;type:text" json:"id"`
	Name         string         `gorm:"uniqueIndex;not null" json:"name"`
	Color        string         `gorm:"default:#6366f1" json:"color"`
	Icon         string         `gorm:"default:💰" json:"icon"`
	Transactions []Transaction  `gorm:"foreignKey:CategoryID" json:"transactions,omitempty"`
}

func (Category) TableName() string {
	return "Category"
}

func (c *Category) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return
}

type Transaction struct {
	ID          string          `gorm:"primaryKey;type:text" json:"id"`
	Description string          `gorm:"not null" json:"description"`
	Amount      float64         `gorm:"type:decimal(12,2);not null" json:"amount"`
	Type        TransactionType `gorm:"type:text;not null" json:"type"`
	Date        time.Time       `gorm:"not null;index:idx_user_date" json:"date"`
	Notes       string          `json:"notes"`
	CreatedAt   time.Time       `gorm:"column:createdAt" json:"createdAt"`
	UpdatedAt   time.Time       `gorm:"column:updatedAt" json:"updatedAt"`
	UserID      string          `gorm:"column:userId;not null;index:idx_user_date;index:idx_user_type" json:"userId"`
	CategoryID  string          `gorm:"column:categoryId;not null" json:"categoryId"`
	Category    Category        `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	User        User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Transaction) TableName() string {
	return "Transaction"
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) (err error) {
	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	return
}
