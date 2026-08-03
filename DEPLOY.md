# Deploy Togetherness Table on Hetzner

This guide deploys Togetherness Table on a Hetzner Cloud server.

Two components:

* **HTTP Server**: Caddy (static web application over HTTPS)
* **WebRTC Server**: `y-webrtc` (signaling server running in Docker)

## Requirements

Before starting:

* A Hetzner Cloud account
* A hostname pointing to the server
* An SSH public key
* Git installed locally

The hostname must resolve to the Hetzner server before HTTPS setup can complete.

Example:

```
table.example.com → your server IP
```

## 1. Create the Hetzner Server

Log into Hetzner Cloud:

https://console.hetzner.cloud/

Create a new project.

Create a server with:

| Setting  | Value               |
| -------- | ------------------- |
| Location | Any                 |
| Image    | Ubuntu 24.04        |
| Type     | CX22                |
| SSH Key  | Your public SSH key |

Do not create a password.

## 2. Connect to the Server

SSH into the server:

```bash
ssh root@SERVER_IP
```

## 4. Install Required Packages

Update the system:

```bash
apt update
apt upgrade -y
```

Install dependencies:

```bash
apt install -y git curl
```

Install Docker:

```bash
snap install docker
curl -fsSL https://get.docker.com | sh
```

Verify:

```bash
sudo docker version
```

## 5. Clone Togetherness

Clone the repository:

```bash
git clone https://github.com/sjbrown/togetherness.git
cd togetherness
```

## 6. Generate Deployment Configuration

Run:

```bash
bin/deploy_config.sh
```

Enter the hostname when prompted.

Example:

```
Hostname (DNS name pointing to this server): table.example.com
```

This creates:

```
Caddyfile
docker-compose.yml
```

## 7. Start Togetherness

Build and start the services:

```bash
sudo docker compose up -d --build
```

Check status:

```bash
sudo docker compose ps
```

Expected services:

```
app
signaling
```

## 9. Open Togetherness

Open:

```
https://YOUR_HOSTNAME/?signaling=wss://YOUR_HOSTNAME/signaling
```

Example:

```
https://table.example.com/?signaling=wss://table.example.com/signaling
```

Open the same URL in two browser windows.

Changes made in one browser should synchronize to the other.


## 12. Troubleshooting

### HTTPS certificate fails

Verify DNS:

```bash
dig YOUR_HOSTNAME
```

The result must contain the server IP.

Check Caddy logs:

```bash
docker compose logs app
```

### Signaling connection fails

Verify the browser URL contains:

```
?signaling=wss://YOUR_HOSTNAME/signaling
```

Check the signaling server:

```bash
docker compose logs signaling
```

### Containers are not running

Check:

```bash
docker compose ps
```

Restart:

```bash
docker compose restart
```

### Port 4444 is unreachable

Port 4444 should not be publicly accessible.

The browser connects through:

```
443 → Caddy → signaling:4444
```

Do not open port 4444 in the firewall.

## Architecture

```
Browser
   |
   | HTTPS / WebSocket
   |
   v
+----------------+
| Caddy          |
|                |
| static files   |
| /signaling     |
+----------------+
        |
        |
        v
+----------------+
| y-webrtc       |
| signaling      |
| :4444          |
+----------------+

Hetzner Cloud Server
```

