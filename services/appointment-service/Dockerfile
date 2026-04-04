FROM node:22-alpine
WORKDIR /app
COPY shared ./shared
COPY services/appointment-service ./services/appointment-service
WORKDIR /app/services/appointment-service
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]