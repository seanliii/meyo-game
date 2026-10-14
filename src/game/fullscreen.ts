// Fullscreen helpers: entering the match takes the whole screen so a
// misclick past the window edge cannot yank focus mid-fight. Browsers only
// grant the request inside a user gesture, which is why the entry points
// are click handlers (lock-in, the escape menu button). Esc always exits
// fullscreen at the browser's discretion; that cannot be prevented.

import { glProfile } from './gl_profile';

// Automation (managed browser, headless WebGL) must not take the screen or
// lock the pointer: those freeze native mouse coordinates and stop every
// synthetic click, which is what hung the first in-match shop click until
// the browser lease died. Real players still get the immersive path.
const automation =
  typeof navigator !== 'undefined' &&
  (navigator.webdriver === true || glProfile().software);

// Resolves once the request has been answered, so a caller that wants the
// screen turned as well (game/orientation.ts) can ask the moment the
// document is fullscreen, which is the only state a lock is granted in.
export function requestGameFullscreen(): Promise<void> {
  if (automation) return Promise.resolve();
  if (document.fullscreenElement) return Promise.resolve();
  return document.documentElement.requestFullscreen?.().catch(() => undefined) ?? Promise.resolve();
}

export function toggleGameFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  } else {
    requestGameFullscreen();
  }
}
