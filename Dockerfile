FROM node:14.17.3-alpine3.14
RUN apk add --no-cache bash
USER root

RUN apk update
RUN apk fetch openjdk11
RUN apk add openjdk11

ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk
ENV PATH="$JAVA_HOME/bin:${PATH}"

RUN java --version
RUN echo $PATH
COPY ./ /
RUN chmod +x createusr.sh
RUN chmod +x run.sh
RUN npm install
EXPOSE 3000
CMD node app.js