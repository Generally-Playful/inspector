
export default async function handler(req, res) {
  console.log('API handler invoked with method:', req.method, 'url:', req.url);
    // Basic CORS & preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Parse JSON body safely (works on Vercel Node functions)
    let body = '';
    for await (const chunk of req) body += chunk;
    const data = JSON.parse(body || '{}');
    const image = data?.image;
    if (!image?.type || !image?.value) {
      return res.status(400).json({ error: 'Missing { image: { type, value } }' });
    }

    const rfResp = await fetch(
      'https://serverless.roboflow.com/infer/workflows/generally-playful/detect-count-and-visualize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.ROBOFLOW_PRIVATE_KEY, // <-- set in Vercel
          inputs: { image }
        })
      }
    );

    const text = await rfResp.text(); // pass-through body
    // Log Roboflow response for debugging
    console.log('Roboflow response status:', rfResp.status);
    console.log('Roboflow response body:', text);
    res.setHeader('Content-Type', 'application/json');
    res
      .status(rfResp.ok ? 200 : rfResp.status)
      .send(text);
  } catch (e) {
    // Log error details for debugging
    console.error('API handler error:', e);
    res.status(500).json({ error: 'proxy_error', detail: String(e) });
  }
}
