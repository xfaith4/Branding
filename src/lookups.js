const TLDS = ['com', 'io', 'ai', 'app', 'co', 'dev'];

export function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

async function request(url, fetcher) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetcher(url, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) return { status: response.status, data: null };
    return { status: response.status, data: await response.json() };
  } finally { clearTimeout(timeout); }
}

export async function checkDomain(slug, tld, fetcher = fetch) {
  const host = `${slug}.${tld}`;
  try {
    const { data } = await request(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A&edns_client_subnet=0.0.0.0%2F0`, fetcher);
    if (data?.Status === 3) return { host, resolves: false, label: 'NXDOMAIN' };
    if (data?.Status === 0 && (!data.Answer || Array.isArray(data.Answer))) {
      const resolves = (data.Answer ?? []).some(record => record.type === 1 && typeof record.data === 'string');
      return { host, resolves, label: resolves ? 'A record found' : 'no A record' };
    }
  } catch { /* A failed lookup is unknown, never available. */ }
  return { host, resolves: null, label: 'unknown' };
}

export async function checkGitHubUser(slug, fetcher = fetch) {
  try {
    const { status, data } = await request(`https://api.github.com/users/${encodeURIComponent(slug)}`, fetcher);
    if (status === 404) return { exists: false };
    if (status === 200 && typeof data?.login === 'string') return { exists: true, type: data.type === 'Organization' ? 'Organization' : 'User' };
    return { exists: null, rateLimited: status === 403 || status === 429 };
  } catch { return { exists: null }; }
}

export async function checkGitHubRepos(slug, fetcher = fetch) {
  try {
    const { data } = await request(`https://api.github.com/search/repositories?q=${encodeURIComponent(`${slug} in:name`)}&per_page=5`, fetcher);
    if (!data || data.incomplete_results || !Number.isInteger(data.total_count) || !Array.isArray(data.items)) return { count: null };
    return {
      count: data.total_count,
      exactMatches: data.items.filter(item => typeof item.name === 'string' && item.name.toLowerCase() === slug).length,
    };
  } catch { return { count: null }; }
}

export async function runAvailability(name, fetcher = fetch) {
  const slug = slugify(name);
  if (!slug || slug.length > 63) {
    return { slug, domains: [], ghUser: { exists: null }, ghRepos: { count: null }, error: 'Lookups need a name containing 1–63 ASCII letters or digits after removing spaces and punctuation.' };
  }
  const [ghUser, ghRepos, ...domains] = await Promise.all([
    slug.length <= 39 ? checkGitHubUser(slug, fetcher) : Promise.resolve({ exists: null }),
    checkGitHubRepos(slug, fetcher),
    ...TLDS.map(tld => checkDomain(slug, tld, fetcher)),
  ]);
  return { slug, ghUser, ghRepos, domains };
}
