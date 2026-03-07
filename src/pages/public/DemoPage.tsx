import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { StructuredData, buildHowToSchema } from '@/components/StructuredData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, BarChart3, Zap, Kanban, Play, ArrowRight } from 'lucide-react';
import { HeroBackground, GradientCTA } from '@/components/shared';
import roiHero from '@/assets/hero/roi-hero.png';
import { VoiceDemoTab, KanbanDemoTab, PlatformDemoTab, FlowDemoTab, demoFeatureCards } from '@/features/demo';

const DemoPage: React.FC = () => {
  const [liveCallTime, setLiveCallTime] = useState(0);
  const [voicemailTime, setVoicemailTime] = useState(0);
  const [voiceApplyTime, setVoiceApplyTime] = useState(0);

  const softwareAppSchema = {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    "name": "Apply AI", "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
    "description": "AI-powered recruitment platform with voice technology for instant candidate engagement",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "150" }
  };

  const howToSchema = buildHowToSchema({
    name: 'How AI Voice Agents Work for Recruitment',
    description: 'Learn how AI voice technology automates candidate verification and outreach.',
    totalTime: 'PT5M',
    steps: [
      { name: 'Listen to Demo Calls', text: 'Play sample recordings to hear AI agent conversations with candidates.' },
      { name: 'Review Dynamic Variables', text: 'See how applicant data is dynamically inserted into conversations.' },
      { name: 'Understand the Workflow', text: 'Follow the process from application submission to callback.' },
      { name: 'Explore Platform Features', text: 'Discover the full platform capabilities and integrations.' }
    ]
  });

  return (
    <>
      <SEO
        title="Interactive Demo | Apply AI Recruitment Platform"
        description="Experience Apply AI with interactive voice demos, platform walkthroughs, and see how AI-powered recruitment can transform your hiring process."
        keywords="ATS demo, recruitment software demo, AI hiring demo, voice agent demo, trucking recruitment"
        canonical="https://applyai.jobs/demo"
        ogImage="https://applyai.jobs/og-demo.png"
        ogType="website"
      />
      <StructuredData data={softwareAppSchema} />
      <StructuredData data={howToSchema} />

      <div className="min-h-screen bg-background">
        <HeroBackground imageSrc={roiHero} imageAlt="Business analytics and ROI charts" overlayVariant="dark" overlayOpacity={70} className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4"><Play className="h-3 w-3 mr-1" />Interactive Demo</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Experience Apply AI in Action</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore our AI-powered recruitment platform with interactive demos, audio samples, and a complete walkthrough of the candidate journey.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 px-4 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto min-h-[48px]" asChild><Link to="/contact">Schedule a Demo<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px]" asChild><Link to="/contact">Contact Sales</Link></Button>
            </div>
          </div>
        </HeroBackground>

        {/* Main Demo Tabs */}
        <section className="py-16 container mx-auto px-4">
          <Tabs defaultValue="voice" className="space-y-8">
            <TabsList className="flex overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-4 w-full max-w-3xl mx-auto">
              <TabsTrigger value="voice" className="flex items-center gap-2 whitespace-nowrap min-h-[44px]">
                <Bot className="h-4 w-4" /><span className="hidden sm:inline">Voice Tech</span><span className="sm:hidden">Voice</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center gap-2 whitespace-nowrap min-h-[44px]">
                <Kanban className="h-4 w-4" /><span className="hidden sm:inline">Pipeline View</span><span className="sm:hidden">Pipeline</span>
              </TabsTrigger>
              <TabsTrigger value="platform" className="flex items-center gap-2 whitespace-nowrap min-h-[44px]">
                <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Platform</span><span className="sm:hidden">Platform</span>
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2 whitespace-nowrap min-h-[44px]">
                <Zap className="h-4 w-4" /><span className="hidden sm:inline">Flow</span><span className="sm:hidden">Flow</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" className="space-y-8">
              <VoiceDemoTab
                liveCallTime={liveCallTime} voicemailTime={voicemailTime} voiceApplyTime={voiceApplyTime}
                onLiveCallTimeUpdate={setLiveCallTime} onVoicemailTimeUpdate={setVoicemailTime} onVoiceApplyTimeUpdate={setVoiceApplyTime}
              />
            </TabsContent>
            <TabsContent value="kanban" className="space-y-8"><KanbanDemoTab /></TabsContent>
            <TabsContent value="platform" className="space-y-8"><PlatformDemoTab /></TabsContent>
            <TabsContent value="flow" className="space-y-8"><FlowDemoTab /></TabsContent>
          </Tabs>
        </section>

        {/* Feature Cards */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose ATS.me?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoFeatureCards.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <GradientCTA
          title="Ready to Transform Your Hiring?"
          description="Join leading trucking companies using ATS.me to hire faster and smarter."
          primaryAction={{ label: 'Get Started', to: '/contact' }}
          secondaryAction={{ label: 'Contact Sales', to: '/contact' }}
        />
      </div>
    </>
  );
};

export default DemoPage;
