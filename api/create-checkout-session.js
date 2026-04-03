/* Stripe Checkout 세션 생성 — 사이트 유지비 지원
   흐름: 프론트에서 금액 전달 → Stripe 세션 생성 → Stripe 결제 페이지 URL 반환
   LINE Pay / 카드 등 Stripe 대시보드에서 활성화한 결제 수단 자동 지원 */

import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { amount } = req.body; // 엔화(JPY) — 100, 500, 또는 자유 입력값

  if (!amount || amount < 100) {
    return res.status(400).json({ error: '최소 금액은 100엔입니다.' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = req.headers.origin || 'https://caredoc-navy.vercel.app';

  try {
    const session = await stripe.checkout.sessions.create({
      automatic_payment_methods: { enabled: true },
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'CareDoc サイト維持費のご支援 🐾',
            description: 'いつもご利用いただきありがとうございます。',
          },
          unit_amount: amount, /* JPY는 소수점 없는 통화 — 100 = ¥100 */
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/?support=thanks`,
      cancel_url:  `${origin}/`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err);
    res.status(500).json({ error: err.message });
  }
}
