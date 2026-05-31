'use client';

import { Zap, Github, Linkedin, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#services' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ],
  Services: [
    { label: 'WhatsApp AI Agents', href: '#services' },
    { label: 'AI Barista', href: '#services' },
    { label: 'Workflow Automations', href: '#services' },
    { label: 'Lead Generation', href: '#services' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#contact' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-nerva-border bg-[#020509]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nerva-cyan to-nerva-blue flex items-center justify-center">
                <Zap className="w-4 h-4 text-nerva-dark" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text-cyan">Nerva</span>
                <span className="text-foreground ml-1">AI</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              When Your Business Thinks for Itself. AI-powered automation for
              the modern enterprise.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-nerva-cyan hover:border-nerva-cyan/30 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-nerva-cyan hover:border-nerva-cyan/30 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-nerva-cyan hover:border-nerva-cyan/30 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg glass-card flex items-center justify-center text-muted-foreground hover:text-nerva-cyan hover:border-nerva-cyan/30 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-nerva-cyan transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-nerva-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Nerva AI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Built with AI. Powered by Intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
