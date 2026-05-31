'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap, LogOut, Plus, MessageSquare, Users, Target,
  Send, Loader2, Trash2, Key, Bot, Settings, Coffee,
  Brain, Workflow, Film, Phone, ArrowLeft, ChevronDown,
  Sparkles, Copy, CheckCircle2, BarChart3, Clock
} from 'lucide-react';

type Page = 'overview' | 'chat' | 'leads' | 'agents' | 'settings';

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

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, logout, refreshUser } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [page, setPage] = useState<Page>('overview');
  const [loading, setLoading] = useState(true);

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
            </button>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-nerva-border">
          <div className="flex items-center gap-3 mb-3">
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
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`p-2 rounded-lg ${page === item.id ? 'bg-nerva-cyan/10 text-nerva-cyan' : 'text-muted-foreground'}`}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {page === 'overview' && <OverviewPage business={business} setPage={setPage} />}
          {page === 'chat' && <ChatPage business={business} />}
          {page === 'leads' && <LeadsPage business={business} />}
          {page === 'agents' && <AgentsPage business={business} refresh={loadBusiness} />}
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ businessId: business.id, message: userMsg }),
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">AI Agent Chat</h1>
      <p className="text-muted-foreground mb-6">Test your AI agent trained on {business.name}&apos;s knowledge base.</p>

      <div className="glass-card rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 border-b border-nerva-border">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
            <Bot className="w-5 h-5 text-nerva-dark" />
          </div>
          <div>
            <div className="text-sm font-medium">{business.name} Agent</div>
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
              <p className="text-muted-foreground/50 text-xs mt-1">It&apos;s trained on your business knowledge base</p>
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
  );
}

/* ============ LEADS ============ */
function LeadsPage({ business }: { business: Business }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents?businessId=' + business.id);
      if (res.ok) setAgents(await res.json());
    } catch {} finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const createAgent = async () => {
    if (!newAgentType || !newAgentName) return;
    await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, type: newAgentType, name: newAgentName }),
    });
    setShowCreate(false);
    setNewAgentType('');
    setNewAgentName('');
    loadAgents();
    refresh();
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
    loadAgents();
    refresh();
  };

  const selectedType = agentTypes.find((t) => t.id === newAgentType);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage your AI workforce</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="shine-effect bg-gradient-to-r from-nerva-cyan to-nerva-blue text-nerva-dark font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Agent
        </Button>
      </div>

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

/* ============ SETTINGS ============ */
function SettingsPage({ business, refresh }: { business: Business; refresh: () => void }) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(business.name);
  const [contextData, setContextData] = useState(business.contextData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(business.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, name, contextData }),
      });
      setSaved(true);
      refresh();
      setTimeout(() => setSaved(false), 2000);
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
