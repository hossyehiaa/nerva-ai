'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Starter',
    price: '1,500',
    currency: 'EGP',
    period: '/month',
    description: 'Perfect for small businesses getting started with AI automation.',
    features: [
      { text: '1 AI Agent', included: true },
      { text: '500 leads/month', included: true },
      { text: 'WhatsApp Integration', included: true },
      { text: 'Basic Dashboard', included: true },
      { text: 'Email Support', included: true },
      { text: 'Multiple Agents', included: false },
      { text: 'Custom Knowledge Base', included: false },
      { text: 'API Access', included: false },
    ],
    cta: 'Start Starter',
    popular: false,
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    name: 'Pro',
    price: '3,500',
    currency: 'EGP',
    period: '/month',
    description: 'For growing businesses that need more power and flexibility.',
    features: [
      { text: '3 AI Agents', included: true },
      { text: 'Unlimited leads', included: true },
      { text: 'WhatsApp Integration', included: true },
      { text: 'Full Dashboard + CRM', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Multiple Agents', included: true },
      { text: 'Custom Knowledge Base', included: true },
      { text: 'API Access', included: true },
    ],
    cta: 'Start Pro',
    popular: true,
    gradient: 'from-nerva-cyan to-nerva-blue',
  },
  {
    name: 'Agency',
    price: '10,000',
    currency: 'EGP',
    period: '/month',
    description: 'For agencies and enterprises managing multiple businesses at scale.',
    features: [
      { text: '10 AI Agents', included: true },
      { text: 'Unlimited leads', included: true },
      { text: 'All Integrations', included: true },
      { text: 'White-label Dashboard', included: true },
      { text: 'Dedicated Account Manager', included: true },
      { text: 'Multiple Agents', included: true },
      { text: 'Custom Knowledge Base', included: true },
      { text: 'Full API + Webhooks', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-purple-400 to-violet-600',
  },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Sparkles className="w-4 h-4 text-nerva-cyan" />
            <span className="text-sm text-muted-foreground">Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, Transparent{' '}
            <span className="gradient-text-cyan">Pricing</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Choose the plan that fits your business. All plans include core AI
            capabilities, and you can upgrade anytime as your needs grow.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <span
            className={`text-sm ${
              !isAnnual ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
              isAnnual ? 'bg-nerva-cyan' : 'bg-muted'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                isAnnual ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span
            className={`text-sm ${
              isAnnual ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Annual
            <span className="ml-1 text-nerva-green text-xs font-medium">
              Save 20%
            </span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative glass-card-hover rounded-2xl p-8 flex flex-col ${
                plan.popular ? 'ring-1 ring-nerva-cyan/40 glow-cyan' : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark text-xs font-semibold">
                  Most Popular
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {isAnnual
                      ? Math.round(
                          parseInt(plan.price.replace(',', '')) * 0.8
                        ).toLocaleString()
                      : plan.price}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {plan.currency}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-nerva-green mt-1">
                    Billed annually
                  </p>
                )}
              </div>

              {/* CTA */}
              <Button
                asChild
                className={`w-full mb-6 rounded-xl font-semibold ${
                  plan.popular
                    ? 'shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark hover:opacity-90'
                    : 'bg-muted text-foreground hover:bg-muted/80 border border-nerva-border'
                }`}
              >
                <a href="#contact">{plan.cta}</a>
              </Button>

              {/* Features */}
              <div className="space-y-3 flex-grow">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-nerva-green flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? 'text-foreground'
                          : 'text-muted-foreground/50'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Payment methods note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          We accept Instapay, Vodafone Cash, and bank transfers. All prices are in Egyptian Pounds (EGP).
        </motion.div>
      </div>
    </section>
  );
}
