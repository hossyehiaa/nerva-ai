'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How quickly can I get started with Nerva AI?',
    answer:
      'You can go live in under 2 minutes. Simply create an account, complete the 3-step onboarding wizard (business name, industry, and knowledge base), and your AI agent is ready to start handling customer inquiries. No coding or technical setup required — we handle all the complexity behind the scenes.',
  },
  {
    question: 'Can I switch plans at any time?',
    answer:
      'Absolutely. You can upgrade or downgrade your plan at any time from your dashboard. When upgrading, the new features are activated immediately and you only pay the prorated difference. When downgrading, the change takes effect at the start of your next billing cycle, so you never lose access to features mid-month.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes! Every new account starts on our free tier, which includes 1 AI agent and up to 10 leads per month. This gives you a chance to test the platform, see how the AI interacts with your customers, and experience the lead capture system firsthand before committing to a paid plan.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We currently accept Instapay, Vodafone Cash, and direct bank transfers. We are focused on the Egyptian market and are working on adding more payment options including credit cards and international payment methods. If you need a specific payment method, reach out to our sales team.',
  },
  {
    question: 'How does the AI learn about my business?',
    answer:
      'During onboarding, you provide your business knowledge base — this can include product descriptions, pricing, FAQs, policies, and any other relevant information. Our system then generates a custom AI prompt that trains the agent to understand your specific business context. The AI uses this knowledge to answer customer questions accurately and capture leads effectively.',
  },
  {
    question: 'Can the AI agent handle Arabic and English conversations?',
    answer:
      'Yes, our AI agents are fully bilingual. They can automatically detect whether a customer is writing in Arabic or English and respond in the same language. The system supports Egyptian Arabic dialect and formal Arabic, as well as English, making it ideal for businesses serving diverse customer bases in the MENA region.',
  },
  {
    question: 'How does the lead capture system work?',
    answer:
      'Our AI agents are trained to naturally extract key customer information — name, phone number, and intent — during the course of a conversation. When a lead is detected, it is automatically saved to your dashboard CRM. You never have to manually enter data; the AI handles it seamlessly while maintaining a natural conversation flow.',
  },
  {
    question: 'Is my business data secure?',
    answer:
      'Security is our top priority. All data is encrypted in transit and at rest. Your business knowledge base, customer conversations, and lead data are stored securely and never shared with third parties. We use industry-standard security practices and our infrastructure is built on reliable cloud providers with 99.9% uptime guarantees.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <HelpCircle className="w-4 h-4 text-nerva-cyan" />
            <span className="text-sm text-muted-foreground">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Frequently Asked{' '}
            <span className="gradient-text-cyan">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Got questions? We have answers. If you can&apos;t find what you&apos;re
            looking for, feel free to contact us directly.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-nerva-cyan/5 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                      openIndex === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
