FROM oven/bun:1.1.0

WORKDIR /app

COPY package.json bun.lockb* ./

# 2️⃣ install deps
RUN bun install

# 3️⃣ copy the rest
COPY . .

EXPOSE 4000
CMD ["bun", "run", "src/index.js"]
