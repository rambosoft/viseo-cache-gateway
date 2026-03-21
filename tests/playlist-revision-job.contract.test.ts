import { describe, expect, it } from "vitest";

import { parsePlaylistRevisionJob } from "../src/core/jobs/playlistRevisionJob";

describe("playlist revision job contract", () => {
  it("validates and normalizes a queued playlist revision job payload", () => {
    const job = parsePlaylistRevisionJob({
      tenantId: "tenant_demo",
      principalId: "principal_demo",
      playlist: {
        playlistId: "pl_demo",
        sourceType: "m3u",
        displayName: "Demo Playlist",
        m3u: {
          url: "https://example.com/playlist.m3u"
        }
      },
      requestedAt: new Date().toISOString(),
      reason: "missing_revision"
    });

    expect(job.tenantId).toBe("tenant_demo");
    expect(job.playlist.sourceType).toBe("m3u");
    expect(job.reason).toBe("missing_revision");
  });

  it("rejects malformed playlist revision job payloads", () => {
    expect(() =>
      parsePlaylistRevisionJob({
        tenantId: "tenant_demo",
        principalId: "principal_demo",
        playlist: {
          playlistId: "pl_demo",
          sourceType: "m3u",
          m3u: {
            url: "not-a-url"
          }
        },
        requestedAt: "not-a-date",
        reason: "missing_revision"
      })
    ).toThrow();
  });
});
