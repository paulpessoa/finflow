# Usa uma imagem oficial do Go como base para o build (Stage 1)
FROM golang:1.24-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência primeiro (para otimizar o cache do Docker)
COPY go.mod go.sum ./
RUN go mod download

# Copia o resto do código fonte
COPY . .

# Compila o binário do Go
# CGO_ENABLED=0 garante um binário estático que roda em qualquer container Alpine
# GOOS=linux diz que o sistema operacional alvo é Linux
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o finflow-backgo ./cmd/api

# Stage 2: Cria a imagem final super leve
FROM alpine:latest

# Instala certificados root (necessários para HTTPS, ex: chamadas para a API do Groq)
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copia apenas o binário compilado do Stage 1
COPY --from=builder /app/finflow-backgo .

# Expõe a porta que a aplicação vai rodar
EXPOSE 3001

# Comando para rodar o executável
CMD ["./finflow-backgo"]
