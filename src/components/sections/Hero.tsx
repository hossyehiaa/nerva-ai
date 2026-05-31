'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Zap, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface HeroProps {
  onGetStarted?: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-[#030712]/60 to-[#030712]" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nerva-blue/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-nerva-purple/3 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
        >
          <Sparkles className="w-4 h-4 text-nerva-cyan" />
          <span className="text-sm text-muted-foreground">
            AI-Powered Business Automation
          </span>
          <span className="px-2 py-0.5 rounded-full bg-nerva-cyan/10 text-nerva-cyan text-xs font-medium">
            New
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="block">When Your Business</span>
          <span className="block gradient-text text-glow-cyan">Thinks for Itself</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10"
        >
          Transform your operations with custom-trained AI agents that automate
          customer support, capture leads 24/7, and handle complex workflows —
          so you can focus on growth.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={onGetStarted}
            className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold text-base px-8 py-6 rounded-xl glow-cyan hover:glow-cyan-strong transition-all duration-300"
          >
              Start Automating
              <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-nerva-border text-foreground hover:bg-nerva-cyan/5 hover:border-nerva-cyan/30 text-base px-8 py-6 rounded-xl transition-all duration-300"
          >
            <a href="#how-it-works">
              <Play className="w-5 h-5 mr-2" />
              See How It Works
            </a>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
        >
          {[
            {
              icon: Clock,
              value: '2 min',
              label: 'Setup Time',
              desc: 'Go live in minutes',
            },
            {
              icon: Zap,
              value: '24/7',
              label: 'Availability',
              desc: 'Never miss a lead',
            },
            {
              icon: Users,
              value: '100+',
              label: 'Industries',
              desc: 'Tailored solutions',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="glass-card rounded-xl px-6 py-5 text-center"
            >
              <stat.icon className="w-5 h-5 text-nerva-cyan mx-auto mb-2" />
              <div className="text-2xl font-bold gradient-text-cyan">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-foreground mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <div className="gradient-border rounded-2xl overflow-hidden glow-cyan">
            <div className="relative rounded-2xl overflow-hidden bg-nerva-card">
              <Image
                src="/dashboard-mockup.png"
                alt="Nerva AI Dashboard Preview"
                width={1344}
                height={768}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Overlay gradient at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#030712] to-transparent" />
            </div>
          </div>
          {/* Glow behind */}
          <div className="absolute -inset-4 bg-gradient-to-r from-nerva-cyan/10 via-nerva-blue/10 to-nerva-purple/10 rounded-3xl blur-2xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
