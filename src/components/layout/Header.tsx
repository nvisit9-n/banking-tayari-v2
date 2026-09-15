import React from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Sparkles, 
  Flame, 
  Zap, 
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isUserAdmin, OFFICIAL_ADMIN_EMAIL } from '../../utils/sanitizer';

// =========================================================================
// Official Banking Tayari Nepal Inline SVG Component
// Rendered directly inline to guarantee 0ms latency, no broken image assets,
// and exact Navy Blue (#0B2046) & Crimson Red (#C8102E) branding.
// =========================================================================
export const BankingTayariLogoSvg: React.FC<{ 
  className?: string; 
  showMotto?: boolean;
}> = ({ 
  className = 'h-10 md:h-12 w-auto object-contain',
  showMotto = true
}) => {
  return (
    <svg 
      viewBox={showMotto ? "0 0 980 320" : "0 0 980 240"} 
      fill="none" 
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Banking Tayari Nepal Logo"
    >
      {/* ===== 1. LEFT EMBLEM: Stylized 'B' with Book, Pen, and Red Flourish ===== */}
      <g id="emblem-group" transform="translate(10, 8)">
        {/* Main Navy Body of the letter 'B' */}
        <path 
          d="M 28 6 L 176 6 C 220 6, 256 30, 256 74 C 256 110, 226 134, 184 142 C 228 152, 258 184, 258 226 C 258 244, 250 260, 238 274 C 228 266, 214 260, 196 258 C 226 244, 238 226, 238 208 C 238 174, 210 152, 166 152 L 76 152 L 76 248 L 28 248 Z" 
          fill="#0B2046" 
        />

        {/* Upper bowl cutout of 'B' */}
        <path 
          d="M 76 40 L 168 40 C 190 40, 208 52, 208 72 C 208 92, 190 106, 168 106 L 76 106 Z" 
          fill="#FFFFFF" 
        />

        {/* Fanned Book Pages (Navy Blue, Bottom Left) */}
        <path d="M 12 306 C 45 286, 86 276, 128 274 C 128 264, 128 256, 128 248 C 76 252, 38 266, 12 306 Z" fill="#0B2046" />
        <path d="M 20 282 C 52 262, 90 252, 130 249 C 130 241, 130 234, 130 226 C 84 230, 48 244, 20 282 Z" fill="#0B2046" />
        <path d="M 32 258 C 62 238, 98 228, 132 224 C 132 216, 132 210, 132 202 C 90 206, 56 218, 32 258 Z" fill="#0B2046" />

        {/* Crimson Red Flourish Swooshes (Bottom Right) */}
        <path d="M 136 302 C 178 282, 222 260, 260 216 C 260 242, 246 272, 218 292 C 190 308, 160 308, 136 302 Z" fill="#C8102E" />
        <path d="M 138 281 C 170 263, 206 244, 238 216 C 238 232, 228 254, 208 270 C 184 284, 160 286, 138 281 Z" fill="#C8102E" />

        {/* Central White Fountain Pen Nib (Pointing Upwards) */}
        <g transform="translate(94, 142)">
          <path 
            d="M 42 0 L 12 74 C 12 106, 24 133, 42 153 C 60 133, 72 106, 72 74 L 42 0 Z" 
            fill="#FFFFFF" 
            stroke="#0B2046" 
            strokeWidth="3.5" 
            strokeLinejoin="round" 
          />
          <circle cx="42" cy="74" r="6.5" fill="#0B2046" />
          <line x1="42" y1="67" x2="42" y2="4" stroke="#0B2046" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 26 76 C 26 96, 33 114, 42 128 C 51 114, 58 96, 58 76" fill="none" stroke="#0B2046" strokeWidth="2.5" />
        </g>
      </g>

      {/* ===== 2. RIGHT BRAND TYPOGRAPHY ===== */}
      <g transform="translate(295, 12)">
        {/* Navy Blue "BANKING" */}
        <text 
          x="0" 
          y="126" 
          fill="#0B2046" 
          fontSize="136" 
          fontWeight="900" 
          letterSpacing="1"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          BANKING
        </text>

        {/* Crimson Red Banner: "TAYARI NEPAL" */}
        <rect x="0" y="150" width="670" height="82" rx="4" fill="#C8102E" />
        <text 
          x="335" 
          y="210" 
          fill="#FFFFFF" 
          fontSize="46" 
          fontWeight="800" 
          textAnchor="middle" 
          letterSpacing="11"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          TAYARI NEPAL
        </text>

        {/* Slogan Row: PREPARE | PRACTICE | SUCCEED */}
        {showMotto && (
          <g transform="translate(6, 256)">
            {/* 1. PREPARE Badge */}
            <g transform="translate(0, 0)">
              <circle cx="26" cy="26" r="26" fill="none" stroke="#0B2046" strokeWidth="4.5" />
              <path d="M 14 18 C 19 16, 24 17, 26 19 C 28 17, 33 16, 38 18 L 38 34 C 33 32, 28 33, 26 35 C 24 33, 19 32, 14 34 Z" fill="#0B2046" />
              <line x1="26" y1="19" x2="26" y2="35" stroke="#FFFFFF" strokeWidth="2" />
              <text x="66" y="35" fill="#0B2046" fontSize="23" fontWeight="800" letterSpacing="2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                PREPARE
              </text>
            </g>

            {/* Divider 1 */}
            <line x1="218" y1="6" x2="218" y2="48" stroke="#0B2046" strokeWidth="2.5" />

            {/* 2. PRACTICE Badge */}
            <g transform="translate(242, 0)">
              <circle cx="26" cy="26" r="26" fill="none" stroke="#C8102E" strokeWidth="4.5" />
              <path d="M 36 15 L 39 18 L 25 32 L 18 35 L 21 28 Z" fill="#0B2046" />
              <path d="M 16 36 C 22 34, 30 36, 36 31" fill="none" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" />
              <text x="66" y="35" fill="#0B2046" fontSize="23" fontWeight="800" letterSpacing="2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                PRACTICE
              </text>
            </g>

            {/* Divider 2 */}
            <line x1="472" y1="6" x2="472" y2="48" stroke="#C8102E" strokeWidth="2.5" />

            {/* 3. SUCCEED Badge */}
            <g transform="translate(496, 0)">
              <circle cx="26" cy="26" r="26" fill="none" stroke="#0B2046" strokeWidth="4.5" />
              <rect x="17" y="29" width="4.5" height="9" fill="#0B2046" rx="1" />
              <rect x="24" y="23" width="4.5" height="15" fill="#0B2046" rx="1" />
              <rect x="31" y="17" width="4.5" height="21" fill="#0B2046" rx="1" />
              <path d="M 17 23 L 26 15 L 37 11 M 32 11 L 37 11 L 37 16" fill="none" stroke="#0B2046" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="66" y="35" fill="#0B2046" fontSize="23" fontWeight="800" letterSpacing="2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                SUCCEED
              </text>
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};

export const Header: React.FC = () => {
  const { 
    user, 
    theme, 
    toggleTheme, 
    setIsSearchOpen, 
    setIsAiModalOpen,
    setIsNotificationsOpen,
    notifications,
    unreadNotificationsCount,
    setActiveTab,
    setIsProfileModalOpen,
    openAdminWithSecurityCheck,
    isAdminAuthenticated
  } = useApp();

  // 1. Visibility logic for the Admin button: ONLY when the authorized admin is logged in
  const isAdmin = Boolean(user && isUserAdmin(user.email));

  const unreadCount = typeof unreadNotificationsCount === 'number' 
    ? unreadNotificationsCount 
    : (notifications || []).filter(n => !n.read).length;

  // Dynamic user session bindings:
  // - Display Name: user.displayName (or fallback to email prefix if null)
  // - Email Address: user.email
  // - Profile Picture: user.photoURL (or avatarUrl / avatar generator)
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const displayName = user?.displayName || (user?.name && user.name !== 'विद्यार्थी' ? user.name : (emailPrefix || 'परीक्षार्थी'));
  const userEmail = user?.email || '';
  const photoURL = user?.photoURL || user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&size=256`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Official Brand Logo in Header: Mobile-only to eliminate desktop sidebar duplicate */}
          <div 
            id="header-brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex md:hidden items-center cursor-pointer group shrink-0"
            title="Banking Tayari Nepal - Home"
          >
            {/* White pill background ensures 100% crisp contrast for Navy & Red in both Light & Dark modes */}
            <div className="bg-white hover:bg-slate-50 px-2 py-1 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-red-300 transition-all flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="Banking Tayari Nepal Logo" 
                className="h-10 w-auto object-contain select-none"
              />
            </div>
          </div>

          {/* Search Bar Input / Trigger on Desktop */}
          <div className="flex-1 max-w-lg hidden md:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-400 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400" />
                <span>के खोज्दै हुनुहुन्छ? (Search Notes, Quiz...)</span>
              </div>
              <kbd className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>


          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* AI Study Assistant Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition"
              title="AI Study Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="hidden sm:inline">AI साथी</span>
            </button>

            {/* Streak & XP Display */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl text-xs font-semibold">
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400" title="Study Streak">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>{user.streak}d</span>
              </div>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Experience Points">
                <Zap className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                <span>{user.xp} XP</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Notification Bell with Dynamic Counter Badge */}
            <button
              id="header-notification-btn"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notifications"
              className="p-2 relative text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition focus:outline-none"
              title={`सूचनाहरू (${unreadCount} नपढिएका)`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span 
                  id="header-notification-badge"
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[19px] h-[19px] px-1 text-[10px] font-black font-mono text-white bg-red-600 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Admin PIN Button - ONLY rendered when isAdmin is true (user.email === 'rishiramthapa3@gmail.com') */}
            {isAdmin && (
              <button
                id="header-admin-btn"
                onClick={openAdminWithSecurityCheck}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  isAdminAuthenticated 
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800/60 hover:bg-red-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`प्रशासक प्यानल (${OFFICIAL_ADMIN_EMAIL})`}
              >
                <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>प्रशासक (PIN)</span>
                {isAdminAuthenticated && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600 text-white font-mono uppercase tracking-wide">
                    Active
                  </span>
                )}
              </button>
            )}

            {/* Header Profile Section & Trigger */}
            <button 
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              id="header-profile-btn"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l pl-3 sm:pl-4 ml-1 sm:ml-2 border-slate-200 dark:border-slate-800 group text-left cursor-pointer"
              title={`${displayName} - प्रोफाइल सम्पादन तथा विवरण`}
            >
              <div className="text-right hidden sm:block max-w-[140px]">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate" title={displayName}>
                  {displayName}
                </p>
                {userEmail ? (
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate" title={userEmail}>
                    {userEmail}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.targetExam?.split(' ')[0] || user?.district || 'विद्यार्थी'}
                  </p>
                )}
              </div>
              
              <div className="relative">
                <img 
                  src={photoURL} 
                  alt={displayName} 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover shadow-sm transition-transform group-hover:scale-105"
                />
                {user && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                )}
              </div>
            </button>


          </div>
        </div>
      </div>
    </header>
  );
};
