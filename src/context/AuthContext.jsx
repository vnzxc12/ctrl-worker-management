import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEMO_HR_USER = {
  id: 'usr-hr-01',
  email: 'hr@ctrlconstruction.ph',
  password: 'Password123!',
  fullName: 'Maria Santos',
  role: 'HR Admin',
  title: 'Senior HR Operations Officer',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  permissions: ['*']
};

export const DEMO_USERS = [DEMO_HR_USER];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ctrl_auth_user');
    return saved ? JSON.parse(saved) : DEMO_HR_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authStatus = localStorage.getItem('ctrl_is_authenticated');
    return authStatus === 'true';
  });

  useEffect(() => {
    localStorage.setItem('ctrl_auth_user', JSON.stringify(currentUser));
    localStorage.setItem('ctrl_is_authenticated', isAuthenticated ? 'true' : 'false');
  }, [currentUser, isAuthenticated]);

  const login = (email, password) => {
    // Validate demo credentials or accept standard demo input
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (normalizedEmail === DEMO_HR_USER.email.toLowerCase() || normalizedEmail === 'admin@ctrlconstruction.ph' || normalizedEmail === 'hr.admin@ctrlconstruction.ph' || normalizedEmail.includes('hr')) {
      setCurrentUser(DEMO_HR_USER);
      setIsAuthenticated(true);
      return { success: true };
    }

    // Default to HR User for demo convenience
    setCurrentUser(DEMO_HR_USER);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('ctrl_is_authenticated', 'false');
  };

  const hasPermission = () => {
    return true; // Single HR demo account has full administrative and operational access
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      login,
      logout,
      hasPermission,
      demoAccount: DEMO_HR_USER
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
