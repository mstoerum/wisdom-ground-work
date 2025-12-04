import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AIAnalysisDemo } from "@/components/landing/AIAnalysisDemo";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PersonasSection } from "@/components/landing/PersonasSection";
import { SecuritySection } from "@/components/landing/SecuritySection";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AIAnalysisDemo />
        <ComparisonSection />
        <PersonasSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
