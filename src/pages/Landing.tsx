import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { DifferenceSection } from "@/components/landing/DifferenceSection";
import { AIAnalysisDemo } from "@/components/landing/AIAnalysisDemo";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PersonasSection } from "@/components/landing/PersonasSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <DifferenceSection />
        <AIAnalysisDemo />
        <ComparisonSection />
        <PersonasSection />
      </main>
    </div>
  );
};

export default Landing;
