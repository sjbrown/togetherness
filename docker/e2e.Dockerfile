FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY playwright.config.js ./
COPY bin/ ./bin/
COPY tests/ ./tests/


CMD ["bin/test_e2e.sh"]
