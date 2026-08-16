const RPC_TARGET = 'https://devnet.helius-rpc.com/?api-key=d2891b4a-5a20-48ea-9ce1-046c2b899bbe';


const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, solana-client',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/rpc') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
      const upstream = await fetch(RPC_TARGET, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'solana-client': 'hermes-launchpad/1.0' },
        body: await request.text(),
      });
      const res = new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json', ...cors } });
      return res;
    }
    return env.ASSETS.fetch(request);
  },
};
