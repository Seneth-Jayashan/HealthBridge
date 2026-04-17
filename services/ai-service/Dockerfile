FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache wget
RUN addgroup -S healthbridge && adduser -S appuser -G healthbridge

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs && chown -R appuser:healthbridge /app
USER appuser

EXPOSE 5007

HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
  CMD wget -qO- http://localhost:5007/health || exit 1

CMD ["node", "index.js"]