'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ArrowRight, ArrowLeft, Building2, Store, Dumbbell, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

const industries = [
  { id: 'ecommerce', label: 'E-commerce', icon: Store, desc: 'Online retail & shopping' },
  { id: 'fitness', label: 'Gym & Fitness', icon: Dumbbell, desc: 'Health clubs & trainers' },
  { id: 'marketing', label: 'Marketing Agency', icon: Briefcase, desc: 'Digital & creative agencies' },
  { id: 'other', label: 'Other Industry', icon: Building2, desc: 'Any other business type' },
];

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contextData, setContextData] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    if (!businessName || !industry) return;
    setLoading(true);
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, industry, contextData }),
      });
      if (res.ok) {
        setCreated(true);
        setTimeout(() => onComplete(), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nerva-green/20 to-nerva-green/5 border border-nerva-green/30 flex items-center justify-center mx-auto mb-6 pulse-glow">
            <CheckCircle2 className="w-10 h-10 text-nerva-green" />
          </div>
          <h2 className="text-3xl font-bold mb-2">AI Agent Created!</h2>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-nerva-cyan/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
            <Zap className="w-4 h-4 text-nerva-dark" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text-cyan">Nerva</span>
            <span className="text-foreground ml-1">AI</span>
          </span>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s
                      ? 'bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 ${step > s ? 'bg-nerva-cyan' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Business Name */}
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">What&apos;s your business name?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This will be used to train your AI agent about your brand.
              </p>
              <Input
                placeholder="e.g. Cairo Tech Solutions"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-12 rounded-xl text-lg"
              />
              <Button
                onClick={() => businessName && setStep(2)}
                disabled={!businessName}
                className="w-full mt-6 shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Industry */}
          {step === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">What industry are you in?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                We&apos;ll customize your AI agent for your specific market.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setIndustry(ind.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      industry === ind.id
                        ? 'bg-nerva-cyan/10 border-nerva-cyan/40 ring-1 ring-nerva-cyan/30'
                        : 'bg-muted/30 border-nerva-border hover:border-nerva-cyan/20'
                    } border`}
                  >
                    <ind.icon className={`w-6 h-6 mb-2 ${industry === ind.id ? 'text-nerva-cyan' : 'text-muted-foreground'}`} />
                    <div className="font-medium text-sm">{ind.label}</div>
                    <div className="text-xs text-muted-foreground">{ind.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={() => industry && setStep(3)}
                  disabled={!industry}
                  className="flex-1 shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Knowledge Base */}
          {step === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Tell us about your business</h3>
              <p className="text-sm text-muted-foreground mb-6">
                The more details you provide, the smarter your AI agent will be. Include products, services, pricing, FAQs, and anything else customers might ask about.
              </p>
              <textarea
                placeholder={`Example for a restaurant:
- We serve Egyptian and Italian cuisine
- Opening hours: 10 AM - 12 AM daily
- Popular dishes: Koshari, Pasta Carbonara, Grilled Sea Bass
- Average price: 150-300 EGP per person
- We offer delivery via WhatsApp orders
- Special: Buy 2 main dishes, get a free dessert`}
                value={contextData}
                onChange={(e) => setContextData(e.target.value)}
                rows={8}
                className="w-full bg-muted/50 border border-nerva-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-nerva-cyan/50 focus:outline-none focus:ring-1 focus:ring-nerva-cyan/20 resize-none"
              />
              <div className="flex gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Build My AI Agent <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-nerva-green" /> Secure & Private</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-nerva-cyan" /> 2-min Setup</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
