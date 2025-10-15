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
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import { Brain, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

const featureImportanceData = [
  { feature: 'Years of Experience', importance: 0.24, category: 'high' },
  { feature: 'Skills Match', importance: 0.21, category: 'high' },
  { feature: 'Education Level', importance: 0.18, category: 'medium' },
  { feature: 'Previous Roles', importance: 0.15, category: 'medium' },
  { feature: 'Industry Experience', importance: 0.12, category: 'medium' },
  { feature: 'Certifications', importance: 0.10, category: 'low' },
].sort((a, b) => b.importance - a.importance);

const modelVersionData = [
  { version: 'v1.0', accuracy: 72, deployed: '2024-01' },
  { version: 'v1.1', accuracy: 76, deployed: '2024-03' },
  { version: 'v1.2', accuracy: 81, deployed: '2024-05' },
  { version: 'v2.0', accuracy: 87, deployed: '2024-08' },
  { version: 'v2.1', accuracy: 91, deployed: '2024-11' },
];

const confidenceDistributionData = [
  { range: '90-100%', count: 342, x: 95, y: 342, z: 20 },
  { range: '80-89%', count: 289, x: 85, y: 289, z: 18 },
  { range: '70-79%', count: 156, x: 75, y: 156, z: 15 },
  { range: '60-69%', count: 84, x: 65, y: 84, z: 12 },
  { range: '<60%', count: 26, x: 55, y: 26, z: 8 },
];

const performanceMetricsData = [
  { metric: 'Precision', value: 0.87, description: 'Accuracy of positive predictions' },
  { metric: 'Recall', value: 0.82, description: 'Ability to find all relevant candidates' },
  { metric: 'F1-Score', value: 0.84, description: 'Balance between precision and recall' },
  { metric: 'AUC-ROC', value: 0.91, description: 'Overall model discrimination ability' },
];

export const ModelInsights: React.FC = () => {
  const currentVersion = 'v2.1';
  const lastUpdated = '2024-11-15';
  const trainingDataPoints = 15847;

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
          Model {currentVersion}
        </Badge>
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Model</p>
              <p className="text-2xl font-bold">{currentVersion}</p>
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
              <p className="text-2xl font-bold">Ensemble</p>
              <p className="text-xs text-muted-foreground">Gradient Boosting</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Update Frequency</p>
              <p className="text-2xl font-bold">Monthly</p>
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
              <BarChart data={featureImportanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 0.3]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" width={150} />
                <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                <Bar dataKey="importance" fill="hsl(var(--primary))">
                  {featureImportanceData.map((entry, index) => (
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
              {featureImportanceData.slice(0, 3).map((feature, idx) => (
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
            {performanceMetricsData.map((metric) => (
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
              <BarChart data={modelVersionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="version" />
                <YAxis domain={[60, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))">
                  {modelVersionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={index === modelVersionData.length - 1 ? 'hsl(var(--success))' : 'hsl(var(--primary))'}
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
                <Scatter data={confidenceDistributionData} fill="hsl(var(--primary))">
                  {confidenceDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.4 + index * 0.15})`} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-5 gap-2 mt-4">
              {confidenceDistributionData.map((item) => (
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
                  68% of predictions have confidence scores above 90%, indicating strong model reliability for most candidates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Consistent Accuracy Improvement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Model accuracy has improved by 19% from v1.0 to v2.1 through continuous learning and data refinement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Low Confidence Cases</p>
                <p className="text-xs text-muted-foreground mt-1">
                  26 predictions (3%) have confidence below 60%. These cases should receive additional human review to ensure quality.
                </p>
              </div>
            </div>

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
