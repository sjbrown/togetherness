FROM ubuntu:18.04

RUN apt-get update && apt-get install -y \
    python-dev \
    vim \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./src /app

CMD python -m SimpleHTTPServer 80

