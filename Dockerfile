# Stage 1 — builder
FROM node:20-alpine AS builder

WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm install

# copy source
COPY . .

# Stage 2 — production
FROM node:20-alpine

WORKDIR /app

# copy only necessary files
COPY --from=builder /app /app

ENV NODE_ENV=production

# security: run as non-root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["npm", "start"]