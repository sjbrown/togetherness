FROM node:22-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY src/ ./src/
COPY bin/ ./bin/
COPY tests/ ./tests/
COPY vitest.config.js ./

CMD ["bin/test_unit.sh"]

