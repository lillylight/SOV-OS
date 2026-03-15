import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProtocolModules from "@/components/ProtocolModules";
import FlowDiagram from "@/components/FlowDiagram";
import Capabilities from "@/components/Capabilities";
import AgentIntegration from "@/components/AgentIntegration";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1440px] mx-auto border-l border-r border-[var(--line)]">
        <Hero />
        <ProtocolModules />
        <FlowDiagram />
        <Capabilities />
        <PricingSection />
        <AgentIntegration />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
