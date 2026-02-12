import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Database,
  Phone,
  MapPin,
  FileCheck,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';
import { useDataQuality } from '../hooks/useDataQuality';
import { SourceQualityMetrics, FieldCompletionRate, DataQualityAlert } from '../types/dataQuality';
import { EnrichmentService } from '../services/enrichmentService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
 
 const categoryIcons = {
   contact: Phone,
   location: MapPin,
   qualification: FileCheck,
   compliance: Shield,
   screening: Database,
 };
 
 const QualityScoreBadge = ({ score }: { score: number }) => {
   const getVariant = () => {
     if (score >= 85) return 'default';
     if (score >= 70) return 'secondary';
     if (score >= 50) return 'outline';
     return 'destructive';
   };
 
   const getLabel = () => {
     if (score >= 85) return 'Excellent';
     if (score >= 70) return 'Good';
     if (score >= 50) return 'Fair';
     return 'Poor';
   };
 
   return (
     <Badge variant={getVariant()} className="text-xs">
       {getLabel()} ({score.toFixed(0)}%)
     </Badge>
   );
 };
 
 const FieldCompletionRow = ({ field }: { field: FieldCompletionRate }) => {
   const Icon = categoryIcons[field.category] || Database;
   
   return (
     <div className="flex items-center gap-3 py-2">
       <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
       <div className="flex-1 min-w-0">
         <div className="flex items-center justify-between mb-1">
           <span className="text-sm font-medium truncate">{field.displayName}</span>
           <span className="text-sm text-muted-foreground">
             {field.populatedRecords}/{field.totalRecords}
           </span>
         </div>
           <Progress 
             value={field.completionRate} 
             className={cn(
               "h-2",
               field.completionRate < 50 && "[&>div]:bg-destructive",
               field.completionRate >= 50 && field.completionRate < 70 && "[&>div]:bg-warning",
               field.completionRate >= 70 && field.completionRate < 85 && "[&>div]:bg-accent"
             )}
           />
       </div>
       <span className={cn(
         "text-sm font-medium w-12 text-right",
         field.completionRate < 50 && "text-destructive",
         field.completionRate >= 50 && field.completionRate < 70 && "text-warning-foreground",
         field.completionRate >= 70 && field.completionRate < 85 && "text-accent-foreground",
         field.completionRate >= 85 && "text-primary"
       )}>
         {field.completionRate.toFixed(0)}%
       </span>
     </div>
   );
 };
 
