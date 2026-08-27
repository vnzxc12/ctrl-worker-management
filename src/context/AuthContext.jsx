import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEMO_HR_USER = {
  id: 'usr-hr-01',
  email: 'rayford.duro@ctrlconstruction.ph',
  password: 'Password123!',
  fullName: 'Rayford Duro',
  role: 'HR Admin',
  title: 'HR Operations Lead',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  permissions: ['*']
};

export const DEMO_USERS = [DEMO_HR_USER];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ctrl_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate previous demo session name if needed
      if (parsed.fullName !== 'Rayford Duro') {
        return DEMO_HR_USER;
      }
      return parsed;
    }
    return DEMO_HR_USER;
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
    setCurrentUser(DEMO_HR_USER);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('ctrl_is_authenticated', 'false');
  };

  const hasPermission = () => {
    return true; // Single HR demo account has full administrative access
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
