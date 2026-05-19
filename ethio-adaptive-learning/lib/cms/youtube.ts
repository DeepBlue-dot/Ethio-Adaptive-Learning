const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"])

export type NormalizedYouTubeUrl = {
  videoId: string
  url: string
  thumbnailUrl: string
}

export function normalizeYouTubeUrl(rawUrl: string): NormalizedYouTubeUrl {
  let url: URL

  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error("Enter a valid YouTube URL.")
  }

  if (!YOUTUBE_HOSTS.has(url.hostname)) {
    throw new Error("Only YouTube video URLs are supported.")
  }

  const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v")

  if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    throw new Error("The YouTube video ID could not be found.")
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  }
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
}
