import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AnimatedVisual from "@/components/AnimatedVisual";
import ProtocolModules from "@/components/ProtocolModules";
import FlowDiagram from "@/components/FlowDiagram";
import Capabilities from "@/components/Capabilities";
import AgentIntegration from "@/components/AgentIntegration";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-[1440px] mx-auto border-l border-r border-[var(--line)]">
        <Hero />
        <div className="px-8 py-12">
          <AnimatedVisual />
        </div>
        <ProtocolModules />
        <FlowDiagram />
        <Capabilities />
        <AgentIntegration />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
