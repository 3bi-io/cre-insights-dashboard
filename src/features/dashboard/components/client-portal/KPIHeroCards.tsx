import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Send, Target, Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { ClientAnalyticsData } from '@/features/clients/types/clientAnalytics.types';

interface KPIHeroCardsProps {
  analytics: ClientAnalyticsData | null;
  isLoading: boolean;
  sparklineData?: Array<{ date: string; count: number }>;
}

const getReadinessGrade = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-400' };
  if (score >= 40) return { label: 'Fair', color: 'text-amber-400' };
  return { label: 'Poor', color: 'text-red-400' };
};

const getDeliveryStatus = (rate: number) => {
  if (rate >= 90) return { label: 'Healthy', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (rate >= 70) return { label: 'Needs Attention', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
  return { label: 'Critical', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
};

const getSlaStatus = (hours: number) => {
  if (hours === 0) return null;
  if (hours <= 24) return { label: 'Within SLA', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  return { label: 'Above SLA', color: 'text-red-400', bg: 'bg-red-500/20' };
};

export const KPIHeroCards: React.FC<KPIHeroCardsProps> = ({ analytics, isLoading, sparklineData }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-24 mb-3" />
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const deliveryRate = analytics.atsDelivery.successRate;
  const deliveryStatus = getDeliveryStatus(deliveryRate);
  const readinessGrade = getReadinessGrade(analytics.avgReadinessScore);
  const slaStatus = getSlaStatus(analytics.sla.avgResponseHours);
  const readinessPercent = Math.min(analytics.avgReadinessScore, 100);

  const cards = [
    {
      title: 'Total Applications',
      subtitle: 'Applications received',
      value: analytics.totalApplications.toLocaleString(),
      icon: Users,
      borderColor: 'border-l-blue-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      extra: (
        <div className="mt-3">
          {sparklineData && sparklineData.length > 1 ? (
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="sparkBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#sparkBlue)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No trend data yet</p>
          )}
        </div>
      ),
    },
    {
      title: 'ATS Delivery Rate',
      subtitle: 'Successfully delivered to ATS',
      value: `${deliveryRate}%`,
      icon: Send,
      borderColor: 'border-l-violet-500',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      extra: (
        <div className="mt-3 space-y-2">
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${deliveryStatus.bg} ${deliveryStatus.text} border ${deliveryStatus.border}`}>
            {deliveryStatus.label}
          </span>
          <div className="space-y-1">
            {[
              { label: 'Success', value: analytics.atsDelivery.success, color: 'bg-emerald-500' },
              { label: 'Error', value: analytics.atsDelivery.error, color: 'bg-red-500' },
              { label: 'Pending', value: analytics.atsDelivery.pending, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="ml-auto font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Avg Readiness Score',
      subtitle: 'Candidate quality score',
      value: `${analytics.avgReadinessScore}`,
      icon: Target,
      borderColor: 'border-l-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      extra: (
        <div className="mt-3 flex items-center gap-3">
          {/* Circular progress ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke={readinessPercent >= 80 ? '#10b981' : readinessPercent >= 60 ? '#3b82f6' : readinessPercent >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(readinessPercent / 100) * 125.6} 125.6`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
              {analytics.avgReadinessScore}
            </span>
          </div>
          <div>
            <p className={`text-sm font-semibold ${readinessGrade.color}`}>{readinessGrade.label}</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Avg Response Time',
      subtitle: 'Time to first recruiter contact',
      value: analytics.sla.avgResponseHours > 0 ? `${analytics.sla.avgResponseHours}h` : 'N/A',
      icon: Clock,
      borderColor: 'border-l-amber-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      extra: (
        <div className="mt-3">
          {slaStatus ? (
            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${slaStatus.bg} ${slaStatus.color}`}>
              {slaStatus.label}
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">No response data yet</p>
          )}
          {analytics.sla.totalWithResponse > 0 && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Within 24h</span>
                <span className="text-emerald-400">{analytics.sla.within24h}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>24-48h</span>
                <span className="text-amber-400">{analytics.sla.within48h}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Over 48h</span>
                <span className="text-red-400">{analytics.sla.over48h}</span>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={`border-l-4 ${card.borderColor} border-border/50 hover:border-border transition-colors`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              {card.extra}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
