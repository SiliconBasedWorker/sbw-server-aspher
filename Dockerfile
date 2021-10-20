FROM node

COPY --chown=root:root ./*.js ./*.json ./public ./cert /app/

WORKDIR /app

# run in build
RUN npm install

# run while docker run
CMD node aspher.js

EXPOSE 5001