FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/landing-page/package.json apps/landing-page/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm install
COPY . .

FROM base AS api
CMD ["npm", "run", "dev", "-w", "@invest4fun/api"]

FROM base AS worker
CMD ["npm", "run", "dev", "-w", "@invest4fun/worker"]

FROM base AS web
CMD ["npm", "run", "dev", "-w", "@invest4fun/web", "--", "--host", "0.0.0.0"]

FROM base AS landing-page
CMD ["npm", "run", "dev", "-w", "@invest4fun/landing-page"]
