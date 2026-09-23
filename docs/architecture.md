# BCIS Architecture

```mermaid
flowchart TB
    subgraph Office["Office LAN"]
        PC1["PC 1: Owner / Admin<br/>Electron Client"]
        PC2["PC 2: Cashier<br/>Electron Client"]
        PC3["PC 3: Operations<br/>Electron Client"]
    end

    API["BCIS API Server<br/>Fastify + TypeScript"]
    DB[("PostgreSQL<br/>bcis_dev")]

    PC1 -->|HTTPS/REST| API
    PC2 -->|HTTPS/REST| API
    PC3 -->|HTTPS/REST| API
    API -->|Drizzle ORM| DB

    API --> Attach["Attachments"]
    API --> Backup["Backups"]
    API --> Logs["Audit / Logs"]
```

## Key rules

- Electron renderers never connect to PostgreSQL directly — all data access goes through the API.
- `contextIsolation: true` and `nodeIntegration: false` are enforced in every Electron window.
- All external input is validated with Zod before reaching business logic.
- Financial mutations are transactional and produce audit records; nothing is silently deleted.