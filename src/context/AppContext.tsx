import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  NavigationTab, 
  UserProfile, 
  BookmarkItem, 
  PurchaseRecord, 
  QuizSet, 
  QuizResultData, 
  StudyNote, 
  PremiumNote,
  AppNotification
} from '../types';
import { StorageService } from '../services/storageService';
import { safeStorage } from '../utils/safeHelpers';
import { MOCK_STUDY_NOTES, MOCK_PREMIUM_NOTES, MOCK_NOTIFICATIONS } from '../data/mockData';
import { isUserAdmin, OFFICIAL_ADMIN_EMAIL, MASTER_ADMIN_PIN, sanitizeUserProfile } from '../utils/sanitizer';
import { fetchOfficialChannelVideos } from '../services/youtubeService';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => void;
  bookmarks: BookmarkItem[];
  toggleBookmark: (type: 'question' | 'note' | 'current-affair', targetId: string, title: string, category: string) => boolean;
  isBookmarked: (type: 'question' | 'note' | 'current-affair', targetId: string) => boolean;
  purchases: PurchaseRecord[];
  hasPurchased: (noteId: string) => boolean;
  recordPurchase: (record: PurchaseRecord) => void;
  activeNote: StudyNote | null;
  openNoteReader: (note: StudyNote | string) => void;
  closeNoteReader: () => void;
  activePremiumNote: PremiumNote | null;
  openPremiumDetail: (note: PremiumNote | string) => void;
  closePremiumDetail: () => void;
  activeQuiz: QuizSet | null;
  startQuiz: (quiz: QuizSet) => void;
  exitQuiz: () => void;
  quizResult: QuizResultData | null;
  setQuizResult: (result: QuizResultData | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isAdminPinModalOpen: boolean;
  setIsAdminPinModalOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  isCurrentUserAdmin: boolean;
  openAdminWithSecurityCheck: () => void;
  verifyAdminPin: (pin: string) => boolean;
  logoutAdmin: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<AppNotification, 'id'>) => void;
  activeReaderPage: number;
  setActiveReaderPage: (page: number) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialUser?: UserProfile | null }> = ({ children, initialUser }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [user, setUserState] = useState<UserProfile>(() => {
    if (initialUser) return sanitizeUserProfile(initialUser);
    return StorageService.getUserProfile();
  });
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(StorageService.getBookmarks());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(StorageService.getPurchases());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([]);

  // Admin Security States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('btn_admin_session_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  const isCurrentUserAdmin = Boolean(user && isUserAdmin(user.email));

  // Sync initialUser if updated from parent
  useEffect(() => {
    if (initialUser) {
      setUserState(sanitizeUserProfile(initialUser));
    }
  }, [initialUser]);

  // Listen to profile updates across the app to update state immediately
  useEffect(() => {
    const handleProfileUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<UserProfile>;
      if (customEvt.detail) {
        setUserState(sanitizeUserProfile(customEvt.detail));
      } else {
        setUserState(StorageService.getUserProfile());
      }
    };
    window.addEventListener('btn:profile-updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('btn:profile-updated', handleProfileUpdated);
    };
  }, []);

  // Modals & Active Viewers
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [activePremiumNote, setActivePremiumNote] = useState<PremiumNote | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizSet | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeReaderPage, setActiveReaderPage] = useState(1);

  // Dynamic Notification Real-Time Sync (Official YouTube uploads + Practice Sets)
  useEffect(() => {
    fetchOfficialChannelVideos(false).then((res) => {
      if (res && res.videos && res.videos.length > 0) {
        setNotifications((currentNotifs) => {
          let updated = [...currentNotifs];
          let addedCount = 0;

          // Check the top recent videos from @bankingtayarinepal
          for (const vid of res.videos.slice(0, 3)) {
            const notifId = `yt-${vid.id}`;
            const exists = updated.some(n => n.id === notifId);
            if (!exists) {
              const newNotif: AppNotification = {
                id: notifId,
                title: `🎬 नयाँ भिडियो: ${vid.title.slice(0, 48)}...`,
                description: `युट्युब च्यानल @bankingtayarinepal मा आधिकारिक कक्षा भिडियो उपलब्ध छ।`,
                timestamp: vid.timeAgoNepali || (vid.isNew ? 'नयाँ (NEW)' : 'हालसालै'),
                read: false,
                type: 'youtube',
                targetTab: 'video-lectures',
                videoUrl: vid.link,
                badge: vid.isNew ? 'नयाँ' : undefined
              };
              updated.unshift(newNotif);
              addedCount++;
            }
          }

          if (addedCount > 0) {
            StorageService.saveNotifications(updated);
            return updated;
          }
          return currentNotifs;
        });
      }
    }).catch(() => {
      // Offline or network restricted - silent fallback
    });
  }, []);

  // Route Guard for /admin or #admin
  useEffect(() => {
    const enforceAdminRouteGuard = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash.startsWith('#admin/')) {
        const isAdmin = isUserAdmin(user?.email);
        if (!isAdmin) {
          // Immediately redirect to /dashboard and warn
          window.history.replaceState(null, '', '/dashboard');
          setActiveTab('home');
          addToast('Unauthorized Access: यो पृष्ठ हेर्न प्रशासक (Admin) अनुमति चाहिन्छ।', 'error');
        } else {
          // Authorized email: check PIN authentication
          if (isAdminAuthenticated) {
            setIsAdminModalOpen(true);
          } else {
            setIsAdminPinModalOpen(true);
          }
        }
      }
    };

    enforceAdminRouteGuard();
    window.addEventListener('popstate', enforceAdminRouteGuard);
    window.addEventListener('hashchange', enforceAdminRouteGuard);

    return () => {
      window.removeEventListener('popstate', enforceAdminRouteGuard);
      window.removeEventListener('hashchange', enforceAdminRouteGuard);
    };
  }, [user?.email, isAdminAuthenticated]);

  // Open Admin with Security & PIN Check
  const openAdminWithSecurityCheck = useCallback(() => {
    if (!isUserAdmin(user?.email)) {
      addToast(`Unauthorized Access: यो सुविधा केवल प्रशासक (${OFFICIAL_ADMIN_EMAIL}) का लागि मात्र हो।`, 'error');
      if (window.location.pathname.includes('/admin')) {
        window.history.replaceState(null, '', '/dashboard');
      }
      return;
    }

    if (isAdminAuthenticated) {
      setIsAdminModalOpen(true);
    } else {
      setIsAdminPinModalOpen(true);
    }
  }, [user?.email, isAdminAuthenticated]);

  // Verify Master PIN
  const verifyAdminPin = useCallback((enteredPin: string): boolean => {
    if (enteredPin === MASTER_ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      try {
        sessionStorage.setItem('btn_admin_session_auth', 'true');
      } catch {}
      setIsAdminPinModalOpen(false);
      setIsAdminModalOpen(true);
      addToast('प्रशासक प्रमाणीकरण सफल भयो! (Admin Access Granted)', 'success');
      return true;
    }
    return false;
  }, []);

  // Logout Admin
  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('btn_admin_session_auth');
    } catch {}
    setIsAdminModalOpen(false);
    setIsAdminPinModalOpen(false);
    if (window.location.pathname.includes('/admin')) {
      window.history.replaceState(null, '', '/dashboard');
    }
    addToast('प्रशासक सत्र सुरक्षित रूपमा बन्द भयो (Admin Logged Out)', 'info');
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    const saved = StorageService.getTheme();
    setThemeState(saved);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    StorageService.setTheme(next);
  };

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    StorageService.saveUserProfile(newUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('user_profile');
      safeStorage.removeItem('user_profile');
      localStorage.removeItem('btn_registration_completed_v1');
      safeStorage.removeItem('btn_registration_completed_v1');
      localStorage.removeItem('btn_student_profile_v2');
      safeStorage.removeItem('btn_student_profile_v2');
      safeStorage.removeItem('btn_user_profile_v1');
    } catch (e) {
      console.error('Logout error', e);
    }
    window.dispatchEvent(new CustomEvent('btn:logout'));
  };

  const refreshUser = () => {
    setUserState(StorageService.getUserProfile());
  };

  const toggleBookmark = (
    type: 'question' | 'note' | 'current-affair', 
    targetId: string, 
    title: string, 
    category: string
  ): boolean => {
    const added = StorageService.toggleBookmark({ type, targetId, title, category });
    setBookmarks(StorageService.getBookmarks());
    return added;
  };

  const isBookmarked = (type: 'question' | 'note' | 'current-affair', targetId: string) => {
    return bookmarks.some(b => b.type === type && b.targetId === targetId);
  };

  const hasPurchased = (noteId: string): boolean => {
    return purchases.some(p => p.noteId === noteId && p.status === 'Purchased');
  };

  const recordPurchase = (record: PurchaseRecord) => {
    StorageService.recordPurchase(record);
    setPurchases(StorageService.getPurchases());
    // Also award completion/purchase XP
    const updated = StorageService.addXp(100);
    setUser(updated);
  };

  const openNoteReader = (note: StudyNote | string) => {
    if (typeof note === 'string') {
      const allNotes = StorageService.getAllNotes();
      const found = allNotes.find(n => n.id === note || 
        (note === 'top-01' && n.id === 'note-banking-history') ||
        (note === 'top-02' && n.id === 'note-banking-functions') ||
        (note === 'top-03' && n.id === 'note-deposit-credit') ||
        (note === 'top-04' && n.id === 'note-trade-finance-lc-bg') ||
        (note === 'top-05' && n.id === 'note-aml-kyc') ||
        (note === 'note-accounting-basics' && (n.id === 'note-accounting-2-1' || n.id === 'note-accounting-basics')) ||
        (note === 'top-p1-b-01' && (n.id === 'note-accounting-2-1' || n.id === 'note-accounting-basics')));
      if (found) {
        setActiveNote(found);
        setActiveReaderPage(1);
      }
    } else {
      setActiveNote(note);
      setActiveReaderPage(1);
    }
  };

  const closeNoteReader = () => {
    setActiveNote(null);
  };

  const openPremiumDetail = (note: PremiumNote | string) => {
    if (typeof note === 'string') {
      const found = StorageService.getAllPremiumNotes().find(n => n.id === note);
      if (found) setActivePremiumNote(found);
    } else {
      setActivePremiumNote(note);
    }
  };

  const closePremiumDetail = () => {
    setActivePremiumNote(null);
  };

  const startQuiz = (quiz: QuizSet) => {
    setQuizResult(null);
    setActiveQuiz(quiz);
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      StorageService.saveNotifications(updated);
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      StorageService.saveNotifications(updated);
      return updated;
    });
    addToast('सबै सूचनाहरू पढेको चिन्ह लगाइयो।', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
    addToast('सबै सूचनाहरू हटाइयो।', 'info');
  };

  const addNotification = (newNotif: Omit<AppNotification, 'id'>) => {
    const item: AppNotification = {
      ...newNotif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setNotifications(prev => {
      const updated = [item, ...prev];
      StorageService.saveNotifications(updated);
      return updated;
    });
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        user,
        setUser,
        logout,
        refreshUser,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        purchases,
        hasPurchased,
        recordPurchase,
        activeNote,
        openNoteReader,
        closeNoteReader,
        activePremiumNote,
        openPremiumDetail,
        closePremiumDetail,
        activeQuiz,
        startQuiz,
        exitQuiz,
        quizResult,
        setQuizResult,
        isSearchOpen,
        setIsSearchOpen,
        isAiModalOpen,
        setIsAiModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen,
        isAdminPinModalOpen,
        setIsAdminPinModalOpen,
        isAdminAuthenticated,
        isCurrentUserAdmin,
        openAdminWithSecurityCheck,
        verifyAdminPin,
        logoutAdmin,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
        addNotification,
        activeReaderPage,
        setActiveReaderPage,
        addToast
      }}
    >
      {/* Global Toast Alert Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 border ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : toast.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-[#0B2046] text-white border-blue-900'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
