# Use a lightweight Node.js image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# (Optional) Copy shared directory if your gateway uses it
# COPY shared ./shared

# Copy the package.json from the build context
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the gateway source code
COPY . .

# Expose the port the gateway runs on
EXPOSE 3000

# Start the gateway
CMD ["npm", "start"]