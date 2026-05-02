FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Dependências de produção
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Build
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm dlx prisma generate
RUN pnpm run build

# Runner
FROM base AS runner
ENV NODE_ENV=production

# Copia tudo necessário
COPY --from=deps    /app/node_modules          ./node_modules
COPY --from=builder /app/dist                  ./dist
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma   ./node_modules/prisma
COPY prisma ./prisma
COPY package.json ./

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
