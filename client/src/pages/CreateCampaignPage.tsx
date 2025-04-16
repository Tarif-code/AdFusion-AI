
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function CreateCampaignPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create New Campaign</h1>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label>Campaign Name</Label>
              <Input placeholder="Enter campaign name" className="mt-1" />
            </div>
            
            <div>
              <Label>Campaign Description</Label>
              <Input placeholder="Enter campaign description" className="mt-1" />
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Upload Your Ads & Assets</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your ad files here, or click to browse
              </p>
              <Button>Browse Files</Button>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" className="mr-2">Save Draft</Button>
              <Button>Publish Campaign</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
