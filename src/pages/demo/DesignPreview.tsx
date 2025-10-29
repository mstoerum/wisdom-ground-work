import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DesignMockups } from "@/components/demo/DesignMockups";

export default function DesignPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/demo')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Demo
        </Button>
        
        <DesignMockups />
      </div>
    </div>
  );
}