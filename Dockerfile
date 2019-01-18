FROM cypress/base:10

RUN apt-get update && apt-get install -y \
    python-dev \
    npm \
    vim \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install --loglevel warn cypress --save-dev

COPY ./src /app

CMD python -m SimpleHTTPServer 80

