/**
 * ROI Calculator XLSX Generator (using exceljs)
 */
import { writeExcelFileAOA } from '@/lib/excelHelper';

/**
 * Generate ROI Calculator Template XLSX
 */
export const generateRoiCalculatorXLSX = async (): Promise<void> => {
  const instructionsData: (string | number | null)[][] = [
    ['Apply AI ROI Calculator'],
    [''],
    ['Instructions:'],
    ['1. Enter your current metrics in the "Current State" column on the Calculator sheet'],
    ['2. Review the projected improvements with ATS.me'],
    ['3. Calculate your potential annual savings and ROI'],
    [''],
    ['Note: Improvement estimates are based on typical customer results.'],
    ['Actual results may vary based on your specific situation.'],
    [''],
    ['For questions, contact us at support@applyai.jobs']

  const calculatorData: (string | number | null)[][] = [
    ['Metric', 'Current State', 'With Apply AI', 'Improvement'],
    ['HIRING VOLUME', '', '', ''],
    ['Monthly Hires', 10, 12, '+20%'],
    ['Monthly Applications', 500, 650, '+30%'],
    ['Open Positions', 25, 25, '-'],
    ['', '', '', ''],
    ['TIME METRICS', '', '', ''],
    ['Time to Hire (days)', 45, 28, '-38%'],
    ['Time to First Response (hours)', 48, 4, '-92%'],
    ['Application Completion Rate (%)', 45, 80, '+78%'],
    ['Recruiter Hours per Hire', 20, 8, '-60%'],
    ['', '', '', ''],
    ['COST METRICS', '', '', ''],
    ['Cost per Hire ($)', 4500, 2700, '-40%'],
    ['Monthly Job Board Spend ($)', 5000, 3500, '-30%'],
    ['Monthly Recruiter Costs ($)', 15000, 15000, '-'],
    ['', '', '', ''],
    ['QUALITY METRICS', '', '', ''],
    ['Quality of Hire Score (1-10)', 6.5, 8.2, '+26%'],
    ['90-Day Retention Rate (%)', 75, 88, '+17%'],
    ['Candidate Satisfaction (%)', 65, 92, '+42%']
  ];

  const summaryData: (string | number | null)[][] = [
    ['ROI SUMMARY'],
    [''],
    ['Annual Projections', 'Value'],
    ['Time Saved (hours/year)', 'See Calculator sheet'],
    ['Cost Savings ($/year)', 'See Calculator sheet'],
    ['Additional Hires Enabled', 'See Calculator sheet'],
    [''],
    ['Estimated Annual Benefits', ''],
    ['Cost per Hire Reduction ($)', '21,600'],
    ['Time Efficiency Gains (hours)', '144'],
    [''],
    ['ROI Metrics', ''],
    ['Net Annual Benefit ($)', '21,600'],
    ['Efficiency Improvement (%)', '60']
  ];

  await writeExcelFileAOA(
    [
      { name: 'Instructions', data: instructionsData, columnWidths: [70] },
      { name: 'Calculator', data: calculatorData, columnWidths: [35, 18, 18, 15] },
      { name: 'ROI Summary', data: summaryData, columnWidths: [35, 20] },
    ],
    'ats-me-roi-calculator.xlsx',
  );
};
