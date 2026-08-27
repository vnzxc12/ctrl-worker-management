import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_SITES,
  INITIAL_DESIGNATIONS,
  INITIAL_DOCUMENT_CATEGORIES,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_LOGS,
  INITIAL_PAYROLL_PERIODS,
  INITIAL_GOVT_RULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPANY_PROFILE
} from '../data/initialData';
import { computeEmployeePayroll } from '../lib/calculations';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { currentUser } = useAuth();

  // Helper to load or initialize state
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`ctrl_hr_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error loading state for ${key}`, e);
      return fallback;
    }
  };

  // State definitions
  const [sites, setSites] = useState(() => loadState('sites', INITIAL_SITES));
  const [designations, setDesignations] = useState(() => loadState('designations', INITIAL_DESIGNATIONS));
  const [documentCategories, setDocumentCategories] = useState(() => loadState('document_categories', INITIAL_DOCUMENT_CATEGORIES));
  const [employees, setEmployees] = useState(() => loadState('employees', INITIAL_EMPLOYEES));
  const [attendanceLogs, setAttendanceLogs] = useState(() => loadState('attendance_logs', INITIAL_ATTENDANCE_LOGS));
  const [payrollPeriods, setPayrollPeriods] = useState(() => loadState('payroll_periods', INITIAL_PAYROLL_PERIODS));
  const [payrollRecords, setPayrollRecords] = useState(() => {
    const saved = loadState('payroll_records', null);
    if (saved) return saved;

    // Generate initial records for period 1 & 2
    const records = [];
    INITIAL_EMPLOYEES.forEach(emp => {
      records.push({
        ...computeEmployeePayroll(emp, 'Semi-Monthly', {}),
        periodId: 'pay-per-1',
        id: `rec-1-${emp.id}`
      });
      records.push({
        ...computeEmployeePayroll(emp, 'Semi-Monthly', {}),
        periodId: 'pay-per-2',
        id: `rec-2-${emp.id}`
      });
    });
    return records;
  });
  const [govtRules, setGovtRules] = useState(() => loadState('govt_rules', INITIAL_GOVT_RULES));
  const [auditLogs, setAuditLogs] = useState(() => loadState('audit_logs', INITIAL_AUDIT_LOGS));
  const [companyProfile, setCompanyProfile] = useState(() => loadState('company_profile', INITIAL_COMPANY_PROFILE));

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('ctrl_hr_sites', JSON.stringify(sites)); }, [sites]);
  useEffect(() => { localStorage.setItem('ctrl_hr_designations', JSON.stringify(designations)); }, [designations]);
  useEffect(() => { localStorage.setItem('ctrl_hr_document_categories', JSON.stringify(documentCategories)); }, [documentCategories]);
  useEffect(() => { localStorage.setItem('ctrl_hr_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('ctrl_hr_attendance_logs', JSON.stringify(attendanceLogs)); }, [attendanceLogs]);
  useEffect(() => { localStorage.setItem('ctrl_hr_payroll_periods', JSON.stringify(payrollPeriods)); }, [payrollPeriods]);
  useEffect(() => { localStorage.setItem('ctrl_hr_payroll_records', JSON.stringify(payrollRecords)); }, [payrollRecords]);
  useEffect(() => { localStorage.setItem('ctrl_hr_govt_rules', JSON.stringify(govtRules)); }, [govtRules]);
  useEffect(() => { localStorage.setItem('ctrl_hr_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('ctrl_hr_company_profile', JSON.stringify(companyProfile)); }, [companyProfile]);

  // Audit Logging Helper
  const logAudit = (action, entityType, entityId, details) => {
    const newLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userName: currentUser ? currentUser.fullName : 'System User',
      userRole: currentUser ? currentUser.role : 'Super Admin',
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // -------------------------------------------------------------
  // EMPLOYEE CRUD
  // -------------------------------------------------------------
  const addEmployee = (employeeData) => {
    const newId = `emp-${Date.now()}`;
    const newEmployee = {
      ...employeeData,
      id: newId,
      siteAssignments: employeeData.currentSiteId ? [
        {
          id: `sa-${Date.now()}`,
          siteId: employeeData.currentSiteId,
          assignedDate: employeeData.hireDate || new Date().toISOString().slice(0, 10),
          demobilizedDate: null,
          supervisor: employeeData.supervisor || 'Site Supervisor',
          crewName: employeeData.crewName || 'General Crew',
          status: 'Active',
          notes: 'Initial site assignment upon onboarding.'
        }
      ] : [],
      documents: employeeData.documents || []
    };

    setEmployees(prev => [newEmployee, ...prev]);
    logAudit('Created Employee', 'Employee', newEmployee.employeeNo, { name: `${newEmployee.firstName} ${newEmployee.lastName}`, designation: newEmployee.designationId });
    return newEmployee;
  };

  const updateEmployee = (id, updatedFields) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        const updated = { ...emp, ...updatedFields };
        logAudit('Updated Employee Profile', 'Employee', emp.employeeNo, { changedFields: Object.keys(updatedFields) });
        return updated;
      }
      return emp;
    }));
  };

  const changeEmployeeStatus = (id, newStatus, reason = '') => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        logAudit('Changed Employee Status', 'Employee', emp.employeeNo, { from: emp.status, to: newStatus, reason });
        return { ...emp, status: newStatus };
      }
      return emp;
    }));
  };

  // -------------------------------------------------------------
  // SITE ASSIGNMENT HISTORY (Maintains Historical Timeline)
  // -------------------------------------------------------------
  const reassignEmployeeSite = (employeeId, newSiteId, supervisor, crewName, notes) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const today = new Date().toISOString().slice(0, 10);
        const existingAssignments = (emp.siteAssignments || []).map(sa => {
          if (sa.status === 'Active') {
            return {
              ...sa,
              demobilizedDate: today,
              status: 'Completed',
              notes: sa.notes ? `${sa.notes} | Transferred to new project on ${today}` : `Demobilized on ${today}`
            };
          }
          return sa;
        });

        const newAssignment = {
          id: `sa-${Date.now()}`,
          siteId: newSiteId,
          assignedDate: today,
          demobilizedDate: null,
          supervisor: supervisor || emp.supervisor || 'Site Supervisor',
          crewName: crewName || emp.crewName || 'General Crew',
          status: 'Active',
          notes: notes || 'Site reassignment deployment.'
        };

        const siteObj = sites.find(s => s.id === newSiteId);
        logAudit('Reassigned Site', 'EmployeeSiteAssignment', emp.employeeNo, {
          fromSite: emp.currentSiteId,
          toSite: siteObj ? siteObj.name : newSiteId,
          supervisor
        });

        return {
          ...emp,
          currentSiteId: newSiteId,
          supervisor: supervisor || emp.supervisor,
          crewName: crewName || emp.crewName,
          siteAssignments: [newAssignment, ...existingAssignments]
        };
      }
      return emp;
    }));
  };

  // -------------------------------------------------------------
  // DOCUMENT MANAGEMENT
  // -------------------------------------------------------------
  const uploadEmployeeDocument = (employeeId, docData) => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc = {
      id: newDocId,
      ...docData,
      uploadedBy: currentUser ? currentUser.fullName : 'HR Admin',
      createdAt: new Date().toISOString()
    };

    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        logAudit('Uploaded Employee Document', 'EmployeeDocument', newDoc.name, { employee: `${emp.firstName} ${emp.lastName}`, file: newDoc.fileName, expiryDate: newDoc.expiryDate });
        return {
          ...emp,
          documents: [newDoc, ...(emp.documents || [])]
        };
      }
      return emp;
    }));
    return newDoc;
  };

  const deleteEmployeeDocument = (employeeId, docId) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const deletedDoc = (emp.documents || []).find(d => d.id === docId);
        logAudit('Deleted Employee Document', 'EmployeeDocument', docId, { documentName: deletedDoc ? deletedDoc.name : 'Unknown' });
        return {
          ...emp,
          documents: (emp.documents || []).filter(d => d.id !== docId)
        };
      }
      return emp;
    }));
  };

  const updateEmployeeDocument = (employeeId, docId, updatedFields) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          documents: (emp.documents || []).map(d => d.id === docId ? { ...d, ...updatedFields } : d)
        };
      }
      return emp;
    }));
    logAudit('Updated Document Metadata', 'EmployeeDocument', docId, { updatedFields });
  };

  // -------------------------------------------------------------
  // SITES MANAGEMENT
  // -------------------------------------------------------------
  const addSite = (siteData) => {
    const newSite = {
      id: `site-${Date.now()}`,
      ...siteData,
      createdAt: new Date().toISOString()
    };
    setSites(prev => [newSite, ...prev]);
    logAudit('Created Construction Site', 'Site', newSite.code, { name: newSite.name, client: newSite.client });
    return newSite;
  };

  const updateSite = (id, siteData) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, ...siteData } : s));
    logAudit('Updated Site Details', 'Site', id, { updatedFields: Object.keys(siteData) });
  };

  // -------------------------------------------------------------
  // DESIGNATIONS / POSITIONS
  // -------------------------------------------------------------
  const addDesignation = (desData) => {
    const newDes = {
      id: `des-${Date.now()}`,
      ...desData,
      createdAt: new Date().toISOString()
    };
    setDesignations(prev => [...prev, newDes]);
    logAudit('Created Designation', 'Designation', newDes.name, { category: newDes.category, defaultRate: newDes.defaultRate });
    return newDes;
  };

  const updateDesignation = (id, desData) => {
    setDesignations(prev => prev.map(d => d.id === id ? { ...d, ...desData } : d));
    logAudit('Updated Designation', 'Designation', id, { updatedFields: Object.keys(desData) });
  };

  // -------------------------------------------------------------
  // ATTENDANCE & TIME LOGS
  // -------------------------------------------------------------
  const addAttendanceLog = (logData) => {
    const newLog = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...logData
    };
    setAttendanceLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  const importBatchAttendance = (records) => {
    setAttendanceLogs(prev => {
      const existingKeys = new Set(prev.map(r => `${r.employeeId}_${r.logDate}`));
      const filtered = records.filter(r => !existingKeys.has(`${r.employeeId}_${r.logDate}`));
      logAudit('Imported Attendance via Excel', 'Attendance', `${records.length} records`, { newRecords: filtered.length, skippedDuplicates: records.length - filtered.length });
      return [...filtered, ...prev];
    });
  };

  // -------------------------------------------------------------
  // PAYROLL & PAYSLIPS ENGINE
  // -------------------------------------------------------------
  const createPayrollPeriod = (periodData) => {
    const newPeriodId = `pay-per-${Date.now()}`;
    const newPeriod = {
      id: newPeriodId,
      ...periodData,
      status: 'Draft',
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      recordsCount: 0,
      createdAt: new Date().toISOString()
    };

    // Calculate payroll records for all active employees
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const newRecords = activeEmployees.map(emp => {
      const comp = computeEmployeePayroll(emp, periodData.periodType, { govRules });
      return {
        ...comp,
        periodId: newPeriodId,
        id: `rec-${newPeriodId}-${emp.id}`
      };
    });

    const totalGross = newRecords.reduce((sum, r) => sum + r.grossPay, 0);
    const totalDeductions = newRecords.reduce((sum, r) => sum + r.totalDeductions, 0);
    const totalNet = newRecords.reduce((sum, r) => sum + r.netPay, 0);

    newPeriod.totalGross = Math.round(totalGross * 100) / 100;
    newPeriod.totalDeductions = Math.round(totalDeductions * 100) / 100;
    newPeriod.totalNet = Math.round(totalNet * 100) / 100;
    newPeriod.recordsCount = newRecords.length;

    setPayrollPeriods(prev => [newPeriod, ...prev]);
    setPayrollRecords(prev => [...newRecords, ...prev]);

    logAudit('Created Payroll Period', 'PayrollPeriod', newPeriod.periodName, { recordsGenerated: newRecords.length, totalGross });
    return newPeriod;
  };

  const updatePayrollRecord = (recordId, updatedFields) => {
    setPayrollRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const updated = { ...rec, ...updatedFields };
        return updated;
      }
      return rec;
    }));
  };

  const approvePayrollPeriod = (periodId) => {
    setPayrollPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        logAudit('Approved Payroll Period', 'PayrollPeriod', p.periodName, { approvedBy: currentUser.fullName, totalNet: p.totalNet });
        return {
          ...p,
          status: 'Approved',
          approvedBy: currentUser ? currentUser.fullName : 'Atty. Victor Serrano',
          approvedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  const markPayrollPaid = (periodId) => {
    setPayrollPeriods(prev => prev.map(p => {
      if (p.id === periodId) {
        logAudit('Disbursed Payroll (Marked Paid)', 'PayrollPeriod', p.periodName, { disbursedAt: new Date().toISOString() });
        return { ...p, status: 'Paid' };
      }
      return p;
    }));
  };

  const importBatchPayroll = (periodId, importedRecords) => {
    setPayrollRecords(prev => {
      const otherRecords = prev.filter(r => r.periodId !== periodId);
      const combined = [...importedRecords, ...otherRecords];

      // Update period totals
      const totalGross = importedRecords.reduce((sum, r) => sum + Number(r.grossPay || 0), 0);
      const totalDeductions = importedRecords.reduce((sum, r) => sum + Number(r.totalDeductions || 0), 0);
      const totalNet = importedRecords.reduce((sum, r) => sum + Number(r.netPay || 0), 0);

      setPayrollPeriods(perPrev => perPrev.map(p => {
        if (p.id === periodId) {
          return {
            ...p,
            totalGross: Math.round(totalGross * 100) / 100,
            totalDeductions: Math.round(totalDeductions * 100) / 100,
            totalNet: Math.round(totalNet * 100) / 100,
            recordsCount: importedRecords.length
          };
        }
        return p;
      }));

      logAudit('Imported Batch Payroll via Excel', 'PayrollPeriod', periodId, { recordsImported: importedRecords.length, totalGross });
      return combined;
    });
  };

  // -------------------------------------------------------------
  // SETTINGS & RESET
  // -------------------------------------------------------------
  const updateGovtRules = (newRules) => {
    setGovtRules(newRules);
    logAudit('Updated Statutory Contribution Rules', 'GovernmentRules', '2026 Table', { newRules });
  };

  const updateCompanyProfile = (profile) => {
    setCompanyProfile(profile);
    logAudit('Updated Company Profile & Settings', 'CompanyProfile', profile.companyName, { profile });
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setSites(INITIAL_SITES);
    setDesignations(INITIAL_DESIGNATIONS);
    setDocumentCategories(INITIAL_DOCUMENT_CATEGORIES);
    setEmployees(INITIAL_EMPLOYEES);
    setAttendanceLogs(INITIAL_ATTENDANCE_LOGS);
    setPayrollPeriods(INITIAL_PAYROLL_PERIODS);
    setGovtRules(INITIAL_GOVT_RULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCompanyProfile(INITIAL_COMPANY_PROFILE);
    window.location.reload();
  };

  return (
    <DataContext.Provider value={{
      sites,
      designations,
      documentCategories,
      employees,
      attendanceLogs,
      payrollPeriods,
      payrollRecords,
      govtRules,
      auditLogs,
      companyProfile,

      // Employee Functions
      addEmployee,
      updateEmployee,
      changeEmployeeStatus,
      reassignEmployeeSite,

      // Document Functions
      uploadEmployeeDocument,
      deleteEmployeeDocument,
      updateEmployeeDocument,

      // Site & Designation Functions
      addSite,
      updateSite,
      addDesignation,
      updateDesignation,

      // Attendance Functions
      addAttendanceLog,
      importBatchAttendance,

      // Payroll Functions
      createPayrollPeriod,
      updatePayrollRecord,
      approvePayrollPeriod,
      markPayrollPaid,
      importBatchPayroll,

      // Settings
      updateGovtRules,
      updateCompanyProfile,
      resetToDemoData,
      logAudit
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
