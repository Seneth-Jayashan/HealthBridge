# Stage 1: Build the React App
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the App with Nginx
FROM nginx:alpine
# Copy the compiled React files from Stage 1 into the Nginx server
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]