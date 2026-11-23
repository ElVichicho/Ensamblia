type CatalogRpc = <T>(name: string, body?: Record<string,unknown>) => Promise<T>;
export function catalogRpc(write = false): CatalogRpc | undefined {
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const key = write ? secret : process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim() || secret;
  if (!url || !key) return;
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) throw new Error("Invalid Supabase URL");
  return async <T>(name: string, body: Record<string,unknown> = {}) => {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method:"POST",headers:{apikey:key,"Content-Type":"application/json",...(key.startsWith("eyJ")?{Authorization:`Bearer ${key}`}:{})},
      body:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(write?25000:8000),
    });
    if (!response.ok) throw new Error(`Catalog database request failed (${response.status})`);
    return await response.json() as T;
  };
}
