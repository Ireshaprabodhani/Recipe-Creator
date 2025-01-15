FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Make sure port 80 is exposed
EXPOSE 80

# Test nginx configuration during build
RUN nginx -t

CMD ["nginx", "-g", "daemon off;"]