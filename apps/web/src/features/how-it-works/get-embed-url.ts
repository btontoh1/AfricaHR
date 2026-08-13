/**
 * Turns a YouTube/Vimeo/Loom watch/share link into its iframe-embeddable
 * form. Returns null for anything else - the UI falls back to a plain
 * "Watch video" link rather than risking an iframe pointed at an arbitrary,
 * unrecognized host.
 */
export function getEmbedUrl(videoUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.split('/').pop();
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === 'loom.com') {
    const id = url.pathname.split('/').filter(Boolean).pop();
    return id ? `https://www.loom.com/embed/${id}` : null;
  }

  return null;
}
