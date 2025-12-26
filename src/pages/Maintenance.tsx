import { Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/contexts/BrandingContext";

export default function Maintenance() {
  const { branding } = useBranding();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Wrench className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          We'll Be Right Back
        </h1>
        
        <p className="text-muted-foreground mb-6">
          {branding.platformName} is currently undergoing scheduled maintenance. 
          We're working hard to improve your experience. Please check back soon!
        </p>
        
        <div className="p-4 bg-muted/50 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground">
            If you're an administrator, please{" "}
            <a href="/auth" className="text-primary hover:underline">
              sign in
            </a>{" "}
            to access the platform.
          </p>
        </div>

        <Button variant="outline" onClick={() => window.location.reload()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
