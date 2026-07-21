# Build context is the repo root
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
RUN npm install --workspace services/api-gateway --no-audit --no-fund
COPY services/api-gateway services/api-gateway
RUN npm run build --workspace services/api-gateway

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/services/api-gateway/package.json ./package.json
COPY --from=build /repo/services/api-gateway/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/index.js"]
