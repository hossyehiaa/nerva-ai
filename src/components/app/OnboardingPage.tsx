'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, ArrowRight, ArrowLeft, Building2, Store, Dumbbell, Briefcase, Loader2, CheckCircle2, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

const industries = [
  { id: 'ecommerce', label: 'E-commerce', icon: Store, desc: 'Online retail & shopping' },
  { id: 'fitness', label: 'Gym & Fitness', icon: Dumbbell, desc: 'Health clubs & trainers' },
  { id: 'marketing', label: 'Marketing Agency', icon: Briefcase, desc: 'Digital & creative agencies' },
  { id: 'other', label: 'Other Industry', icon: Building2, desc: 'Any other business type' },
];

const buildSteps = [
  'Analyzing your business...',
  'Generating AI personality...',
  'Training knowledge base...',
  'Configuring responses...',
  'Agent ready!',
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contextData, setContextData] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [created, setCreated] = useState(false);
  const [createError, setCreateError] = useState('');

  // Step 4 states
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildComplete, setBuildComplete] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleCreate = async () => {
    if (!businessName || !industry) return;
    setLoading(true);
    setCreateError('');
    try {
      // First warm up the database
      try { await fetch('/api/db/warmup'); } catch {}

      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: businessName, industry, contextData }),
      });
      if (res.ok) {
        const data = await res.json();
        setBusinessId(data.id);
        setStep(4);
      } else {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || 'Failed to create business. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setCreateError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Animate build progress when step 4 starts
  useEffect(() => {
    if (step !== 4) return;

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setBuildProgress(current);
      if (current >= buildSteps.length) {
        clearInterval(interval);
        setTimeout(() => setBuildComplete(true), 500);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [step]);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const sendTestMessage = async () => {
    if (!chatInput.trim() || chatSending || !businessId) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, message: userMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setChatSending(false);
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
          <h2 className="text-3xl font-bold mb-2">Welcome to Nerva AI!</h2>
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
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s
                      ? 'bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
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
              {createError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-nerva-green" /> Secure & Private</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-nerva-cyan" /> 2-min Setup</span>
              </div>
            </div>
          )}

          {/* Step 4: Agent Building Animation + Test Chat */}
          {step === 4 && (
            <div>
              <AnimatePresence mode="wait">
                {!buildComplete ? (
                  <motion.div
                    key="building"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center pulse-glow">
                        <Sparkles className="w-5 h-5 text-nerva-dark" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Your AI Agent Is Being Built</h3>
                        <p className="text-sm text-muted-foreground">This will only take a moment...</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {buildSteps.map((label, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={buildProgress > i ? { opacity: 1, x: 0 } : { opacity: 0.3, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/20"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                            buildProgress > i
                              ? 'bg-nerva-green/20 text-nerva-green'
                              : buildProgress === i
                                ? 'bg-nerva-cyan/20 text-nerva-cyan'
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {buildProgress > i ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </motion.div>
                            ) : buildProgress === i ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                          <span className={`text-sm transition-colors ${
                            buildProgress > i ? 'text-foreground' : buildProgress === i ? 'text-nerva-cyan' : 'text-muted-foreground'
                          }`}>
                            {label}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-6 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-nerva-cyan to-nerva-blue rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(buildProgress / buildSteps.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Success header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-nerva-green/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-nerva-green" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Agent Ready!</h3>
                        <p className="text-sm text-muted-foreground">Test your AI agent below</p>
                      </div>
                    </div>

                    {/* Mini chat interface */}
                    <div className="glass-card rounded-xl overflow-hidden border border-nerva-border mb-4">
                      {/* Chat header */}
                      <div className="flex items-center gap-2 p-3 border-b border-nerva-border bg-muted/20">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-nerva-dark" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">{businessName} Agent</div>
                          <div className="text-[10px] text-nerva-green flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-nerva-green" /> Online
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div ref={chatScrollRef} className="max-h-64 overflow-y-auto p-3 space-y-3">
                        {chatMessages.length === 0 && (
                          <div className="text-center py-6">
                            <Bot className="w-8 h-8 text-nerva-cyan/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Say hello to your AI agent!</p>
                          </div>
                        )}
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                                : 'bg-muted/50 text-foreground'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {chatSending && (
                          <div className="flex justify-start">
                            <div className="bg-muted/50 rounded-xl px-3 py-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="p-3 border-t border-nerva-border">
                        <form
                          onSubmit={(e) => { e.preventDefault(); sendTestMessage(); }}
                          className="flex gap-2"
                        >
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-9 rounded-lg text-xs"
                            disabled={chatSending}
                          />
                          <Button
                            type="submit"
                            disabled={!chatInput.trim() || chatSending}
                            className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-9 px-3 rounded-lg"
                          >
                            <Send className="w-3 h-3" />
                          </Button>
                        </form>
                      </div>
                    </div>

                    {/* Go to Dashboard */}
                    <Button
                      onClick={() => {
                        setCreated(true);
                        setTimeout(() => onComplete(), 1500);
                      }}
                      className="w-full shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
