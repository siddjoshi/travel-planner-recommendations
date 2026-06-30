# Travel Planner Recommendation Engine

Repo 3 of the Travel Planner demo.

This service returns static, deterministic recommendation data for hotels, routes, restaurants, and attractions. It intentionally does **not** integrate with AI.

## Run

```bash
npm install
npm run dev
```

The service runs on `http://localhost:4000` by default.

## Endpoints

### `GET /health`

Returns service health.

### `POST /api/recommendations`

Request:

```json
{
  "destination": "Tokyo",
  "interests": ["food", "culture"],
  "budget": 2500
}
```

Response contains grouped static suggestions:

- `hotels`
- `routes`
- `restaurants`
- `attractions`

Every response includes `source: "static-demo-data"` and a demo-only disclaimer.
