FROM mcr.microsoft.com/playwright:v1.60.0-jammy

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tests/e2e/  ./tests/e2e/
COPY playwright.config.js ./

CMD ["npx", "playwright", "test", "--reporter=list"]
