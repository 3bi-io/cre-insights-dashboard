import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { createExcelBlob } from '@/lib/excelHelper';
import type { AIAnalyticsData, DateRangeType } from '../hooks/useAIAnalyticsData';

interface ExportSection {
  id: string;
  label: string;
  enabled: boolean;
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  dateRange: DateRangeType;
  sections: ExportSection[];
}

function formatDateRangeLabel(dateRange: DateRangeType): string {
  const labels: Record<DateRangeType, string> = {
    week: 'Last Week',
    month: 'Last Month',
    quarter: 'Last Quarter',
    year: 'Last Year',
  };
  return labels[dateRange];
}

// Export to PDF
export async function exportToPDF(data: AIAnalyticsData, options: ExportOptions): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  const lineHeight = 7;
  const sectionGap = 15;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Analytics Report', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Date and range
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Period: ${formatDateRangeLabel(options.dateRange)}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += sectionGap;

  // Helper function to check page break
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPos);
    yPos += lineHeight + 2;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  };

  // Helper function to add metric line
  const addMetricLine = (label: string, value: string | number) => {
    checkPageBreak(lineHeight);
    doc.text(`${label}: ${value}`, 25, yPos);
    yPos += lineHeight;
  };

  // Performance Section
  if (options.sections.find(s => s.id === 'performance' && s.enabled)) {
    addSectionHeader('AI Performance Metrics');
    addMetricLine('Model Accuracy', `${data.performance.modelAccuracy}%`);
    addMetricLine('Prediction Confidence', `${data.performance.predictionConfidence}%`);
    addMetricLine('Candidates Analyzed', data.performance.candidatesAnalyzed.toLocaleString());
    addMetricLine('Success Rate', `${data.performance.successRate}%`);
    addMetricLine('Average Processing Time', data.performance.avgProcessingTime);
    addMetricLine('Bias Score', `${data.performance.biasScore}/100`);
    yPos += sectionGap;
  }

  // Predictions Section
  if (options.sections.find(s => s.id === 'predictions' && s.enabled)) {
    addSectionHeader('Predictive Analytics');
    addMetricLine('Total Potential Savings', `$${data.predictions.costPredictions.reduce((sum, c) => sum + c.savings, 0).toLocaleString()}/month`);
    
    doc.text('Cost Predictions:', 25, yPos);
    yPos += lineHeight;
    data.predictions.costPredictions.forEach(cost => {
      addMetricLine(`  ${cost.category}`, `Current: $${cost.current.toLocaleString()} → Predicted: $${cost.predicted.toLocaleString()} (Save $${cost.savings.toLocaleString()})`);
    });
    yPos += sectionGap;
  }

  // Comparison Section
  if (options.sections.find(s => s.id === 'comparison' && s.enabled)) {
    addSectionHeader('AI vs Traditional Comparison');
    addMetricLine('Total Savings', `$${data.comparison.totalSavings.toLocaleString()}`);
    addMetricLine('Time Saved', `${data.comparison.timeSaved} hours`);
    addMetricLine('Quality Increase', `+${data.comparison.qualityIncrease}%`);
    
    yPos += 5;
    data.comparison.metrics.forEach(metric => {
      addMetricLine(metric.metric, `Traditional: ${metric.traditional}${metric.unit} → AI: ${metric.aiEnhanced}${metric.unit} (+${metric.improvement}%)`);
    });
    yPos += sectionGap;
  }

  // Bias Section
  if (options.sections.find(s => s.id === 'bias' && s.enabled)) {
    addSectionHeader('Bias & Fairness Analysis');
    addMetricLine('Fairness Score', `${data.bias.fairnessScore}/100`);
    addMetricLine('Overall Bias Score', `${data.bias.overallBiasScore}/100 (lower is better)`);
    addMetricLine('Issues Detected', data.bias.issuesDetected.toString());
    
    yPos += 5;
    doc.text('Bias by Category:', 25, yPos);
    yPos += lineHeight;
    data.bias.metrics.forEach(metric => {
      addMetricLine(`  ${metric.category}`, `${metric.score}/${metric.threshold} (${metric.status})`);
    });
    yPos += sectionGap;
  }

  // Insights Section
  if (options.sections.find(s => s.id === 'insights' && s.enabled)) {
    addSectionHeader('Model Insights');
    addMetricLine('Model Version', data.insights.modelVersion);
    addMetricLine('Training Data Points', data.insights.trainingDataPoints.toLocaleString());
    addMetricLine('Last Updated', data.insights.lastUpdated);
    
    yPos += 5;
    doc.text('Top Feature Importance:', 25, yPos);
    yPos += lineHeight;
    data.insights.featureImportance.slice(0, 5).forEach(feature => {
      addMetricLine(`  ${feature.feature}`, `${(feature.importance * 100).toFixed(1)}%`);
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} of ${totalPages} | AI Analytics Report`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

// Export to Excel
export async function exportToExcel(data: AIAnalyticsData, options: ExportOptions): Promise<Blob> {
  const sheets: Array<{ name: string; data: (string | number | null)[][] }> = [];

  if (options.sections.find(s => s.id === 'performance' && s.enabled)) {
    sheets.push({
      name: 'Performance',
      data: [
        ['AI Performance Metrics', ''],
        ['Generated', format(new Date(), 'PPpp')],
        ['Period', formatDateRangeLabel(options.dateRange)],
        ['', ''],
        ['Metric', 'Value'],
        ['Model Accuracy', `${data.performance.modelAccuracy}%`],
        ['Prediction Confidence', `${data.performance.predictionConfidence}%`],
        ['Candidates Analyzed', data.performance.candidatesAnalyzed],
        ['Success Rate', `${data.performance.successRate}%`],
        ['Processing Time', data.performance.avgProcessingTime],
        ['Bias Score', `${data.performance.biasScore}/100`],
        ['Precision', `${(data.performance.precision * 100).toFixed(1)}%`],
        ['Recall', `${(data.performance.recall * 100).toFixed(1)}%`],
      ],
    });
  }

  if (options.sections.find(s => s.id === 'predictions' && s.enabled)) {
    sheets.push({
      name: 'Predictions',
      data: [
        ['Predictive Analytics', '', '', ''],
        ['', '', '', ''],
        ['Hiring Forecast', '', '', ''],
        ['Month', 'Actual', 'Predicted', 'Confidence'],
        ...data.predictions.forecastData.map(f => [f.month, f.actual ?? 'N/A', f.predicted, `${f.confidence}%`] as (string | number | null)[]),
        ['', '', '', ''],
        ['Cost Predictions', '', '', ''],
        ['Category', 'Current', 'Predicted', 'Savings'],
        ...data.predictions.costPredictions.map(c => [c.category, `$${c.current}`, `$${c.predicted}`, `$${c.savings}`] as (string | number | null)[]),
      ],
    });
  }

  if (options.sections.find(s => s.id === 'comparison' && s.enabled)) {
    sheets.push({
      name: 'Comparison',
      data: [
        ['AI vs Traditional Comparison', '', '', '', ''],
        ['', '', '', '', ''],
        ['Summary', '', '', '', ''],
        ['Total Savings', `$${data.comparison.totalSavings.toLocaleString()}`, '', '', ''],
        ['Time Saved', `${data.comparison.timeSaved} hours`, '', '', ''],
        ['Quality Increase', `+${data.comparison.qualityIncrease}%`, '', '', ''],
        ['', '', '', '', ''],
        ['Detailed Metrics', '', '', '', ''],
        ['Metric', 'Traditional', 'AI-Enhanced', 'Unit', 'Improvement'],
        ...data.comparison.metrics.map(m => [m.metric, m.traditional, m.aiEnhanced, m.unit, `+${m.improvement}%`] as (string | number | null)[]),
      ],
    });
  }

  if (options.sections.find(s => s.id === 'bias' && s.enabled)) {
    sheets.push({
      name: 'Bias Analysis',
      data: [
        ['Bias & Fairness Analysis', '', '', ''],
        ['', '', '', ''],
        ['Summary', '', '', ''],
        ['Fairness Score', `${data.bias.fairnessScore}/100`, '', ''],
        ['Overall Bias Score', `${data.bias.overallBiasScore}/100`, '', ''],
        ['Issues Detected', data.bias.issuesDetected, '', ''],
        ['', '', '', ''],
        ['Bias by Category', '', '', ''],
        ['Category', 'Score', 'Threshold', 'Status'],
        ...data.bias.metrics.map(m => [m.category, m.score, m.threshold, m.status] as (string | number | null)[]),
        ['', '', '', ''],
        ['Diversity Data', '', '', ''],
        ['Stage', 'Diverse', 'Non-Diverse', ''],
        ...data.bias.diversityData.map(d => [d.name, d.diverse, d.nonDiverse, ''] as (string | number | null)[]),
      ],
    });
  }

  if (options.sections.find(s => s.id === 'insights' && s.enabled)) {
    sheets.push({
      name: 'Insights',
      data: [
        ['Model Insights', '', ''],
        ['', '', ''],
        ['Model Information', '', ''],
        ['Version', data.insights.modelVersion, ''],
        ['Training Data Points', data.insights.trainingDataPoints.toLocaleString(), ''],
        ['Last Updated', data.insights.lastUpdated, ''],
        ['', '', ''],
        ['Feature Importance', '', ''],
        ['Feature', 'Importance', 'Category'],
        ...data.insights.featureImportance.map(f => [f.feature, `${(f.importance * 100).toFixed(1)}%`, f.category] as (string | number | null)[]),
        ['', '', ''],
        ['Confidence Distribution', '', ''],
        ['Range', 'Count', ''],
        ...data.insights.confidenceDistribution.map(c => [c.range, c.count, ''] as (string | number | null)[]),
      ],
    });
  }

  return createExcelBlob(sheets);
}

// Export to CSV
export function exportToCSV(data: AIAnalyticsData, options: ExportOptions): Blob {
  const rows: string[] = [];
  
  rows.push('AI Analytics Report');
  rows.push(`Generated,${format(new Date(), 'PPpp')}`);
  rows.push(`Period,${formatDateRangeLabel(options.dateRange)}`);
  rows.push('');

  if (options.sections.find(s => s.id === 'performance' && s.enabled)) {
    rows.push('Performance Metrics');
    rows.push('Metric,Value');
    rows.push(`Model Accuracy,${data.performance.modelAccuracy}%`);
    rows.push(`Prediction Confidence,${data.performance.predictionConfidence}%`);
    rows.push(`Candidates Analyzed,${data.performance.candidatesAnalyzed}`);
    rows.push(`Success Rate,${data.performance.successRate}%`);
    rows.push(`Processing Time,${data.performance.avgProcessingTime}`);
    rows.push(`Bias Score,${data.performance.biasScore}/100`);
    rows.push('');
  }

  if (options.sections.find(s => s.id === 'comparison' && s.enabled)) {
    rows.push('AI vs Traditional Comparison');
    rows.push('Metric,Traditional,AI-Enhanced,Unit,Improvement');
    data.comparison.metrics.forEach(m => {
      rows.push(`${m.metric},${m.traditional},${m.aiEnhanced},${m.unit},+${m.improvement}%`);
    });
    rows.push('');
  }

  if (options.sections.find(s => s.id === 'bias' && s.enabled)) {
    rows.push('Bias Analysis');
    rows.push('Category,Score,Threshold,Status');
    data.bias.metrics.forEach(m => {
      rows.push(`${m.category},${m.score},${m.threshold},${m.status}`);
    });
    rows.push('');
  }

  if (options.sections.find(s => s.id === 'insights' && s.enabled)) {
    rows.push('Feature Importance');
    rows.push('Feature,Importance,Category');
    data.insights.featureImportance.forEach(f => {
      rows.push(`${f.feature},${(f.importance * 100).toFixed(1)}%,${f.category}`);
    });
  }

  return new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

// Main export function
export async function exportAnalytics(
  data: AIAnalyticsData,
  options: ExportOptions
): Promise<void> {
  let blob: Blob;
  let filename: string;
  const timestamp = format(new Date(), 'yyyy-MM-dd');

  switch (options.format) {
    case 'pdf':
      blob = await exportToPDF(data, options);
      filename = `ai-analytics-report-${timestamp}.pdf`;
      break;
    case 'excel':
      blob = await exportToExcel(data, options);
      filename = `ai-analytics-report-${timestamp}.xlsx`;
      break;
    case 'csv':
      blob = exportToCSV(data, options);
      filename = `ai-analytics-report-${timestamp}.csv`;
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }

  // Download the file
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportAnalytics;
