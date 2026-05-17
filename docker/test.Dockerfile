FROM node:22-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source — tests import from src/lib/shapes.js
COPY src/ ./src/
COPY tests/   ./tests/
COPY vitest.config.js ./

CMD ["npx", "vitest", "run", "--reporter=verbose"]
