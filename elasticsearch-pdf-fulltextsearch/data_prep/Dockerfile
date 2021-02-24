FROM debian:buster
RUN useradd -u 1000 -m server
RUN apt-get update && apt-get install -y curl  && apt-get clean
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs

WORKDIR /home/server

COPY . examples/nodejs-simple
RUN cd examples/nodejs-simple && \
    npm install
RUN chown -R server /home/server
USER 1000
ENTRYPOINT cd /home/server/examples/nodejs-simple && node webapp.js