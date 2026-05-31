'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap, LogOut, Plus, MessageSquare, Users, Target,
  Send, Loader2, Trash2, Key, Bot, Settings, Coffee,
  Brain, Workflow, Film, Phone, ArrowLeft, ChevronDown,
  Sparkles, Copy, CheckCircle2, BarChart3, Clock,
  CreditCard, ShieldCheck, Home, Crown, X, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Page = 'overview' | 'chat' | 'leads' | 'agents' | 'settings' | 'subscription';

interface Business {
  id: string;
  name: string;
  industry: string;
  contextData: string;
  systemPrompt: string;
  apiKey: string;
  subscriptionStatus: string;
  agents?: Agent[];
  _count?: { leads: number };
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: string;
  systemPrompt?: string;
  createdAt: string;
}

interface Lead {
  id: string;
  customerName: string | null;
  customerContact: string | null;
  intent: string | null;
  source: string;
  createdAt: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const agentTypes = [
  { id: 'whatsapp', label: 'WhatsApp Agent', icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10', desc: 'AI sales agent on WhatsApp' },
  { id: 'barista', label: 'AI Barista', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', desc: 'QR code ordering for cafes' },
  { id: 'knowledge', label: 'Knowledge Base', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Internal AI assistant' },
  { id: 'leadgen', label: 'Lead Generation', icon: Target, color: 'text-rose-400', bg: 'bg-rose-500/10', desc: 'Automated prospect outreach' },
  { id: 'content', label: 'Content Pipeline', icon: Film, color: 'text-sky-400', bg: 'bg-sky-500/10', desc: 'Auto content creation' },
  { id: 'workflow', label: 'Workflow Automation', icon: Workflow, color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10', desc: 'n8n workflow connections' },
  { id: 'voice', label: 'AI Voice Caller', icon: Phone, color: 'text-teal-400', bg: 'bg-teal-500/10', desc: 'Human-like phone calls' },
];

const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    currency: 'EGP',
    period: '/mo',
    agents: 1,
    leads: 10,
    features: ['1 AI Agent', '10 leads/month', 'Basic chat', 'Community support'],
    highlight: false,
    current: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '1,500',
    currency: 'EGP',
    period: '/mo',
    agents: 3,
    leads: 100,
    features: ['3 AI Agents', '100 leads/month', 'WhatsApp + Knowledge agents', 'Email support', 'Custom knowledge base'],
    highlight: false,
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '3,500',
    currency: 'EGP',
    period: '/mo',
    agents: 7,
    leads: 500,
    features: ['7 AI Agents', '500 leads/month', 'All agent types', 'Priority support', 'Advanced analytics', 'API access'],
    highlight: true,
    current: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '10,000',
    currency: 'EGP',
    period: '/mo',
    agents: 999,
    leads: 99999,
    features: ['Unlimited agents', 'Unlimited leads', 'Custom integrations', 'Dedicated support', 'White-label option', 'SLA guarantee', 'Custom training'],
    highlight: false,
    current: false,
  },
];

const agentLimits: Record<string, number> = { free: 1, starter: 3, pro: 7, agency: 999 };

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [page, setPage] = useState<Page>('overview');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const res = await fetch('/api/business');
      if (res.ok) {
        const businesses = await res.json();
        if (businesses.length > 0) {
          setBusiness(businesses[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('home');
  };

  const handleBackToHome = () => {
    onNavigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nerva-cyan animate-spin" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-nerva-dark flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative z-10 text-center glass-card rounded-2xl p-10 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center mx-auto mb-6 glow-cyan">
            <Plus className="w-8 h-8 text-nerva-dark" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Set Up Your Business</h2>
          <p className="text-muted-foreground mb-6">Create your first business to start building AI agents.</p>
          <Button
            onClick={() => onNavigate('onboarding')}
            className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl px-8"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Business
          </Button>
        </div>
      </div>
    );
  }

  const navItems: { id: Page; label: string; icon: typeof Zap }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-nerva-dark flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-nerva-border bg-[#020509] flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 p-5 border-b border-nerva-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
            <Zap className="w-4 h-4 text-nerva-dark" />
          </div>
          <span className="text-lg font-bold">
            <span className="gradient-text-cyan">Nerva</span>
            <span className="text-foreground ml-1">AI</span>
          </span>
        </div>

        {/* Business info */}
        <div className="p-4 border-b border-nerva-border">
          <div className="text-sm font-medium truncate">{business.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{business.industry}</div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`w-2 h-2 rounded-full ${business.subscriptionStatus === 'free' ? 'bg-muted-foreground' : 'bg-nerva-green'}`} />
            <span className="text-xs text-muted-foreground capitalize">{business.subscriptionStatus} plan</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                page === item.id
                  ? 'bg-nerva-cyan/10 text-nerva-cyan'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'subscription' && business.subscriptionStatus === 'free' && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-nerva-cyan/20 text-nerva-cyan">Upgrade</span>
              )}
            </button>
          ))}
        </nav>

