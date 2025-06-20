# Build Stage
FROM node:20 AS build
WORKDIR /app
COPY . .

# Build-time args for Vite env variables
ARG VITE_API_BASE_URL
ARG VITE_API_WS_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_WS_URL=$VITE_API_WS_URL

RUN npm install
RUN npm run build

# Nginx Stage
FROM nginx:alpine AS nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
