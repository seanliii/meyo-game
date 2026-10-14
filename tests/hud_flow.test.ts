import { describe, expect, it } from 'vitest';
import { resolveReservedHotkey } from '../src/game/input';
import {
  defaultShopSelection,
  escapeHotkeyAction,
  shopHotkeyAction,
  syncBlockingStateForWinner,
  shouldPromptOpeningShop,
} from '../src/ui/hud';

describe('hud hotkey routing', () => {
  it('uses Escape to close the shop before opening the pause menu', () => {
    expect(
      escapeHotkeyAction({
        shopOpen: true,
        escapeOpen: false,
        endOpen: false,
      }),
    ).toBe('close-shop');
  });

  it('uses Escape to toggle the pause menu when no shop is blocking', () => {
    expect(
      escapeHotkeyAction({
        shopOpen: false,
        escapeOpen: false,
        endOpen: false,
      }),
    ).toBe('toggle-escape');
  });

  it('lets P switch to the shop instead of stacking it on top of pause', () => {
    expect(
      shopHotkeyAction({
        shopOpen: false,
        escapeOpen: true,
        endOpen: false,
      }),
    ).toBe('open-shop');
  });

  it('keeps Escape dead on the end screen but lets P close a shop stranded open by the ending', () => {
    // Esc must never stack the pause menu over the end screen.
    const ended = { shopOpen: true, escapeOpen: false, endOpen: true } as const;
    expect(escapeHotkeyAction(ended)).toBe('none');
    // P still closes a shop that was open when the match ended — the
    // stranded-shop deadlock. setShopOpen refuses to open while the end
    // overlay is up, so close is all P can ever do here.
    expect(shopHotkeyAction(ended)).toBe('close-shop');
    expect(shopHotkeyAction({ ...ended, shopOpen: false })).toBe('close-shop');
  });
});

describe('reserved hotkeys on the end screen', () => {
  it('hands Tab and Enter back to the browser once the match has a winner', () => {
    // Keyboard focus must be able to reach Play again / Return to menu.
    expect(resolveReservedHotkey('Tab', { shopOpen: false, ended: true })).toBeNull();
    expect(resolveReservedHotkey('Enter', { shopOpen: false, ended: true })).toBeNull();
  });

  it('keeps the in-match meanings while the match is live', () => {
    expect(resolveReservedHotkey('Tab', { shopOpen: false, ended: false })).toBe(
      'toggle-scoreboard',
    );
    expect(resolveReservedHotkey('Enter', { shopOpen: true, ended: false })).toBe('shop-buy');
    expect(resolveReservedHotkey('Enter', { shopOpen: false, ended: false })).toBe('open-chat');
  });
});

describe('end overlay blocking state', () => {
  it('drops shop and escape before opening the result overlay', () => {
    expect(
      syncBlockingStateForWinner(
        { shopOpen: true, escapeOpen: true, endOpen: false },
        1,
      ),
    ).toEqual({
      shopOpen: false,
      escapeOpen: false,
      endOpen: true,
    });
  });

  it('leaves the live-match blocking state untouched before a winner exists', () => {
    const live = { shopOpen: true, escapeOpen: false, endOpen: false } as const;
    expect(syncBlockingStateForWinner(live, null)).toEqual(live);
  });
});

describe('opening shop prompt', () => {
  it('prompts at match start without forcing a modal over the spawn view', () => {
    expect(shouldPromptOpeningShop(0, null)).toBe(true);
    expect(shouldPromptOpeningShop(4.9, null)).toBe(true);
    expect(shouldPromptOpeningShop(5, null)).toBe(false);
    expect(shouldPromptOpeningShop(0, 0)).toBe(false);
  });
});

describe('default shop selection', () => {
  it('prefers the first affordable component so keyboard buy has a valid target', () => {
    expect(defaultShopSelection([], 500)).toBe('iron_blade');
    expect(defaultShopSelection([], 0)).toBe('iron_blade');
  });
});
