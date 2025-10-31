# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build arguments for all environment variables
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_BASE_URL=http://localhost:3000
ARG REACT_APP_ZITADEL_AUTHORITY
ARG REACT_APP_ZITADEL_CLIENT_ID
ARG REACT_APP_REDIRECT_URI=http://localhost:3000/auth/callback
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_ZITADEL_AUTHORITY=$REACT_APP_ZITADEL_AUTHORITY
ENV REACT_APP_ZITADEL_CLIENT_ID=$REACT_APP_ZITADEL_CLIENT_ID
ENV REACT_APP_REDIRECT_URI=$REACT_APP_REDIRECT_URI
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV GENERATE_SOURCEMAP=false

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
