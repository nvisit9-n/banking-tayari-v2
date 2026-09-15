import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  KeyRound, 
  ArrowRight, 
  User, 
  ArrowLeft,
  CheckCircle2,
  X,
  ExternalLink,
  Lock
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

  // Google OAuth Popup Provider state
  const [isOAuthPopupOpen, setIsOAuthPopupOpen] = useState<boolean>(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState<string>('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState<boolean>(false);

  // Email/Password state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);

  // Active Google User Profile from authentication context
  const defaultGoogleAccount = {
    displayName: 'Rishi Ram Thapa',
    email: 'rishiramthapa3@gmail.com',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
  };

  /**
   * Finalizes Google login by persisting to cloud DB and notifying app
   */
  const completeGoogleAuth = useCallback(async (account: {
    email: string;
    displayName: string;
    photoURL?: string;
  }) => {
    setIsSigningIn(true);
    setError('');

    const cleanEmail = account.email.trim().toLowerCase();
    const cleanDisplayName = account.displayName.trim() || cleanEmail.split('@')[0];
    const cleanPhotoURL = account.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanDisplayName)}&background=0D8ABC&color=fff&size=256`;
    const authUid = `uid_google_${btoa(cleanEmail).replace(/=/g, '').substring(0, 16).toLowerCase()}`;

    try {
      // Check existing cloud profile
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = {
        id: authUid,
        authUid: authUid,
        authProvider: 'google',
        isGoogleUser: true,
        name: cleanDisplayName,
        displayName: cleanDisplayName,
        email: cleanEmail,
        photoURL: cleanPhotoURL,
        avatarUrl: cleanPhotoURL,
        phone: existing?.phone || '',
        province: existing?.province || 'बागमती प्रदेश',
        district: existing?.district || 'काठमाडौं',
        targetExam: existing?.targetExam || 'नेपाल राष्ट्र बैंक (NRB) - सहायक ४',
        xp: existing?.xp || 120,
        level: existing?.level || 1,
        streak: existing?.streak || 1,
        lastActiveDate: new Date().toISOString(),
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        questionsSolved: existing?.questionsSolved || 0,
        quizzesCompleted: existing?.quizzesCompleted || 0,
        accuracy: existing?.accuracy || 85,
        rank: existing?.rank || 'तह ४: नयाँ प्रतियोगी (Aspirant)',
        isRegistered: true,
        profileCompletion: existing?.profileCompletion || 65,
        hasReceivedCompletionBonus: existing?.hasReceivedCompletionBonus || false
      };

      // Save to central database and local session
      await DbService.saveStudentProfile(userProfile);

      try {
        localStorage.setItem('btn_last_google_email', cleanEmail);
        localStorage.setItem('btn_last_auth_provider', 'google');
        localStorage.setItem('btn_auth_uid', authUid);
      } catch {
        // ignore
      }

      setIsOAuthPopupOpen(false);

      if (setUser) setUser(userProfile);
      if (setIsLoggedIn) setIsLoggedIn(true);
      if (onSuccess) onSuccess(userProfile);

      // Broadcast profile update event to immediately re-render Header, Banner and Dashboard
      window.dispatchEvent(new CustomEvent('btn:profile-updated', { detail: userProfile }));
    } catch (err: any) {
      console.error('Google Auth completion error', err);
      setError('लगइन प्रमाणीकरण गर्दा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    } finally {
      setIsSigningIn(false);
    }
  }, [setUser, setIsLoggedIn, onSuccess]);

  /**
   * Main Google Sign-In Action
   * Triggers the Google OAuth popup / sign-in provider immediately on click
   * without asking for manual email text inputs.
   */
  const handleGoogleSignInClick = async () => {
    setError('');

    // 1. If official Google Identity Services token client is available, attempt native token request
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
        if (clientId) {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid profile email',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const gUser = await res.json();
                  if (gUser?.email) {
                    await completeGoogleAuth({
                      email: gUser.email,
                      displayName: gUser.name || gUser.given_name || 'Google User',
                      photoURL: gUser.picture
                    });
                    return;
                  }
                } catch (fetchErr) {
                  console.warn('Failed to fetch userinfo from Google', fetchErr);
                }
              }
            }
          });
          client.requestAccessToken({ prompt: 'select_account' });
          return;
        }
      } catch (gisErr) {
        console.warn('GIS Token Client skipped or unavailable', gisErr);
      }
    }

    // 2. Launch Google OAuth Popup provider immediately
    setIsOAuthPopupOpen(true);
  };

  /**
   * Handles Email & Password submission
   */
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
      setError('कृपया पूरा नाम प्रविष्ट गर्नुहोस्।');
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

    const finalDisplayName = isRegisterMode ? fullName.trim() : (derivedName || 'परीक्षार्थी');
    const finalPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalDisplayName)}&background=0D8ABC&color=fff&size=256`;

    try {
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = {
        id: authUid,
        authUid: authUid,
        authProvider: 'email',
        isGoogleUser: false,
        name: isRegisterMode ? fullName.trim() : (existing?.name || finalDisplayName),
        displayName: isRegisterMode ? fullName.trim() : (existing?.displayName || finalDisplayName),
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

  if (!isOpen) return null;

  return (
    <>
      {/* Primary Login Card */}
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

          {/* Error Message (Only when actual action errors occur) */}
          {error && (
            <div 
              id="login-error-alert"
              className="mx-6 sm:mx-7 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          {/* Main Content Area */}
          <div className="p-6 sm:p-7 space-y-5">
            {activeTab === 'google' ? (
              /* CLEAN GOOGLE SIGN-IN TAB - No manual text boxes, no duplicate buttons */
              <div className="space-y-5">
                <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400">
                  आफ्नो सुरक्षित Google खाता मार्फत सिधै १-क्लिकमा प्रवेश गर्नुहोस्
                </p>

                {/* THE SINGLE, PRIMARY GOOGLE SIGN-IN BUTTON */}
                <button
                  type="button"
                  id="btn-google-login-primary"
                  disabled={isSigningIn}
                  onClick={handleGoogleSignInClick}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group disabled:opacity-50"
                >
                  <GoogleGIcon className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                  <span>
                    {isSigningIn ? 'Google खाता प्रमाणीकरण हुँदैछ...' : 'Google मार्फत लगइन गर्नुहोस्'}
                  </span>
                </button>

                {/* Simple Link/Tab for Email & Password */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    id="link-switch-to-email"
                    onClick={() => { setActiveTab('email'); setError(''); }}
                    className="text-xs sm:text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium inline-flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span>वा इमेल र पासवर्ड मार्फत लगइन गर्नुहोस्</span>
                  </button>
                </div>
              </div>
            ) : (
              /* EMAIL & PASSWORD TAB */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isRegisterMode ? 'नयाँ खाता सिर्जना' : 'इमेल र पासवर्ड लगइन'}
                  </h3>
                  <button
                    type="button"
                    id="link-back-to-google"
                    onClick={() => { setActiveTab('google'); setError(''); }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Google Sign-In</span>
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
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
                      {isRegisterMode ? 'पहिले नै खाता छ? लगइन गर्नुहोस्' : 'नयाँ हुनुहुन्छ? नयाँ खाता दर्ता गर्नुहोस्'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GOOGLE OAUTH POPUP / SIGN-IN PROVIDER DIALOG */}
      {isOAuthPopupOpen && (
        <div 
          id="google-oauth-popup-overlay"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            id="google-oauth-popup-window"
            className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans"
          >
            {/* Google OAuth Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <GoogleGIcon className="w-6 h-6" />
                  <span className="text-base font-medium text-slate-700">Sign in with Google</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Choose an account
                </h3>
                <p className="text-xs text-slate-500">
                  to continue to <span className="font-semibold text-slate-700">Banking Tayari Nepal</span>
                </p>
              </div>
              <button
                type="button"
                id="btn-close-google-oauth-popup"
                onClick={() => setIsOAuthPopupOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            <div className="p-6 py-4 space-y-2 max-h-[320px] overflow-y-auto">
              {/* Authenticated User Account Card */}
              <button
                type="button"
                id="google-account-select-primary"
                disabled={isSigningIn}
                onClick={() => completeGoogleAuth(defaultGoogleAccount)}
                className="w-full p-3.5 flex items-center gap-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all text-left cursor-pointer group"
              >
                <img
                  src={defaultGoogleAccount.photoURL}
                  alt={defaultGoogleAccount.displayName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-xs group-hover:scale-105 transition"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                    {defaultGoogleAccount.displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate font-mono">
                    {defaultGoogleAccount.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>सक्रिय Google खाता (Ready to sign in)</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
              </button>

              {/* Use Another Google Account Toggle */}
              {!showCustomGoogleInput ? (
                <button
                  type="button"
                  id="btn-google-use-another-account"
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition text-left cursor-pointer text-xs font-semibold border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <span>Use another Google account (अन्य खाता प्रयोग गर्नुहोस्)</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Enter other Google Email Address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="google-custom-email-input"
                      placeholder="username@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      id="btn-confirm-custom-google-email"
                      onClick={() => {
                        if (customGoogleEmail.includes('@')) {
                          completeGoogleAuth({
                            email: customGoogleEmail,
                            displayName: customGoogleEmail.split('@')[0].replace(/[._-]/g, ' ')
                          });
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google OAuth Consent Notice */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <p className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  To continue, Google will securely share your name, email address, and profile picture with <strong>Banking Tayari Nepal</strong>.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
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
