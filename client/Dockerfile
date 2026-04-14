# Stage 1: Build the React Application
FROM node:22-alpine as build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app (Assuming Vite here, which outputs to /dist. If using Create React App, change to /build)
RUN npm run build

# Stage 2: Serve the App with Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled React files from Stage 1 into the Nginx server
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for Docker
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]