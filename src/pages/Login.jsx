import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  FileCheck,
  Banknote,
  Eye,
  EyeOff,
  Sparkles,
  Key
} from 'lucide-react';
import Logo from '../assets/Logo';
import { useAuth, DEMO_HR_USER } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function Login() {
  const { login, demoAccount } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('hr@ctrlconstruction.ph');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      addToast(`Welcome back, ${demoAccount.fullName}! Signed in as HR Admin.`, 'success');
      navigate('/');
    }, 400);
  };

  const handleInstantDemoLogin = () => {
    setIsLoading(true);
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setTimeout(() => {
      login(demoAccount.email, demoAccount.password);
      addToast(`Demo login successful! Logged in as ${demoAccount.fullName} (HR Admin).`, 'success');
      navigate('/');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Left Column: Visual Showcase & Brand Highlights (Hidden on small mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 border-r border-slate-800/80 overflow-hidden">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e63917_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

        {/* Ambient Gradient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="relative z-10">
          <Logo variant="full" size="lg" light={true} />
        </div>

        {/* Core Value Proposition */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold tracking-wide uppercase">
            <HardHat className="w-3.5 h-3.5 text-brand-400" />
            <span>Commercial Construction HRIS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
            Precision workforce, site deployments, and payroll for modern builders.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Engineered specifically for construction general contractors managing craft trades, DOLE/TESDA safety cards, historical project assignments, and statutory labor costing.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>22 Sample Workers</span>
              </div>
              <p className="text-[11px] text-slate-400">Master 201 records, photos & trades</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span>4 Active Sites</span>
              </div>
              <p className="text-[11px] text-slate-400">BGC Tower, MRT-7, Horizon Cebu</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Compliance Radar</span>
              </div>
              <p className="text-[11px] text-slate-400">DOLE safety & license expiry alerts</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Banknote className="w-4 h-4" />
                <span>Automated Payroll</span>
              </div>
              <p className="text-[11px] text-slate-400">SSS, PhilHealth, HDMF & Payslips</p>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between pt-6 border-t border-slate-800/80">
          <span>CTRL Construction Corp. Enterprise HR v2.6</span>
          <span>A product by <strong className="text-slate-300 font-bold">VCS Technologies</strong></span>
        </div>
      </div>

      {/* Right Column: Interactive Login Form & Demo Account */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 relative">
        {/* Mobile Header Logo */}
        <div className="lg:hidden mb-8">
          <Logo variant="full" size="lg" light={true} />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Card Title */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
              Sign In to HR Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your corporate credentials to access construction workforce records.
            </p>
          </div>

          {/* 1-Click Demo Account Quick Access Banner */}
          <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-brand-950/70 via-slate-900 to-slate-900 border border-brand-500/30 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>HR Admin Demo Account</span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  <strong>{demoAccount.email}</strong>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Password: <span className="text-slate-200">{demoAccount.password}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInstantDemoLogin}
                className="px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-900/40 transition-all hover:scale-105 flex-shrink-0 flex items-center gap-1"
              >
                <span>Instant Demo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@ctrlconstruction.ph"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(demoAccount.email);
                    setPassword(demoAccount.password);
                    addToast('Demo credentials autofilled', 'info');
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold"
                >
                  Autofill Demo Password
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-900 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all font-mono placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-brand-500 focus:ring-brand-500/20"
                />
                <span>Remember this device</span>
              </label>

              <span className="text-slate-500">Encrypted 256-bit Session</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-lg shadow-brand-900/40 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as HR Admin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Authorized access only for CTRL Construction Corp. HR & Field Operations.</span>
          </div>

          <div className="lg:hidden text-center text-[11px] text-slate-500 pt-4">
            A product by <strong className="text-slate-300">VCS Technologies</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
