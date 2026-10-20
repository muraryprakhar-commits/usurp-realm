// Confirms a Crest Studio payment with Dodo before the download page unlocks.
// Needs the Vercel environment variable DODO_API_KEY (a live Dodo API key).
const PRODUCT_ID = 'pdt_0Nq7l6osvcUL8N0wu65UL';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = String((req.query && req.query.payment_id) || '');
  if (!/^pay_[A-Za-z0-9]{6,64}$/.test(id)) return res.status(400).json({ ok: false, error: 'bad_payment_id' });
  const key = process.env.DODO_API_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not_configured' });
  try {
    const base = process.env.DODO_API_BASE || 'https://live.dodopayments.com';
    const r = await fetch(`${base}/payments/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    if (r.status === 404) return res.status(404).json({ ok: false, error: 'not_found' });
    if (!r.ok) return res.status(502).json({ ok: false, error: 'provider_error' });
    const p = await r.json();
    // product_cart may be empty for some checkout types; only reject when it names a different product.
    const cart = Array.isArray(p.product_cart) ? p.product_cart : [];
    const forCrest = cart.length === 0 || cart.some(i => i.product_id === PRODUCT_ID);
    const refunded = p.refund_status === 'full';
    if (p.status !== 'succeeded' || !forCrest || refunded) return res.status(402).json({ ok: false, error: 'not_paid' });
    const design = p.metadata && typeof p.metadata.design === 'string' ? p.metadata.design.slice(0, 600) : null;
    return res.status(200).json({ ok: true, design });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'provider_unreachable' });
  }
};
