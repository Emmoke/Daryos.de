# Container für Cloud Run (oder jeden anderen Docker-Host): öffentliche Seite + Verwaltung + API
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 TRUST_PROXY=true
COPY --from=build /app /app
EXPOSE 8080
CMD ["npx", "tsx", "server.ts"]
