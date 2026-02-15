FROM node:20-alpine AS backend
WORKDIR /app/banhang-backend
COPY banhang-backend/package.json banhang-backend/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production
COPY banhang-backend/ ./

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend /app/banhang-backend /app/banhang-backend
EXPOSE 5000
CMD ["node", "/app/banhang-backend/src/index.js"]
