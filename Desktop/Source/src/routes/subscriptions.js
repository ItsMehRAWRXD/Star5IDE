const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
const { auth, requireSubscription } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: req.user.email,
      client_reference_id: req.user._id.toString(),
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plans', auth, async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      expand: ['data.product']
    });

    const plans = prices.data.map(price => ({
      id: price.id,
      name: price.product.name,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring.interval
    }));

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSubscriptionUpdate(session);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
  }

  res.json({ received: true });
});

async function handleSubscriptionUpdate(data) {
  // Handle subscription updates here
  console.log('Subscription update:', data);
}

module.exports = router;
