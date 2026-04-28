# ---- builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json next.config.js postcss.config.js tailwind.config.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY scripts ./scripts
COPY public ./public

ENV NEXT_TELEMETRY_DISABLED=1

# Run migrate and seed before build to create DB
RUN node_modules/.bin/tsx scripts/migrate.ts && node_modules/.bin/tsx scripts/seed.ts

RUN npm run build

# seed를 빌드 시점에 미리 실행해서 DB 파일 생성
RUN node_modules/.bin/tsx scripts/seed.ts

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 빌드 시점에 생성된 DB 파일도 복사
COPY --from=builder /app/data ./data

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DB_PATH=/app/data/duoday.db
ENV UPLOAD_DIR=/app/public/uploads

CMD ["node", "server.js"]
