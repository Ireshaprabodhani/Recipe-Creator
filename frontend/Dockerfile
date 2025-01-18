# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set the API URL environment variable
ARG VITE_API_URL=https://inkqxdx9em.ap-southeast-1.awsapprunner.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create health check endpoint directory
RUN mkdir -p /usr/share/nginx/html/health

# Add health check file
RUN echo "OK" > /usr/share/nginx/html/health/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]