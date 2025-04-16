import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Zap, RefreshCw, FileOutput } from "lucide-react";

export default function QuickActions() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="space-y-4">
          <Link href="/create-ad">
            <Button 
              className="w-full py-6 bg-gradient-to-r from-primary to-accent text-white rounded-lg flex items-center justify-center font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Ad Campaign
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full py-6 bg-secondary hover:bg-muted text-foreground rounded-lg flex items-center justify-center font-medium transition-colors"
          >
            <Zap className="mr-2 h-5 w-5" />
            Quick Ad Creation
          </Button>
          
          <Button 
            variant="outline"
            className="w-full py-6 bg-secondary hover:bg-muted text-foreground rounded-lg flex items-center justify-center font-medium transition-colors"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Refresh Analytics
          </Button>
          
          <Button 
            variant="outline"
            className="w-full py-6 bg-secondary hover:bg-muted text-foreground rounded-lg flex items-center justify-center font-medium transition-colors"
          >
            <FileOutput className="mr-2 h-5 w-5" />
            Export Reports
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
