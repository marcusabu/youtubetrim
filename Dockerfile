FROM node:23-slim AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/client/package.json ./apps/client/package.json
COPY apps/server/package.json ./apps/server/package.json
COPY tsconfig.base.json ./

RUN yarn install

COPY apps/client ./apps/client
COPY apps/server ./apps/server

RUN yarn build:client

FROM node:23-slim AS runner

WORKDIR /app

# Install dependencies for yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally
RUN pip3 install yt-dlp --break-system-packages

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/apps/client/dist ./apps/client/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server ./apps/server

EXPOSE 3000

CMD ["yarn", "start:prod"]