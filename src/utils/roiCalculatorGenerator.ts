/**
 * ROI Calculator XLSX Generator
 */
import * as XLSX from 'xlsx';

interface ROIRow {
  Metric: string;
  'Current State': string | number;
  'With Apply AI': string | number;
  'Improvement': string;
}

/**
 * Generate ROI Calculator Template XLSX
 */
export const generateRoiCalculatorXLSX = (): void => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instructionsData = [
    ['ATS.me ROI Calculator'],
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
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Calculator sheet
  const calculatorData: ROIRow[] = [
    { Metric: 'HIRING VOLUME', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'Monthly Hires', 'Current State': 10, 'With Apply AI': 12, 'Improvement': '+20%' },
    { Metric: 'Monthly Applications', 'Current State': 500, 'With Apply AI': 650, 'Improvement': '+30%' },
    { Metric: 'Open Positions', 'Current State': 25, 'With Apply AI': 25, 'Improvement': '-' },
    { Metric: '', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'TIME METRICS', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'Time to Hire (days)', 'Current State': 45, 'With Apply AI': 28, 'Improvement': '-38%' },
    { Metric: 'Time to First Response (hours)', 'Current State': 48, 'With Apply AI': 4, 'Improvement': '-92%' },
    { Metric: 'Application Completion Rate (%)', 'Current State': 45, 'With Apply AI': 80, 'Improvement': '+78%' },
    { Metric: 'Recruiter Hours per Hire', 'Current State': 20, 'With Apply AI': 8, 'Improvement': '-60%' },
    { Metric: '', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'COST METRICS', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'Cost per Hire ($)', 'Current State': 4500, 'With Apply AI': 2700, 'Improvement': '-40%' },
    { Metric: 'Monthly Job Board Spend ($)', 'Current State': 5000, 'With Apply AI': 3500, 'Improvement': '-30%' },
    { Metric: 'Monthly Recruiter Costs ($)', 'Current State': 15000, 'With Apply AI': 15000, 'Improvement': '-' },
    { Metric: '', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'QUALITY METRICS', 'Current State': '', 'With Apply AI': '', 'Improvement': '' },
    { Metric: 'Quality of Hire Score (1-10)', 'Current State': 6.5, 'With Apply AI': 8.2, 'Improvement': '+26%' },
    { Metric: '90-Day Retention Rate (%)', 'Current State': 75, 'With Apply AI': 88, 'Improvement': '+17%' },
    { Metric: 'Candidate Satisfaction (%)', 'Current State': 65, 'With Apply AI': 92, 'Improvement': '+42%' }
  ];

  const wsCalculator = XLSX.utils.json_to_sheet(calculatorData);
  wsCalculator['!cols'] = [
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCalculator, 'Calculator');

  // Summary sheet
  const summaryData = [
    ['ROI SUMMARY'],
    [''],
    ['Annual Projections', 'Value'],
    ['Time Saved (hours/year)', '=Calculator!B10*12*-1'],
    ['Cost Savings ($/year)', '=(Calculator!B13-Calculator!C13)*12'],
    ['Additional Hires Enabled', '=(Calculator!C2-Calculator!B2)*12'],
    [''],
    ['Estimated Annual Benefits', ''],
    ['Cost per Hire Reduction ($)', '=(Calculator!B13-Calculator!C13)*12'],
    ['Time Efficiency Gains (hours)', '=(Calculator!B10-Calculator!C10)*12'],
    [''],
    ['ROI Metrics', ''],
    ['Net Annual Benefit ($)', '=(Calculator!B13-Calculator!C13)*12'],
    ['Efficiency Improvement (%)', '=((Calculator!B10-Calculator!C10)/Calculator!B10)*100']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'ROI Summary');

  // Save file
  XLSX.writeFile(wb, 'ats-me-roi-calculator.xlsx');
};
