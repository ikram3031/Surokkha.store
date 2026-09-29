# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

ARG VITE_API_BASE_URL=https://server.decantrebd.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_CLIENT=engulfic
ENV VITE_CLIENT=$VITE_CLIENT

RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 8005

CMD ["nginx", "-g", "daemon off;"]
