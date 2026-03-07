/**
 * Voice Technology Demo Tab
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Phone, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioPlayer from '@/components/voice/demo/AudioPlayer';
import TranscriptDisplay from '@/components/voice/demo/TranscriptDisplay';
import DynamicVariablesCard from '@/components/voice/demo/DynamicVariablesCard';
import HowItWorksSection from '@/components/voice/demo/HowItWorksSection';
import { liveCallTranscript, voicemailTranscript, voiceApplyTranscript } from '@/components/voice/demo/transcriptData';

interface VoiceDemoTabProps {
  liveCallTime: number;
  voicemailTime: number;
  voiceApplyTime: number;
  onLiveCallTimeUpdate: (t: number) => void;
  onVoicemailTimeUpdate: (t: number) => void;
  onVoiceApplyTimeUpdate: (t: number) => void;
}

export const VoiceDemoTab = ({
  liveCallTime,
  voicemailTime,
  voiceApplyTime,
  onLiveCallTimeUpdate,
  onVoicemailTimeUpdate,
  onVoiceApplyTimeUpdate,
}: VoiceDemoTabProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">AI Voice Agent Demo</h2>
        <p className="text-muted-foreground">
          Listen to real examples of our AI voice agent interacting with candidates
        </p>
      </div>

      <Tabs defaultValue="voice-apply" className="space-y-6">
        <TabsList className="grid w-full max-w-xl mx-auto grid-cols-3">
          <TabsTrigger value="voice-apply">Voice Apply</TabsTrigger>
          <TabsTrigger value="live">Outbound Call</TabsTrigger>
          <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
        </TabsList>

        <TabsContent value="voice-apply">
          <div className="flex justify-center mb-4">
            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
              <Mic className="h-3 w-3" />
              Complete Application Flow
            </Badge>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Voice Apply Demo
                </CardTitle>
                <CardDescription>Full candidate application in under 6 minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AudioPlayer src="/audio/voice-apply-demo.mp3" onTimeUpdate={onVoiceApplyTimeUpdate} />
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="text-xs">CDL Screening</Badge>
                  <Badge variant="secondary" className="text-xs">Veteran Recognition</Badge>
                  <Badge variant="secondary" className="text-xs">Conversational AI</Badge>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  * Real conversation demonstrating complete intake flow
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Transcript</CardTitle>
                <CardDescription>Watch the full application unfold</CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptDisplay currentTime={voiceApplyTime} transcriptData={voiceApplyTranscript} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  Live Call Audio
                </CardTitle>
                <CardDescription>AI agent verifying CDL qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AudioPlayer src="/audio/example-outbound-call.mp3" onTimeUpdate={onLiveCallTimeUpdate} />
                <div className="text-xs text-muted-foreground text-center">
                  * Demo audio - actual calls are personalized with candidate data
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Transcript</CardTitle>
                <CardDescription>Follow along as the AI agent speaks</CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptDisplay currentTime={liveCallTime} transcriptData={liveCallTranscript} />
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
                <CardDescription>AI agent leaving a professional voicemail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AudioPlayer src="/audio/example-voicemail-call.m4a" onTimeUpdate={onVoicemailTimeUpdate} />
                <div className="text-xs text-muted-foreground text-center">
                  * Demo audio - voicemails include callback instructions
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voicemail Transcript</CardTitle>
                <CardDescription>See the personalized message content</CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptDisplay currentTime={voicemailTime} transcriptData={voicemailTranscript} speakerLabels={{ agent: 'AI Voicemail', applicant: 'System' }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <DynamicVariablesCard />
        <HowItWorksSection />
      </div>
    </div>
  );
};
