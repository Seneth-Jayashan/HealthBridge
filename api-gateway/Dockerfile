# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# (Optional) Copy shared directory if your gateway uses it
# COPY shared ./shared

# Copy the package.json specifically from the api-gateway folder
COPY api-gateway/package*.json ./api-gateway/

# Change working directory to the gateway folder
WORKDIR /app/api-gateway

# Install dependencies
RUN npm install

# Copy the rest of the gateway source code
COPY api-gateway/ .

# Expose the port the gateway runs on
EXPOSE 3000

# Start the gateway
CMD ["npm", "start"]