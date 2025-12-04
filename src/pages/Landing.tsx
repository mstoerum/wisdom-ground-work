import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { DifferenceSection } from "@/components/landing/DifferenceSection";
import { AIAnalysisDemo } from "@/components/landing/AIAnalysisDemo";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <DifferenceSection />
        <AIAnalysisDemo />
      </main>
    </div>
  );
};

export default Landing;
