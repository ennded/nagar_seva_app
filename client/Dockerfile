# Build context is the repo root
FROM node:22-alpine AS build
WORKDIR /repo
ARG VITE_GRAPHQL_URL
ARG VITE_UPLOAD_URL
ENV VITE_GRAPHQL_URL=${VITE_GRAPHQL_URL}
ENV VITE_UPLOAD_URL=${VITE_UPLOAD_URL}
COPY package.json ./
COPY client/package.json client/package.json
RUN npm install --workspace client --no-audit --no-fund
COPY client client
RUN npm run build --workspace client

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/client/package.json ./package.json
COPY --from=build /repo/client/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 5173
CMD ["npm", "run", "preview"]
