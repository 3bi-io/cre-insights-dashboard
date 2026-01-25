import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { Brain, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import type { FeatureImportance, ConfidenceDistribution, ModelVersionPoint, PerformanceMetricPoint } from '../hooks';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface ModelInsightsProps {
  data: {
    featureImportance: FeatureImportance[];
    confidenceDistribution: ConfidenceDistribution[];
    modelVersion: string;
    trainingDataPoints: number;
    lastUpdated: string;
    modelVersionHistory: ModelVersionPoint[];
    performanceMetrics: PerformanceMetricPoint[];
    modelType: string;
    modelSubtype: string;
    updateFrequency: string;
    accuracyImprovement: number;
  };
}

export const ModelInsights: React.FC<ModelInsightsProps> = ({ data }) => {
  const { 
    featureImportance, 
    confidenceDistribution, 
    modelVersion, 
    trainingDataPoints, 
    lastUpdated,
    modelVersionHistory,
    performanceMetrics,
    modelType,
    modelSubtype,
    updateFrequency,
    accuracyImprovement
  } = data;

  // Calculate high confidence percentage
  const totalPredictions = confidenceDistribution.reduce((sum, c) => sum + c.count, 0);
  const highConfidenceCount = confidenceDistribution
    .filter(c => c.range === '90-100%' || c.range === '80-89%')
    .reduce((sum, c) => sum + c.count, 0);
  const highConfidencePercent = totalPredictions > 0 ? Math.round((highConfidenceCount / totalPredictions) * 100) : 0;
  
  const lowConfidenceCount = confidenceDistribution
    .filter(c => c.range === '<60%')
    .reduce((sum, c) => sum + c.count, 0);

  if (!featureImportance.length) {
    return (
      <AnalyticsEmptyState
        title="No Model Insights Available"
        description="Model insights are generated after AI analysis. Start analyzing candidates to see feature importance and confidence distributions."
        icon="brain"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Model Insights & Explainability
          </h3>
          <p className="text-sm text-muted-foreground">
            Understanding how the AI makes decisions
          </p>
        </div>
        <Badge variant="outline">
          Model {modelVersion}
        </Badge>
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Model</p>
              <p className="text-2xl font-bold">{modelVersion}</p>
              <p className="text-xs text-muted-foreground">Released: {lastUpdated}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Training Data</p>
              <p className="text-2xl font-bold">{trainingDataPoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">data points</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Model Type</p>
              <p className="text-2xl font-bold">{modelType}</p>
              <p className="text-xs text-muted-foreground">{modelSubtype}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Update Frequency</p>
              <p className="text-2xl font-bold">{updateFrequency}</p>
              <p className="text-xs text-muted-foreground">with continuous learning</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Feature Importance
          </CardTitle>
          <CardDescription>
            Which factors most influence AI hiring decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureImportance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 0.3]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" fill="hsl(var(--primary))">
                  {featureImportance.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.category === 'high' ? 'hsl(var(--success))' :
                        entry.category === 'medium' ? 'hsl(var(--primary))' :
                        'hsl(var(--muted))'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {featureImportance.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{feature.feature}</span>
                    <Badge variant="outline">{(feature.importance * 100).toFixed(1)}%</Badge>
                  </div>
                  <Progress value={feature.importance * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Metrics</CardTitle>
          <CardDescription>
            Technical evaluation of model accuracy and reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{metric.metric}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {(metric.value * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={metric.value * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Model Evolution
            </CardTitle>
            <CardDescription>
              Accuracy improvements across versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelVersionHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="version" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))">
                  {modelVersionHistory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={index === modelVersionHistory.length - 1 ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Confidence Distribution</CardTitle>
            <CardDescription>
              Distribution of model confidence levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" dataKey="x" name="Confidence %" domain={[50, 100]} />
                <YAxis type="number" dataKey="y" name="Count" />
                <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={confidenceDistribution} fill="hsl(var(--primary))">
                  {confidenceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.4 + index * 0.15})`} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {confidenceDistribution.map((item) => (
                <div key={item.range} className="text-center">
                  <p className="text-xs text-muted-foreground">{item.range}</p>
                  <p className="text-lg font-bold">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <Lightbulb className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">High Confidence Predictions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {highConfidencePercent}% of predictions have confidence scores above 80%, indicating strong model reliability for most candidates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Consistent Accuracy Improvement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Model accuracy has improved by {accuracyImprovement}% from v1.0 to {modelVersion} through continuous learning and data refinement.
                </p>
              </div>
            </div>

            {lowConfidenceCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Low Confidence Cases</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lowConfidenceCount} predictions ({totalPredictions > 0 ? Math.round((lowConfidenceCount / totalPredictions) * 100) : 0}%) have confidence below 60%. These cases should receive additional human review to ensure quality.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Feature Engineering Opportunity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider adding soft skills assessment as a feature. Current model heavily weighs technical factors, potentially missing strong cultural fits.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelInsights;
