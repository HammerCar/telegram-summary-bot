#
# Builder stage.
# This state compile our TypeScript to get the JavaScript code
#
FROM node:18 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig*.json ./
COPY ./src ./src

RUN npm install -g pnpm
RUN pnpm install --quiet && pnpm run build

#
# Production stage.
# This state compile get back the JavaScript code from builder stage
# It will also install the production package only
#
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --quiet --only=production

## We just need the build to execute the command
COPY --from=builder /usr/src/app/dist ./dist

CMD ["pnpm", "run", "start"]
