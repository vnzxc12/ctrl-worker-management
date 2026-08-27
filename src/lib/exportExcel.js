import * as XLSX from 'xlsx';

/**
 * Exports Master Employees roster to Excel (.xlsx)
 */
export function exportEmployeesToExcel(employees, designations = [], sites = []) {
  const desMap = Object.fromEntries(designations.map(d => [d.id, d.name]));
  const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

  const rows = employees.map(emp => ({
    'Employee ID': emp.employeeNo,
    'First Name': emp.firstName,
    'Middle Name': emp.middleName || '',
    'Last Name': emp.lastName,
    'Suffix': emp.suffix || '',
    'Designation': desMap[emp.designationId] || 'Unassigned',
    'Assigned Site': siteMap[emp.currentSiteId] || 'Unassigned',
    'Status': emp.status,
    'Employment Type': emp.employmentType,
    'Salary Type': emp.salaryType,
    'Basic Rate': emp.basicRate,
    'Contact Number': emp.contactNo || '',
    'Email': emp.email || '',
    'Date Hired': emp.hireDate,
    'SSS No': emp.sssNo || '',
    'PhilHealth No': emp.philhealthNo || '',
    'Pag-IBIG No': emp.pagibigNo || '',
    'TIN': emp.tinNo || '',
    'Emergency Contact': emp.emergencyContact || '',
    'Emergency Phone': emp.emergencyPhone || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CTRL_Employees');
  XLSX.writeFile(workbook, `CTRL_Employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports Payroll Register to Excel (.xlsx)
 */
export function exportPayrollToExcel(period, records, designations = [], sites = []) {
  const desMap = Object.fromEntries(designations.map(d => [d.id, d.name]));
  const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));

  const rows = records.map(rec => ({
    'Employee ID': rec.employeeNo,
    'Employee Name': rec.employeeName,
    'Designation': desMap[rec.designationId] || 'N/A',
    'Site / Project': siteMap[rec.siteId] || 'Unassigned',
    'Salary Type': rec.salaryType,
    'Basic Rate': rec.basicRate,
    'Days Worked': rec.daysWorked,
    'OT Hours': rec.otHours,
    'Basic Pay': rec.basicPay,
    'OT Pay': rec.otPay,
    'Holiday Pay': rec.holidayPay,
    'Allowances': rec.totalAllowances,
    'Gross Pay': rec.grossPay,
    'SSS (EE)': rec.sssDeduction,
    'SSS (ER)': rec.sssEmployer,
    'PhilHealth (EE)': rec.philhealthDeduction,
    'PhilHealth (ER)': rec.philhealthEmployer,
    'Pag-IBIG (EE)': rec.pagibigDeduction,
    'Pag-IBIG (ER)': rec.pagibigEmployer,
    'Withholding Tax': rec.taxDeduction,
    'Loans / Advances': (rec.cashAdvance || 0) + (rec.loanDeduction || 0),
    'Total Deductions': rec.totalDeductions,
    'Net Pay': rec.netPay
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll_Register');
  const safePeriodName = (period.periodName || 'Payroll').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `CTRL_Payroll_${safePeriodName}.xlsx`);
}

/**
 * Generates and downloads downloadable Attendance Excel Import Template
 */
export function downloadAttendanceTemplate(employees = []) {
  const sampleRows = employees.slice(0, 5).map((emp, i) => ({
    'Employee ID': emp.employeeNo,
    'Employee Name': `${emp.firstName} ${emp.lastName}`,
    'Date (YYYY-MM-DD)': '2026-08-27',
    'Time In (HH:MM)': '07:00',
    'Time Out (HH:MM)': '17:00',
    'Regular Hours': 8,
    'OT Hours': i % 2 === 0 ? 2 : 0,
    'Status': 'Present',
    'Notes': 'Formwork inspection'
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows.length > 0 ? sampleRows : [
    {
      'Employee ID': 'CTRL-2026-0001',
      'Employee Name': 'Juan Dela Cruz',
      'Date (YYYY-MM-DD)': '2026-08-27',
      'Time In (HH:MM)': '07:00',
      'Time Out (HH:MM)': '17:00',
      'Regular Hours': 8,
      'OT Hours': 2,
      'Status': 'Present',
      'Notes': 'Formworks'
    }
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance_Template');
  XLSX.writeFile(workbook, 'CTRL_Attendance_Import_Template.xlsx');
}

/**
 * Generates and downloads downloadable Payroll Excel Import Template
 */
export function downloadPayrollTemplate(employees = []) {
  const sampleRows = employees.slice(0, 5).map(emp => ({
    'Employee ID': emp.employeeNo,
    'Employee Name': `${emp.firstName} ${emp.lastName}`,
    'Days Worked': emp.salaryType === 'Monthly' ? 13 : 12,
    'OT Hours': 4,
    'Site Allowance': 500,
    'Hazard Allowance': 800,
    'Bonuses': 0,
    'Cash Advance': 0,
    'Loans Deduction': 0,
    'Other Deductions': 0,
    'Notes': 'Standard semi-monthly run'
  }));

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll_Import_Template');
  XLSX.writeFile(workbook, 'CTRL_Payroll_Import_Template.xlsx');
}

/**
 * Reads an Excel file and returns JSON data
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve({ jsonData, sheetNames: workbook.SheetNames });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
