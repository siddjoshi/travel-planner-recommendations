import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { getRecommendations, isTripStyle, type RecommendationRequest } from "./recommendations.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "travel-planner-recommendations",
    source: "static-demo-data"
  });
});

app.post("/api/recommendations", (request, response) => {
  const body = request.body as RecommendationRequest;

  if (!body.destination || typeof body.destination !== "string") {
    response.status(400).json({
      error: "destination is required",
      message: "Provide a destination string to receive static demo recommendations."
    });
    return;
  }

  if (body.tripStyle !== undefined && !isTripStyle(body.tripStyle)) {
    response.status(400).json({
      error: "tripStyle is invalid",
      message: "Provide tripStyle as relaxed, balanced, or packed."
    });
    return;
  }

  response.json(getRecommendations(body));
});

app.listen(port, () => {
  console.log(`Travel Planner Recommendation Engine running at http://localhost:${port}`);
});
