FROM node:16-alpine

WORKDIR /frontend

COPY package*.json ./

RUN npm install

ENV WDS_SOCKET_PORT=3001

COPY . .

RUN npm run build --production
RUN npm install -g serve

EXPOSE 3000

CMD npm run start