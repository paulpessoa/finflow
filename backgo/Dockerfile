# Usa uma imagem oficial do Go como base para o build (Stage 1)
FROM golang:1.24-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência
COPY go.mod go.sum ./

# Otimização: Usa cache mount para não baixar tudo do zero a cada build
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# Copia o resto do código fonte
COPY . .

# Compila o binário do Go usando cache para o build também
RUN --mount=type=cache,target=/root/.cache/go-build \
    --mount=type=cache,target=/go/pkg/mod \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o finflow-backgo ./cmd/api

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
