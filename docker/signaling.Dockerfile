FROM node:22-alpine

WORKDIR /app

RUN npm install y-webrtc

EXPOSE 4444

# bin field is y-webrtc-signaling → bin/server.js
CMD ["node", "node_modules/y-webrtc/bin/server.js"]
