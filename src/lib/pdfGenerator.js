import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './calculations';

/**
 * Generates an official branded payslip PDF for an individual worker
 */
export function generatePayslipPDF(record, employee, period, designationName, siteName, companyProfile) {
  const doc = new jsPDF();

  // Header Banner - Construction Red/Orange Brand
  doc.setFillColor(230, 57, 23); // #E63917
  doc.rect(0, 0, 210, 28, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CTRL CONSTRUCTION CORP.', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HUMAN RESOURCE MANAGEMENT & PAYROLL SYSTEM', 14, 20);

  doc.setFontSize(8);
  doc.text('CONFIDENTIAL EMPLOYEE PAYSLIP', 196, 13, { align: 'right' });
  doc.text(period.periodName || 'Payroll Period', 196, 20, { align: 'right' });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  // Employee Information Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 38, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${employee.firstName} ${employee.middleName || ''} ${employee.lastName} ${employee.suffix || ''}`.trim(), 20, 43);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Employee ID: ${employee.employeeNo}`, 20, 50);
  doc.text(`Designation: ${designationName || 'N/A'}`, 20, 57);
  doc.text(`Assigned Site: ${siteName || 'Unassigned'}`, 20, 64);

  doc.text(`Employment Type: ${employee.employmentType}`, 110, 43);
  doc.text(`Salary Type: ${employee.salaryType} (Rate: ${formatCurrency(employee.basicRate)})`, 110, 50);
  doc.text(`Payout Date: ${period.payoutDate || 'N/A'}`, 110, 57);
  doc.text(`TIN: ${employee.tinNo || 'N/A'} | SSS: ${employee.sssNo || 'N/A'}`, 110, 64);

  // Tables for Earnings & Deductions
  const earningsData = [
    ['Basic Salary / Regular Pay', `${record.daysWorked || 0} days`, formatCurrency(record.basicPay)],
    ['Overtime Pay (125%)', `${record.otHours || 0} hrs`, formatCurrency(record.otPay)],
    ['Holiday Pay (200%)', '-', formatCurrency(record.holidayPay)],
    ['Rest Day Work Pay', '-', formatCurrency(record.restDayPay)],
    ['Night Differential (10%)', '-', formatCurrency(record.nightDiffPay)],
    ['Site / Project Allowance', '-', formatCurrency(record.siteAllowance)],
    ['Hazard Pay / Skill Bonus', '-', formatCurrency(record.hazardAllowance + (record.otherBonuses || 0))],
  ];

  const deductionsData = [
    ['SSS Contribution (EE)', formatCurrency(record.sssDeduction)],
    ['PhilHealth Contribution (EE)', formatCurrency(record.philhealthDeduction)],
    ['Pag-IBIG Contribution (EE)', formatCurrency(record.pagibigDeduction)],
    ['Withholding Tax (BIR TRAIN)', formatCurrency(record.taxDeduction)],
    ['Cash Advance', formatCurrency(record.cashAdvance)],
    ['Tool / Equipment Loan', formatCurrency(record.loanDeduction)],
    ['Other Authorized Deductions', formatCurrency(record.otherDeductions)],
  ];

  // Draw Earnings Table (Left column)
  doc.autoTable({
    startY: 78,
    margin: { left: 14, right: 110 },
    head: [['EARNINGS', 'HRS / DAYS', 'AMOUNT']],
    body: earningsData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
  });

  const earningsFinalY = doc.lastAutoTable.finalY;

  // Draw Deductions Table (Right column)
  doc.autoTable({
    startY: 78,
    margin: { left: 110, right: 14 },
    head: [['DEDUCTIONS', 'AMOUNT']],
    body: deductionsData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  const deductionsFinalY = doc.lastAutoTable.finalY;
  const bottomY = Math.max(earningsFinalY, deductionsFinalY) + 6;

  // Summary Totals Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, bottomY, 182, 34, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL GROSS PAY', 22, bottomY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(record.grossPay), 22, bottomY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL DEDUCTIONS', 80, bottomY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`- ${formatCurrency(record.totalDeductions)}`, 80, bottomY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 57, 23);
  doc.text('NET TAKE-HOME PAY', 140, bottomY + 10);
  doc.setFontSize(14);
  doc.text(formatCurrency(record.netPay), 140, bottomY + 20);

  // Government Employer Share Info
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`Employer Statutory Shares: SSS: ${formatCurrency(record.sssEmployer)} | PhilHealth: ${formatCurrency(record.philhealthEmployer)} | Pag-IBIG: ${formatCurrency(record.pagibigEmployer)}`, 22, bottomY + 28);

  // Signatures
  const signY = bottomY + 48;
  doc.setDrawColor(148, 163, 184);
  doc.line(22, signY, 80, signY);
  doc.line(130, signY, 188, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Employee Signature & Date Received', 25, signY + 6);
  doc.text('Authorized HR / Payroll Officer', 135, signY + 6);

  // Footer Note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('CTRL Construction HR Management — A product by VCS Technologies', 105, 285, { align: 'center' });

  // Save / Download
  const safeName = `${employee.employeeNo}_${employee.lastName}_Payslip`.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeName}.pdf`);
}
