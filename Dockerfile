FROM node
EXPOSE 8080

ARG DEFAULT_MYSQL_PW
ARG DEFAULT_MYSQL_HOST

RUN mkdir /app; mkdir /app/server_code; mkdir /app/views
WORKDIR /app
COPY server_code/node.js ./server_code/node.js
COPY views/* ./views/
WORKDIR server_code
RUN npm install express; npm install http; npm install socket.io; npm install mysql; npm install path
ENV MYSQL_PW=$DEFAULT_MYSQL_PW
ENV MYSQL_HOST=$DEFAULT_MYSQL_HOST
ENTRYPOINT node node.js --db-pw $MYSQL_PW --db-ip $MYSQL_HOST
