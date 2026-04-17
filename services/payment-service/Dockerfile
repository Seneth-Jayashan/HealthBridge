FROM node:22-alpine

# Set the working directory to the root of our virtual app
WORKDIR /app

# 1. Copy the shared folder into the container FIRST
COPY shared ./shared

# 2. Copy the payment-service files into the container
COPY services/payment-service ./services/payment-service

# 3. Change working directory to the payment-service
WORKDIR /app/services/payment-service

# 4. Install dependencies (it will now successfully find the ../../shared folder!)
RUN npm install

EXPOSE 3005

CMD ["npm", "start"]