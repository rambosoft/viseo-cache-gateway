import { expect, Page } from '@playwright/test';

export class PlaylistsPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/playlists/);
    await expect(this.page.getByTestId('playlists-profile-menu-button')).toBeVisible();
  }

  async goto(): Promise<void> {
    await this.page.goto('/playlists');
    await this.expectLoaded();
  }

  async addPlaylist(name: string, path: string): Promise<void> {
    await this.page.getByTestId('playlists-full-url-name-input').fill(name);
    await this.page.getByTestId('playlists-full-url-path-input').fill(path);
    await this.page.getByTestId('playlists-full-url-submit-button').click();
  }

  async expectPlaylistRendered(playlistId: number): Promise<void> {
    await expect(this.page.getByTestId('playlists-card-list')).toBeVisible();
    await expect(this.page.getByTestId(`playlists-edit-button-${playlistId}`)).toBeVisible();
    await expect(this.page.getByTestId(`playlists-remove-button-${playlistId}`)).toBeVisible();
  }

  async openSettingsFromMenu(): Promise<void> {
    await this.page.getByTestId('playlists-profile-menu-button').click();
    await this.page.getByTestId('playlists-open-settings-button').click();
  }
}
