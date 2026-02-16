import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Sparkles, Loader2, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreativeResult {
  id: string;
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
  mediaUrl: string;
}

const GenerateFoundersPassCreative: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CreativeResult | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("generate-founders-pass-creative", {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || "Generation failed");

      setResult(response.data.creative);
      toast.success("Founders Pass creative generated and saved!");
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate creative");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Founders Pass Creative Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate a premium AI-powered ad creative for Social Beacon distribution.
        </p>
      </div>

      {!result && (
        <Card className="border-primary/20 bg-card">
          <CardHeader className="text-center pb-4">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
            <CardTitle>Generate Founders Pass Ad Creative</CardTitle>
            <CardDescription>
              Uses Gemini Pro for a cinematic 16:9 hero image and AI-crafted ad copy.
              The creative will be saved and ready for Rocket Launch across all Social Beacon platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating (may take 30-60s)...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Generate Creative
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="overflow-hidden border-primary/30">
            <div className="aspect-video relative bg-muted">
              <img
                src={result.mediaUrl}
                alt="Founders Pass Creative"
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Saved to Ad Creatives
              </Badge>
            </div>
            <CardContent className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Headline</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.headline)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-lg font-bold text-foreground">{result.headline}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.body)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-foreground">{result.body}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hashtags</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {result.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={result.mediaUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                    <ExternalLink className="h-3 w-3" /> View Image
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fullText = `${result.headline}\n\n${result.body}\n\n${result.hashtags.map(t => `#${t}`).join(" ")}`;
                    copyToClipboard(fullText);
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy All
                </Button>
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-1">
                  <Sparkles className="h-3 w-3" /> Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground text-center">
            This creative is now available in the Ad Creative Studio for Rocket Launch 🚀 distribution.
          </p>
        </div>
      )}
    </div>
  );
};

export default GenerateFoundersPassCreative;
