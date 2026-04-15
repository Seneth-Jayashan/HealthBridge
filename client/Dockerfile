# Stage 1: Build the React Application
FROM node:22-alpine as build

# Set the working directory to the ROOT of your project inside the container
WORKDIR /app

# 1. Copy the shared folder into the container FIRST
COPY shared ./shared

# 2. Copy the client folder into the container
COPY client ./client

# 3. Change working directory into the client folder for the build steps
WORKDIR /app/client

# 4. Install dependencies 
# (Now when npm sees "file:../shared", the folder actually exists!)
RUN npm install

# 5. Build the app
RUN npm run build

# Stage 2: Serve the App with Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy our custom Nginx configuration file
# Note: Path updated to reflect the new client subfolder
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled React files from Stage 1 into the Nginx server
# Note: Path updated to /app/client/dist
COPY --from=build /app/client/dist /usr/share/nginx/html

# Expose port 80 for Docker
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]