import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Bot, ExternalLink, Save, X, Edit, Plus } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useVoiceAgents } from '@/features/elevenlabs/hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LLMModelSelect } from '@/features/elevenlabs';
import { useToast } from '@/hooks/use-toast';

interface AgentFormData {
  agent_name: string;
  agent_id: string;
  elevenlabs_agent_id: string;
  voice_id: string;
  description: string;
  llm_model: string;
}

export const OrganizationAgentAssignment: React.FC = () => {
  const { organizations, isLoading: loadingOrgs } = useOrganizations();
  const { voiceAgents, isLoading: loadingAgents, createVoiceAgent, updateVoiceAgent } = useVoiceAgents();
  const { toast } = useToast();
  
  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    agent_name: '',
    agent_id: '',
    elevenlabs_agent_id: '',
    voice_id: '9BWtsMINqrJLrRacOk9x',
    description: '',
    llm_model: 'gpt-4o-mini'
  });

  const getAgentForOrg = (orgId: string) => {
    return voiceAgents?.find(agent => agent.organization_id === orgId);
  };

  const handleEdit = (orgId: string) => {
    const agent = getAgentForOrg(orgId);
    if (agent) {
      setFormData({
        agent_name: agent.agent_name,
        agent_id: agent.agent_id,
        elevenlabs_agent_id: agent.elevenlabs_agent_id,
        voice_id: agent.voice_id || '9BWtsMINqrJLrRacOk9x',
        description: agent.description || '',
        llm_model: agent.llm_model || 'gpt-4o-mini'
      });
    } else {
      setFormData({
        agent_name: '',
        agent_id: '',
        elevenlabs_agent_id: '',
        voice_id: '9BWtsMINqrJLrRacOk9x',
        description: '',
        llm_model: 'gpt-4o-mini'
      });
    }
    setEditingOrg(orgId);
  };

  const handleCancel = () => {
    setEditingOrg(null);
    setFormData({
      agent_name: '',
      agent_id: '',
      elevenlabs_agent_id: '',
      voice_id: '9BWtsMINqrJLrRacOk9x',
      description: '',
      llm_model: 'gpt-4o-mini'
    });
  };

  const handleSave = async (orgId: string) => {
    if (!formData.agent_name || !formData.agent_id || !formData.elevenlabs_agent_id) {
      toast({
        title: "Validation Error",
        description: "Agent name, internal ID, and ElevenLabs ID are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const agent = getAgentForOrg(orgId);
      const agentData = {
        organization_id: orgId,
        ...formData,
        is_active: true
      };

      if (agent) {
        await updateVoiceAgent({ id: agent.id, ...agentData });
        toast({
          title: "Success",
          description: "Voice agent updated successfully"
        });
      } else {
        await createVoiceAgent(agentData);
        toast({
          title: "Success",
          description: "Voice agent created successfully"
        });
      }
      
      handleCancel();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save agent",
        variant: "destructive"
      });
    }
  };

  if (loadingOrgs || loadingAgents) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading organizations...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Assign unique ElevenLabs agent IDs to each organization</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => window.open('https://elevenlabs.io/app/conversational-ai', '_blank')}
          >
            Open ElevenLabs Dashboard
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {organizations?.map((org) => {
          const agent = getAgentForOrg(org.id);
          const isEditing = editingOrg === org.id;

          return (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription className="text-sm">{org.slug}</CardDescription>
                    </div>
                  </div>
                  {agent && !isEditing ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      Agent Assigned
                    </Badge>
                  ) : !isEditing ? (
                    <Badge variant="outline">No Agent</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="space-y-4">
                    {agent ? (
                      <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agent Name:</span>
                          <span className="font-medium">{agent.agent_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Agent ID:</span>
                          <span className="font-mono text-xs">{agent.elevenlabs_agent_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LLM Model:</span>
                          <span className="font-medium">{agent.llm_model}</span>
                        </div>
                        {agent.description && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="font-medium text-right max-w-xs">{agent.description}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No voice agent assigned to this organization yet.
                      </p>
                    )}
                    <Button
                      variant={agent ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleEdit(org.id)}
                      className="w-full"
                    >
                      {agent ? (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Agent
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Assign Agent
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`agent_name_${org.id}`}>Agent Name *</Label>
                      <Input
                        id={`agent_name_${org.id}`}
                        placeholder="e.g., HR Assistant"
                        value={formData.agent_name}
                        onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`agent_id_${org.id}`}>Internal Agent ID *</Label>
                      <Input
                        id={`agent_id_${org.id}`}
                        placeholder="e.g., hr_assistant_001"
                        value={formData.agent_id}
                        onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for internal tracking (lowercase, underscores only)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`elevenlabs_id_${org.id}`}>ElevenLabs Agent ID *</Label>
                      <Input
                        id={`elevenlabs_id_${org.id}`}
                        placeholder="agent_xxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={formData.elevenlabs_agent_id}
                        onChange={(e) => setFormData({ ...formData, elevenlabs_agent_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        From ElevenLabs Dashboard → Agent → Settings → Agent ID
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`voice_${org.id}`}>Voice</Label>
                      <Select
                        value={formData.voice_id}
                        onValueChange={(value) => setFormData({ ...formData, voice_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9BWtsMINqrJLrRacOk9x">Aria - Warm, friendly female</SelectItem>
                          <SelectItem value="CwhRBWXzGAHq8TQ4Fs17">Roger - Professional male</SelectItem>
                          <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah - Clear, articulate female</SelectItem>
                          <SelectItem value="FGY2WhTYpPnrIDTdsKH5">Laura - Energetic female</SelectItem>
                          <SelectItem value="IKne3meq5aSn9XLyUdCD">Charlie - Confident male</SelectItem>
                          <SelectItem value="JBFqnCBsd6RMkjVDRZzb">George - Authoritative male</SelectItem>
                          <SelectItem value="N2lVS1w4EtoT3dr4eOWO">Callum - Smooth male</SelectItem>
                          <SelectItem value="SAz9YHcvj6GT2YYXdXww">River - Calm, soothing neutral</SelectItem>
                          <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam - Casual male</SelectItem>
                          <SelectItem value="XB0fDUnXU5powFXDhCwa">Charlotte - Elegant female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`description_${org.id}`}>Description</Label>
                      <Input
                        id={`description_${org.id}`}
                        placeholder="Brief description..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <LLMModelSelect
                      value={formData.llm_model}
                      onValueChange={(value) => setFormData({ ...formData, llm_model: value })}
                    />

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleSave(org.id)}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Agent
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {organizations?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No organizations found. Create organizations first before assigning agents.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
