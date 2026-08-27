import { INITIAL_GOVT_RULES } from '../data/initialData';

/**
 * Calculates Philippine SSS Contribution
 * Employee and Employer share according to SSS 2026 table
 */
export function calculateSSS(monthlyGross, rules = INITIAL_GOVT_RULES.sss) {
  const cappedSalary = Math.min(Math.max(monthlyGross, rules.minSalary), rules.maxSalary);
  const employeeShare = Math.min(cappedSalary * rules.employeeRate, rules.maxEmployeeDeduction);
  const employerShare = cappedSalary * rules.employerRate;

  return {
    employeeShare: Math.round(employeeShare * 100) / 100,
    employerShare: Math.round(employerShare * 100) / 100,
    total: Math.round((employeeShare + employerShare) * 100) / 100
  };
}

/**
 * Calculates Philippine PhilHealth Contribution (5% total, 2.5% EE / 2.5% ER)
 */
export function calculatePhilHealth(monthlyGross, rules = INITIAL_GOVT_RULES.philhealth) {
  const cappedSalary = Math.min(Math.max(monthlyGross, rules.minSalary), rules.maxSalary);
  const total = cappedSalary * rules.rate;
  const employeeShare = Math.min(Math.max(total * 0.5, rules.minEmployeeDeduction), rules.maxEmployeeDeduction);
  const employerShare = employeeShare;

  return {
    employeeShare: Math.round(employeeShare * 100) / 100,
    employerShare: Math.round(employerShare * 100) / 100,
    total: Math.round((employeeShare + employerShare) * 100) / 100
  };
}

/**
 * Calculates Philippine Pag-IBIG Contribution (standard statutory ₱200/mo)
 */
export function calculatePagIBIG(monthlyGross, rules = INITIAL_GOVT_RULES.pagibig) {
  const employeeShare = rules.employeeFixedAmount || 200;
  const employerShare = rules.employerFixedAmount || 200;

  return {
    employeeShare,
    employerShare,
    total: employeeShare + employerShare
  };
}

/**
 * Calculates BIR TRAIN Law Semi-Monthly Withholding Tax
 */
export function calculateWithholdingTax(taxableIncome, isSemiMonthly = true) {
  if (taxableIncome <= 0) return 0;

  if (isSemiMonthly) {
    if (taxableIncome <= 10417) return 0;
    if (taxableIncome <= 16667) return (taxableIncome - 10417) * 0.15;
    if (taxableIncome <= 33333) return 937.50 + (taxableIncome - 16667) * 0.20;
    if (taxableIncome <= 83333) return 4270.70 + (taxableIncome - 33333) * 0.25;
    if (taxableIncome <= 333333) return 16770.70 + (taxableIncome - 83333) * 0.30;
    return 91770.70 + (taxableIncome - 333333) * 0.35;
  } else {
    // Monthly calculation
    if (taxableIncome <= 20833) return 0;
    if (taxableIncome <= 33333) return (taxableIncome - 20833) * 0.15;
    if (taxableIncome <= 66667) return 1875 + (taxableIncome - 33333) * 0.20;
    if (taxableIncome <= 166667) return 8541.80 + (taxableIncome - 66667) * 0.25;
    if (taxableIncome <= 666667) return 33541.80 + (taxableIncome - 166667) * 0.30;
    return 183541.80 + (taxableIncome - 666667) * 0.35;
  }
}

/**
 * Computes complete construction worker payroll record for a period
 */
