FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# API types are generated from the contract (single source, not committed). The contract lives outside this
# build context, so it comes in as the named context "contract" (docs/api):
#   docker build --build-context contract=./docs/api ./frontend   (compose: additional_contexts)
COPY --from=contract openapi.yaml /contract/openapi.yaml
RUN npx openapi-typescript /contract/openapi.yaml -o src/api/schema.d.ts && npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
RUN mkdir -p public && adduser -S -u 10001 radar && chown -R radar /app
USER radar
EXPOSE 3000
CMD ["node", "server.js"]
