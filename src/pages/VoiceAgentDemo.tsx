import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, CheckCircle, Headphones } from 'lucide-react';
import AudioPlayer from '@/components/voice/demo/AudioPlayer';
import TranscriptDisplay from '@/components/voice/demo/TranscriptDisplay';
import DynamicVariablesCard from '@/components/voice/demo/DynamicVariablesCard';
import HowItWorksSection from '@/components/voice/demo/HowItWorksSection';
import { SEO } from '@/components/SEO';

const VoiceAgentDemo: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Voice Agent Demo - See It In Action"
        description="Listen to a real AI-powered outbound call demo. Hear how our voice agent verifies applicant information using dynamic variables for personalized conversations."
        keywords="AI voice agent, outbound call automation, voice AI demo, recruitment automation, applicant verification"
        canonical="https://ats.me/voice-demo"
        ogImage="https://ats.me/og-voice-demo.png"
        ogType="website"
      />
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/voice-agent">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Voice Agents
                </Button>
              </Link>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Successful Demo Call
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Headphones className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Voice Agent Demo</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Listen to a real outbound call where our AI agent verifies applicant information 
            using dynamic variables extracted from their application.
          </p>
        </div>

        {/* Audio Player & Transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Call Recording
              </CardTitle>
              <CardDescription>
                A 60-second outbound call to verify applicant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AudioPlayer 
                src="/audio/example-outbound-call.mp3" 
                onTimeUpdate={setCurrentTime}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Duration: ~60 seconds</Badge>
                <Badge variant="outline">Outbound Call</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Transcript</CardTitle>
              <CardDescription>
                Follow along as the conversation plays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptDisplay currentTime={currentTime} />
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Variables */}
        <DynamicVariablesCard />

        {/* How It Works */}
        <HowItWorksSection />

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Ready to implement voice agents?</h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Configure your own AI voice agents to automatically reach out to applicants, 
                verify information, and streamline your recruitment process.
              </p>
              <Link to="/voice-agent">
                <Button size="lg" className="mt-2">
                  Configure Voice Agents
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAgentDemo;
