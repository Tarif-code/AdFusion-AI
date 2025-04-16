import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Wand2 } from "lucide-react";
import { SiGoogle, SiFacebook, SiSpotify } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generateAudioAd, generateTextAd, generateVisualAd } from "@/lib/openai";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AdCreationWizardProps {
  currentStep: number;
  wizardData: any;
  onUpdateData: (section: string, data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AdCreationWizard({
  currentStep,
  wizardData,
  onUpdateData,
  onNext,
  onBack
}: AdCreationWizardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // AI content generation
  const generateContent = async () => {
    const { product, target, tone, sellingPoints } = wizardData.adContent;
    
    if (!product) {
      toast({
        title: "Missing information",
        description: "Please enter what you're promoting before generating content.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate audio script
      const audioScript = await generateAudioAd(product, target, tone, sellingPoints);
      
      // Generate text ad copy
      const textAdCopy = await generateTextAd(product, target, tone, sellingPoints);
      
      // Generate visual prompt
      const visualPrompt = await generateVisualAd(product, target, tone, sellingPoints);
      
      // Update wizard data with generated content
      onUpdateData('formatAssets', {
        audioScript,
        textAdCopy,
        visualPrompt
      });
      
      toast({
        title: "Content generated",
        description: "AI has successfully generated ad content based on your inputs."
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating content. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit campaign 
  const handleSubmit = async () => {
    try {
      // Create campaign
      const campaignResponse = await apiRequest("POST", "/api/campaigns", {
        name: wizardData.campaignDetails.name,
        type: wizardData.formatAssets.adType,
        status: "scheduled",
        platforms: wizardData.platformSettings.platforms,
        performance: 0
      });
      
      const campaign = await campaignResponse.json();
      
      // Create ad content
      await apiRequest("POST", "/api/ads", {
        campaignId: campaign.campaign.id,
        type: wizardData.formatAssets.adType,
        content: {
          ...wizardData.adContent,
          ...wizardData.formatAssets
        }
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      // Show success message
      toast({
        title: "Campaign created",
        description: "Your ad campaign has been successfully created and scheduled."
      });
      
      // Redirect to campaigns page
      navigate("/campaigns");
    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: "There was an error creating your campaign. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const renderStepConnector = (step: number) => {
    return (
      <div className={`step-connector ${currentStep >= step ? 'active' : ''}`}></div>
    );
  };

  const renderStepNavigation = () => {
    return (
      <div className="flex items-center mb-8 px-6 pt-6">
        {[1, 2, 3, 4, 5].map((step) => (
          <>
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step 
                    ? 'bg-primary text-white' 
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step}
              </div>
              <span 
                className={`text-xs mt-2 font-medium ${
                  currentStep >= step 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                {step === 1 && 'Campaign Details'}
                {step === 2 && 'Ad Content'}
                {step === 3 && 'Format & Assets'}
                {step === 4 && 'Platform Settings'}
                {step === 5 && 'Review & Launch'}
              </span>
            </div>
            {step < 5 && renderStepConnector(step+1)}
          </>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Campaign Details</h3>
              <p className="text-muted-foreground text-sm">Provide basic information about your campaign.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input 
                    id="campaign-name" 
                    placeholder="Enter campaign name" 
                    value={wizardData.campaignDetails.name}
                    onChange={(e) => onUpdateData('campaignDetails', { name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="campaign-objective">Campaign Objective</Label>
                  <Select 
                    value={wizardData.campaignDetails.objective}
                    onValueChange={(value) => onUpdateData('campaignDetails', { objective: value })}
                  >
                    <SelectTrigger id="campaign-objective">
                      <SelectValue placeholder="Select an objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">Brand Awareness</SelectItem>
                      <SelectItem value="consideration">Consideration</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="lead">Lead Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="campaign-budget">Budget</Label>
                  <Input 
                    id="campaign-budget" 
                    placeholder="Enter campaign budget" 
                    type="number"
                    value={wizardData.campaignDetails.budget}
                    onChange={(e) => onUpdateData('campaignDetails', { budget: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {wizardData.campaignDetails.schedule.start ? (
                            format(new Date(wizardData.campaignDetails.schedule.start), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={wizardData.campaignDetails.schedule.start ? new Date(wizardData.campaignDetails.schedule.start) : undefined}
                          onSelect={(date) => onUpdateData('campaignDetails', { 
                            schedule: { 
                              ...wizardData.campaignDetails.schedule, 
                              start: date?.toISOString() 
                            } 
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {wizardData.campaignDetails.schedule.end ? (
                            format(new Date(wizardData.campaignDetails.schedule.end), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={wizardData.campaignDetails.schedule.end ? new Date(wizardData.campaignDetails.schedule.end) : undefined}
                          onSelect={(date) => onUpdateData('campaignDetails', { 
                            schedule: { 
                              ...wizardData.campaignDetails.schedule, 
                              end: date?.toISOString() 
                            } 
                          })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Generate Ad Content</h3>
              <p className="text-muted-foreground text-sm">Let our AI help create compelling content for your campaign.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <Label className="mb-2 block">What are you promoting?</Label>
                  <Input 
                    placeholder="Enter product, service, or offer..." 
                    value={wizardData.adContent.product}
                    onChange={(e) => onUpdateData('adContent', { product: e.target.value })}
                  />
                </div>
                
                <div className="mb-6">
                  <Label className="mb-2 block">Target audience</Label>
                  <Select 
                    value={wizardData.adContent.target}
                    onValueChange={(value) => onUpdateData('adContent', { target: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="young_adults">Young adults (18-24)</SelectItem>
                      <SelectItem value="adults">Adults (25-40)</SelectItem>
                      <SelectItem value="middle_aged">Middle-aged (41-60)</SelectItem>
                      <SelectItem value="seniors">Seniors (61+)</SelectItem>
                      <SelectItem value="custom">Custom audience...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mb-6">
                  <Label className="mb-2 block">Tone of voice</Label>
                  <RadioGroup 
                    className="grid grid-cols-3 gap-2"
                    value={wizardData.adContent.tone}
                    onValueChange={(value) => onUpdateData('adContent', { tone: value })}
                  >
                    <div className="relative">
                      <RadioGroupItem value="professional" id="tone-professional" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-professional"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "professional" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Professional
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="friendly" id="tone-friendly" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-friendly"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "friendly" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Friendly
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="casual" id="tone-casual" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-casual"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "casual" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Casual
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="humorous" id="tone-humorous" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-humorous"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "humorous" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Humorous
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="serious" id="tone-serious" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-serious"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "serious" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Serious
                      </Label>
                    </div>
                    <div className="relative">
                      <RadioGroupItem value="persuasive" id="tone-persuasive" className="absolute opacity-0" />
                      <Label
                        htmlFor="tone-persuasive"
                        className={cn(
                          "block text-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-secondary",
                          wizardData.adContent.tone === "persuasive" 
                            ? "border-primary bg-primary/10" 
                            : "border-border"
                        )}
                      >
                        Persuasive
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="mb-6">
                  <Label className="mb-2 block">Key selling points (optional)</Label>
                  <Textarea 
                    placeholder="Enter key benefits, features or offers..." 
                    rows={4}
                    value={wizardData.adContent.sellingPoints}
                    onChange={(e) => onUpdateData('adContent', { sellingPoints: e.target.value })}
                  />
                </div>
                
                <Button 
                  className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center font-medium transition-colors"
                  onClick={generateContent}
                  disabled={isGenerating}
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  {isGenerating ? "Generating..." : "Generate Ad Content"}
                </Button>
              </div>
              
              {/* AI Generated Content Preview */}
              <div className="bg-secondary p-5 rounded-xl border border-border">
                <h4 className="font-medium flex items-center mb-4">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-accent" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12C22 14.6522 20.9464 17.1957 19.0711 19.0711C17.1957 20.9464 14.6522 22 12 22C10.6868 22 9.38642 21.7413 8.17317 21.2388C6.95991 20.7362 5.85752 19.9997 4.92893 19.0711C3.05357 17.1957 2 14.6522 2 12C2 9.34784 3.05357 6.8043 4.92893 4.92893C6.8043 3.05357 9.34784 2 12 2ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4Z" fill="currentColor"/>
                    <path d="M11 17H13V12H11V17ZM11 11H13V9H11V11Z" fill="currentColor"/>
                  </svg>
                  AI Generated Content
                </h4>
                
                {/* Audio Ad Preview */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">Audio Script</h5>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg mb-3">
                    <p className="text-sm leading-relaxed">
                      {wizardData.formatAssets.audioScript || "Your AI-generated audio script will appear here."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        className="p-2 rounded-full bg-background text-foreground hover:bg-primary"
                        size="icon"
                        variant="ghost"
                        onClick={() => setAudioPlaying(!audioPlaying)}
                      >
                        {audioPlaying ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        )}
                      </Button>
                      <div className={`audio-wave ${!audioPlaying && 'hidden'}`}>
                        {[...Array(10)].map((_, i) => (
                          <div key={i}></div>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">0:15</span>
                  </div>
                </div>
                
                {/* Text Ad Preview */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">Text Ad Copy</h5>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-sm font-medium mb-1">
                      {wizardData.formatAssets.textAdCopy?.headline || "Your headline will appear here"}
                    </p>
                    <p className="text-xs text-green-500 mb-1">
                      {wizardData.formatAssets.textAdCopy?.url || "www.yourbrand.com"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wizardData.formatAssets.textAdCopy?.body || "Your ad description will appear here."}
                    </p>
                  </div>
                </div>
                
                {/* Visual Ad Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium">Visual Ad Suggestion</h5>
                    <Button className="text-xs text-primary hover:underline" variant="link">
                      Generate Image
                    </Button>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-muted-foreground mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        <p className="text-xs text-muted-foreground">Click "Generate Image" to create a visual ad</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Format & Assets</h3>
              <p className="text-muted-foreground text-sm">Choose format types and customize assets for your ad campaign.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Ad Type</Label>
                <RadioGroup 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  value={wizardData.formatAssets.adType}
                  onValueChange={(value) => onUpdateData('formatAssets', { adType: value })}
                >
                  <div className="relative">
                    <RadioGroupItem value="audio" id="ad-type-audio" className="absolute opacity-0" />
                    <Label
                      htmlFor="ad-type-audio"
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-secondary h-full",
                        wizardData.formatAssets.adType === "audio" 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                      <span className="font-medium">Audio Ad</span>
                      <span className="text-xs text-muted-foreground mt-1">Radio & podcast ads</span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem value="visual" id="ad-type-visual" className="absolute opacity-0" />
                    <Label
                      htmlFor="ad-type-visual"
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-secondary h-full",
                        wizardData.formatAssets.adType === "visual" 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <span className="font-medium">Visual Ad</span>
                      <span className="text-xs text-muted-foreground mt-1">Images & graphics</span>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem value="multi-format" id="ad-type-multi" className="absolute opacity-0" />
                    <Label
                      htmlFor="ad-type-multi"
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-secondary h-full",
                        wizardData.formatAssets.adType === "multi-format" 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      )}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 8H3"/><path d="M16 14a3 3 0 1 1-2.83 4H11a2 2 0 1 1 0-4h5z"/><rect width="18" height="18" x="3" y="4" rx="2"/></svg>
                      <span className="font-medium">Multi-format</span>
                      <span className="text-xs text-muted-foreground mt-1">Audio, visual & text</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Tabs defaultValue="audio" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="audio" className="flex-1">Audio Settings</TabsTrigger>
                  <TabsTrigger value="visual" className="flex-1">Visual Settings</TabsTrigger>
                  <TabsTrigger value="text" className="flex-1">Text Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="audio" className="mt-6 space-y-4">
                  <div>
                    <Label className="mb-2 block">Voice Type</Label>
                    <Select 
                      value={wizardData.formatAssets.voiceType}
                      onValueChange={(value) => onUpdateData('formatAssets', { voiceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male Voice</SelectItem>
                        <SelectItem value="female">Female Voice</SelectItem>
                        <SelectItem value="neutral">Gender Neutral</SelectItem>
                        <SelectItem value="child">Child Voice</SelectItem>
                        <SelectItem value="senior">Senior Voice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Background Music</Label>
                    <Select 
                      value={wizardData.formatAssets.musicType}
                      onValueChange={(value) => onUpdateData('formatAssets', { musicType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select background music" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upbeat">Upbeat</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="none">No music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Audio Script</Label>
                    <Textarea 
                      placeholder="Enter or edit your audio script" 
                      rows={5}
                      value={wizardData.formatAssets.audioScript}
                      onChange={(e) => onUpdateData('formatAssets', { audioScript: e.target.value })}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="visual" className="mt-6 space-y-4">
                  <div>
                    <Label className="mb-2 block">Visual Format</Label>
                    <RadioGroup className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <RadioGroupItem value="banner" id="format-banner" className="absolute opacity-0" />
                        <Label
                          htmlFor="format-banner"
                          className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-secondary h-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                          <span>Banner Ad</span>
                        </Label>
                      </div>
                      
                      <div className="relative">
                        <RadioGroupItem value="social" id="format-social" className="absolute opacity-0" />
                        <Label
                          htmlFor="format-social"
                          className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-secondary h-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
                          <span>Social Media Post</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Visual Ad Description</Label>
                    <Textarea 
                      placeholder="Describe what you want to see in your visual ad" 
                      rows={5}
                      value={wizardData.formatAssets.visualPrompt}
                      onChange={(e) => onUpdateData('formatAssets', { visualPrompt: e.target.value })}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="mt-6 space-y-4">
                  <div>
                    <Label className="mb-2 block">Headline</Label>
                    <Input 
                      placeholder="Enter headline (max 30 characters)" 
                      maxLength={30}
                      value={wizardData.formatAssets.textAdCopy?.headline || ""}
                      onChange={(e) => onUpdateData('formatAssets', { 
                        textAdCopy: { 
                          ...wizardData.formatAssets.textAdCopy,
                          headline: e.target.value 
                        } 
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Display URL</Label>
                    <Input 
                      placeholder="www.yourbrand.com/offer" 
                      value={wizardData.formatAssets.textAdCopy?.url || ""}
                      onChange={(e) => onUpdateData('formatAssets', { 
                        textAdCopy: { 
                          ...wizardData.formatAssets.textAdCopy,
                          url: e.target.value 
                        } 
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Ad Text</Label>
                    <Textarea 
                      placeholder="Enter ad description (max 90 characters)" 
                      rows={3}
                      maxLength={90}
                      value={wizardData.formatAssets.textAdCopy?.body || ""}
                      onChange={(e) => onUpdateData('formatAssets', { 
                        textAdCopy: { 
                          ...wizardData.formatAssets.textAdCopy,
                          body: e.target.value 
                        } 
                      })}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Platform Settings</h3>
              <p className="text-muted-foreground text-sm">Choose platforms and configure targeting settings.</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-4 block">Select Platforms</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    wizardData.platformSettings.platforms.includes("google") && "border-primary bg-primary/5"
                  )}>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Checkbox 
                        id="platform-google"
                        checked={wizardData.platformSettings.platforms.includes("google")}
                        onCheckedChange={(checked) => {
                          const platforms = checked
                            ? [...wizardData.platformSettings.platforms, "google"]
                            : wizardData.platformSettings.platforms.filter((p: string) => p !== "google");
                          onUpdateData('platformSettings', { platforms });
                        }}
                      />
                      <Label htmlFor="platform-google" className="flex items-center cursor-pointer">
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Google Ads
                      </Label>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    wizardData.platformSettings.platforms.includes("facebook") && "border-primary bg-primary/5"
                  )}>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Checkbox 
                        id="platform-facebook"
                        checked={wizardData.platformSettings.platforms.includes("facebook")}
                        onCheckedChange={(checked) => {
                          const platforms = checked
                            ? [...wizardData.platformSettings.platforms, "facebook"]
                            : wizardData.platformSettings.platforms.filter((p: string) => p !== "facebook");
                          onUpdateData('platformSettings', { platforms });
                        }}
                      />
                      <Label htmlFor="platform-facebook" className="flex items-center cursor-pointer">
                        <SiFacebook className="mr-2 h-4 w-4" />
                        Facebook Ads
                      </Label>
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    wizardData.platformSettings.platforms.includes("spotify") && "border-primary bg-primary/5"
                  )}>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Checkbox 
                        id="platform-spotify"
                        checked={wizardData.platformSettings.platforms.includes("spotify")}
                        onCheckedChange={(checked) => {
                          const platforms = checked
                            ? [...wizardData.platformSettings.platforms, "spotify"]
                            : wizardData.platformSettings.platforms.filter((p: string) => p !== "spotify");
                          onUpdateData('platformSettings', { platforms });
                        }}
                      />
                      <Label htmlFor="platform-spotify" className="flex items-center cursor-pointer">
                        <SiSpotify className="mr-2 h-4 w-4" />
                        Spotify Ads
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Audience Targeting</Label>
                <Tabs defaultValue="demographics" className="w-full">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="demographics" className="flex-1">Demographics</TabsTrigger>
                    <TabsTrigger value="interests" className="flex-1">Interests</TabsTrigger>
                    <TabsTrigger value="location" className="flex-1">Location</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="demographics" className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Age Groups</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((age) => (
                          <div key={age} className="flex items-center space-x-2">
                            <Checkbox id={`age-${age}`} />
                            <Label htmlFor={`age-${age}`}>{age}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Gender</Label>
                      <RadioGroup className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="gender-all" />
                          <Label htmlFor="gender-all">All Genders</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="gender-male" />
                          <Label htmlFor="gender-male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="gender-female" />
                          <Label htmlFor="gender-female">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="interests" className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Select Interests</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Technology", "Fashion", "Sports", "Food", "Travel", "Music", "Gaming", "Health", "Finance", "Education"].map((interest) => (
                          <div key={interest} className="flex items-center space-x-2">
                            <Checkbox id={`interest-${interest.toLowerCase()}`} />
                            <Label htmlFor={`interest-${interest.toLowerCase()}`}>{interest}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="location" className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Target Locations</Label>
                      <Select defaultValue="united-states">
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="united-states">United States</SelectItem>
                          <SelectItem value="canada">Canada</SelectItem>
                          <SelectItem value="united-kingdom">United Kingdom</SelectItem>
                          <SelectItem value="australia">Australia</SelectItem>
                          <SelectItem value="global">Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <Label className="mb-2 block">Ad Scheduling</Label>
                <RadioGroup 
                  className="space-y-3"
                  value={wizardData.platformSettings.scheduling?.timing || 'standard'}
                  onValueChange={(value) => onUpdateData('platformSettings', { 
                    scheduling: { timing: value } 
                  })}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="standard" id="timing-standard" className="mt-1" />
                    <div>
                      <Label htmlFor="timing-standard" className="font-medium">Standard delivery</Label>
                      <p className="text-sm text-muted-foreground">Show ads evenly over time</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="accelerated" id="timing-accelerated" className="mt-1" />
                    <div>
                      <Label htmlFor="timing-accelerated" className="font-medium">Accelerated delivery</Label>
                      <p className="text-sm text-muted-foreground">Show ads as quickly as possible</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Review & Launch</h3>
              <p className="text-muted-foreground text-sm">Review your campaign details before launching.</p>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Campaign Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaign Name:</span>
                      <span className="font-medium">{wizardData.campaignDetails.name || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Objective:</span>
                      <span className="font-medium">{wizardData.campaignDetails.objective || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">${wizardData.campaignDetails.budget || "0"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {wizardData.campaignDetails.schedule.start ? format(new Date(wizardData.campaignDetails.schedule.start), "MMM d, yyyy") : "Not set"} - 
                        {wizardData.campaignDetails.schedule.end ? format(new Date(wizardData.campaignDetails.schedule.end), "MMM d, yyyy") : "Not set"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Ad Content & Format</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ad Type:</span>
                      <span className="font-medium capitalize">{wizardData.formatAssets.adType || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Audience:</span>
                      <span className="font-medium">{wizardData.adContent.target || "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tone:</span>
                      <span className="font-medium capitalize">{wizardData.adContent.tone || "Not specified"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Platforms & Targeting</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms:</span>
                      <div className="flex space-x-2">
                        {wizardData.platformSettings.platforms.length > 0 ? (
                          wizardData.platformSettings.platforms.map((platform: string) => (
                            <span key={platform} className="font-medium capitalize">{platform}</span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">None selected</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="font-medium capitalize">{wizardData.platformSettings.scheduling?.timing || "Standard"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <h4 className="flex items-center text-sm font-medium text-primary mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                  Campaign Summary
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You're about to create a {wizardData.formatAssets.adType} ad campaign named "{wizardData.campaignDetails.name || 'Untitled Campaign'}" 
                  targeting {wizardData.adContent.target || 'a general audience'}.
                  The ad will be published on {wizardData.platformSettings.platforms.length} platform(s) with a budget of ${wizardData.campaignDetails.budget || '0'}.
                </p>
                <p className="text-sm text-primary font-medium">
                  Ready to launch your campaign?
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-background border-border rounded-xl overflow-hidden flex flex-col">
      <div className="border-b border-border p-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Create New Ad Campaign</h2>
      </div>
      
      {renderStepNavigation()}
      
      <div className="overflow-y-auto custom-scrollbar p-0 flex-1">
        {renderStepContent()}
      </div>
      
      <div className="border-t border-border p-6 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 1}
        >
          {currentStep > 1 ? `Back to ${
            currentStep === 2 ? 'Campaign Details' :
            currentStep === 3 ? 'Ad Content' :
            currentStep === 4 ? 'Format & Assets' :
            'Platform Settings'
          }` : 'Back'}
        </Button>
        
        {currentStep < 5 ? (
          <Button 
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            onClick={onNext}
          >
            Next: {
              currentStep === 1 ? 'Ad Content' :
              currentStep === 2 ? 'Format & Assets' :
              currentStep === 3 ? 'Platform Settings' :
              'Review & Launch'
            }
          </Button>
        ) : (
          <Button 
            className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:opacity-90 transition-colors"
            onClick={handleSubmit}
          >
            Launch Campaign
          </Button>
        )}
      </div>
    </div>
  );
}
