#!/usr/bin/env bash

set -euo pipefail

if [ `basename $(pwd)` != "togetherness" ]; then
  echo "You must be in the togetherness directory to run this command"
  exit 1
fi

read -rp "Hostname (e.g. table.example.com): " HOSTNAME

if [[ -z "$HOSTNAME" ]]; then
    echo "Hostname is required."
    exit 1
fi

cat > Caddyfile <<EOF
$HOSTNAME {

    root * /srv
    file_server

    reverse_proxy /signaling* signaling:4444
}
EOF

cat > docker-compose.yml <<EOF
name: togetherness

services:
  app:
    image: caddy:2.10

    ports:
      - "80:80"
      - "443:443"

    volumes:
      - ./src:/srv:ro
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

    depends_on:
      - signaling

    restart: unless-stopped

  signaling:
    build:
      context: .
      dockerfile: docker/signaling.Dockerfile

    expose:
      - "4444"

    environment:
      LOG: y-webrtc

    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
EOF

cat <<EOF

Configuration written.

Generated files:

  Caddyfile
  docker-compose.yml

Next step:

    docker compose up -d

EOF
