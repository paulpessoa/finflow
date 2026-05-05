package main

import (
	"finflow-backgo/internal/handlers"
	"finflow-backgo/internal/middleware"
	"finflow-backgo/internal/models"
	"finflow-backgo/internal/repository"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: arquivo .env não encontrado")
	}

	// 2. Connect to Database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL não configurada")
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Falha ao conectar no banco de dados:", err)
	}

	// 3. Auto Migrate
	log.Println("Rodando migrations...")
	err = db.AutoMigrate(&models.User{}, &models.Category{}, &models.Transaction{})
	if err != nil {
		log.Fatal("Falha ao rodar migrations:", err)
	}

	// 4. Repositories
	userRepo := repository.NewUserRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)

	// 5. Handlers
	authHandler := handlers.NewAuthHandler(userRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	transactionHandler := handlers.NewTransactionHandler(transactionRepo)
	aiHandler := handlers.NewAIHandler(transactionRepo)

	// 6. Setup Router
	r := gin.Default()

	// CORS Middleware (Simple version for demo)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check (Global)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "backgo"})
	})

	api := r.Group("/api")
	{
		// Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.RequireAuth(), authHandler.Me)
		}

		// Categories Routes
		categories := api.Group("/categories")
		categories.Use(middleware.RequireAuth())
		{
			categories.GET("", categoryHandler.List)
		}

		// Transactions Routes
		transactions := api.Group("/transactions")
		transactions.Use(middleware.RequireAuth())
		{
			transactions.GET("", transactionHandler.List)
			transactions.GET("/summary", transactionHandler.Summary)
			transactions.POST("", transactionHandler.Create)
			transactions.PUT("/:id", transactionHandler.Update)
			transactions.DELETE("/:id", transactionHandler.Delete)
		}

		// AI Routes
		ai := api.Group("/ai")
		ai.Use(middleware.RequireAuth())
		{
			ai.POST("/insights", aiHandler.GetInsights)
		}

		// Streaming Routes
		streaming := api.Group("/streaming")
		streaming.Use(middleware.RequireAuth())
		{
			streaming.POST("/ask", aiHandler.AskStreaming)
		}
	}

	// 7. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("🚀 API (Go) rodando em http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Falha ao iniciar servidor:", err)
	}
}
