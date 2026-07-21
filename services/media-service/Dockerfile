# Build context is the repo root
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json ./
COPY services/media-service/package.json services/media-service/package.json
COPY shared shared
RUN npm install --workspace services/media-service --no-audit --no-fund
COPY services/media-service services/media-service
RUN npm run build --workspace services/media-service

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/services/media-service/package.json ./package.json
COPY --from=build /repo/services/media-service/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
RUN mkdir -p /app/uploads/complaints /app/uploads/kyc
VOLUME ["/app/uploads"]
EXPOSE 4003
CMD ["node", "dist/index.js"]
