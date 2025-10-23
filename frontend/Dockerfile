# Build stage
FROM node:18-alpine AS build
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

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_BASE_URL=$REACT_APP_BASE_URL
ENV REACT_APP_ZITADEL_AUTHORITY=$REACT_APP_ZITADEL_AUTHORITY
ENV REACT_APP_ZITADEL_CLIENT_ID=$REACT_APP_ZITADEL_CLIENT_ID
ENV REACT_APP_REDIRECT_URI=$REACT_APP_REDIRECT_URI
ENV GENERATE_SOURCEMAP=false

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
