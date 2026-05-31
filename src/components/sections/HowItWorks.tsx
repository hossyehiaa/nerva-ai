'use client';

import { motion } from 'framer-motion';
import { Upload, Cpu, Rocket, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Share Your Business Knowledge',
    description:
      'Provide us with your business details, product catalog, FAQs, and brand voice. Our onboarding wizard captures everything your AI agent needs to represent your business perfectly — from pricing to personality.',
    color: 'text-nerva-cyan',
    bg: 'bg-nerva-cyan/10',
    ring: 'ring-nerva-cyan/20',
  },
  {
    step: '02',
    icon: Cpu,
    title: 'We Train Your AI Agent',
    description:
      'Our system generates a custom AI agent trained specifically on your data. It learns your products, understands your customers, and masters the art of natural conversation. The agent is configured to capture leads, handle objections, and close deals just like your best salesperson.',
    color: 'text-nerva-blue',
    bg: 'bg-nerva-blue/10',
    ring: 'ring-nerva-blue/20',
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Go Live & Watch It Work',
    description:
      'Connect your AI agent to WhatsApp, your website, or any channel. Within minutes, it starts handling customer inquiries 24/7, capturing leads automatically, and feeding them straight into your dashboard. You monitor everything from a single intuitive interface.',
    color: 'text-nerva-green',
    bg: 'bg-nerva-green/10',
    ring: 'ring-nerva-green/20',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nerva-cyan/3 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Rocket className="w-4 h-4 text-nerva-cyan" />
            <span className="text-sm text-muted-foreground">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Three Steps to{' '}
            <span className="gradient-text-cyan">Full Automation</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            Getting started with Nerva AI is simpler than you think. No complex
            integrations, no coding required — just share your knowledge and
            watch your AI workforce come to life.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative"
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-nerva-cyan/30 to-transparent" />
              )}

              <div className="glass-card-hover rounded-2xl p-8 h-full">
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl ${step.bg} ring-1 ${step.ring} flex items-center justify-center`}
                  >
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <span className="text-4xl font-bold text-white/[0.06]">
                    {step.step}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Check items */}
                <div className="mt-4 space-y-2">
                  {i === 0 && (
                    <>
                      <CheckItem text="Product catalog & pricing" />
                      <CheckItem text="Brand voice & tone" />
                      <CheckItem text="Common Q&As" />
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <CheckItem text="Custom system prompt" />
                      <CheckItem text="Lead detection rules" />
                      <CheckItem text="Conversation memory" />
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <CheckItem text="Real-time dashboard" />
                      <CheckItem text="Lead CRM access" />
                      <CheckItem text="API key for integrations" />
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-nerva-green flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
