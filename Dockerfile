FROM node:alpine

RUN mkdir app

COPY index.js /app

WORKDIR /app

RUN npm install -g npm@7.10.0

RUN npm i express bitcoin-rpc-promise --force

RUN npm -v

RUN node -v

EXPOSE 3000

CMD [ "node" , "index"]