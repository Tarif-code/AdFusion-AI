
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Wand2, Download, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAudioAd, generateTextAd, generateVisualAd } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

export default function CreateAdAIPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [adContent, setAdContent] = useState({
    textCopy: { headline: "", body: "", url: "" },
    audio: { script: "", voiceType: "male", musicType: "upbeat" },
    visual: { imagePrompt: "", videoPrompt: "" }
  });

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const [textAd, audioScript, visualPrompt] = await Promise.all([
        generateTextAd(productInfo, targetAudience, tone, keyPoints),
        generateAudioAd(productInfo, targetAudience, tone, keyPoints),
        generateVisualAd(productInfo, targetAudience, tone, keyPoints)
      ]);

      setAdContent({
        textCopy: textAd,
        audio: { ...adContent.audio, script: audioScript },
        visual: { 
          imagePrompt: visualPrompt,
          videoPrompt: visualPrompt 
        }
      });

      toast({
        title: "Generated Successfully",
        description: "Your ad content has been generated across all formats."
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating the content.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const [productInfo, setProductInfo] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("friendly");
  const [keyPoints, setKeyPoints] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create Ad with AI</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label>What are you promoting?</Label>
              <Input 
                value={productInfo}
                onChange={(e) => setProductInfo(e.target.value)}
                placeholder="Describe your product or service"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Target Audience</Label>
              <Input
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Who is this ad for?"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Key Selling Points</Label>
              <Textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Enter key benefits, features, or offers..."
                className="mt-1"
              />
            </div>

            <Button 
              onClick={generateContent} 
              disabled={isGenerating}
              className="w-full"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              {isGenerating ? "Generating..." : "Generate Ad Content"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="text">
            <TabsList className="w-full">
              <TabsTrigger value="text" className="flex-1">Text Copy</TabsTrigger>
              <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>
              <TabsTrigger value="visual" className="flex-1">Visual</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={adContent.textCopy.headline} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={adContent.textCopy.body} readOnly />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={adContent.textCopy.url} readOnly />
              </div>
              <Button className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Download Text Copy
              </Button>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Voice Type</Label>
                <Select 
                  value={adContent.audio.voiceType}
                  onValueChange={(value) => setAdContent(prev => ({
                    ...prev,
                    audio: { ...prev.audio, voiceType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Background Music</Label>
                <Select
                  value={adContent.audio.musicType}
                  onValueChange={(value) => setAdContent(prev => ({
                    ...prev,
                    audio: { ...prev.audio, musicType: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upbeat">Upbeat</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Script</Label>
                <Textarea value={adContent.audio.script} readOnly className="h-32" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Eye className="mr-2 h-5 w-5" />
                  Preview
                </Button>
                <Button className="flex-1">
                  <Download className="mr-2 h-5 w-5" />
                  Download Audio
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="visual" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Image Generation Prompt</Label>
                <Textarea value={adContent.visual.imagePrompt} readOnly className="h-32" />
              </div>
              <div className="space-y-2">
                <Label>Video Generation Prompt</Label>
                <Textarea value={adContent.visual.videoPrompt} readOnly className="h-32" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Eye className="mr-2 h-5 w-5" />
                  Preview
                </Button>
                <Button className="flex-1">
                  <Download className="mr-2 h-5 w-5" />
                  Download Assets
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
