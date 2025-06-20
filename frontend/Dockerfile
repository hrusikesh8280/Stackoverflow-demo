# Use the same Bun version you use locally
FROM oven/bun:1.2.15

WORKDIR /app

# Optional: skip copying bun.lockb if you don't use it
COPY package.json bun.lockb* ./

RUN bun install

COPY . .

CMD ["bun", "run", "dev", "--", "--host"]
