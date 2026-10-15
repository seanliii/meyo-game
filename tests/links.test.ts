// The one outward link this deployment keeps: the deployer's own
// repository, never the upstream author's. The Discord invite is gone
// from the UI (no Discord door, no welcome strip), so DISCORD is empty
// and nothing in the client may show it.

import { describe, expect, it } from 'vitest';
import { welcomesToDiscord, welcomeWords } from '../src/ui/discord_welcome';
import { DISCORD, PRIVACY, REPO } from '../src/ui/links';

describe('the outward links', () => {
  it('point at the deployer repository, not the upstream author', () => {
    expect(REPO).toBe('https://github.com/seanliii/meyo-game');
    // The page has to be reachable from the game, or the promise in it is
    // only made to people who read the source.
    expect(PRIVACY).toBe(`${REPO}/blob/main/PRIVACY.md`);
  });

  it('carries no Discord invite: the UI shows none', () => {
    // Empty means the landing bar, the auth form and the account drawer
    // have nothing to render; the button and the welcome are gone.
    expect(DISCORD).toBe('');
  });
});

describe('the Discord welcome', () => {
  it('greets the account that was just created, and nobody else', () => {
    expect(welcomesToDiscord('created')).toBe(true);
    expect(welcomesToDiscord('joined')).toBe(true);
    // A player coming back for their tenth match has already decided.
    expect(welcomesToDiscord('signedin')).toBe(false);
    expect(welcomesToDiscord('failed')).toBe(false);
    expect(welcomesToDiscord('off')).toBe(false);
    expect(welcomesToDiscord(null)).toBe(false);
  });

  it('stops inviting somebody the auto-join already let in', () => {
    // Being asked to join a server you are standing in reads as a bug.
    expect(welcomeWords('created').link).toBe('Join the Discord');
    expect(welcomeWords('joined').link).toBe('Open the server');
    expect(welcomeWords('joined').lead).toContain('you are in the Discord');
  });
});
