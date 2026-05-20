# OpenWA

Self-hosted WhatsApp API Gateway. Manages a single WhatsApp session and exposes a simple HTTP API for sending messages and posting to WhatsApp Channels (newsletters). Includes a lightweight dashboard for session management and API key administration.

## Quick start (Docker)

```bash
cp .env.example .env
# Edit .env — set API_MASTER_KEY and ports if needed
docker compose up -d
```

- **API:** `http://localhost:2785/api`
- **Swagger docs:** `http://localhost:2785/api/docs`
- **Dashboard:** `http://localhost:2886`

The auto-generated API key is printed to the container log on first startup:

```bash
docker logs openwa | grep "API Key"
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `2785` | Port the backend listens on |
| `DASHBOARD_PORT` | `2886` | Port the dashboard is served on |
| `API_MASTER_KEY` | *(auto-generated)* | Overrides the auto-generated admin key |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug` |
| `OPENWA_API_IMAGE` | `smilebasti/openwa-api:latest` | Override Docker image for API |
| `OPENWA_DASH_IMAGE` | `smilebasti/openwa-dashboard:latest` | Override Docker image for Dashboard |

All other variables (database path, session path, storage path) are pre-configured for SQLite + local filesystem — no external services needed.

## API usage

All endpoints require the header `X-API-Key: <key>`.

### Sessions

```http
# Create a session (name: lowercase letters, numbers, hyphens; min 3 chars)
POST /api/sessions
{"name": "default"}

# Start session (triggers QR code generation)
POST /api/sessions/:id/start

# Get QR code (base64 PNG — scan with your phone)
GET /api/sessions/:id/qr

# Stop session
POST /api/sessions/:id/stop

# Delete session
DELETE /api/sessions/:id
```

### Send a text message

```http
POST /api/sessions/:sessionId/messages/send-text
{"chatId": "4912345678901@c.us", "text": "Hello!"}
```

### Post to a WhatsApp Channel

> **Requirement:** The connected WhatsApp account must be an **admin** of the channel.

#### Step 1 — Find your channel ID

```http
GET /api/sessions/:sessionId/channels
```

Response:
```json
[
  {
    "id": "120363xxxxxxxxxx@newsletter",
    "name": "My Channel",
    "subscriberCount": 42
  }
]
```

#### Step 2a — Post a text message

```http
POST /api/sessions/:sessionId/channels/:channelId/messages
Content-Type: application/json
X-API-Key: <key>

{"text": "New update from the API!"}
```

#### Step 2b — Post an image with caption

```http
POST /api/sessions/:sessionId/channels/:channelId/messages/media
Content-Type: application/json
X-API-Key: <key>

{
  "mediaUrl": "https://example.com/photo.jpg",
  "caption": "Check out this photo!"
}
```

#### Step 2c — Post a video with caption

```http
POST /api/sessions/:sessionId/channels/:channelId/messages/media
Content-Type: application/json
X-API-Key: <key>

{
  "mediaUrl": "https://example.com/clip.mp4",
  "caption": "Watch this clip"
}
```

The `mediaUrl` must be publicly accessible. The API detects the media type automatically from the MIME type returned by the URL. `caption` is optional for both image and video.

#### Response

All send endpoints return:

```json
{
  "id": "true_120363xxxxxxxxxx@newsletter_3EB0...",
  "timestamp": 1716123456
}
```

### API key management

```http
GET    /api/auth/api-keys
POST   /api/auth/api-keys       {"name": "ci-bot", "role": "operator"}
DELETE /api/auth/api-keys/:id
POST   /api/auth/api-keys/:id/revoke
```

Roles: `admin` (full access) · `operator` (send messages, manage sessions) · `viewer` (read-only).

## Dashboard

The dashboard at `http://localhost:2886` provides:

- **Sessions** — Create sessions, scan QR codes, monitor connection status
- **API Keys** — Create and manage API keys with role-based access
- **Message Tester** — Send test messages (text, image, video, audio, document) to chats, groups, or channels

## CI/CD (GitLab)

`.gitlab-ci.yml` builds two Docker images on every push to `main` and on `v*.*.*` tags.

| Stage | Trigger | Action |
|---|---|---|
| `build` | `main`, tags, MRs | Push images to private Harbor registry |
| `publish` | `v*.*.*` tags only | Push to Docker Hub + GHCR, mirror code to GitHub, create GitHub Release |
| `deploy` | *(commented out)* | SSH deploy to server |

Required CI/CD variables:

| Variable | Description |
|---|---|
| `HARBOR_HOST` | Private registry host |
| `HARBOR_USERNAME` / `HARBOR_PASSWORD` | Registry credentials |
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | Docker Hub credentials |
| `GITHUB_USERNAME` / `GITHUB_TOKEN` / `GITHUB_REPO` | GitHub mirror credentials |

To enable SSH deploy: add a `server-private-key` secure file, set `SSH_HOST` + `SSH_USER` variables, and uncomment the `deploy:` block.

## Architecture

```
┌─────────────────────┐    port 2886     ┌──────────────────────┐
│  openwa-dashboard   │ ── nginx ───────▶ │                      │
│  (React + nginx)    │  proxy /api→:2785 │   openwa (NestJS)    │
└─────────────────────┘                   │   SQLite · local FS  │
                                          └──────────────────────┘
```

Both containers share `openwa-network`. Session data, the SQLite database and media files are stored in the `openwa-data` Docker volume.

## License

MIT
