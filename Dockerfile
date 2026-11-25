# ---- build the React frontend ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci
COPY shared shared
COPY frontend frontend
RUN npm run build -w frontend

# ---- runtime: Express API + static frontend ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --omit=dev -w backend && npm cache clean --force
COPY shared shared
COPY backend/src backend/src
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
ENV UPLOAD_DIR=/data/uploads PORT=4000
EXPOSE 4000
CMD ["node", "backend/src/server.js"]
