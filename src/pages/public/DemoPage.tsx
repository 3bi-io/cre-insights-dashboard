import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Bot, 
  Mic, 
  BarChart3, 
  Link as LinkIcon, 
  Play,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import AudioPlayer from '@/components/voice/demo/AudioPlayer';
import TranscriptDisplay from '@/components/voice/demo/TranscriptDisplay';
import DynamicVariablesCard from '@/components/voice/demo/DynamicVariablesCard';
import HowItWorksSection from '@/components/voice/demo/HowItWorksSection';
import { liveCallTranscript, voicemailTranscript } from '@/components/voice/demo/transcriptData';

const DemoPage: React.FC = () => {
  const [liveCallTime, setLiveCallTime] = useState(0);
  const [voicemailTime, setVoicemailTime] = useState(0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ATS.me",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered recruitment platform with voice technology for instant candidate engagement",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  const featureCards = [
    {
      icon: Mic,
      title: 'Voice Apply',
      description: 'Candidates apply via voice in under 2 minutes',
      color: 'text-primary'
    },
    {
      icon: Phone,
      title: 'Instant Callbacks',
      description: 'AI contacts applicants within 3 minutes',
      color: 'text-green-500'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track cost-per-hire and source ROI',
      color: 'text-blue-500'
    },
    {
      icon: LinkIcon,
      title: '100+ Integrations',
      description: 'Tenstreet, Indeed, ZipRecruiter & more',
      color: 'text-purple-500'
    }
  ];

  const platformFeatures = [
    { label: 'Job Listings Management', included: true },
    { label: 'Application Tracking', included: true },
    { label: 'AI-Powered Screening', included: true },
    { label: 'Voice Agent Callbacks', included: true },
    { label: 'Analytics Dashboard', included: true },
    { label: 'ATS Integrations', included: true },
    { label: 'Custom Application Forms', included: true },
    { label: 'Team Collaboration', included: true }
  ];

  const applicationSteps = [
    { icon: Smartphone, title: 'Apply', description: 'Candidate submits quick application' },
    { icon: Phone, title: 'AI Callback', description: 'Voice agent calls within 3 minutes' },
    { icon: CheckCircle2, title: 'Verify', description: 'Qualification questions answered' },
    { icon: Users, title: 'Connect', description: 'Qualified leads sent to your team' }
  ];

  return (
    <>
      <Helmet>
        <title>Interactive Demo | ATS.me AI Recruitment Platform</title>
        <meta 
          name="description" 
          content="Experience ATS.me with interactive voice demos, platform walkthroughs, and see how AI-powered recruitment can transform your hiring process." 
        />
        <meta name="keywords" content="ATS demo, recruitment software demo, AI hiring demo, voice agent demo, trucking recruitment" />
        <link rel="canonical" href="https://ats.me/demo" />
        <meta property="og:title" content="Interactive Demo | ATS.me" />
        <meta property="og:description" content="See ATS.me in action with interactive voice demos and platform walkthroughs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ats.me/demo" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              <Play className="h-3 w-3 mr-1" />
              Interactive Demo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Experience ATS.me in Action
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore our AI-powered recruitment platform with interactive demos, audio samples, 
              and a complete walkthrough of the candidate journey.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Demo Tabs */}
        <section className="py-16 container mx-auto px-4">
          <Tabs defaultValue="voice" className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Voice Technology</span>
                <span className="sm:hidden">Voice</span>
              </TabsTrigger>
              <TabsTrigger value="platform" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Platform Overview</span>
                <span className="sm:hidden">Platform</span>
              </TabsTrigger>
              <TabsTrigger value="flow" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Application Flow</span>
                <span className="sm:hidden">Flow</span>
              </TabsTrigger>
            </TabsList>

            {/* Voice Technology Tab */}
            <TabsContent value="voice" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">AI Voice Agent Demo</h2>
                <p className="text-muted-foreground">
                  Listen to real examples of our AI voice agent interacting with candidates
                </p>
              </div>

              <Tabs defaultValue="live" className="space-y-6">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="live">Live Applicant Call</TabsTrigger>
                  <TabsTrigger value="voicemail">Voicemail Scenario</TabsTrigger>
                </TabsList>

                <TabsContent value="live">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Phone className="h-5 w-5 text-green-500" />
                          Live Call Audio
                        </CardTitle>
                        <CardDescription>
                          AI agent verifying CDL qualifications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AudioPlayer
                          src="/audio/live-call-demo.mp3"
                          onTimeUpdate={setLiveCallTime}
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          * Demo audio - actual calls are personalized with candidate data
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Live Transcript</CardTitle>
                        <CardDescription>
                          Follow along as the AI agent speaks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TranscriptDisplay
                          currentTime={liveCallTime}
                          transcriptData={liveCallTranscript}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="voicemail">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="h-5 w-5 text-primary" />
                          Voicemail Audio
                        </CardTitle>
                        <CardDescription>
                          AI agent leaving a professional voicemail
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AudioPlayer
                          src="/audio/voicemail-demo.mp3"
                          onTimeUpdate={setVoicemailTime}
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          * Demo audio - voicemails include callback instructions
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Voicemail Transcript</CardTitle>
                        <CardDescription>
                          See the personalized message content
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TranscriptDisplay
                          currentTime={voicemailTime}
                          transcriptData={voicemailTranscript}
                          speakerLabels={{ agent: 'AI Voicemail', applicant: 'System' }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <DynamicVariablesCard />
                <HowItWorksSection />
              </div>
            </TabsContent>

            {/* Platform Overview Tab */}
            <TabsContent value="platform" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
                <p className="text-muted-foreground">
                  Everything you need to manage your recruitment pipeline
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Comprehensive Features</CardTitle>
                    <CardDescription>
                      All the tools you need in one platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {platformFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span>{feature.label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Metrics</CardTitle>
                    <CardDescription>
                      Results our customers achieve
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-4xl font-bold text-primary mb-1">&lt;3 min</div>
                      <div className="text-sm text-muted-foreground">Average callback time</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/5 rounded-lg">
                      <div className="text-4xl font-bold text-green-600 mb-1">40%</div>
                      <div className="text-sm text-muted-foreground">Higher contact rates</div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                      <div className="text-4xl font-bold text-blue-600 mb-1">60%</div>
                      <div className="text-sm text-muted-foreground">Reduction in cost-per-hire</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Application Flow Tab */}
            <TabsContent value="flow" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Candidate Journey</h2>
                <p className="text-muted-foreground">
                  From application to connection in minutes, not days
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {applicationSteps.map((step, index) => (
                  <Card key={index} className="text-center relative">
                    <CardContent className="pt-8 pb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-8">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Speed Matters in Recruitment</h3>
                      <p className="text-muted-foreground max-w-xl">
                        Studies show that 50% of candidates accept the first offer they receive. 
                        With ATS.me, you connect with qualified candidates before your competitors even make contact.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Feature Cards Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose ATS.me?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureCards.map((feature, index) => (
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

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join leading trucking companies using ATS.me to hire faster and smarter.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default DemoPage;
