FROM mhart/alpine-node:16.4.2

COPY --chown=root:root ./*.js ./*.json ./public /app/

WORKDIR /app

ENV port=5001
ENV access_token=asdfghjkl
ENV mainServerToken=asdfghjkl
ENV mainServerPass=qazwsx

# run in build
RUN npm install

# run while docker run
CMD node aspher.js

EXPOSE 5001