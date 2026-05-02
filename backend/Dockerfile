FROM node:20-alpine AS base
# Instala bibliotecas necessárias para o Prisma no Alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# Dependências de produção
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production

# Copia tudo necessário
COPY --from=deps    /app/node_modules          ./node_modules
COPY --from=builder /app/dist                  ./dist
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY prisma ./prisma
COPY package*.json ./

EXPOSE 3001

# Usa npx para garantir que o prisma seja encontrado
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
