import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  KeyRound, 
  ArrowRight, 
  User 
} from 'lucide-react';
import { UserProfile } from '../../types';
import { DbService } from '../../services/dbService';
import { BrandLogo } from '../common/BrandLogo';

export interface LoginModalProps {
  isOpen?: boolean;
  onSuccess?: (user: UserProfile) => void;
  setUser?: (user: UserProfile) => void;
  setIsLoggedIn?: (loggedIn: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onSuccess,
  setUser,
  setIsLoggedIn
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'email'>('google');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Dynamic Google login input state (initialized from previous session if available)
  const [googleEmailInput, setGoogleEmailInput] = useState<string>(() => {
    try {
      return localStorage.getItem('btn_last_google_email') || '';
    } catch {
      return '';
    }
  });
  const [googleNameInput, setGoogleNameInput] = useState<string>('');

  // Email/Password state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Optional Google Identity Services (GIS) button initialization
  useEffect(() => {
    if (activeTab === 'google' && typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                if (payload.email) {
                  handleGoogleLogin(payload.email, payload.name, payload.picture);
                }
              } catch (parseErr) {
                console.warn('Could not parse Google credential JWT', parseErr);
              }
            }
          },
          auto_select: false
        });

        const container = document.getElementById('gsi-official-button-container');
        if (container) {
          (window as any).google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
            shape: 'pill'
          });
        }
      } catch {
        // GIS is optional
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Dynamic Google Authentication Handler
  const handleGoogleLogin = async (overrideEmail?: string, overrideName?: string, overridePhoto?: string) => {
    setIsSigningIn(true);
    setError('');

    const rawEmail = (overrideEmail || googleEmailInput).trim().toLowerCase();
    
    // Validate email
    if (!rawEmail || !rawEmail.includes('@')) {
      setError('कृपया आफ्नो मान्य Google इमेल ठेगाना प्रविष्ट गर्नुहोस्।');
      setIsSigningIn(false);
      return;
    }

    // Derive display name from email prefix or custom name
    const emailPrefix = rawEmail.split('@')[0];
    const formattedPrefix = emailPrefix
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const finalDisplayName = overrideName?.trim() || googleNameInput.trim() || formattedPrefix || 'Google User';
    const finalEmail = rawEmail;
    const finalPhoto = overridePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=0D8ABC&color=fff&size=256`;
    const authUid = `uid_google_${btoa(finalEmail).replace(/=/g, '').substring(0, 16).toLowerCase()}`;

    try {
      // Check if user already exists in Central Database
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = {
        id: authUid,
        authUid: authUid,
        authProvider: 'google',
        isGoogleUser: true,
        name: existing?.name && existing.name !== 'विद्यार्थी' ? existing.name : finalDisplayName,
        displayName: existing?.displayName || finalDisplayName,
        email: finalEmail,
        photoURL: existing?.photoURL || existing?.avatarUrl || finalPhoto,
        avatarUrl: existing?.avatarUrl || existing?.photoURL || finalPhoto,
        phone: existing?.phone || '',
        province: existing?.province || 'बागमती प्रदेश',
        district: existing?.district || 'काठमाडौं',
        targetExam: existing?.targetExam || 'नेपाल राष्ट्र बैंक (NRB) - सहायक ४',
        xp: existing?.xp || 100,
        level: existing?.level || 1,
        streak: existing?.streak || 1,
        lastActiveDate: new Date().toISOString(),
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        questionsSolved: existing?.questionsSolved || 0,
        quizzesCompleted: existing?.quizzesCompleted || 0,
        accuracy: existing?.accuracy || 85,
        rank: existing?.rank || 'तह ४: नयाँ प्रतियोगी (Aspirant)',
        isRegistered: true,
        profileCompletion: existing?.profileCompletion || 60,
        hasReceivedCompletionBonus: existing?.hasReceivedCompletionBonus || false
      };

      // Store in localStorage for fast 1-click returning session
      try {
        localStorage.setItem('btn_last_google_email', finalEmail);
        localStorage.setItem('btn_last_auth_provider', 'google');
        localStorage.setItem('btn_auth_uid', authUid);
      } catch {
        // ignore
      }

      // Persist directly to central database and storage
      await DbService.saveStudentProfile(userProfile);

      if (setUser) setUser(userProfile);
      if (setIsLoggedIn) setIsLoggedIn(true);
      if (onSuccess) onSuccess(userProfile);

      // Dispatch event to sync state immediately across all components
      window.dispatchEvent(new CustomEvent('btn:profile-updated', { detail: userProfile }));
    } catch (err: any) {
      console.error('Google login error', err);
      setError('लगइन गर्दा प्राविधिक समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Email / Password Authentication Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्दछ।');
      return;
    }

    if (isRegisterMode && (!fullName.trim() || fullName.trim().length < 2)) {
      setError('कृपया आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    setIsSigningIn(true);
    const authUid = `uid_email_${btoa(cleanEmail).replace(/=/g, '').substring(0, 16).toLowerCase()}`;
    const emailPrefix = cleanEmail.split('@')[0];
    const derivedName = emailPrefix
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const finalDisplayName = isRegisterMode ? fullName.trim() : (derivedName || 'विद्यार्थी');
    const finalPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=0D8ABC&color=fff&size=256`;

    try {
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = {
        id: authUid,
        authUid: authUid,
        authProvider: 'email',
        isGoogleUser: false,
        name: existing?.name && existing.name !== 'विद्यार्थी' ? existing.name : finalDisplayName,
        displayName: existing?.displayName || finalDisplayName,
        email: cleanEmail,
        photoURL: existing?.photoURL || existing?.avatarUrl || finalPhoto,
        avatarUrl: existing?.avatarUrl || existing?.photoURL || finalPhoto,
        phone: existing?.phone || '',
        province: existing?.province || 'बागमती प्रदेश',
        district: existing?.district || 'काठमाडौं',
        targetExam: existing?.targetExam || 'नेपाल राष्ट्र बैंक (NRB) - सहायक ४',
        xp: existing?.xp || 100,
        level: existing?.level || 1,
        streak: existing?.streak || 1,
        lastActiveDate: new Date().toISOString(),
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        questionsSolved: existing?.questionsSolved || 0,
        quizzesCompleted: existing?.quizzesCompleted || 0,
        accuracy: existing?.accuracy || 85,
        rank: existing?.rank || 'तह ४: नयाँ प्रतियोगी (Aspirant)',
        isRegistered: true,
        profileCompletion: existing?.profileCompletion || 40,
        hasReceivedCompletionBonus: existing?.hasReceivedCompletionBonus || false
      };

      try {
        localStorage.setItem('btn_last_auth_provider', 'email');
        localStorage.setItem('btn_auth_uid', authUid);
      } catch {
        // ignore
      }

      await DbService.saveStudentProfile(userProfile);

      if (setUser) setUser(userProfile);
      if (setIsLoggedIn) setIsLoggedIn(true);
      if (onSuccess) onSuccess(userProfile);

      window.dispatchEvent(new CustomEvent('btn:profile-updated', { detail: userProfile }));
    } catch (err: any) {
      console.error('Email login error', err);
      setError('लगइन गर्दा समस्या आयो।');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div 
      id="login-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div 
        id="login-auth-modal-card"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Branding */}
        <div className="p-6 sm:p-7 text-center border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-blue-50/50 dark:from-blue-950/20 to-transparent">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="full" className="h-11 w-auto" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            बैंकिङ तयारी नेपालमा स्वागत छ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            नेपाल राष्ट्र बैंक, बाणिज्य बैंक तथा संगठित संस्था परीक्षा तयारी
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-7 pt-4">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              type="button"
              id="tab-google-login"
              onClick={() => { setActiveTab('google'); setError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GoogleGIcon className="w-4 h-4" />
              <span>Google Sign-In</span>
            </button>

            <button
              type="button"
              id="tab-email-login"
              onClick={() => { setActiveTab('email'); setError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>इमेल र पासवर्ड</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div 
            id="login-error-alert"
            className="mx-6 sm:mx-7 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold"
          >
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 sm:p-7 pt-4 pb-7">
          {activeTab === 'google' ? (
            <div className="space-y-4">
              
              {/* Optional GIS Button container if Google script is active */}
              <div id="gsi-official-button-container" className="flex justify-center empty:hidden"></div>

              {/* Dynamic Google Email Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  तपाईंको Google इमेल ठेगाना (Google Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    id="google-email-input"
                    placeholder="उदा: yourname@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGoogleLogin();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Optional Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  पूरा नाम (वैकल्पिक — खाली छोडेमा इमेलबाट स्वतः लिइनेछ)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    id="google-name-input"
                    placeholder="उदा: Rishi Ram Thapa"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGoogleLogin();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Main Google Sign-In Action Button */}
              <button
                type="button"
                id="btn-google-login-primary"
                disabled={isSigningIn}
                onClick={() => handleGoogleLogin()}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer group mt-2 disabled:opacity-50"
              >
                <GoogleGIcon className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                <span>
                  {isSigningIn ? 'प्रमाणीकरण हुँदैछ...' : 'Google मार्फत लगइन गर्नुहोस्'}
                </span>
              </button>

            </div>
          ) : (
            /* Email / Password Form */
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    पूरा नाम (Full Name) *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      id="email-register-fullname-input"
                      placeholder="उदा: ऋषि राम थापा"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  इमेल ठेगाना (Email Address) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    id="email-login-email-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  पासवर्ड (Password) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    id="email-login-password-input"
                    placeholder="कम्तिमा ६ अक्षर"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-email-submit"
                disabled={isSigningIn}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                <span>{isRegisterMode ? 'नयाँ खाता सिर्जना गर्नुहोस्' : 'लगइन गर्नुहोस्'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  id="btn-toggle-register-mode"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                >
                  {isRegisterMode ? 'पहिले नै खाता छ? लगइन गर्नुहोस्' : 'नयाँ हुनुहुन्छ? नयाँ खाता सिर्जना गर्नुहोस्'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

// Clean Google G Icon
function GoogleGIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
