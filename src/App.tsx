/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { LoginModal } from './components/auth/LoginModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UserProfile } from './types';
import { safeStorage } from './utils/safeHelpers';
import { sanitizeUserProfile } from './utils/sanitizer';

/**
 * Validates and retrieves the persistent user profile from localStorage ('user_profile').
 * Returns null if no valid, registered user profile is found.
 */
function getValidStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('user_profile') || safeStorage.getItem('user_profile');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      (
        (parsed.email && typeof parsed.email === 'string' && parsed.email.includes('@')) ||
        (parsed.phone && typeof parsed.phone === 'string' && parsed.phone.trim().length >= 7)
      )
    ) {
      return sanitizeUserProfile(parsed);
    }
    return null;
  } catch (err) {
    console.error('Error parsing user_profile from localStorage:', err);
    return null;
  }
}

export default function App() {
  // Authentication State strictly checked against localStorage.getItem('user_profile')
  const [user, setUser] = useState<UserProfile | null>(() => getValidStoredProfile());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(getValidStoredProfile()));

  // Logout / Edit Profile Reset handler
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('user_profile');
      safeStorage.removeItem('user_profile');
      localStorage.removeItem('btn_registration_completed_v1');
      safeStorage.removeItem('btn_registration_completed_v1');
      localStorage.removeItem('btn_student_profile_v2');
      safeStorage.removeItem('btn_student_profile_v2');
      safeStorage.removeItem('btn_user_profile_v1');
    } catch (e) {
      console.error('Error clearing user profile on logout:', e);
    }
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  // Form submission / unlock portal callback
  const handleLoginSuccess = useCallback((formData: UserProfile) => {
    setUser(formData);
    setIsLoggedIn(true);
  }, []);

  // Listen for storage events and cross-tab/subcomponent auth triggers
  useEffect(() => {
    const syncAuth = () => {
      const validProfile = getValidStoredProfile();
      setUser(validProfile);
      setIsLoggedIn(Boolean(validProfile));
    };

    const handleProfileUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile>;
      if (customEvt.detail) {
        setUser(customEvt.detail);
        setIsLoggedIn(true);
      } else {
        syncAuth();
      }
    };

    window.addEventListener('storage', syncAuth);
    window.addEventListener('btn:logout', handleLogout);
    window.addEventListener('btn:profile-updated', handleProfileUpdated);

    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('btn:logout', handleLogout);
      window.removeEventListener('btn:profile-updated', handleProfileUpdated);
    };
  }, [handleLogout]);

  // =========================================================================
  // 1. INSTANT & FRICTIONLESS AUTHENTICATION FLOW
  // Google Sign-In is primary. No blocking onboarding form.
  // Upon login, redirect immediately to Dashboard.
  // =========================================================================
  if (!isLoggedIn || !user) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
          <LoginModal
            isOpen={true}
            setUser={setUser}
            setIsLoggedIn={setIsLoggedIn}
            onSuccess={handleLoginSuccess}
          />
        </div>
      </ErrorBoundary>
    );
  }

  // =========================================================================
  // 2. UNLOCKED PORTAL ACCESS
  // Render Main Dashboard interface and full portal only after authenticated login.
  // =========================================================================
  return (
    <ErrorBoundary>
      <AppProvider initialUser={user}>
        <Dashboard user={user} onLogout={handleLogout} />
      </AppProvider>
    </ErrorBoundary>
  );
}
