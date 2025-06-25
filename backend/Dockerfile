FROM oven/bun:1.1.0

WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install


COPY . .

EXPOSE 4000
CMD ["bun", "run", "src/index.js"]
