import "dotenv/config";

const parsePort = (value, fallback) => {
  const parsed = Number.parseInt(value ?? `${fallback}`, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const fixtureConfig = {
  sourceType: process.env.MANUAL_FIXTURE_SOURCE_TYPE === "xtream" ? "xtream" : "m3u",
  primaryPort: parsePort(process.env.MANUAL_FIXTURE_PRIMARY_PORT, 4000),
  sourcePort: parsePort(process.env.MANUAL_FIXTURE_SOURCE_PORT, 5000),
  bindHost: process.env.MANUAL_FIXTURE_BIND_HOST ?? "127.0.0.1",
  advertisedHost: process.env.MANUAL_FIXTURE_ADVERTISED_HOST ?? "127.0.0.1",
  playlistId: process.env.MANUAL_FIXTURE_PLAYLIST_ID ?? "pl_demo",
  playlistName: process.env.MANUAL_FIXTURE_PLAYLIST_NAME ?? "Demo Playlist",
  token: process.env.MANUAL_FIXTURE_TOKEN ?? "demo-token"
};
