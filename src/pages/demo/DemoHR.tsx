import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DemoAnalytics } from "@/components/demo/DemoAnalytics";

export default function DemoHR() {
  const navigate = useNavigate();

  return (
    <DemoAnalytics onBackToMenu={() => navigate('/demo')} />
  );
}
