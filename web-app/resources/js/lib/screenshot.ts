/** Turn a relative "public" disk path (as stored on audit findings) into a browser-loadable URL. */
export function screenshotUrl(path?: string | null): string | null {
  if (!path) return null;
  return `/storage/${path}`;
}