export function computeEmployeePayroll(employee, periodType = 'Semi-Monthly', inputData = {}) {
  const {
    daysWorked = (employee.salaryType === 'Monthly' ? 13 : 12),
    otHours = 0,
    holidayDays = 0,
    restDaysWorked = 0,
    nightDiffHours = 0,
    siteAllowance = (employee.currentSiteId ? 500 : 0),
    hazardAllowance = (['des-3', 'des-4', 'des-9', 'des-2'].includes(employee.designationId) ? 800 : 0), // welders, crane operators, riggers get hazard
    otherBonuses = 0,
    cashAdvance = 0,
    loanDeduction = 0,
    otherDeductions = 0,
    govRules = INITIAL_GOVT_RULES
  } = inputData;

  const basicRate = Number(employee.basicRate) || 0;
  let basicPay = 0;
  let hourlyRate = 0;

  if (employee.salaryType === 'Hourly') {
    hourlyRate = basicRate;
    basicPay = (daysWorked * 8) * hourlyRate;
  } else if (employee.salaryType === 'Daily') {
    hourlyRate = basicRate / 8;
    basicPay = daysWorked * basicRate;
  } else if (employee.salaryType === 'Monthly') {
    // Semi-monthly basic pay is 50% of monthly rate
    basicPay = periodType === 'Semi-Monthly' ? basicRate / 2 : basicRate;
    hourlyRate = basicRate / (26 * 8); // standard 26 days/month
  }

  // Overtime pay (125% regular rate)
  const otPay = otHours * (hourlyRate * 1.25);

  // Holiday pay (200% for regular holiday)
  const holidayPay = holidayDays * (hourlyRate * 8 * 1.0); // additional 100%

  // Rest day pay (130%)
  const restDayPay = restDaysWorked * (hourlyRate * 8 * 0.30); // additional 30%

  // Night Differential (10%)
  const nightDiffPay = nightDiffHours * (hourlyRate * 0.10);

  // Total Allowances
  const totalAllowances = Number(siteAllowance) + Number(hazardAllowance) + Number(otherBonuses);

  // Gross Pay
  const grossPay = basicPay + otPay + holidayPay + restDayPay + nightDiffPay + totalAllowances;

  // Monthly equivalent for statutory deduction brackets
  const monthlyEquivalent = periodType === 'Semi-Monthly' ? grossPay * 2 : grossPay;

  // Statutory Deductions (Split by 2 if semi-monthly)
  const isSemi = periodType === 'Semi-Monthly';
  const sssResult = calculateSSS(monthlyEquivalent, govRules.sss);
  const sssDeduction = isSemi ? sssResult.employeeShare / 2 : sssResult.employeeShare;
  const sssEmployer = isSemi ? sssResult.employerShare / 2 : sssResult.employerShare;

  const phResult = calculatePhilHealth(monthlyEquivalent, govRules.philhealth);
  const philhealthDeduction = isSemi ? phResult.employeeShare / 2 : phResult.employeeShare;
  const philhealthEmployer = isSemi ? phResult.employerShare / 2 : phResult.employerShare;

  const pagibigResult = calculatePagIBIG(monthlyEquivalent, govRules.pagibig);
  const pagibigDeduction = isSemi ? pagibigResult.employeeShare / 2 : pagibigResult.employeeShare;
  const pagibigEmployer = isSemi ? pagibigResult.employerShare / 2 : pagibigResult.employerShare;

  // Taxable Income = Gross Pay - Mandatory Govt Contributions
  const mandatoryDeductions = sssDeduction + philhealthDeduction + pagibigDeduction;
  const taxableIncome = Math.max(0, grossPay - mandatoryDeductions);
  const taxDeduction = calculateWithholdingTax(taxableIncome, isSemi);

  // Total Deductions
  const totalDeductions = mandatoryDeductions + taxDeduction + Number(cashAdvance) + Number(loanDeduction) + Number(otherDeductions);

  // Net Take-Home Pay
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    employeeId: employee.id,
    employeeNo: employee.employeeNo,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    designationId: employee.designationId,
    siteId: employee.currentSiteId,
    salaryType: employee.salaryType,
    basicRate,
    daysWorked,
    otHours,
    basicPay: Math.round(basicPay * 100) / 100,
    otPay: Math.round(otPay * 100) / 100,
    holidayPay: Math.round(holidayPay * 100) / 100,
    restDayPay: Math.round(restDayPay * 100) / 100,
    nightDiffPay: Math.round(nightDiffPay * 100) / 100,
    siteAllowance: Number(siteAllowance),
    hazardAllowance: Number(hazardAllowance),
    otherBonuses: Number(otherBonuses),
    totalAllowances: Math.round(totalAllowances * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    sssDeduction: Math.round(sssDeduction * 100) / 100,
    sssEmployer: Math.round(sssEmployer * 100) / 100,
    philhealthDeduction: Math.round(philhealthDeduction * 100) / 100,
    philhealthEmployer: Math.round(philhealthEmployer * 100) / 100,
    pagibigDeduction: Math.round(pagibigDeduction * 100) / 100,
    pagibigEmployer: Math.round(pagibigEmployer * 100) / 100,
    taxDeduction: Math.round(taxDeduction * 100) / 100,
    cashAdvance: Number(cashAdvance),
    loanDeduction: Number(loanDeduction),
    otherDeductions: Number(otherDeductions),
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Currency Formatter (Philippine Peso ₱)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Number Formatter
 */
export function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-PH');
}
