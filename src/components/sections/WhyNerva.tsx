'use client';

import { motion } from 'framer-motion';
import { DollarSign, Clock, TrendingUp, Database, ShieldCheck, Headphones } from 'lucide-react';

const benefits = [
  {
    icon: DollarSign,
    title: 'Reduce Costs Dramatically',
    description:
      'Replace the need for large human customer service teams. A single AI agent handles the volume of multiple employees, saving you thousands in monthly salaries while delivering consistent, high-quality responses around the clock.',
    stat: '70%',
    statLabel: 'Cost Reduction',
    color: 'text-nerva-green',
    bg: 'bg-nerva-green/10',
  },
  {
    icon: Clock,
    title: '24/7 Non-Stop Availability',
    description:
      'Your AI agents never sleep, never take breaks, and never miss a message. Whether it is 3 AM or a national holiday, every customer inquiry gets an instant response and every lead gets captured immediately.',
    stat: '24/7',
    statLabel: 'Always Online',
    color: 'text-nerva-cyan',
    bg: 'bg-nerva-cyan/10',
  },
  {
    icon: TrendingUp,
    title: 'Instant Responses, Higher Conversions',
    description:
      'Eliminate wait times that kill deals. Our AI responds in under a second, naturally negotiates with prospects, handles objections, and upsells — converting casual browsers into paying customers at rates humans simply cannot match.',
    stat: '3x',
    statLabel: 'More Conversions',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  {
    icon: Database,
    title: 'Zero-Friction Lead Extraction',
    description:
      'No more manual data entry. The AI automatically extracts customer names, phone numbers, and purchase intent directly from natural conversation and saves it to your CRM. Every lead is captured, organized, and ready for follow-up.',
    stat: '100%',
    statLabel: 'Lead Capture Rate',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    description:
      'All data is encrypted in transit and at rest. Your business knowledge, customer conversations, and lead data are stored securely with industry-standard protection. We never share your data with third parties, period.',
    stat: 'AES-256',
    statLabel: 'Encryption',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description:
      'From onboarding to scaling, our team is with you every step of the way. Pro and Agency plans include priority support and dedicated account managers who understand your business and help you get the most from your AI agents.',
    stat: '<2hr',
    statLabel: 'Response Time',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
  },
];

export default function WhyNerva() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Why Businesses Choose{' '}
            <span className="gradient-text-cyan">Nerva AI</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            We do not just build chatbots — we deploy intelligent AI
            workforces that transform how businesses operate, sell, and scale.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-card-hover rounded-2xl p-6"
            >
              {/* Icon + Stat */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center`}
                >
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${benefit.color}`}>
                    {benefit.stat}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {benefit.statLabel}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
