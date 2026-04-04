# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the gateway source code
COPY . .

# Expose the port the gateway runs on
EXPOSE 3000

# Start the gateway
CMD ["npm", "start"]