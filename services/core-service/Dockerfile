# Build context is the repo root (see infra/docker-compose.yml / k8s build instructions)
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json ./
COPY services/core-service/package.json services/core-service/package.json
COPY shared shared
RUN npm install --workspace shared --workspace services/core-service --no-audit --no-fund
RUN npm run build --workspace shared
COPY services/core-service services/core-service
RUN npm run build --workspace services/core-service

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/services/core-service/package.json ./package.json
COPY --from=build /repo/services/core-service/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/shared/package.json /app/shared/package.json
COPY --from=build /repo/shared/dist /app/shared/dist
EXPOSE 4001
CMD ["node", "dist/index.js"]
