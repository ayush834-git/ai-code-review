# CloudPulse Web Application

CloudPulse is a distributed telemetry, team activity, and metrics monitoring dashboard built with Node.js, Express, and React.

## System Architecture

- **Backend**: Express.js REST API with Postgres/SQLite datastores
- **Frontend**: React components with CSS modules
- **Authentication**: JWT token authentication & role-based access control
- **Utilities**: Micro-services for file processing, system telemetry diagnostics, and mailing alerts

## Getting Started

```bash
npm install
npm run dev
```

## API Endpoints

- `GET /api/users` - Fetch user directory
- `GET /api/users/:id` - Fetch user details
- `GET /api/search` - Search system products and telemetry logs
- `GET /api/admin/ping` - Network diagnostics
- `GET /api/files/download` - Download exported logs
