import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, CheckCircle, Headphones, MessageSquare, Voicemail } from 'lucide-react';
import AudioPlayer from '@/components/voice/demo/AudioPlayer';
import TranscriptDisplay from '@/components/voice/demo/TranscriptDisplay';
import DynamicVariablesCard from '@/components/voice/demo/DynamicVariablesCard';
import HowItWorksSection from '@/components/voice/demo/HowItWorksSection';
import { liveCallTranscript, voicemailTranscript } from '@/components/voice/demo/transcriptData';
import { SEO } from '@/components/SEO';
import { StructuredData, buildHowToSchema } from '@/components/StructuredData';

const VoiceAgentDemo: React.FC = () => {
  const [liveCallTime, setLiveCallTime] = useState(0);
  const [voicemailTime, setVoicemailTime] = useState(0);

  const howToSchema = buildHowToSchema({
    name: 'How AI Voice Agents Work for Recruitment',
    description: 'Learn how AI voice technology automates candidate verification and outreach, reducing time-to-hire and improving applicant experience.',
    totalTime: 'PT5M',
    steps: [
      { name: 'Listen to Demo Calls', text: 'Play the sample recordings to hear how the AI agent conducts live applicant verification and handles voicemail scenarios.' },
      { name: 'Review Dynamic Variables', text: 'See how applicant name, job title, and company information are dynamically inserted into conversations.' },
      { name: 'Understand the Workflow', text: 'Follow the process from application submission to automated callback and qualification verification.' },
      { name: 'Configure Your Voice Agent', text: 'Set up custom prompts, voice selection, and trigger conditions for your recruitment workflow.' }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Voice Agent Demo - See It In Action"
        description="Listen to real AI-powered outbound call demos. Hear how our voice agent verifies applicant information and handles voicemail scenarios using dynamic variables."
        keywords="AI voice agent, outbound call automation, voice AI demo, recruitment automation, applicant verification, AI voicemail"
        canonical="https://ats.me/demo"
        ogImage="https://ats.me/og-voice-demo.png"
        ogType="website"
      />
      <StructuredData data={howToSchema} />
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to ATS.me
                </Button>
              </Link>
            </div>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Demo Calls
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
            Listen to real outbound calls where our AI agent verifies applicant information 
            and handles different scenarios including live conversations and voicemail.
          </p>
        </div>

        {/* Tabbed Demo Examples */}
        <Tabs defaultValue="live-call" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="live-call" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Live Applicant Call
            </TabsTrigger>
            <TabsTrigger value="voicemail" className="gap-2">
              <Voicemail className="h-4 w-4" />
              Voicemail Scenario
            </TabsTrigger>
          </TabsList>

          {/* Live Call Tab */}
          <TabsContent value="live-call" className="space-y-6">
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3" />
                Live Conversation
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Call Recording
                  </CardTitle>
                  <CardDescription>
                    AI agent verifies applicant details in a direct conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AudioPlayer 
                    src="/audio/example-outbound-call.mp3" 
                    onTimeUpdate={setLiveCallTime}
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
                  <TranscriptDisplay 
                    currentTime={liveCallTime} 
                    transcriptData={liveCallTranscript}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voicemail Tab */}
          <TabsContent value="voicemail" className="space-y-6">
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Voicemail className="h-3 w-3" />
                AI-to-AI Call
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Voicemail className="h-5 w-5 text-primary" />
                    Voicemail Recording
                  </CardTitle>
                  <CardDescription>
                    AI agent leaves a message with the applicant's voicemail assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AudioPlayer 
                    src="/audio/example-voicemail-call.m4a" 
                    onTimeUpdate={setVoicemailTime}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">Duration: ~2 minutes</Badge>
                    <Badge variant="outline">Voicemail</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Live Transcript</CardTitle>
                  <CardDescription>
                    Watch the AI-to-AI conversation unfold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TranscriptDisplay 
                    currentTime={voicemailTime} 
                    transcriptData={voicemailTranscript}
                    speakerLabels={{
                      agent: 'Outbound AI',
                      applicant: 'Voicemail AI'
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

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
