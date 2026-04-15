import { randomUUID } from 'node:crypto';

import { expect, test } from '../../fixtures/e2e.fixture';
import { PlaylistsPage } from '../../pages/playlists.page';
import { loginSeededUserViaUi, seedScenario } from '../../tasks/customer-workflows';
import { pollUntil } from '../../utils/polling';

test('@smoke playlist-entitled-crud adds a playlist for an entitled customer', async ({ page, e2eApi }) => {
  const { seed } = await seedScenario(e2eApi, {
    scenarioId: 'customer-active',
    email: `playlist-entitled.${randomUUID()}@e2e.viseo.test`
  });

  const auth = await e2eApi.login(seed);
  await loginSeededUserViaUi(page, seed);

  const playlistsPage = new PlaylistsPage(page);
  await playlistsPage.goto();

  const playlistName = `Playlist ${seed.runId}`;
  await playlistsPage.addPlaylist(playlistName, 'https://example.com/playlist.m3u');

  const playlists = await pollUntil(
    () => e2eApi.getPlaylists(auth.token),
    (response) => response.content.some((entry) => entry.name === playlistName),
    { description: 'Playlist was not persisted in backend state' }
  );
  const createdPlaylist = playlists.content.find((entry) => entry.name === playlistName);
  expect(createdPlaylist).toBeDefined();

  await playlistsPage.expectPlaylistRendered(createdPlaylist!.id);
});
