# OpenWA Dashboard

React frontend for the OpenWA WhatsApp API Gateway.

## Features

- **Sessions** — Create and manage WhatsApp sessions, scan QR codes, monitor live connection status via WebSocket
- **API Keys** — Create, revoke and delete API keys with role-based access (admin / operator / viewer)
- **Message Tester** — Send test messages to personal contacts, groups or WhatsApp Channels (text, image, video, audio, document)
- **Internationalisation** — English, Deutsch, עברית (RTL)

## Tech stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool |
| React Router 7 | Client-side routing |
| TanStack Query | Server state / caching |
| Socket.IO Client | Real-time session events |
| i18next | Internationalisation |
| Lucide React | Icons |

## Development

```bash
# From the repo root — installs both API and dashboard deps
npm install

# Start API + dashboard in watch mode
npm run dev
```

Dashboard is available at `http://localhost:2886`.

## Production build

```bash
npm run dashboard:build
# or from inside dashboard/
npm run build
```

The build output lands in `dashboard/dist/` and is served by nginx in the Docker container.

## Project structure

```
dashboard/
├── src/
│   ├── components/       # Shared UI components (Layout, Toast, PageHeader …)
│   ├── hooks/            # React Query hooks and utility hooks
│   ├── i18n/
│   │   └── locales/      # en.json · de.json · he.json
│   ├── pages/            # Sessions · ApiKeys · MessageTester
│   ├── services/         # API client (api.ts)
│   ├── App.tsx
│   └── main.tsx
├── public/
├── Dockerfile
├── nginx.conf
└── vite.config.ts
```

## License

MIT
