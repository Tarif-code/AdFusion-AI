import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import AdCreationWizard from "./AdCreationWizard";

export default function AdCreation() {
  const [location] = useLocation();
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    campaignDetails: {
      name: "",
      objective: "",
      budget: "",
      schedule: { start: "", end: "" }
    },
    adContent: {
      product: "",
      target: "",
      tone: "friendly",
      sellingPoints: ""
    },
    formatAssets: {
      adType: "audio",
      audioScript: "",
      voiceType: "male",
      musicType: "upbeat",
      textAdCopy: { headline: "", body: "", url: "" },
      visualPrompt: ""
    },
    platformSettings: {
      platforms: [] as string[],
      audienceTargeting: { age: [], gender: [], interests: [] },
      scheduling: { timing: "standard" }
    }
  });

  // Update step from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const step = params.get("step");
    if (step && !isNaN(parseInt(step)) && parseInt(step) >= 1 && parseInt(step) <= 5) {
      setWizardStep(parseInt(step));
    }
  }, [location]);

  const handleNext = () => {
    if (wizardStep < 5) {
      setWizardStep(wizardStep + 1);
      window.history.pushState({}, "", `/create-ad?step=${wizardStep + 1}`);
    }
  };

  const handleBack = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
      window.history.pushState({}, "", `/create-ad?step=${wizardStep - 1}`);
    }
  };

  const updateWizardData = (section: string, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        ...data
      }
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create New Ad Campaign</h1>
        </div>
      </div>
      
      <Card className="bg-background-secondary border-border">
        <CardContent className="p-0">
          <AdCreationWizard
            currentStep={wizardStep}
            wizardData={wizardData}
            onUpdateData={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        </CardContent>
      </Card>
    </div>
  );
}
