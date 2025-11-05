import { AboutSections } from "@/components/AboutSections";
import { CallToAction } from "@/components/CallToAction";
import { ContractsSection } from "@/components/ContractsSection";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { ImpactMetrics } from "@/components/ImpactMetrics";
import { Navbar } from "@/components/Navbar";
import { TechStack } from "@/components/TechStack";
import { ValueGrid } from "@/components/ValueGrid";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <div id="login" className="flex-1">
        <Hero />
        <ImpactMetrics />
        <AboutSections />
        <ValueGrid />
        <ContractsSection />
        <TechStack />
        <CallToAction />
      </div>
      <Footer />
    </main>
  );
}
