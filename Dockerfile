FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile

FROM install AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY apps/api apps/api
COPY apps/frontend apps/frontend
RUN pnpm --filter=api db:generate
RUN pnpm --filter=api build
RUN pnpm --filter=frontend build

FROM base AS api
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/apps/api/uploads
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts /app/apps/api/prisma.config.ts
RUN mkdir -p /app/apps/api/uploads
WORKDIR /app/apps/api
EXPOSE 8000
CMD ["pnpm", "start"]

FROM base AS frontend
WORKDIR /app/apps/frontend
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/frontend/node_modules ./node_modules
COPY --from=build /app/apps/frontend/package.json ./package.json
COPY --from=build /app/apps/frontend/vite.config.ts ./vite.config.ts
COPY --from=build /app/apps/frontend/public ./public
COPY --from=build /app/apps/frontend/dist ./dist
EXPOSE 5137
CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "5137"]
