'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Coffee,
  Workflow,
  Brain,
  Target,
  Film,
  Phone,
  ArrowRight,
  Zap,
} from 'lucide-react';

const services = [
  {
    icon: MessageSquare,
    title: 'WhatsApp AI Sales Agents',
    subtitle: 'وكلاء المبيعات الذكية',
    description:
      'A fully integrated AI employee connected to your WhatsApp, trained on your business knowledge base to answer queries, handle objections, and automatically extract leads into your dashboard. Never miss a customer inquiry again with 24/7 intelligent coverage.',
    features: ['Auto Lead Capture', 'Custom Knowledge Base', 'Natural Negotiation', 'CRM Integration'],
    gradient: 'from-green-400 to-emerald-600',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    popular: true,
  },
  {
    icon: Coffee,
    title: 'AI Barista / Digital Waiter',
    subtitle: 'الجرسون الرقمي للكافيهات',
    description:
      'A web-based QR code system for hospitality. Customers scan a QR at their table to open a chat interface. The AI, trained on your full menu, suggests customized food and drinks, upsells desserts, and processes orders seamlessly — no app download required.',
    features: ['QR Code Ordering', 'Menu AI Training', 'Smart Upselling', 'Order Processing'],
    gradient: 'from-amber-400 to-orange-600',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    popular: false,
  },
  {
    icon: Workflow,
    title: 'Workflow Automations',
    subtitle: 'أتمتة العمليات الداخلية',
    description:
      'Connect your internal business apps to automate repetitive tasks. Trigger inventory alerts, send automated follow-up emails after leads are captured, sync data between platforms, and eliminate manual busywork that drains your team\'s productivity.',
    features: ['n8n Integration', 'App Connectivity', 'Auto Follow-ups', 'Inventory Alerts'],
    gradient: 'from-nerva-cyan to-nerva-blue',
    iconBg: 'bg-nerva-cyan/10',
    iconColor: 'text-nerva-cyan',
    popular: false,
  },
  {
    icon: Brain,
    title: 'Internal AI Knowledge Base',
    subtitle: 'أنظمة المعرفة الداخلية',
    description:
      'A private AI chatbot trained on your company policies, onboarding documents, and internal procedures. Employees get instant answers to their questions without digging through manuals or waiting for HR responses. Reduce onboarding time by 70%.',
    features: ['Policy Training', 'Instant Answers', 'Onboarding Support', 'Private & Secure'],
    gradient: 'from-purple-400 to-violet-600',
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-400',
    popular: false,
  },
  {
    icon: Target,
    title: 'AI Lead Generation & Outreach',
    subtitle: 'صيد العملاء المحتملين',
    description:
      'Automated systems that discover prospects and initiate intelligent cold outreach via email or messaging. Our AI negotiates with potential clients, qualifies leads, and books meetings directly into your calendar — turning cold lists into warm opportunities.',
    features: ['Smart Prospecting', 'Cold Outreach AI', 'Meeting Booking', 'Lead Qualification'],
    gradient: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    popular: false,
  },
  {
    icon: Film,
    title: 'AI Content Pipelines',
    subtitle: 'خطوط إنتاج المحتوى',
    description:
      'Take a single idea and automatically generate video scripts, social media posts, and schedule them for publishing. Create consistent, high-quality content at scale without expanding your creative team. From concept to publication, fully automated.',
    features: ['Script Generation', 'Social Posts', 'Auto-Scheduling', 'Multi-Platform'],
    gradient: 'from-sky-400 to-blue-600',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    popular: false,
  },
  {
    icon: Phone,
    title: 'AI Voice Callers',
    subtitle: 'وكلاء الصوت الذكية',
    description:
      'AI agents capable of making and receiving human-like phone calls to handle reservations, basic customer inquiries, and appointment scheduling. Your business gets a tireless phone team that sounds natural, never gets frustrated, and logs every conversation.',
    features: ['Human-like Voice', 'Reservation Handling', 'Call Logging', 'Inbound & Outbound'],
    gradient: 'from-teal-400 to-cyan-600',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-400',
    popular: false,
    badge: 'Coming Soon',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
            <Zap className="w-4 h-4 text-nerva-cyan" />
            <span className="text-sm text-muted-foreground">Our Services</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to{' '}
            <span className="gradient-text-cyan">Automate & Scale</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            From AI-powered sales agents to complete workflow automation, we
            provide the full stack of intelligent tools your business needs to
            thrive in the AI era.
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={`group relative glass-card-hover rounded-2xl p-6 flex flex-col ${
                service.popular ? 'ring-1 ring-nerva-cyan/30' : ''
              }`}
            >
              {/* Popular badge */}
              {service.popular && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark text-xs font-semibold">
                  Most Popular
                </div>
              )}

              {/* Coming Soon badge */}
              {service.badge && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-nerva-border">
                  {service.badge}
                </div>
              )}

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center mb-4`}
              >
                <service.icon className={`w-6 h-6 ${service.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold mb-1">{service.title}</h3>
              <p className="text-xs text-muted-foreground mb-3 font-mono" dir="rtl">
                {service.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                {service.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {service.features.map((feature, j) => (
                  <span
                    key={j}
                    className="px-2.5 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground border border-nerva-border"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Learn more link */}
              <a
                href="#contact"
                className="inline-flex items-center text-sm text-nerva-cyan hover:text-nerva-cyan/80 transition-colors group/link"
              >
                Learn more
                <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
              </a>

              {/* Background number */}
              <div className="absolute top-4 right-4 text-7xl font-bold text-white/[0.02] select-none pointer-events-none">
                {String(i + 1).padStart(2, '0')}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 glass-card rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: '500+', label: 'Companies Served' },
            { value: '10M+', label: 'Messages Handled' },
            { value: '85%', label: 'Time Saved' },
            { value: '3x', label: 'Sales Increase' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-bold gradient-text-cyan">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
