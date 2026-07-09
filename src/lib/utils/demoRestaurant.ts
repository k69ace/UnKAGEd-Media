import { createSeededRandom, range } from "./seededRandom";

// Shared demo-mode profile generator so multiple agents (Reviews, GBP,
// Competitors) that lack API keys still agree on the same "estimated"
// rating/review-count for a given restaurant instead of drifting apart.

export type DemoTargetProfile = {
  rating: number;
  reviewCount: number;
};

export function demoTargetProfile(seedKey: string): DemoTargetProfile {
  const rng = createSeededRandom(seedKey);
  const rating = Math.round((3.2 + rng() * 1.6) * 10) / 10; // 3.2 - 4.8
  const reviewCount = range(rng, 15, 650);
  return { rating, reviewCount };
}
