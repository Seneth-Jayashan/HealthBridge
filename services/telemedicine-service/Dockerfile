FROM node:22-alpine

WORKDIR /app

COPY shared ./shared
COPY services/telemedicine-service ./services/telemedicine-service

WORKDIR /app/services/telemedicine-service

RUN npm install

EXPOSE 3008

CMD ["npm", "start"]