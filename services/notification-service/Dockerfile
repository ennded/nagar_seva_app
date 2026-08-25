# Build context is the repo root
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json ./
COPY services/notification-service/package.json services/notification-service/package.json
COPY shared shared
RUN npm install --workspace shared --workspace services/notification-service --no-audit --no-fund
RUN npm run build --workspace shared
COPY services/notification-service services/notification-service
RUN npm run build --workspace services/notification-service

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/services/notification-service/package.json ./package.json
COPY --from=build /repo/services/notification-service/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 4002
CMD ["node", "dist/index.js"]
