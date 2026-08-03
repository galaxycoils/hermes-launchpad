// Anonymous identity for wallet-less users + referral capture.
const ID_KEY = 'hermes_id';
const REF_KEY = 'hermes_ref';

export function getAnonId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = 'anon-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

/** Capture ?ref= from the URL once, persist for signup attribution. */
export function captureRef(): string | null {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && /^[a-zA-Z0-9-]{3,64}$/.test(ref)) {
    localStorage.setItem(REF_KEY, ref);
    // clean the URL
    params.delete('ref');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return ref;
  }
  return localStorage.getItem(REF_KEY);
}

export function shareLink(refCode: string, tokenId?: string): string {
  const base = 'https://hermes-launchpad.pages.dev/';
  return `${base}?ref=${encodeURIComponent(refCode)}${tokenId ? `&token=${tokenId}` : ''}`;
}
