FROM nginx:1.27-alpine

COPY src/app/ /usr/share/nginx/html/

RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    gzip on;\n\
    gzip_types text/html text/css application/javascript;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
