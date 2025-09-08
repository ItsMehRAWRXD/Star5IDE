const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium', 'enterprise']
  },
  price: {
    monthly: Number,
    yearly: Number
  },
  features: {
    users: Number,
    storage: String,
    support: String,
    apiCalls: Number
  },
  stripePriceId: {
    monthly: String,
    yearly: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
