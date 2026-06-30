# Travel Planner Recommendation Engine

Static recommendation service for the Travel Planner demo. The service returns deterministic hotel, route, restaurant, and attraction suggestions for a destination so the rest of the Travel Planner system can be developed and demonstrated without calling an AI model or third-party travel APIs.

This repository is intentionally small and predictable. It is useful for local demos, integration tests, front-end development, and repeatable examples where every request should produce the same shape of response.

## Contents

- [What this service does](#what-this-service-does)
- [How it fits into Travel Planner](#how-it-fits-into-travel-planner)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Quick start](#quick-start)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Recommendation behavior](#recommendation-behavior)
- [Data model](#data-model)
- [Development guide](#development-guide)
- [Production and deployment notes](#production-and-deployment-notes)
- [Troubleshooting](#troubleshooting)

## What this service does

The app exposes an HTTP API that:

- reports service health from `GET /health`;
- accepts a destination, interests, and optional budget at `POST /api/recommendations`;
- returns grouped recommendations for hotels, routes, restaurants, and attractions;
- uses curated static demo data for known destinations;
- falls back to generic recommendations for unsupported destinations;
- includes a `source` and `disclaimer` field so callers know the data is static and demo-only.

The service does not call an AI model, booking provider, map provider, search API, database, or external recommendation engine.

## How it fits into Travel Planner

This is repo 3 of the Travel Planner demo. It acts as the recommendation backend that a Travel Planner front end or orchestration service can call after collecting trip preferences.

Typical local flow:

```text
Travel Planner UI or API
        |
        | POST /api/recommendations
        v
Travel Planner Recommendation Engine
        |
        | deterministic static data
        v
Hotels, routes, restaurants, attractions
```

Because responses are deterministic, the UI can be developed against stable examples and demo recordings do not depend on external services.

## Tech stack

- **Runtime:** Node.js with ECMAScript modules
- **Language:** TypeScript
- **HTTP framework:** Express
- **Middleware:** CORS and JSON body parsing
- **Environment loading:** dotenv
- **Development runner:** tsx watch
- **Build output:** compiled JavaScript in `dist/`

## Project structure

```text
.
├── .env.example             # Example local environment variables
├── package.json             # npm scripts and dependencies
├── package-lock.json        # Locked dependency versions
├── tsconfig.json            # TypeScript compiler configuration
└── src
    ├── index.ts             # Express app, middleware, routes, and server startup
    └── recommendations.ts   # Static data, request/response types, and ranking logic
```

### `src/index.ts`

Creates the Express app, loads environment variables, configures CORS, parses JSON request bodies, and defines the HTTP routes.

Routes currently implemented:

- `GET /health`
- `POST /api/recommendations`

### `src/recommendations.ts`

Owns the static recommendation catalog and recommendation response logic.

It defines:

- public TypeScript types for requests, responses, categories, and items;
- destination-specific static data;
- fallback static data;
- destination normalization;
- interest-based ordering within each category;
- `getRecommendations`, the main function used by the API route.

## Configuration

Configuration is read from environment variables. For local development, copy `.env.example` to `.env` and adjust values as needed.

```bash
cp .env.example .env
```

| Variable | Default | Required | Description |
| --- | --- | --- | --- |
| `PORT` | `4000` | No | Port used by the Express server. |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | No | Browser origin allowed by CORS. Set this to the URL of the front end that calls this service. |

Example:

```env
PORT=4000
ALLOWED_ORIGIN=http://localhost:3000
```

## Quick start

### Prerequisites

- Node.js 22 or a compatible modern Node.js version
- npm

### Install dependencies

```bash
npm install
```

### Run in development mode

```bash
npm run dev
```

The development server uses `tsx watch`, so TypeScript changes are picked up automatically.

By default the API is available at:

```text
http://localhost:4000
```

### Confirm the service is running

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "travel-planner-recommendations",
  "source": "static-demo-data"
}
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the TypeScript development server with file watching. |
| `npm run build` | Compiles TypeScript from `src/` into `dist/`. |
| `npm start` | Runs the compiled app from `dist/index.js`. Run `npm run build` first. |

There is currently no automated test script defined in `package.json`.

## API reference

### `GET /health`

Returns basic service status.

#### Request

```http
GET /health
```

#### Successful response

Status: `200 OK`

```json
{
  "status": "ok",
  "service": "travel-planner-recommendations",
  "source": "static-demo-data"
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | Current service status. |
| `service` | string | Stable service identifier. |
| `source` | string | Identifies the response as static demo data. |

### `POST /api/recommendations`

Returns grouped recommendations for a requested destination.

#### Request

```http
POST /api/recommendations
Content-Type: application/json
```

```json
{
  "destination": "Tokyo",
  "interests": ["food", "culture"],
  "budget": 2500
}
```

#### Request fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `destination` | string | Yes | Destination name. It is trimmed, lowercased, and whitespace-normalized before lookup. |
| `interests` | string[] | No | Interest tags used to prioritize items within each category. Matching is case-insensitive. |
| `budget` | number | No | Accepted for request compatibility, but not currently used by the recommendation logic. |

#### Successful response

Status: `200 OK`

```json
{
  "destination": "Tokyo",
  "normalizedDestination": "tokyo",
  "source": "static-demo-data",
  "disclaimer": "Recommendations are static demo data and are not generated by real AI.",
  "recommendations": {
    "hotels": [
      {
        "id": "tokyo-hotel-1",
        "title": "Shinjuku Lantern House",
        "description": "A modern hotel near late-night food streets and major rail connections.",
        "reason": "Ideal for travelers who want easy transit and energetic evenings.",
        "tags": ["transit", "nightlife", "food"],
        "priceLevel": "$$"
      }
    ],
    "routes": [],
    "restaurants": [],
    "attractions": []
  }
}
```

The actual response includes two items in each category.

#### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `destination` | string | Original destination string from the request. |
| `normalizedDestination` | string | Normalized lookup key used by the service. |
| `source` | string | Always `static-demo-data`. |
| `disclaimer` | string | Demo-only data notice. |
| `recommendations.hotels` | RecommendationItem[] | Hotel suggestions. |
| `recommendations.routes` | RecommendationItem[] | Suggested day routes or itinerary segments. |
| `recommendations.restaurants` | RecommendationItem[] | Restaurant suggestions. |
| `recommendations.attractions` | RecommendationItem[] | Attraction suggestions. |

#### Validation error

If `destination` is missing or is not a string, the service returns:

Status: `400 Bad Request`

```json
{
  "error": "destination is required",
  "message": "Provide a destination string to receive static demo recommendations."
}
```

#### Example requests

Tokyo with interest prioritization:

```bash
curl -X POST http://localhost:4000/api/recommendations \
  -H 'Content-Type: application/json' \
  -d '{
    "destination": "Tokyo",
    "interests": ["food", "culture"],
    "budget": 2500
  }'
```

Unsupported destination using fallback data:

```bash
curl -X POST http://localhost:4000/api/recommendations \
  -H 'Content-Type: application/json' \
  -d '{
    "destination": "Lisbon",
    "interests": ["views", "food"]
  }'
```

## Recommendation behavior

### Supported destination data

The service has destination-specific static data for:

- Tokyo
- Paris
- New York

Destination matching is normalized, so inputs like `" Tokyo "`, `"tokyo"`, and `"TOKYO"` all map to the same static dataset.

### Fallback recommendations

If the normalized destination does not match a known destination, the service returns generic fallback recommendations. The response still includes the original destination and a normalized destination so clients can display what the user asked for while understanding that the recommendation set was generic.

### Interest prioritization

The `interests` array does not filter out recommendations. Instead, it reorders items inside each category based on tag matches.

Scoring behavior:

1. Each recommendation item has a `tags` array.
2. Each requested interest is compared with the item's tags case-insensitively.
3. One point is added for each matching interest.
4. Items with higher scores are sorted before items with lower scores.
5. If no interests are provided, the original static ordering is preserved.

For example, if a traveler asks for `"food"`, restaurant and route items tagged with `food` are prioritized within their categories.

### Budget behavior

The request type accepts `budget`, but the current implementation does not use it to sort, filter, or generate recommendations. Price information is represented by each item's `priceLevel`.

### Determinism

There is no randomness in the service. The same request body produces the same response order and content unless the static catalog changes.

## Data model

### Recommendation categories

Every response includes the same four categories:

```ts
type RecommendationCategory = "hotels" | "routes" | "restaurants" | "attractions";
```

### Recommendation item

```ts
interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  reason: string;
  tags: string[];
  priceLevel: "$" | "$$" | "$$$";
}
```

| Field | Description |
| --- | --- |
| `id` | Stable identifier for the demo item. |
| `title` | Display title for the recommendation. |
| `description` | Short user-facing description. |
| `reason` | Explanation for why the item is recommended. |
| `tags` | Interest and context tags used for ordering. |
| `priceLevel` | Simple relative price indicator. |

### Recommendation response

```ts
interface RecommendationResponse {
  destination: string;
  normalizedDestination: string;
  source: "static-demo-data";
  disclaimer: string;
  recommendations: Record<RecommendationCategory, RecommendationItem[]>;
}
```

## Development guide

### Adding a destination

To add destination-specific recommendations:

1. Open `src/recommendations.ts`.
2. Add a new key to `destinationRecommendations` using the normalized destination name.
3. Provide exactly the categories expected by `RecommendationGroups`: `hotels`, `routes`, `restaurants`, and `attractions`.
4. Add recommendation items with useful tags so `interests` can prioritize them.
5. Run `npm run build` to confirm the TypeScript types are valid.

Example destination key:

```ts
const destinationRecommendations: Record<string, RecommendationGroups> = {
  lisbon: {
    hotels: [],
    routes: [],
    restaurants: [],
    attractions: []
  }
};
```

For multi-word destinations, use the normalized lowercase string with single spaces, such as `"new york"`.

### Adding a recommendation item

Each item should:

- have a stable, category-specific `id`;
- use a concise title suitable for cards or list views;
- include a short description;
- explain why the item was selected;
- include tags that callers may send through `interests`;
- use one of the supported price levels: `$`, `$$`, or `$$$`.

### Changing API behavior

If the request or response shape changes, update:

- the TypeScript interfaces in `src/recommendations.ts`;
- the route handling in `src/index.ts`;
- the API examples in this README;
- any consuming Travel Planner services or front-end clients.

### CORS behavior

The app allows one configured origin through the `ALLOWED_ORIGIN` environment variable. In local development this defaults to `http://localhost:3000`, which is suitable for a local front end.

For deployed environments, set `ALLOWED_ORIGIN` to the exact HTTPS origin of the calling app.

## Production and deployment notes

Before running the service outside local development:

1. Install dependencies with `npm install`.
2. Build the TypeScript project with `npm run build`.
3. Set `PORT` and `ALLOWED_ORIGIN` in the runtime environment.
4. Start the compiled service with `npm start`.

Example:

```bash
npm install
npm run build
PORT=4000 ALLOWED_ORIGIN=https://your-travel-planner.example npm start
```

Operational notes:

- The service is stateless and does not require a database.
- The service does not persist user input.
- Horizontal scaling is straightforward because all recommendation data is loaded from source code.
- Update the static catalog through code changes and redeploy.

## Troubleshooting

### `npm start` fails with `Cannot find module 'dist/index.js'`

Run the build first:

```bash
npm run build
npm start
```

### Browser requests are blocked by CORS

Set `ALLOWED_ORIGIN` to the exact origin of the caller. Include the protocol and port when applicable.

Example:

```env
ALLOWED_ORIGIN=http://localhost:3000
```

### `POST /api/recommendations` returns `400`

Make sure the JSON body includes a string `destination` field:

```json
{
  "destination": "Paris"
}
```

### Unsupported destinations return generic data

This is expected. Add destination-specific data to `destinationRecommendations` if the app should return curated suggestions for that destination.

### `budget` does not change the results

This is expected in the current implementation. The field is accepted by the request type but not used by the ranking logic.

## Demo limitations

- Recommendations are static demo content.
- The service does not verify real availability, opening hours, location accuracy, or prices.
- The service does not personalize results beyond simple tag-based ordering.
- The service does not generate content with AI.
- The service does not currently use `budget` in ranking.

Use this service as a stable recommendation stub for the Travel Planner demo, not as a production travel recommendation system.
