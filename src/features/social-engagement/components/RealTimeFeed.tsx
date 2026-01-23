import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  AtSign,
  Clock,
  Zap,
  TrendingUp,
  Bot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SocialInteraction } from '../hooks/useSocialInteractions';
import { SocialPlatform } from '../hooks/useSocialConnections';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RealTimeFeedProps {
  organizationId?: string;
  onInteractionClick?: (interaction: SocialInteraction) => void;
}

const PLATFORM_CONFIG: Record<SocialPlatform, { 
  name: string; 
  color: string; 
  bgColor: string;
  gradient: string;
}> = {
  facebook: { 
    name: 'Facebook', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-500/10',
    gradient: 'from-blue-500 to-blue-600'
  },
  instagram: { 
    name: 'Instagram', 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-500/10',
    gradient: 'from-purple-500 via-pink-500 to-orange-400'
  },
  twitter: { 
    name: 'X', 
    color: 'text-foreground', 
    bgColor: 'bg-foreground/10',
    gradient: 'from-gray-700 to-gray-900'
  },
  whatsapp: { 
    name: 'WhatsApp', 
    color: 'text-green-600', 
    bgColor: 'bg-green-500/10',
    gradient: 'from-green-500 to-green-600'
  },
  linkedin: { 
    name: 'LinkedIn', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-700/10',
    gradient: 'from-blue-600 to-blue-800'
  },
};

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-3.5 w-3.5" />,
  like: <Heart className="h-3.5 w-3.5" />,
  share: <Share2 className="h-3.5 w-3.5" />,
  mention: <AtSign className="h-3.5 w-3.5" />,
  message: <MessageSquare className="h-3.5 w-3.5" />,
};

export function RealTimeFeed({ organizationId, onInteractionClick }: RealTimeFeedProps) {
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [newCount, setNewCount] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (!organizationId) return;

    const fetchInteractions = async () => {
      const { data, error } = await supabase
        .from('social_interactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setInteractions(data as SocialInteraction[]);
      }
    };

    fetchInteractions();
  }, [organizationId]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId || !isLive) return;

    const channel = supabase
      .channel('social-interactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_interactions',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const newInteraction = payload.new as SocialInteraction;
          setInteractions(prev => [newInteraction, ...prev.slice(0, 49)]);
          setNewCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, isLive]);

  // Clear new count after 5 seconds
  useEffect(() => {
    if (newCount > 0) {
      const timer = setTimeout(() => setNewCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newCount]);

  const getInitials = (name: string | null, handle: string | null) => {
    const text = name || handle || 'U';
    return text.slice(0, 2).toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                +{newCount} new
              </Badge>
            )}
            <Button 
              variant={isLive ? "default" : "outline"} 
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-1.5"
            >
              <Zap className={cn("h-3.5 w-3.5", isLive && "text-yellow-300")} />
              {isLive ? 'Live' : 'Paused'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <AnimatePresence mode="popLayout">
            {interactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No interactions yet</p>
                <p className="text-sm">Messages will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y">
                {interactions.map((interaction, index) => {
                  const platform = PLATFORM_CONFIG[interaction.platform];
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => onInteractionClick?.(interaction)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-accent/50",
                        interaction.requires_human_review && "bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={interaction.sender_avatar_url || undefined} />
                          <AvatarFallback className={cn(
                            "text-white text-xs bg-gradient-to-br",
                            platform?.gradient || 'from-gray-500 to-gray-600'
                          )}>
                            {getInitials(interaction.sender_name, interaction.sender_handle)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {interaction.sender_name || interaction.sender_handle || 'Unknown'}
                            </span>
                            {interaction.sender_handle && interaction.sender_name && (
                              <span className="text-muted-foreground text-xs truncate">
                                @{interaction.sender_handle}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {interaction.content}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs gap-1", platform?.bgColor, platform?.color)}
                            >
                              {INTERACTION_ICONS[interaction.interaction_type] || <MessageSquare className="h-3 w-3" />}
                              {platform?.name}
                            </Badge>

                            {interaction.auto_responded && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Bot className="h-3 w-3" />
                                Auto-replied
                              </Badge>
                            )}

                            {interaction.sentiment_label === 'negative' && (
                              <Badge variant="destructive" className="text-xs">
                                Negative
                              </Badge>
                            )}

                            {interaction.requires_human_review && (
                              <Badge className="text-xs bg-amber-500 text-white">
                                Review needed
                              </Badge>
                            )}

                            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
