// Pure helper — no server imports — so it's safe to use from client
// components (SchedulerList is rendered inside the client SchedulerView).
export function buildLiveLink(platform: string, platformPostId: string): string | null {
  switch (platform) {
    case "FACEBOOK":
      return `https://www.facebook.com/${platformPostId}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/p/${platformPostId}`;
    case "LINKEDIN":
      return `https://www.linkedin.com/feed/update/${platformPostId}`;
    case "X":
      return `https://x.com/i/web/status/${platformPostId}`;
    default:
      return null;
  }
}
