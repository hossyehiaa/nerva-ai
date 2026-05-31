'use client';

import Navbar from '@/components/sections/Navbar';
import Hero from '@/components/sections/Hero';
import WhyNerva from '@/components/sections/WhyNerva';
import Services from '@/components/sections/Services';
import HowItWorks from '@/components/sections/HowItWorks';
import Pricing from '@/components/sections/Pricing';
import FAQ from '@/components/sections/FAQ';
import CTA from '@/components/sections/CTA';
import Footer from '@/components/sections/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-nerva-dark">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <WhyNerva />
        <Services />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
