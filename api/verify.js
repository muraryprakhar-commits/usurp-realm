// Confirms a Crest Studio payment with Dodo before downloads unlock, and says which product was bought.
// Needs the Vercel environment variable DODO_API_KEY (a live Dodo API key).
const PRODUCTS = {
  crest: 'pdt_0Nq7l6osvcUL8N0wu65UL',   // Custom Coat of Arms, $9
  kit: 'pdt_0Nq8R4zhafrgCTZA1HYkj',     // Crest Logo Kit, $29
};

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
    // Which product? Trust only Dodo's own record: the product cart, or (if a checkout type leaves the cart empty)
    // the settled amount, never anything the buyer could put in the URL.
    const ids = (Array.isArray(p.product_cart) ? p.product_cart : []).map(i => i && i.product_id);
    let plan = null;
    if (ids.includes(PRODUCTS.kit)) plan = 'kit';
    else if (ids.includes(PRODUCTS.crest)) plan = 'crest';
    else if (ids.length === 0) plan = String(p.settlement_currency || '').toUpperCase() === 'USD' && Number(p.settlement_amount) >= 1500 ? 'kit' : 'crest';
    const refunded = p.refund_status === 'full';
    if (p.status !== 'succeeded' || !plan || refunded) return res.status(402).json({ ok: false, error: 'not_paid' });
    const design = p.metadata && typeof p.metadata.design === 'string' ? p.metadata.design.slice(0, 600) : null;
    return res.status(200).json({ ok: true, design, plan });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'provider_unreachable' });
  }
};
