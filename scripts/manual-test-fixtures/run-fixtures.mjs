import http from "node:http";

import { fixtureConfig } from "./fixture-config.mjs";
import { demoPlaylistFixture, demoXtreamFixture } from "./fixture-data.mjs";

const startSourceServer = () => {
  const server = http.createServer((req, res) => {
    if (fixtureConfig.sourceType === "m3u") {
      if (req.url !== "/playlist.m3u") {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200, { "content-type": "application/x-mpegURL" });
      res.end(demoPlaylistFixture);
      return;
    }

    const url = new URL(
      req.url ?? "/",
      `http://${fixtureConfig.advertisedHost}:${fixtureConfig.sourcePort}`
    );
    if (url.pathname !== "/player_api.php") {
      res.writeHead(404);
      res.end();
      return;
    }

    const action = url.searchParams.get("action");
    const payload =
      action === "get_vod_categories"
        ? demoXtreamFixture.vodCategories
        : action === "get_series_categories"
          ? demoXtreamFixture.seriesCategories
          : action === "get_live_categories"
            ? demoXtreamFixture.liveCategories
            : action === "get_vod_streams"
              ? demoXtreamFixture.vods
              : action === "get_series"
                ? demoXtreamFixture.series
                : action === "get_live_streams"
                  ? demoXtreamFixture.lives
                  : action === "get_vod_info"
                    ? demoXtreamFixture.details.vod
                    : action === "get_series_info"
                      ? demoXtreamFixture.details.series
                      : action === "get_live_info"
                        ? demoXtreamFixture.details.live
                        : null;

    if (payload === null) {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  });

  return new Promise((resolve) => {
    server.listen(fixtureConfig.sourcePort, fixtureConfig.bindHost, () => resolve(server));
  });
};

const startPrimaryServer = () => {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/validate") {
      res.writeHead(404);
      res.end();
      return;
    }

    const playlist =
      fixtureConfig.sourceType === "m3u"
        ? {
            playlistId: fixtureConfig.playlistId,
            sourceType: "m3u",
            displayName: fixtureConfig.playlistName,
            m3u: {
              url: `http://${fixtureConfig.advertisedHost}:${fixtureConfig.sourcePort}/playlist.m3u`
            }
          }
        : {
            playlistId: fixtureConfig.playlistId,
            sourceType: "xtream",
            displayName: fixtureConfig.playlistName,
            xtream: {
              serverUrl: `http://${fixtureConfig.advertisedHost}:${fixtureConfig.sourcePort}/`,
              username: "xtream_user",
              password: "xtream_pass"
            }
          };

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        principalId: "principal_demo",
        tenantId: "tenant_demo",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        playlists: [playlist]
      })
    );
  });

  return new Promise((resolve) => {
    server.listen(fixtureConfig.primaryPort, fixtureConfig.bindHost, () => resolve(server));
  });
};

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const printInstructions = () => {
  const playlistFetchCommand = `curl -H "Authorization: Bearer ${fixtureConfig.token}" "http://127.0.0.1:3000/api/playlists/${fixtureConfig.playlistId}/items?page=1&pageSize=20"`;

  console.log("");
  console.log("Manual fixture servers are running.");
  console.log(`Bind host:      ${fixtureConfig.bindHost}`);
  console.log(`Advertised host:${fixtureConfig.advertisedHost}`);
  console.log(`Primary server: http://${fixtureConfig.advertisedHost}:${fixtureConfig.primaryPort}/validate`);
  console.log(`Source server:  http://${fixtureConfig.advertisedHost}:${fixtureConfig.sourcePort}`);
  console.log(`Source type:    ${fixtureConfig.sourceType}`);
  console.log(`Playlist id:    ${fixtureConfig.playlistId}`);
  console.log(`Bearer token:   ${fixtureConfig.token}`);
  console.log("");
  console.log("Suggested runtime setup:");
  console.log(`  PRIMARY_SERVER_URL=http://${fixtureConfig.advertisedHost}:${fixtureConfig.primaryPort}`);
  console.log(`  MANUAL_FIXTURE_SOURCE_TYPE=${fixtureConfig.sourceType}`);
  console.log("");
  console.log("Suggested manual request:");
  console.log(`  ${playlistFetchCommand}`);
  console.log("");
  console.log("Press Ctrl+C to stop both fixture servers.");
};

const main = async () => {
  const [sourceServer, primaryServer] = await Promise.all([
    startSourceServer(),
    startPrimaryServer()
  ]);

  printInstructions();

  const shutdown = async () => {
    await Promise.allSettled([closeServer(primaryServer), closeServer(sourceServer)]);
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
};

void main();
