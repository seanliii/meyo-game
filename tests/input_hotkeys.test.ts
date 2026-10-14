import { describe, expect, it } from 'vitest';

import { resolveLevelAbilityHotkey, resolveReservedHotkey } from '../src/game/input';

describe('reserved hotkeys around the shop', () => {
  it('routes B and Enter to quick-buy while the shop is open', () => {
    expect(resolveReservedHotkey('b', { shopOpen: true, ended: false })).toBe('shop-buy');
    expect(resolveReservedHotkey('Enter', { shopOpen: true, ended: false })).toBe('shop-buy');
  });

  it('keeps B as recall and Enter as chat while the shop is closed', () => {
    expect(resolveReservedHotkey('b', { shopOpen: false, ended: false })).toBe('recall');
    expect(resolveReservedHotkey('Enter', { shopOpen: false, ended: false })).toBe('open-chat');
  });
});

describe('ability level hotkeys', () => {
  it('allows Shift+QWER as a browser-safe level-up path', () => {
    expect(resolveLevelAbilityHotkey('q', { altKey: false, shiftKey: true })).toBe('Q');
    expect(resolveLevelAbilityHotkey('W', { altKey: false, shiftKey: true })).toBe('W');
  });

  it('keeps Alt+QWER working for existing desktop muscle memory', () => {
    expect(resolveLevelAbilityHotkey('e', { altKey: true, shiftKey: false })).toBe('E');
    expect(resolveLevelAbilityHotkey('R', { altKey: true, shiftKey: false })).toBe('R');
  });

  it('ignores plain keys and non-ability keys', () => {
    expect(resolveLevelAbilityHotkey('q', { altKey: false, shiftKey: false })).toBeNull();
    expect(resolveLevelAbilityHotkey('x', { altKey: true, shiftKey: false })).toBeNull();
  });
});