        {/* Back to Home + User & Logout */}
        <div className="p-4 border-t border-nerva-border space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToHome}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <Home className="w-4 h-4 mr-2" /> Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center text-nerva-dark text-xs font-bold">
              {user?.name?.[0] || user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#020509]/90 backdrop-blur-xl border-b border-nerva-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-nerva-dark" />
            </div>
            <span className="font-bold text-sm gradient-text-cyan">Nerva AI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-nerva-cyan"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-nerva-border bg-[#020509]/95 backdrop-blur-xl">
            <div className="p-2 space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    page === item.id
                      ? 'bg-nerva-cyan/10 text-nerva-cyan'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="border-t border-nerva-border mt-2 pt-2 space-y-0.5">
                <button
                  onClick={() => { handleBackToHome(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <Home className="w-4 h-4" /> Back to Home
                </button>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {page === 'overview' && <OverviewPage business={business} setPage={setPage} />}
          {page === 'chat' && <ChatPage business={business} />}
          {page === 'leads' && <LeadsPage business={business} />}
          {page === 'agents' && <AgentsPage business={business} refresh={loadBusiness} />}
          {page === 'subscription' && <SubscriptionPage business={business} refresh={loadBusiness} />}
          {page === 'settings' && <SettingsPage business={business} refresh={loadBusiness} />}
        </div>
      </main>
    </div>
  );
}

/* ============ OVERVIEW ============ */
function OverviewPage({ business, setPage }: { business: Business; setPage: (p: Page) => void }) {
  const [leadCount, setLeadCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);

  useEffect(() => {
    fetch('/api/leads?businessId=' + business.id).then(r => r.json()).then(d => setLeadCount(d.length || 0)).catch(() => {});
    fetch('/api/agents?businessId=' + business.id).then(r => r.json()).then(d => setAgentCount(d.length || 0)).catch(() => {});
  }, [business.id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {business.name}</h1>
      <p className="text-muted-foreground mb-8">Your AI agents are working 24/7 for you.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Bot, label: 'Active Agents', value: agentCount, color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10' },
          { icon: Users, label: 'Total Leads', value: leadCount, color: 'text-nerva-green', bg: 'bg-nerva-green/10' },
          { icon: Clock, label: 'Availability', value: '24/7', color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { icon: Sparkles, label: 'Plan', value: business.subscriptionStatus, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <button onClick={() => setPage('chat')} className="glass-card-hover rounded-xl p-6 text-left">
          <MessageSquare className="w-8 h-8 text-nerva-cyan mb-3" />
          <h3 className="font-semibold mb-1">Test Your AI Agent</h3>
          <p className="text-sm text-muted-foreground">Chat with your trained AI agent and see how it handles customer conversations.</p>
        </button>
        <button onClick={() => setPage('agents')} className="glass-card-hover rounded-xl p-6 text-left">
          <Bot className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="font-semibold mb-1">Manage Agents</h3>
          <p className="text-sm text-muted-foreground">Add WhatsApp, Barista, and other AI agents for your business.</p>
        </button>
      </div>
    </div>
  );
}

/* ============ CHAT ============ */
function ChatPage({ business }: { business: Business }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch('/api/agents?businessId=' + business.id);
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
          if (data.length > 0 && !selectedAgentId) {
            setSelectedAgentId(data[0].id);
          }
        }
      } catch {} finally { setAgentsLoading(false); }
    };
    loadAgents();
  }, [business.id]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, message: userMsg, agentId: selectedAgentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet.' }]);
    } finally {
      setSending(false);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setMessages([]);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">AI Agent Chat</h1>
      <p className="text-muted-foreground mb-6">Test your AI agents trained on {business.name}&apos;s knowledge base.</p>

      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {/* Agent list sidebar */}
        <div className="lg:w-56 glass-card rounded-2xl overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-nerva-border">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agents</div>
          </div>
          <div className="p-2 space-y-1 max-h-96 lg:max-h-none overflow-y-auto">
            {agentsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-nerva-cyan animate-spin" /></div>
            ) : agents.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground text-center">No agents yet</div>
            ) : (
              agents.map((agent) => {
                const typeInfo = agentTypes.find(t => t.id === agent.type) || agentTypes[0];
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all text-sm ${
                      selectedAgentId === agent.id
                        ? 'bg-nerva-cyan/10 border border-nerva-cyan/30 text-foreground'
                        : 'hover:bg-muted/30 border border-transparent text-muted-foreground'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <typeInfo.icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs truncate">{agent.name}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{agent.type}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col min-h-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-nerva-border">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
              <Bot className="w-5 h-5 text-nerva-dark" />
            </div>
            <div>
              <div className="text-sm font-medium">{selectedAgent?.name || business.name + ' Agent'}</div>
              <div className="text-xs text-nerva-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-nerva-green" /> Online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-nerva-cyan/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Start a conversation with your AI agent</p>
                <p className="text-muted-foreground/50 text-xs mt-1">
                  {selectedAgent ? `Chatting with ${selectedAgent.name}` : 'Select an agent from the list'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                    : 'bg-muted/50 text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted/50 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-nerva-border">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted/50 border-nerva-border focus:border-nerva-cyan/50 h-11 rounded-xl"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-11 px-4 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ LEADS ============ */
function LeadsPage({ business }: { business: Business }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?businessId=' + business.id);
      if (res.ok) setLeads(await res.json());
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Lead deleted', description: 'The lead has been removed.' });
    loadLeads();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{leads.length} leads captured by your AI agents</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLeads} className="border-nerva-border">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : leads.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No leads yet. Your AI agents will capture leads automatically.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-nerva-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Contact</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Intent</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Source</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-nerva-border/50 hover:bg-nerva-cyan/5">
                    <td className="p-4 text-sm">{lead.customerName || '—'}</td>
                    <td className="p-4 text-sm">{lead.customerContact || '—'}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">{lead.intent || '—'}</td>
                    <td className="p-4"><span className="text-xs px-2 py-0.5 rounded-full bg-nerva-cyan/10 text-nerva-cyan">{lead.source}</span></td>
                    <td className="p-4 text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <button onClick={() => deleteLead(lead.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ AGENTS ============ */
function AgentsPage({ business, refresh }: { business: Business; refresh: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newAgentType, setNewAgentType] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [limitModal, setLimitModal] = useState(false);
  const { toast } = useToast();

  const currentLimit = agentLimits[business.subscriptionStatus] || 1;

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?businessId=' + business.id);
      if (res.ok) setAgents(await res.json());
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const createAgent = async () => {
    if (!newAgentType || !newAgentName) return;

    // Check subscription limit on client side
    if (agents.length >= currentLimit) {
      setLimitModal(true);
      return;
    }

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, type: newAgentType, name: newAgentName }),
      });

      if (res.status === 403) {
        setLimitModal(true);
        return;
      }

      if (res.ok) {
        toast({ title: 'Agent created', description: `${newAgentName} is now active.` });
      }
    } catch {} 

    setShowCreate(false);
    setNewAgentType('');
    setNewAgentName('');
    loadAgents();
    refresh();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Agent deleted', description: 'The agent has been removed.' });
    loadAgents();
    refresh();
  };

  const selectedType = agentTypes.find((t) => t.id === newAgentType);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage your AI workforce · {agents.length}/{currentLimit === 999 ? '∞' : currentLimit} agents</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Agent
        </Button>
      </div>

      {/* Subscription limit modal */}
      {limitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Agent Limit Reached</h3>
            <p className="text-sm text-muted-foreground mb-1">
              You&apos;re on the <span className="text-foreground font-medium capitalize">{business.subscriptionStatus}</span> plan with a limit of {currentLimit === 999 ? 'unlimited' : currentLimit} agent{currentLimit !== 1 && currentLimit !== 999 ? 's' : ''}.
            </p>
            <p className="text-sm text-muted-foreground mb-6">Upgrade your plan to create more agents.</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setLimitModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setLimitModal(false)}
                className="flex-1 shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl"
              >
                <Crown className="w-4 h-4 mr-2" /> View Plans
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create agent panel */}
      {showCreate && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Create New Agent</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {agentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setNewAgentType(type.id);
                  setNewAgentName(`${business.name} - ${type.label}`);
                }}
                className={`p-3 rounded-xl text-left transition-all border ${
                  newAgentType === type.id
                    ? 'bg-nerva-cyan/10 border-nerva-cyan/40'
                    : 'bg-muted/20 border-nerva-border hover:border-nerva-cyan/20'
                }`}
              >
                <type.icon className={`w-5 h-5 mb-2 ${type.color}`} />
                <div className="text-xs font-medium">{type.label}</div>
              </button>
            ))}
          </div>
          {selectedType && (
            <div className="flex gap-3">
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="flex-1 bg-muted/50 border-nerva-border h-11 rounded-xl"
              />
              <Button onClick={createAgent} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-11 rounded-xl px-6">
                Create
              </Button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : agents.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No agents yet. Add your first AI agent to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const typeInfo = agentTypes.find((t) => t.id === agent.type) || agentTypes[0];
            return (
              <div key={agent.id} className="glass-card-hover rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                    <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${agent.status === 'active' ? 'bg-nerva-green/10 text-nerva-green' : 'bg-muted text-muted-foreground'}`}>
                      {agent.status}
                    </span>
                    <button onClick={() => deleteAgent(agent.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-medium text-sm">{agent.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{typeInfo.desc}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ SUBSCRIPTION ============ */
function SubscriptionPage({ business, refresh }: { business: Business; refresh: () => void }) {
  const { toast } = useToast();

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, plan: planId }),
      });
      if (res.ok) {
        toast({
          title: 'Plan Updated!',
          description: `You've been upgraded to the ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan.`,
        });
        refresh();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to update plan', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Subscription</h1>
      <p className="text-muted-foreground mb-8">Manage your plan and billing</p>

      {/* Current plan status */}
      <div className="glass-card rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-nerva-dark" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Plan</div>
              <div className="text-xl font-bold capitalize">{business.subscriptionStatus}</div>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold">{agentLimits[business.subscriptionStatus] || 1 === 999 ? '∞' : (agentLimits[business.subscriptionStatus] || 1)}</div>
              <div className="text-xs text-muted-foreground">Agents</div>
            </div>
            <div className="w-px bg-nerva-border" />
            <div className="text-center">
              <div className="font-bold capitalize">{business.subscriptionStatus === 'agency' ? 'Unlimited' : business.subscriptionStatus === 'pro' ? '500' : business.subscriptionStatus === 'starter' ? '100' : '10'}</div>
              <div className="text-xs text-muted-foreground">Leads/mo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subscriptionPlans.map((plan) => {
          const isCurrentPlan = plan.id === business.subscriptionStatus;
          return (
            <div
              key={plan.id}
              className={`glass-card rounded-2xl p-6 flex flex-col relative ${
                plan.highlight ? 'ring-1 ring-nerva-cyan/40' : ''
              } ${isCurrentPlan ? 'ring-1 ring-nerva-green/40' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark text-xs font-semibold">
                  Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-nerva-green/20 text-nerva-green text-xs font-semibold border border-nerva-green/30">
                  Current Plan
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.currency}{plan.period}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${plan.highlight ? 'text-nerva-cyan' : 'text-nerva-green'}`} />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || upgrading !== null}
                className={`w-full rounded-xl font-semibold ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground'
                    : plan.highlight
                      ? 'shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                      : 'border border-nerva-border bg-transparent text-foreground hover:bg-muted/50'
                }`}
                variant={isCurrentPlan || plan.highlight ? undefined : 'outline'}
              >
                {upgrading === plan.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isCurrentPlan ? 'Current Plan' : upgrading === plan.id ? 'Upgrading...' : 'Upgrade'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Feature comparison */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Feature Comparison</h2>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-nerva-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Feature</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Free</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Starter</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4 bg-nerva-cyan/5">Pro</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Agency</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI Agents', values: ['1', '3', '7', '∞'] },
                  { feature: 'Leads/month', values: ['10', '100', '500', '∞'] },
                  { feature: 'WhatsApp Agent', values: [true, true, true, true] },
                  { feature: 'Knowledge Agent', values: [false, true, true, true] },
                  { feature: 'Barista Agent', values: [false, false, true, true] },
                  { feature: 'Lead Gen Agent', values: [false, false, true, true] },
                  { feature: 'Content Agent', values: [false, false, true, true] },
                  { feature: 'Workflow Agent', values: [false, false, false, true] },
                  { feature: 'Voice Agent', values: [false, false, false, true] },
                  { feature: 'API Access', values: [false, false, true, true] },
                  { feature: 'Priority Support', values: [false, false, true, true] },
                  { feature: 'Custom Integrations', values: [false, false, false, true] },
                  { feature: 'White Label', values: [false, false, false, true] },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-nerva-border/30">
                    <td className="p-4 text-sm">{row.feature}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className={`p-4 text-center ${j === 2 ? 'bg-nerva-cyan/5' : ''}`}>
                        {typeof val === 'boolean' ? (
                          val ? <CheckCircle2 className="w-4 h-4 text-nerva-green mx-auto" /> : <span className="text-muted-foreground/30">—</span>
                        ) : (
                          <span className="text-sm">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ SETTINGS ============ */
function SettingsPage({ business, refresh }: { business: Business; refresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(business.name);
  const [contextData, setContextData] = useState(business.contextData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const copyApiKey = () => {
    navigator.clipboard.writeText(business.apiKey);
    setCopied(true);
    toast({ title: 'API key copied!', description: 'Your API key has been copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, name, contextData }),
      });
      if (res.ok) {
        setSaved(true);
        toast({ title: 'Settings saved!', description: 'Your business settings have been updated.' });
        refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your business and AI configuration</p>

      <div className="space-y-6 max-w-2xl">
        {/* Business Info */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Business Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/50 border-nerva-border h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Industry</label>
              <Input value={business.industry} disabled className="bg-muted/30 border-nerva-border h-11 rounded-xl text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">API Key</h3>
          <p className="text-sm text-muted-foreground mb-3">Use this key to integrate with external services.</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-muted/30 border border-nerva-border rounded-xl px-4 py-2.5 text-sm font-mono text-nerva-cyan truncate">
              {business.apiKey}
            </code>
            <Button variant="outline" size="sm" onClick={copyApiKey} className="border-nerva-border px-4">
              {copied ? <CheckCircle2 className="w-4 h-4 text-nerva-green" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Knowledge Base */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Update your business knowledge base. The AI agent will be retrained automatically.
          </p>
          <textarea
            value={contextData}
            onChange={(e) => setContextData(e.target.value)}
            rows={8}
            className="w-full bg-muted/50 border border-nerva-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-nerva-cyan/50 focus:outline-none focus:ring-1 focus:ring-nerva-cyan/20 resize-none"
          />
        </div>

        {/* Save */}
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold h-12 rounded-xl px-8"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5 mr-2" /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
