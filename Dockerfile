# Stage 1 — builder
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Prisma needs this during build
ENV DATABASE_URL=postgresql://user:password@db:5432/devboard
RUN npx prisma generate

# Stage 2 — production
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# ✅ THIS WAS MISSING
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["npm", "start"]