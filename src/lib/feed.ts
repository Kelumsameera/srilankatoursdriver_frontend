// The community feed's menu choices. Kept outside the "use client" feed component so the server page can use them too.
export const FEED_FILTERS = ["all", "stories", "reels", "photos", "articles"] as const;
export type FeedFilter = (typeof FEED_FILTERS)[number];
