import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getRecommendations, isTripStyle, resolveTripStyle, type RecommendationRequest } from "./recommendations.js";

function ids(items: { id: string }[]): string[] {
  return items.map((item) => item.id);
}

describe("getRecommendations tripStyle", () => {
  it("defaults omitted tripStyle to balanced and preserves the existing order", () => {
    const response = getRecommendations({ destination: "Tokyo" });

    assert.equal(response.tripStyle, "balanced");
    assert.deepEqual(ids(response.recommendations.hotels), ["tokyo-hotel-1", "tokyo-hotel-2"]);
    assert.deepEqual(ids(response.recommendations.routes), ["tokyo-route-1", "tokyo-route-2"]);
    assert.deepEqual(ids(response.recommendations.restaurants), ["tokyo-restaurant-1", "tokyo-restaurant-2"]);
    assert.deepEqual(ids(response.recommendations.attractions), ["tokyo-attraction-1", "tokyo-attraction-2"]);
  });

  it("keeps balanced behavior focused on matching interests", () => {
    const response = getRecommendations({
      destination: "Tokyo",
      interests: ["culture"],
      tripStyle: "balanced"
    });

    assert.equal(response.tripStyle, "balanced");
    assert.deepEqual(ids(response.recommendations.hotels), ["tokyo-hotel-2", "tokyo-hotel-1"]);
    assert.deepEqual(ids(response.recommendations.routes), ["tokyo-route-1", "tokyo-route-2"]);
    assert.deepEqual(ids(response.recommendations.attractions), ["tokyo-attraction-1", "tokyo-attraction-2"]);
  });

  it("prioritizes calmer low-friction tags for relaxed trips", () => {
    const response = getRecommendations({
      destination: "Paris",
      tripStyle: "relaxed"
    });

    assert.equal(response.tripStyle, "relaxed");
    assert.deepEqual(ids(response.recommendations.attractions), ["paris-attraction-2", "paris-attraction-1"]);
  });

  it("treats views as a relaxed trip signal", () => {
    const response = getRecommendations({
      destination: "Unknown place",
      tripStyle: "relaxed"
    });

    assert.equal(response.tripStyle, "relaxed");
    assert.deepEqual(ids(response.recommendations.attractions), ["fallback-attraction-2", "fallback-attraction-1"]);
  });

  it("prioritizes landmark-heavy energetic tags for packed trips", () => {
    const response = getRecommendations({
      destination: "New York",
      tripStyle: "packed"
    });

    assert.equal(response.tripStyle, "packed");
    assert.deepEqual(ids(response.recommendations.attractions), ["nyc-attraction-2", "nyc-attraction-1"]);
  });

  it("uses tripStyle before interest matches for non-balanced trips", () => {
    const response = getRecommendations({
      destination: "New York",
      interests: ["museum"],
      tripStyle: "packed"
    });

    assert.equal(response.tripStyle, "packed");
    assert.deepEqual(ids(response.recommendations.attractions), ["nyc-attraction-2", "nyc-attraction-1"]);
  });

  it("resolves invalid library-level tripStyle values to balanced", () => {
    const request = {
      destination: "Tokyo",
      tripStyle: "chill"
    } as unknown as RecommendationRequest;

    const response = getRecommendations(request);

    assert.equal(resolveTripStyle(undefined), "balanced");
    assert.equal(resolveTripStyle("chill"), "balanced");
    assert.equal(response.tripStyle, "balanced");
  });
});

describe("isTripStyle", () => {
  it("accepts only the exact tripStyle contract values", () => {
    assert.equal(isTripStyle("relaxed"), true);
    assert.equal(isTripStyle("balanced"), true);
    assert.equal(isTripStyle("packed"), true);
    assert.equal(isTripStyle("Relaxed"), false);
    assert.equal(isTripStyle("chill"), false);
    assert.equal(isTripStyle(42), false);
    assert.equal(isTripStyle(null), false);
    assert.equal(isTripStyle(""), false);
  });
});
