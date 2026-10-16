// The news (CONTEXT.md: News): what changed on the server, an update, an
// event, a decision, written by hand and committed like content. Nothing
// here is generated from the players: the home's panels already show the
// latest from the Forge and the ladder, and a counter reads small on a
// quiet day where a dated note from three days ago reads alive.
//
// A change the player sees adds an entry in the same change
// (CONTRIBUTING.md). Newest first; the gate in tests/news.test.ts holds
// the dates, the images and the links to what the page can show.

// Where a link may point: a tile or a section of the home, never a URL.
export const NEWS_DESTINATIONS = [
  'play',
  'forge',
  'academy',
  'ladder',
  'gallery',
  'champions',
] as const;
export type NewsDestination = (typeof NEWS_DESTINATIONS)[number];

export interface NewsEntry {
  // Published, UTC.
  day: string;
  title: string;
  // Plain text paragraphs. No markdown: the client has no engine for it.
  body: readonly string[];
  // A file under src/ui/news_art/, 1280 wide (news_images.ts ships it).
  image?: string;
  link?: { label: string; to: NewsDestination };
  // An event's time, an ISO instant. While it is ahead, the entry is
  // pinned at the top (src/ui/news.ts).
  at?: string;
}
