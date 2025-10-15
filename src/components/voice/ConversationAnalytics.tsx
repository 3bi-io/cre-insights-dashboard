import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Users, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface Conversation {
  started_at: string;
  duration_seconds: number | null;
  status: string;
}

interface ConversationAnalyticsProps {
  conversations: Conversation[];
}

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({ conversations }) => {
  // Calculate metrics
  const totalConversations = conversations.length;
  const completedConversations = conversations.filter(c => c.status === 'completed').length;
  const totalDuration = conversations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const avgDuration = totalConversations > 0 ? Math.floor(totalDuration / totalConversations) : 0;
  const completionRate = totalConversations > 0 ? Math.round((completedConversations / totalConversations) * 100) : 0;

  // Generate chart data for last 30 days
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const chartData = last30Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayConversations = conversations.filter(c => 
      format(new Date(c.started_at), 'yyyy-MM-dd') === dayStr
    );
    
    return {
      date: format(day, 'MMM dd'),
      conversations: dayConversations.length,
      avgDuration: dayConversations.length > 0 
        ? Math.floor(dayConversations.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / dayConversations.length)
        : 0
    };
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              {completedConversations} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedConversations} of {totalConversations} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(avgDuration)}</div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(totalDuration)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => 
                format(new Date(c.started_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's conversations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Volume (Last 30 Days)</CardTitle>
          <CardDescription>
            Track conversation trends over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="conversations" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))" 
                fillOpacity={0.2}
                name="Conversations"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