const SourceCard = ({ source }: { source: SourceQualityMetrics }) => {
  const [expanded, setExpanded] = useState(false);
  const [enriching, setEnriching] = useState(false);
  
  // Group fields by category
  const groupedFields = source.fieldCompletionRates.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, FieldCompletionRate[]>);

  // Find fields with low completion for enrichment
  const lowFields = source.fieldCompletionRates
    .filter(f => f.completionRate < 70 && ['qualification', 'contact'].includes(f.category))
    .map(f => f.fieldName);

  const handleTriggerEnrichment = async () => {
    setEnriching(true);
    try {
      const candidates = await EnrichmentService.getEnrichmentCandidates(
        source.source, lowFields, 25
      );
      if (candidates.length === 0) {
        toast.info('No enrichment candidates found for this source');
        return;
      }
      await EnrichmentService.markForEnrichment(candidates.map(c => c.id));
      toast.success(`Queued ${candidates.length} applications for enrichment`);
    } catch (err) {
      toast.error('Failed to trigger enrichment');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{source.displayName}</CardTitle>
            <QualityScoreBadge score={source.qualityScore} />
          </div>
          <Badge variant="outline" className="font-normal">
            {source.totalApplications} apps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Quality</span>
            <span className="font-medium">{source.qualityScore.toFixed(0)}%</span>
          </div>
          <Progress value={source.qualityScore} className="h-2" />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide Details' : 'Show Field Breakdown'}
          </Button>
          {lowFields.length > 0 && source.totalApplications >= 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerEnrichment}
              disabled={enriching}
              className="gap-1"
            >
              <Zap className="h-3 w-3" />
              {enriching ? 'Queuing...' : 'Enrich'}
            </Button>
          )}
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-4">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {fields.map(field => (
                    <FieldCompletionRow key={field.fieldName} field={field} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
 
 const AlertCard = ({ alert }: { alert: DataQualityAlert }) => {
   const severityStyles = {
     critical: 'border-destructive bg-destructive/5',
     high: 'border-warning bg-warning/5',
     medium: 'border-accent bg-accent/5',
     low: 'border-muted',
   };
 
   const severityIcons = {
     critical: <AlertTriangle className="h-4 w-4 text-destructive" />,
     high: <AlertTriangle className="h-4 w-4 text-warning-foreground" />,
     medium: <AlertTriangle className="h-4 w-4 text-accent-foreground" />,
     low: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
   };
 
   return (
     <div className={cn("flex items-start gap-3 p-3 rounded-lg border", severityStyles[alert.severity])}>
       {severityIcons[alert.severity]}
       <div className="flex-1 min-w-0">
         <p className="text-sm font-medium">{alert.message}</p>
         <p className="text-xs text-muted-foreground mt-1">
           Threshold: {alert.threshold}% • Current: {alert.currentRate.toFixed(0)}%
         </p>
       </div>
       <Badge variant="outline" className="shrink-0 text-xs">
         {alert.source}
       </Badge>
     </div>
   );
 };
 
 export const DataQualityDashboard = () => {
   const [days, setDays] = useState(30);
   const { summary, alerts, isLoading, refetch } = useDataQuality(days);
 
   if (isLoading) {
     return (
       <div className="space-y-4">
         <div className="h-32 bg-muted animate-pulse rounded-lg" />
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
           ))}
         </div>
       </div>
     );
   }
 
   if (!summary) {
     return (
       <Card>
         <CardContent className="flex flex-col items-center justify-center py-12">
           <Database className="h-12 w-12 text-muted-foreground mb-4" />
           <p className="text-muted-foreground">No application data available</p>
         </CardContent>
       </Card>
     );
   }
 
   const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Data Quality Dashboard</h2>
           <p className="text-muted-foreground">
             Monitor field completion rates across all application sources
           </p>
         </div>
         <div className="flex items-center gap-2">
           <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
             <SelectTrigger className="w-[140px]">
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="7">Last 7 days</SelectItem>
               <SelectItem value="30">Last 30 days</SelectItem>
               <SelectItem value="90">Last 90 days</SelectItem>
             </SelectContent>
           </Select>
           <Button variant="outline" size="icon" onClick={() => refetch()}>
             <RefreshCw className="h-4 w-4" />
           </Button>
         </div>
       </div>
 
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Overall Quality Score</CardDescription>
             <CardTitle className="text-3xl">
               {summary.overallScore.toFixed(0)}%
             </CardTitle>
           </CardHeader>
           <CardContent>
             <Progress value={summary.overallScore} className="h-2" />
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Total Applications</CardDescription>
             <CardTitle className="text-3xl">{summary.totalApplications}</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground">Last {days} days</p>
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Active Sources</CardDescription>
             <CardTitle className="text-3xl">{summary.bySource.length}</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground">Sending applications</p>
           </CardContent>
         </Card>
         
         <Card className={cn(criticalAlerts.length > 0 && "border-destructive")}>
           <CardHeader className="pb-2">
             <CardDescription>Quality Alerts</CardDescription>
             <CardTitle className="text-3xl flex items-center gap-2">
               {criticalAlerts.length}
               {criticalAlerts.length > 0 && (
                 <AlertTriangle className="h-5 w-5 text-destructive" />
               )}
             </CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground">
               {criticalAlerts.length > 0 ? 'Needs attention' : 'All good'}
             </p>
           </CardContent>
         </Card>
       </div>
 
       {/* Alerts Section */}
       {criticalAlerts.length > 0 && (
         <Card className="border-destructive/50">
           <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-destructive" />
               Quality Alerts
             </CardTitle>
             <CardDescription>
               Fields with low capture rates that need attention
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-2">
             {criticalAlerts.slice(0, 5).map(alert => (
               <AlertCard key={alert.id} alert={alert} />
             ))}
             {criticalAlerts.length > 5 && (
               <p className="text-sm text-muted-foreground text-center py-2">
                 +{criticalAlerts.length - 5} more alerts
               </p>
             )}
           </CardContent>
         </Card>
       )}
 
       {/* Tabs for Sources and Fields */}
        <Tabs defaultValue="sources" className="w-full">
          <TabsList>
            <TabsTrigger value="sources">By Source</TabsTrigger>
            <TabsTrigger value="fields">By Field</TabsTrigger>
            <TabsTrigger value="ats-readiness">ATS Readiness</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sources" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.bySource.map(source => (
                <SourceCard key={source.source} source={source} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="fields" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Critical Field Completion Rates</CardTitle>
                <CardDescription>
                  Across all {summary.totalApplications} applications in the last {days} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {summary.criticalFields
                    .sort((a, b) => a.completionRate - b.completionRate)
                    .map(field => (
                      <FieldCompletionRow key={field.fieldName} field={field} />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ats-readiness" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ATS Readiness Overview
                  </CardTitle>
                  <CardDescription>
                    Percentage of applications ready for auto-post (score ≥ 60%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Estimate readiness from critical field completion
                    const requiredFields = ['first_name', 'last_name', 'phone', 'applicant_email', 'city', 'state', 'zip'];
                    const requiredCompletion = summary.criticalFields
                      .filter(f => requiredFields.includes(f.fieldName));
                    const avgRequired = requiredCompletion.length > 0
                      ? requiredCompletion.reduce((s, f) => s + f.completionRate, 0) / requiredCompletion.length
                      : 0;
                    const estimatedReady = Math.round(avgRequired);
                    
                    return (
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-4xl font-bold">{estimatedReady}%</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            estimated ATS-ready applications
                          </p>
                        </div>
                        <Progress value={estimatedReady} className="h-3" />
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <span className="font-medium text-green-600">
                              {requiredCompletion.filter(f => f.completionRate >= 80).length}
                            </span>
                            <p className="text-xs text-muted-foreground">Fields ≥80%</p>
                          </div>
                          <div>
                            <span className="font-medium text-yellow-600">
                              {requiredCompletion.filter(f => f.completionRate >= 60 && f.completionRate < 80).length}
                            </span>
                            <p className="text-xs text-muted-foreground">Fields 60-80%</p>
                          </div>
                          <div>
                            <span className="font-medium text-red-600">
                              {requiredCompletion.filter(f => f.completionRate < 60).length}
                            </span>
                            <p className="text-xs text-muted-foreground">Fields &lt;60%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Fields for Tenstreet</CardTitle>
                  <CardDescription>Completion rates for auto-post critical fields</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {summary.criticalFields
                      .filter(f => ['first_name', 'last_name', 'phone', 'applicant_email', 'city', 'state', 'zip', 'cdl_class'].includes(f.fieldName))
                      .sort((a, b) => a.completionRate - b.completionRate)
                      .map(field => (
                        <FieldCompletionRow key={field.fieldName} field={field} />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
     </div>
   );
 };