'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap, LogOut, Plus, MessageSquare, Users, Target,
  Send, Loader2, Trash2, Key, Bot, Settings, Coffee,
  Brain, Workflow, Film, Phone, ArrowLeft, ChevronDown,
  Sparkles, Copy, CheckCircle2, BarChart3, Clock,
  CreditCard, ShieldCheck, Home, Crown, X, AlertTriangle,
  Globe, ExternalLink, Upload, FileText, Pause, Play,
  Mail, Webhook, QrCode, Download, Eye, Edit3,
  BookOpen, Search, Tag, ChevronRight, Info, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Page = 'overview' | 'chat' | 'leads' | 'agents' | 'whatsapp' | 'barista' | 'workflows' | 'leadgen' | 'knowledge' | 'subscription' | 'settings';

interface Business {
  id: string;
  name: string;
  industry: string;
  contextData: string;
  systemPrompt: string;
  apiKey: string;
  subscriptionStatus: string;
  whatsappNumber?: string | null;
  whatsappInstance?: string | null;
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
  qrCodeUrl?: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  customerName: string | null;
  customerContact: string | null;
  intent: string | null;
  source: string;
  status: string;
  createdAt: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: string;
  triggerConfig: string;
  actions: string;
  status: string;
  lastRunAt: string | null;
  createdAt: string;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  status: string;
  plan: string;
  amount: number;
  currency: string;
  method: string;
  screenshotUrl: string | null;
  createdAt: string;
  adminNote: string | null;
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
  },
];

const agentLimits: Record<string, number> = { free: 1, starter: 3, pro: 7, agency: 999 };

const planPrices: Record<string, number> = { free: 0, starter: 1500, pro: 3500, agency: 10000 };

const leadStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  contacted: { label: 'Contacted', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  qualified: { label: 'Qualified', color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10' },
  converted: { label: 'Converted', color: 'text-nerva-green', bg: 'bg-nerva-green/10' },
  lost: { label: 'Lost', color: 'text-red-400', bg: 'bg-red-500/10' },
};

const workflowTriggers = [
  { id: 'new_lead', label: 'New Lead', icon: Users, desc: 'When a new lead is captured' },
  { id: 'new_order', label: 'New Order', icon: Coffee, desc: 'When a new order is placed' },
  { id: 'schedule', label: 'Scheduled', icon: Clock, desc: 'Run on a schedule' },
  { id: 'manual', label: 'Manual', icon: Play, desc: 'Trigger manually' },
  { id: 'webhook', label: 'Webhook', icon: Webhook, desc: 'External webhook trigger' },
];

const workflowActionTypes = [
  { id: 'email', label: 'Send Email', icon: Mail, desc: 'Send email notification' },
  { id: 'whatsapp', label: 'Send WhatsApp', icon: MessageSquare, desc: 'Send WhatsApp message' },
  { id: 'update_lead', label: 'Update Lead', icon: Users, desc: 'Change lead status' },
  { id: 'webhook', label: 'Call Webhook', icon: Webhook, desc: 'HTTP request to external URL' },
];

const knowledgeCategories = [
  { id: 'general', label: 'General', color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10' },
  { id: 'policy', label: 'Policy', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'onboarding', label: 'Onboarding', color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'procedures', label: 'Procedures', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'faq', label: 'FAQ', color: 'text-rose-400', bg: 'bg-rose-500/10' },
];

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout } = useAuth();
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

  const navSections = [
    {
      label: null,
      items: [
        { id: 'overview' as Page, label: 'Overview', icon: BarChart3, iconColor: '' },
        { id: 'chat' as Page, label: 'AI Chat', icon: MessageSquare, iconColor: '' },
        { id: 'leads' as Page, label: 'Leads', icon: Users, iconColor: '' },
        { id: 'agents' as Page, label: 'Agents', icon: Bot, iconColor: '' },
      ],
    },
    {
      label: 'Services',
      items: [
        { id: 'whatsapp' as Page, label: 'WhatsApp', icon: MessageSquare, iconColor: 'text-green-400' },
        { id: 'barista' as Page, label: 'AI Barista', icon: Coffee, iconColor: 'text-amber-400' },
        { id: 'workflows' as Page, label: 'Workflows', icon: Workflow, iconColor: 'text-nerva-cyan' },
        { id: 'leadgen' as Page, label: 'Lead Generation', icon: Target, iconColor: 'text-rose-400' },
        { id: 'knowledge' as Page, label: 'Knowledge Base', icon: Brain, iconColor: 'text-purple-400' },
      ],
    },
    {
      label: null,
      items: [
        { id: 'subscription' as Page, label: 'Subscription', icon: CreditCard, iconColor: '' },
        { id: 'settings' as Page, label: 'Settings', icon: Settings, iconColor: '' },

      ],
    },
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mt-2 first:mt-0">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    page === item.id
                      ? 'bg-nerva-cyan/10 text-nerva-cyan'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${page === item.id ? '' : item.iconColor}`} />
                  {item.label}
                  {item.id === 'subscription' && business.subscriptionStatus === 'free' && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-nerva-cyan/20 text-nerva-cyan">Upgrade</span>
                  )}
                </button>
              ))}
            </div>
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
          <div className="border-t border-nerva-border bg-[#020509]/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
            <div className="p-2 space-y-0.5">
              {navSections.map((section, si) => (
                <div key={si}>
                  {section.label && (
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      {section.label}
                    </div>
                  )}
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        page === item.id
                          ? 'bg-nerva-cyan/10 text-nerva-cyan'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${page === item.id ? '' : item.iconColor}`} />
                      {item.label}
                    </button>
                  ))}
                </div>
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
          {page === 'agents' && <AgentsPage business={business} refresh={loadBusiness} setPage={setPage} />}
          {page === 'whatsapp' && <WhatsAppPage business={business} refresh={loadBusiness} setPage={setPage} />}
          {page === 'barista' && <BaristaPage business={business} />}
          {page === 'workflows' && <WorkflowsPage business={business} />}
          {page === 'leadgen' && <LeadGenPage business={business} />}
          {page === 'knowledge' && <KnowledgePage business={business} refresh={loadBusiness} />}
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
            <div className="text-2xl font-bold capitalize">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { page: 'chat' as Page, icon: MessageSquare, label: 'Test Your AI Agent', desc: 'Chat with your trained AI agent', color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10' },
          { page: 'whatsapp' as Page, icon: MessageSquare, label: 'WhatsApp Setup', desc: 'Connect WhatsApp to your agent', color: 'text-green-400', bg: 'bg-green-500/10' },
          { page: 'barista' as Page, icon: Coffee, label: 'AI Barista / QR', desc: 'Generate QR codes for table ordering', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { page: 'workflows' as Page, icon: Workflow, label: 'Workflows', desc: 'Automate actions with triggers', color: 'text-nerva-cyan', bg: 'bg-nerva-cyan/10' },
          { page: 'leadgen' as Page, icon: Target, label: 'Lead Generation', desc: 'AI-powered prospect outreach', color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { page: 'knowledge' as Page, icon: Brain, label: 'Knowledge Base', desc: 'Train your AI with documents', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((item) => (
          <button key={item.page} onClick={() => setPage(item.page)} className="glass-card-hover rounded-xl p-6 text-left group">
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <h3 className="font-semibold mb-1">{item.label}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-2 group-hover:text-nerva-cyan transition-colors" />
          </button>
        ))}
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

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast({ title: 'Status updated', description: `Lead marked as ${status}.` });
        loadLeads();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{leads.length} leads captured by your AI agents</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLeads} className="border-nerva-border">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
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
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const statusCfg = leadStatusConfig[lead.status] || leadStatusConfig.new;
                  return (
                    <tr key={lead.id} className="border-b border-nerva-border/50 hover:bg-nerva-cyan/5">
                      <td className="p-4 text-sm">{lead.customerName || '\u2014'}</td>
                      <td className="p-4 text-sm">{lead.customerContact || '\u2014'}</td>
                      <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">{lead.intent || '\u2014'}</td>
                      <td className="p-4"><span className="text-xs px-2 py-0.5 rounded-full bg-nerva-cyan/10 text-nerva-cyan">{lead.source}</span></td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${statusCfg.bg} ${statusCfg.color} bg-transparent appearance-none font-medium`}
                        >
                          {Object.entries(leadStatusConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <button onClick={() => deleteLead(lead.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ AGENTS ============ */
function AgentsPage({ business, refresh, setPage }: { business: Business; refresh: () => void; setPage: (p: Page) => void }) {
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
          <p className="text-muted-foreground">Manage your AI workforce · {agents.length}/{currentLimit === 999 ? '\u221e' : currentLimit} agents</p>
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
                onClick={() => { setLimitModal(false); setPage('subscription'); }}
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
            <>
              <div className="flex gap-3 mb-4">
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="flex-1 bg-muted/50 border-nerva-border h-11 rounded-xl"
                />
                <Button onClick={createAgent} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-11 rounded-xl px-6">
                  Create
                </Button>
              </div>
              {/* Agent type specific info */}
              {newAgentType === 'whatsapp' && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">WhatsApp Agent Setup</span>
                  </div>
                  <p className="text-xs text-muted-foreground">After creating this agent, go to the WhatsApp Setup page to connect your WhatsApp Business number via Evolution API. Your agent will respond to customers automatically on WhatsApp.</p>
                </div>
              )}
              {newAgentType === 'barista' && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">AI Barista Setup</span>
                  </div>
                  <p className="text-xs text-muted-foreground">After creating this agent, a QR code will be generated automatically. Print it and place it on tables - customers scan and chat to order. Go to the AI Barista page to get your QR code.</p>
                </div>
              )}
            </>
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
                {agent.type === 'whatsapp' && (
                  <button onClick={() => setPage('whatsapp')} className="mt-3 text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Setup WhatsApp
                  </button>
                )}
                {agent.type === 'barista' && (
                  <button onClick={() => setPage('barista')} className="mt-3 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> View QR Code
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ WHATSAPP ============ */
function WhatsAppPage({ business, refresh, setPage }: { business: Business; refresh: () => void; setPage: (p: Page) => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(business.whatsappNumber || '');
  const [savingNumber, setSavingNumber] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const { toast } = useToast();

  const whatsappAgents = agents.filter(a => a.type === 'whatsapp');
  const selectedAgent = whatsappAgents[0] || null;

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?businessId=' + business.id);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
        const wa = data.find((a: Agent) => a.type === 'whatsapp');
        if (wa?.systemPrompt) setSystemPrompt(wa.systemPrompt);
      }
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const saveWhatsappNumber = async () => {
    setSavingNumber(true);
    try {
      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, whatsappNumber }),
      });
      if (res.ok) {
        toast({ title: 'WhatsApp number saved', description: 'Your WhatsApp Business number has been updated.' });
        refresh();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save number.', variant: 'destructive' });
    } finally { setSavingNumber(false); }
  };

  const saveSystemPrompt = async () => {
    if (!selectedAgent) return;
    setSavingPrompt(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAgent.id, systemPrompt }),
      });
      if (res.ok) {
        toast({ title: 'System prompt updated', description: 'Your WhatsApp agent prompt has been saved.' });
        setEditingPrompt(false);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update prompt.', variant: 'destructive' });
    } finally { setSavingPrompt(false); }
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/chat` : '';
  const apiEndpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/chat` : '';

  const steps = [
    { num: 1, title: 'Create WhatsApp Agent', done: whatsappAgents.length > 0, icon: Bot },
    { num: 2, title: 'Connect WhatsApp Number', done: !!business.whatsappNumber, icon: Phone },
    { num: 3, title: 'Configure API', done: whatsappAgents.length > 0, icon: Key },
    { num: 4, title: 'Test Your Agent', done: false, icon: MessageSquare },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Bot Setup</h1>
          <p className="text-muted-foreground">Connect WhatsApp to your AI agent</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Setup Steps Progress */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Setup Progress</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((step) => (
                <div key={step.num} className={`p-4 rounded-xl border ${step.done ? 'bg-nerva-green/5 border-nerva-green/20' : 'bg-muted/10 border-nerva-border'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-nerva-green/20 text-nerva-green' : 'bg-muted/30 text-muted-foreground'}`}>
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </div>
                    <step.icon className={`w-4 h-4 ${step.done ? 'text-nerva-green' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className={`text-xs mt-0.5 ${step.done ? 'text-nerva-green' : 'text-muted-foreground'}`}>
                    {step.done ? 'Complete' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Create Agent */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-nerva-cyan/20 text-nerva-cyan flex items-center justify-center text-xs font-bold">1</div>
              <h3 className="font-semibold">Create WhatsApp Agent</h3>
              {whatsappAgents.length > 0 && <CheckCircle2 className="w-4 h-4 text-nerva-green ml-auto" />}
            </div>
            {whatsappAgents.length > 0 ? (
              <div className="bg-nerva-green/5 border border-nerva-green/20 rounded-xl p-4">
                <p className="text-sm text-nerva-green">WhatsApp agent &quot;{selectedAgent?.name}&quot; is active.</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">You need a WhatsApp agent first. Create one from the Agents page.</p>
                <Button onClick={() => setPage('agents')} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Create WhatsApp Agent
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Connect WhatsApp Number */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-nerva-cyan/20 text-nerva-cyan flex items-center justify-center text-xs font-bold">2</div>
              <h3 className="font-semibold">Connect WhatsApp Number</h3>
              {business.whatsappNumber && <CheckCircle2 className="w-4 h-4 text-nerva-green ml-auto" />}
            </div>
            <p className="text-sm text-muted-foreground mb-3">Enter your WhatsApp Business number that customers will message.</p>
            <div className="flex gap-3">
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+20xxxxxxxxxx"
                className="flex-1 bg-muted/50 border-nerva-border h-11 rounded-xl"
              />
              <Button onClick={saveWhatsappNumber} disabled={savingNumber} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-11 rounded-xl px-6">
                {savingNumber ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {/* Step 3: API Configuration */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-nerva-cyan/20 text-nerva-cyan flex items-center justify-center text-xs font-bold">3</div>
              <h3 className="font-semibold">API Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">API Endpoint</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted/30 border border-nerva-border rounded-xl px-4 py-2.5 text-sm font-mono text-nerva-cyan truncate">
                    {apiEndpoint}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(apiEndpoint); toast({ title: 'Copied!' }); }} className="border-nerva-border px-4">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Webhook URL (for Evolution API)</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted/30 border border-nerva-border rounded-xl px-4 py-2.5 text-sm font-mono text-nerva-cyan truncate">
                    {webhookUrl}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: 'Copied!' }); }} className="border-nerva-border px-4">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Business API Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted/30 border border-nerva-border rounded-xl px-4 py-2.5 text-sm font-mono text-nerva-cyan truncate">
                    {business.apiKey}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(business.apiKey); toast({ title: 'Copied!' }); }} className="border-nerva-border px-4">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Agent System Prompt</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingPrompt(!editingPrompt)} className="text-muted-foreground">
                <Edit3 className="w-4 h-4 mr-1" /> {editingPrompt ? 'Cancel' : 'Edit'}
              </Button>
            </div>
            {editingPrompt ? (
              <div>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="w-full bg-muted/50 border-nerva-border rounded-xl text-sm resize-none"
                />
                <Button onClick={saveSystemPrompt} disabled={savingPrompt} className="mt-3 bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
                  {savingPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Prompt
                </Button>
              </div>
            ) : (
              <div className="bg-muted/20 rounded-xl p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                {systemPrompt || 'No custom prompt set. Using default business prompt.'}
              </div>
            )}
          </div>

          {/* Step 4: Test */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-nerva-cyan/20 text-nerva-cyan flex items-center justify-center text-xs font-bold">4</div>
              <h3 className="font-semibold">Test Your Agent</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Open the AI Chat to verify your WhatsApp agent responds correctly.</p>
            <Button onClick={() => setPage('chat')} variant="outline" className="border-nerva-border rounded-xl">
              <MessageSquare className="w-4 h-4 mr-2" /> Open Test Chat
            </Button>
          </div>

          {/* API Documentation */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-nerva-cyan" />
              <h3 className="font-semibold">Evolution API Integration</h3>
            </div>
            <div className="bg-muted/20 rounded-xl p-4 space-y-3 text-sm text-muted-foreground">
              <p>To connect WhatsApp via Evolution API:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Install and configure <a href="https://github.com/EvolutionAPI/evolution-api" target="_blank" rel="noopener noreferrer" className="text-nerva-cyan hover:underline">Evolution API</a> on your server</li>
                <li>Create a new instance and connect your WhatsApp number by scanning the QR code</li>
                <li>Set the webhook URL to: <code className="bg-muted/30 px-1.5 py-0.5 rounded text-nerva-cyan">{webhookUrl}</code></li>
                <li>Messages from WhatsApp will be forwarded to your Nerva AI agent automatically</li>
              </ol>
            </div>
          </div>

          {/* Connection Status */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Connection Status</h3>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${whatsappAgents.length > 0 ? 'bg-nerva-green animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm">
                {whatsappAgents.length > 0
                  ? `Agent active${business.whatsappNumber ? ' · Number connected' : ' · No number connected'}`
                  : 'No WhatsApp agent configured'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ BARISTA ============ */
function BaristaPage({ business }: { business: Business }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<string[]>(['']);
  const [savingMenu, setSavingMenu] = useState(false);
  const { toast } = useToast();

  const baristaAgents = agents.filter(a => a.type === 'barista');

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?businessId=' + business.id);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
        // Load menu from first barista agent config
        const barista = data.find((a: Agent) => a.type === 'barista');
        if (barista?.config) {
          try {
            const config = JSON.parse(barista.config);
            if (config.menu && Array.isArray(config.menu) && config.menu.length > 0) {
              setMenuItems(config.menu);
            }
          } catch {}
        }
      }
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const getQrCodeUrl = (businessId: string) => {
    if (typeof window === 'undefined') return '';
    const url = `${window.location.origin}/barista/${businessId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  };

  const getBaristaUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/barista/${business.id}`;
  };

  const addMenuItem = () => setMenuItems([...menuItems, '']);

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, value: string) => {
    const updated = [...menuItems];
    updated[index] = value;
    setMenuItems(updated);
  };

  const saveMenu = async () => {
    if (!baristaAgents[0]) return;
    setSavingMenu(true);
    try {
      const filtered = menuItems.filter(i => i.trim());
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: baristaAgents[0].id,
          config: { menu: filtered },
        }),
      });
      if (res.ok) {
        toast({ title: 'Menu saved', description: 'Your barista menu has been updated.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save menu.', variant: 'destructive' });
    } finally { setSavingMenu(false); }
  };

  const downloadQr = () => {
    const url = getQrCodeUrl(business.id);
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Barista / Digital Waiter</h1>
          <p className="text-muted-foreground">QR code ordering for your cafe or restaurant</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : baristaAgents.length === 0 ? (
        <div className="mt-6 glass-card rounded-2xl p-12 text-center">
          <Coffee className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">No Barista Agent</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a Barista agent from the Agents page to generate QR codes for table ordering.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* QR Code */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">QR Code for {business.name}</h3>
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="bg-white rounded-2xl p-4">
                <img
                  src={getQrCodeUrl(business.id)}
                  alt="QR Code for Barista"
                  className="w-48 h-48 sm:w-56 sm:h-56"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Scan URL</label>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted/30 border border-nerva-border rounded-xl px-3 py-2 text-xs font-mono text-nerva-cyan truncate">
                      {getBaristaUrl()}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(getBaristaUrl()); toast({ title: 'URL copied!' }); }} className="border-nerva-border px-3">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <Button onClick={downloadQr} variant="outline" className="border-nerva-border rounded-xl w-full">
                  <Download className="w-4 h-4 mr-2" /> Download QR Code
                </Button>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">Print this QR code and place it on tables. Customers scan it with their phone camera and start chatting with your AI Barista to place orders.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Builder */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Menu Builder</h3>
              <Button variant="outline" size="sm" onClick={addMenuItem} className="border-nerva-border">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Add your menu items so the AI Barista knows what to offer customers.</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {menuItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-7 h-9 flex items-center justify-center text-xs text-muted-foreground">{i + 1}</div>
                  <Input
                    value={item}
                    onChange={(e) => updateMenuItem(i, e.target.value)}
                    placeholder="e.g. Espresso - 35 EGP"
                    className="flex-1 bg-muted/50 border-nerva-border h-9 rounded-lg text-sm"
                  />
                  <button onClick={() => removeMenuItem(i)} className="text-muted-foreground hover:text-red-400 p-2">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={saveMenu} disabled={savingMenu} className="mt-4 bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
              {savingMenu ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Menu
            </Button>
          </div>

          {/* How to Use */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">How to Use AI Barista</h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Add your menu items above so the AI knows what to offer' },
                { step: '2', text: 'Download and print the QR code' },
                { step: '3', text: 'Place QR codes on each table in your cafe/restaurant' },
                { step: '4', text: 'Customers scan the QR code with their phone camera' },
                { step: '5', text: 'They chat with the AI to browse the menu and place orders' },
                { step: '6', text: 'You receive orders in real-time through the Leads page' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Barista Agents List */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Your Barista Agents</h3>
            <div className="space-y-2">
              {baristaAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/10">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-sm font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">Created {new Date(agent.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${agent.status === 'active' ? 'bg-nerva-green/10 text-nerva-green' : 'bg-muted text-muted-foreground'}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ WORKFLOWS ============ */
function WorkflowsPage({ business }: { business: Business }) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows?businessId=' + business.id);
      if (res.ok) setWorkflows(await res.json());
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const createWorkflow = async () => {
    if (!newName || !newTrigger) return;
    setCreating(true);
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          name: newName,
          description: newDesc,
          trigger: newTrigger,
          actions: selectedActions.map(a => ({ type: a })),
        }),
      });
      if (res.ok) {
        toast({ title: 'Workflow created', description: `"${newName}" is now ready.` });
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        setNewTrigger('');
        setSelectedActions([]);
        loadWorkflows();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create workflow.', variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const toggleWorkflowStatus = async (wf: WorkflowItem) => {
    const newStatus = wf.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/workflows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wf.id, status: newStatus }),
      });
      if (res.ok) {
        toast({ title: `Workflow ${newStatus}`, description: `"${wf.name}" is now ${newStatus}.` });
        loadWorkflows();
      }
    } catch {}
  };

  const runWorkflowNow = async (wf: WorkflowItem) => {
    try {
      const res = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: wf.id }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Workflow executed', description: `"${wf.name}" ran successfully. ${data.results?.length || 0} actions executed.` });
        loadWorkflows();
      } else {
        toast({ title: 'Error', description: 'Failed to execute workflow.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to execute workflow.', variant: 'destructive' });
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Workflow deleted' });
    loadWorkflows();
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev =>
      prev.includes(actionId) ? prev.filter(a => a !== actionId) : [...prev, actionId]
    );
  };

  const getTriggerInfo = (triggerId: string) => workflowTriggers.find(t => t.id === triggerId) || workflowTriggers[3];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflow Automations</h1>
          <p className="text-muted-foreground">Automate actions with triggers and workflows</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Workflow
        </Button>
      </div>

      {/* Create workflow panel */}
      {showCreate && (
        <div className="glass-card rounded-2xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold">Create New Workflow</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. New Lead Notification" className="bg-muted/50 border-nerva-border h-11 rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Description</label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" className="bg-muted/50 border-nerva-border h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Trigger</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {workflowTriggers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setNewTrigger(t.id)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    newTrigger === t.id
                      ? 'bg-nerva-cyan/10 border-nerva-cyan/40'
                      : 'bg-muted/20 border-nerva-border hover:border-nerva-cyan/20'
                  }`}
                >
                  <t.icon className={`w-4 h-4 mb-1.5 ${newTrigger === t.id ? 'text-nerva-cyan' : 'text-muted-foreground'}`} />
                  <div className="text-xs font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Actions</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {workflowActionTypes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleAction(a.id)}
                  className={`p-3 rounded-xl text-left transition-all border ${
                    selectedActions.includes(a.id)
                      ? 'bg-nerva-cyan/10 border-nerva-cyan/40'
                      : 'bg-muted/20 border-nerva-border hover:border-nerva-cyan/20'
                  }`}
                >
                  <a.icon className={`w-4 h-4 mb-1.5 ${selectedActions.includes(a.id) ? 'text-nerva-cyan' : 'text-muted-foreground'}`} />
                  <div className="text-xs font-medium">{a.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createWorkflow} disabled={!newName || !newTrigger || creating} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Workflow
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : workflows.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Workflow className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No workflows yet.</p>
          <p className="text-xs text-muted-foreground">Create your first workflow to automate actions when triggers fire.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => {
            const triggerInfo = getTriggerInfo(wf.trigger);
            let actionsList: { type: string }[] = [];
            try { actionsList = JSON.parse(wf.actions); } catch {}
            return (
              <div key={wf.id} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${wf.status === 'active' ? 'bg-nerva-green/10' : 'bg-muted/20'} flex items-center justify-center`}>
                      <triggerInfo.icon className={`w-5 h-5 ${wf.status === 'active' ? 'text-nerva-green' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{wf.name}</h4>
                      {wf.description && <p className="text-xs text-muted-foreground mt-0.5">{wf.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nerva-cyan/10 text-nerva-cyan capitalize">{wf.trigger.replace('_', ' ')}</span>
                        {actionsList.map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground capitalize">{a.type}</span>
                        ))}
                      </div>
                      {wf.lastRunAt && (
                        <p className="text-[10px] text-muted-foreground mt-1">Last run: {new Date(wf.lastRunAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runWorkflowNow(wf)}
                      className="p-2 rounded-lg transition-colors bg-nerva-cyan/10 text-nerva-cyan hover:bg-nerva-cyan/20"
                      title="Run Now"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleWorkflowStatus(wf)}
                      className={`p-2 rounded-lg transition-colors ${wf.status === 'active' ? 'bg-nerva-green/10 text-nerva-green hover:bg-nerva-green/20' : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'}`}
                      title={wf.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {wf.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteWorkflow(wf.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============ LEAD GEN ============ */
function LeadGenPage({ business }: { business: Business }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetAudience, setTargetAudience] = useState('');
  const [channels, setChannels] = useState<string[]>(['whatsapp']);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const leadgenAgents = agents.filter(a => a.type === 'leadgen');

  const loadData = useCallback(async () => {
    try {
      const [agentsRes, leadsRes] = await Promise.all([
        fetch('/api/agents?businessId=' + business.id),
        fetch('/api/leads?businessId=' + business.id),
      ]);
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        setAgents(data);
        const lg = data.find((a: Agent) => a.type === 'leadgen');
        if (lg?.config) {
          try {
            const config = JSON.parse(lg.config);
            if (config.targetAudience) setTargetAudience(config.targetAudience);
            if (config.channels) setChannels(config.channels);
            if (config.messageTemplate) setMessageTemplate(config.messageTemplate);
          } catch {}
        }
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.filter((l: Lead) => l.source === 'leadgen'));
      }
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveConfig = async () => {
    if (!leadgenAgents[0]) return;
    setSaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadgenAgents[0].id,
          config: JSON.stringify({ targetAudience, channels, messageTemplate }),
        }),
      });
      if (res.ok) {
        toast({ title: 'Settings saved', description: 'Lead generation configuration updated.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const aiTemplates = [
    { label: 'Cold Outreach - WhatsApp', text: 'Hi {name}! I noticed you might be interested in {service}. We at {business} are offering a special deal this month. Would you like to learn more?' },
    { label: 'Follow-up - Email', text: 'Dear {name}, Following up on our conversation about {topic}. I wanted to share some exciting updates from {business} that might interest you.' },
    { label: 'Introduction - WhatsApp', text: 'Hello! This is {business} reaching out. We help businesses like yours with {service}. Would you be open to a quick chat?' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Lead Generation</h1>
          <p className="text-muted-foreground">Automated prospect outreach and lead capture</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-3">
                <Target className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-2xl font-bold">{leadgenAgents.length}</div>
              <div className="text-xs text-muted-foreground">Lead Gen Agents</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-nerva-green/10 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-nerva-green" />
              </div>
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-xs text-muted-foreground">Leads Captured</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-nerva-cyan/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-nerva-cyan" />
              </div>
              <div className="text-2xl font-bold capitalize">{channels.join(', ') || 'None'}</div>
              <div className="text-xs text-muted-foreground">Active Channels</div>
            </div>
          </div>

          {!leadgenAgents.length ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Target className="w-12 h-12 text-rose-400/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Lead Gen Agent</h3>
              <p className="text-sm text-muted-foreground">Create a Lead Generation agent from the Agents page to start automated outreach.</p>
            </div>
          ) : (
            <>
              {/* Configuration */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Lead Generation Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Target Audience</label>
                    <Textarea
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Small business owners in Egypt interested in AI automation"
                      rows={3}
                      className="bg-muted/50 border-nerva-border rounded-xl text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Outreach Channels</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-400' },
                        { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-400' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => toggleChannel(ch.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                            channels.includes(ch.id)
                              ? 'bg-nerva-cyan/10 border-nerva-cyan/40 text-foreground'
                              : 'bg-muted/20 border-nerva-border text-muted-foreground hover:border-nerva-cyan/20'
                          }`}
                        >
                          <ch.icon className={`w-4 h-4 ${channels.includes(ch.id) ? ch.color : ''}`} />
                          <span className="text-sm">{ch.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Cold Outreach Message Template</label>
                    <Textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      placeholder="Hi {name}! I'm reaching out from {business}..."
                      rows={4}
                      className="bg-muted/50 border-nerva-border rounded-xl text-sm resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Use {'{name}'}, {'{business}'}, {'{service}'} as placeholders.</p>
                  </div>
                  <Button onClick={saveConfig} disabled={saving} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Configuration
                  </Button>
                </div>
              </div>

              {/* AI-generated templates */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-4">AI Outreach Templates</h3>
                <p className="text-sm text-muted-foreground mb-3">Pre-written templates you can customize for your outreach campaigns.</p>
                <div className="space-y-3">
                  {aiTemplates.map((tpl, i) => (
                    <div key={i} className="bg-muted/10 rounded-xl p-4 border border-nerva-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{tpl.label}</span>
                        <Button variant="ghost" size="sm" onClick={() => { setMessageTemplate(tpl.text); toast({ title: 'Template loaded' }); }} className="text-xs text-nerva-cyan h-7">
                          Use This
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{tpl.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captured leads */}
              {leads.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Leads from Lead Gen ({leads.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/10">
                        <div>
                          <div className="text-sm font-medium">{lead.customerName || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{lead.customerContact || '\u2014'}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${(leadStatusConfig[lead.status] || leadStatusConfig.new).bg} ${(leadStatusConfig[lead.status] || leadStatusConfig.new).color}`}>
                          {lead.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ KNOWLEDGE ============ */
function KnowledgePage({ business, refresh }: { business: Business; refresh: () => void }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const knowledgeAgents = business.agents?.filter(a => a.type === 'knowledge') || [];

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge?businessId=' + business.id);
      if (res.ok) setDocs(await res.json());
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const saveDoc = async () => {
    if (!newTitle || !newContent) return;
    setSaving(true);
    try {
      if (editingDoc) {
        const res = await fetch('/api/knowledge', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDoc.id, title: newTitle, content: newContent, category: newCategory }),
        });
        if (res.ok) {
          toast({ title: 'Document updated', description: `"${newTitle}" has been updated.` });
        }
      } else {
        const res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id, title: newTitle, content: newContent, category: newCategory }),
        });
        if (res.ok) {
          toast({ title: 'Document created', description: `"${newTitle}" has been added to your knowledge base.` });
        }
      }
      setShowCreate(false);
      setEditingDoc(null);
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      loadDocs();
      refresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to save document.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Document deleted' });
    loadDocs();
    refresh();
  };

  const startEdit = (doc: KnowledgeDoc) => {
    setEditingDoc(doc);
    setNewTitle(doc.title);
    setNewContent(doc.content);
    setNewCategory(doc.category);
    setShowCreate(true);
  };

  const cancelEdit = () => {
    setShowCreate(false);
    setEditingDoc(null);
    setNewTitle('');
    setNewContent('');
    setNewCategory('general');
  };

  const sendKnowledgeChat = async () => {
    if (!chatInput.trim() || chatSending) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatSending(true);
    try {
      const res = await fetch('/api/knowledge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, message: userMsg }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.ok ? data.response : 'Error getting response. Please try again.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please check your internet and try again.' }]);
    } finally { setChatSending(false); }
  };

  const categoryStats = docs.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Internal Knowledge Base</h1>
          <p className="text-muted-foreground">Private AI chatbot for your employees — trained on company policies, onboarding, and procedures</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-nerva-cyan animate-spin" /></div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold">{docs.length}</div>
              <div className="text-xs text-muted-foreground">Total Documents</div>
            </div>
            {knowledgeCategories.map((cat) => (
              <div key={cat.id} className="glass-card rounded-xl p-4">
                <div className={`text-2xl font-bold ${cat.color}`}>{categoryStats[cat.id] || 0}</div>
                <div className="text-xs text-muted-foreground">{cat.label}</div>
              </div>
            )).slice(0, 3)}
          </div>

          {/* Add / Edit Document */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <Button onClick={() => { cancelEdit(); setShowCreate(!showCreate); }} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> {editingDoc ? 'Editing' : 'Add Document'}
            </Button>
          </div>

          {showCreate && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold">{editingDoc ? 'Edit Document' : 'New Document'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Title</label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Return Policy" className="bg-muted/50 border-nerva-border h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-muted/50 border border-nerva-border rounded-xl h-11 px-3 text-sm text-foreground"
                  >
                    {knowledgeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Content</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder="Write the document content here..."
                  className="bg-muted/50 border-nerva-border rounded-xl text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                <Button onClick={saveDoc} disabled={!newTitle || !newContent || saving} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingDoc ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          )}

          {/* Document list */}
          {docs.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Brain className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No documents yet.</p>
              <p className="text-xs text-muted-foreground">Add documents to train your AI agent with your business knowledge.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => {
                const catInfo = knowledgeCategories.find(c => c.id === doc.category) || knowledgeCategories[0];
                return (
                  <div key={doc.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg ${catInfo.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <FileText className={`w-4 h-4 ${catInfo.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{doc.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.content}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${catInfo.bg} ${catInfo.color}`}>{catInfo.label}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(doc)} className="p-2 text-muted-foreground hover:text-nerva-cyan transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteDoc(doc.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Employee AI Chatbot */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold">Employee AI Assistant</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 ml-2">Internal Only</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Employees can ask questions about company policies, onboarding, procedures, and more. The AI responds based on your uploaded documents.</p>
            <div className="bg-muted/20 rounded-xl p-3 max-h-72 overflow-y-auto mb-3 space-y-2">
              {chatMessages.length === 0 && (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 text-purple-400/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Ask a question about company policies, onboarding, or procedures...</p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {['What is the leave policy?', 'How do I onboard a new employee?', 'What is the escalation procedure?'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:border-purple-400/30 hover:text-purple-400 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
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
                  <div className="bg-muted/50 rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-nerva-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); sendKnowledgeChat(); }} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your business..."
                className="flex-1 bg-muted/50 border-nerva-border h-10 rounded-lg text-sm"
                disabled={chatSending}
              />
              <Button type="submit" disabled={!chatInput.trim() || chatSending} className="bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark h-10 px-4 rounded-lg">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ SUBSCRIPTION ============ */
function SubscriptionPage({ business, refresh }: { business: Business; refresh: () => void }) {
  const { toast } = useToast();
  const [paymentModal, setPaymentModal] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/payments');
      if (res.ok) setPayments(await res.json());
    } catch {} finally { setPaymentsLoading(false); }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleUpgradeClick = (planId: string) => {
    if (planId === 'free') return;
    setPaymentModal(planId);
  };

  const submitPayment = async () => {
    if (!paymentModal || !screenshot) return;
    setSubmitting(true);
    try {
      const amount = planPrices[paymentModal] || 0;

      // Create payment record + upload screenshot in one request
      const formData = new FormData();
      formData.append('businessId', business.id);
      formData.append('plan', paymentModal);
      formData.append('amount', String(amount));
      formData.append('screenshot', screenshot);

      const payRes = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      if (payRes.ok) {
        toast({
          title: 'Payment submitted!',
          description: 'We\'ll verify within 10 minutes and activate your subscription.',
        });
        setPaymentModal(null);
        setScreenshot(null);
        loadPayments();
      } else {
        const data = await payRes.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit payment. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error. Please check your connection and try again.', variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  const paymentStatusConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    approved: { color: 'text-nerva-green', bg: 'bg-nerva-green/10' },
    rejected: { color: 'text-red-400', bg: 'bg-red-500/10' },
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
              <div className="font-bold">{(agentLimits[business.subscriptionStatus] || 1) === 999 ? '\u221e' : (agentLimits[business.subscriptionStatus] || 1)}</div>
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
                onClick={() => handleUpgradeClick(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full rounded-xl font-semibold ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground'
                    : plan.highlight
                      ? 'shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark'
                      : 'border border-nerva-border bg-transparent text-foreground hover:bg-muted/50'
                }`}
                variant={isCurrentPlan || plan.highlight ? undefined : 'outline'}
              >
                {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Upgrade to {paymentModal.charAt(0).toUpperCase() + paymentModal.slice(1)}</h3>
              <button onClick={() => { setPaymentModal(null); setScreenshot(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-nerva-cyan/5 border border-nerva-cyan/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">Send <span className="text-nerva-cyan font-bold text-lg">{subscriptionPlans.find(p => p.id === paymentModal)?.price} EGP</span> via InstaPay to:</p>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xl font-bold font-mono text-nerva-cyan">@hossyehia</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">InstaPay address: @hossyehia</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Upload Payment Screenshot</label>
                <div className="border-2 border-dashed border-nerva-border rounded-xl p-4 text-center hover:border-nerva-cyan/30 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                    {screenshot ? (
                      <div className="flex items-center gap-2 text-nerva-cyan">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm">{screenshot.name}</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                        <p className="text-xs text-muted-foreground/50">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <Button onClick={submitPayment} disabled={!screenshot || submitting} className="w-full bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl h-12">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Payment'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">We&apos;ll verify within 10 minutes and activate your subscription.</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        {paymentsLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-nerva-cyan animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No payment history yet.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-nerva-border">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Plan</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Method</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusCfg = paymentStatusConfig[payment.status] || paymentStatusConfig.pending;
                    return (
                      <tr key={payment.id} className="border-b border-nerva-border/50">
                        <td className="p-4 text-sm capitalize">{payment.plan}</td>
                        <td className="p-4 text-sm">{payment.amount} {payment.currency}</td>
                        <td className="p-4 text-sm capitalize">{payment.method}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color} capitalize`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                  { feature: 'AI Agents', values: ['1', '3', '7', '\u221e'] },
                  { feature: 'Leads/month', values: ['10', '100', '500', '\u221e'] },
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
                          val ? <CheckCircle2 className="w-4 h-4 text-nerva-green mx-auto" /> : <span className="text-muted-foreground/30">\u2014</span>
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
          <Textarea
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
