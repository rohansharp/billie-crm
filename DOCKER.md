# Docker Development Setup

Single-container setup running both the Next.js frontend (HTTPS) and Python event processor.

## Prerequisites

- Docker and Docker Compose installed
- SSL certificates in `certs/` directory:
  - `localhost.pem` (certificate)
  - `localhost-key.pem` (private key)
- `.env` file with your configuration (use `host.docker.internal` for local services)

## Quick Start

```bash
# Build and start
docker compose up --build -d

# View logs
docker compose logs -f
```

Access at: **https://localhost:3000**

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    Node.js (server.js)        │  │
│  │    • HTTPS via native module  │  │
│  │    • Next.js dev server       │  │
│  │    • Hot reload enabled       │  │
│  └───────────────────────────────┘  │
│               ↓                     │
│          Port 3000                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    Python Event Processor     │  │
│  │    • Consumes Redis events    │  │
│  │    • Updates MongoDB          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
          ↓               ↓
    host.docker.internal:27017 (MongoDB)
    host.docker.internal:6379  (Redis)
```

## Environment Variables

Your `.env` should include:

```env
# Use host.docker.internal for services on your Mac
DATABASE_URI=mongodb://host.docker.internal:27017/billie-servicing
REDIS_URL=redis://host.docker.internal:6379

# Payload CMS
PAYLOAD_SECRET=your-secret-key

# Optional: for building with Billie SDKs
GITHUB_TOKEN=your-github-token
```

## Commands

```bash
# Build and start
docker compose up --build -d

# View logs (both services)
docker compose logs -f

# Rebuild after changes
docker compose up --build -d

# Stop
docker compose down

# Shell into container
docker compose exec billie-crm bash
```

## Generate SSL Certificates

```bash
brew install mkcert
mkcert -install
cd certs
mkcert localhost 127.0.0.1 ::1
mv localhost+2.pem localhost.pem
mv localhost+2-key.pem localhost-key.pem
```
