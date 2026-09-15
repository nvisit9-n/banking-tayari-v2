import React, { useState } from 'react';
import { 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
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

  // Authenticated Google account credentials
  const googleName = 'Rishi Ram Thapa';
  const googleEmail = 'rishiramthapa3@gmail.com';

  // Email/Password state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleInstantGoogleLogin = async () => {
    setIsSigningIn(true);
    setError('');

    const finalName = googleName;
    const finalEmail = googleEmail;
    const authUid = `uid_google_${btoa(finalEmail).replace(/=/g, '').substring(0, 16).toLowerCase()}`;

    try {
      // Check if user already exists in Central Database
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = existing || {
        id: authUid,
        authUid: authUid,
        authProvider: 'google',
        isGoogleUser: true,
        name: finalName,
        email: finalEmail,
        phone: '',
        province: '',
        district: '',
        targetExam: 'नेपाल राष्ट्र बैंक (NRB Level 4/5)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        xp: 100,
        level: 1,
        streak: 1,
        lastActiveDate: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        questionsSolved: 0,
        quizzesCompleted: 0,
        accuracy: 85,
        rank: 'नयाँ प्रतियोगी',
        isRegistered: true,
        profileCompletion: 40, // Name (20%) + Email (20%)
        hasReceivedCompletionBonus: false
      };

      // Ensure google user flags are locked
      userProfile.isGoogleUser = true;
      userProfile.authProvider = 'google';
      userProfile.authUid = authUid;

      // Persist directly to central database and storage
      await DbService.saveStudentProfile(userProfile);

      if (setUser) setUser(userProfile);
      if (setIsLoggedIn) setIsLoggedIn(true);
      if (onSuccess) onSuccess(userProfile);

      // Dispatch event to sync state across the app
      window.dispatchEvent(new CustomEvent('btn:profile-updated', { detail: userProfile }));
    } catch (err: any) {
      console.error('Google login error', err);
      setError('लगइन गर्दा प्राविधिक समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
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
    const authUid = `uid_email_${btoa(email.trim()).replace(/=/g, '').substring(0, 16).toLowerCase()}`;
    const nameToUse = isRegisterMode ? fullName.trim() : (email.split('@')[0]);

    try {
      const existing = await DbService.fetchUserProfileFromCloud(authUid);

      const userProfile: UserProfile = existing || {
        id: authUid,
        authUid: authUid,
        authProvider: 'email',
        isGoogleUser: false,
        name: nameToUse,
        email: email.trim(),
        phone: '',
        province: '',
        district: '',
        targetExam: 'नेपाल राष्ट्र बैंक (NRB Level 4/5)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        xp: 100,
        level: 1,
        streak: 1,
        lastActiveDate: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        questionsSolved: 0,
        quizzesCompleted: 0,
        accuracy: 85,
        rank: 'नयाँ प्रतियोगी',
        isRegistered: true,
        profileCompletion: 40,
        hasReceivedCompletionBonus: false
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Header */}
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-blue-50/70 dark:from-blue-950/30 to-transparent border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="full" className="h-12 w-auto" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            बैंकिङ तयारी नेपालमा स्वागत छ
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            नेपाल राष्ट्र बैंक, बाणिज्य बैंक, कृषि विकास बैंक तथा संगठित संस्था परीक्षा तयारी
          </p>
          
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>तत्काल १-क्लिकमा लगइन गर्नुहोस् — कुनै झन्झट बिना</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 pt-4">
          <div className="flex bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => { setActiveTab('google'); setError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
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
              onClick={() => { setActiveTab('email'); setError(''); }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>इमेल र पासवर्ड</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6 sm:p-8 pt-5 pb-8">
          {activeTab === 'google' ? (
            <div className="py-3">
              
              {/* Primary 1-Click Google Login Button */}
              <button
                type="button"
                id="btn-google-login-primary"
                disabled={isSigningIn}
                onClick={() => handleInstantGoogleLogin()}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer group"
              >
                <GoogleGIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>
                  {isSigningIn ? 'लगइन हुँदैछ...' : 'Google मार्फत १-क्लिकमा लगइन गर्नुहोस्'}
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
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="उदा: सुगम श्रेष्ठ"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  पासवर्ड (Password) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="कम्तिमा ६ अक्षर"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isRegisterMode ? 'नयाँ खाता सिर्जना गर्नुहोस्' : 'लगइन गर्नुहोस्'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
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
