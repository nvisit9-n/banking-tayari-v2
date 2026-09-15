import React, { useRef, useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Trophy, 
  User, 
  Edit3, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  Zap,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DbService } from '../services/dbService';

export interface UserProfileBannerProps {
  onEditProfile?: () => void;
  onStartChallenge?: () => void;
  onOpenNotes?: () => void;
}

export const UserProfileBanner: React.FC<UserProfileBannerProps> = ({
  onEditProfile,
  onStartChallenge,
  onOpenNotes
}) => {
  const { user, refreshUser, addToast, setIsProfileModalOpen, setActiveTab } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const userLevel = user.level ?? (Math.floor(user.xp / 500) + 1);
  const targetExam = user.targetExam || 'नेपाल राष्ट्र बैंक (NRB) - तह ४/५';
  const totalQuestions = user.totalQuestionsAnswered ?? user.questionsSolved ?? 0;
  const streakDays = user.streak ?? 7;
  const accuracy = user.accuracy ?? 84;
  const currentXp = user.xp ?? 1420;
  const nextLevelXp = userLevel * 500;
  const xpProgressPercent = Math.min(100, Math.round(((currentXp % 500) / 500) * 100));

  // Handle direct photo change via Camera overlay button
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('कृपया मान्य फोटो (JPG, PNG, WebP) छान्नुहोस्।', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('फोटोको साइज ५ MB भन्दा कम हुनुपर्छ।', 'warning');
      return;
    }

    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;

      // Downscale to 240x240 for optimal localStorage footprint and instant rendering
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 240;
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          let finalPhotoUrl = rawDataUrl;

          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            finalPhotoUrl = canvas.toDataURL('image/jpeg', 0.88);
          }

          // Save to database & storage immediately
          await DbService.saveStudentProfile({ avatarUrl: finalPhotoUrl });
          refreshUser();
          addToast('तपाईंको प्रोफाइल फोटो सफलतापूर्वक अद्यावधिक भयो!', 'success');
        } catch {
          addToast('फोटो सुरक्षित गर्न सकिएन, कृपया पुनः प्रयास गर्नुहोस्।', 'error');
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      img.onerror = () => {
        setIsUploadingPhoto(false);
        addToast('फोटो लोड गर्न सकिएन।', 'error');
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsUploadingPhoto(false);
      addToast('फाइल पढ्न सकिएन।', 'error');
    };

    reader.readAsDataURL(file);
  };

  const handleOpenEdit = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 shadow-xl relative overflow-hidden border border-blue-900/40 text-white p-6 sm:p-8">
      
      {/* Ambient background glow circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Row: Streak Badge & Cloud Sync Indicator */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
        
        {/* Streak Counter Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-300 text-xs px-3.5 py-1.5 rounded-full font-bold border border-amber-500/30 backdrop-blur-sm shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{streakDays} दिने निरन्तर अध्ययन Streak सक्रिय छ</span>
        </div>

        {/* Cloud Synced & Exam Module Badge */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>७७ जिल्ला लाइभ सिंक</span>
          </span>
          <span className="hidden sm:inline bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-slate-300">
            तह ४ र ५ विशेष
          </span>
        </div>
      </div>

      {/* Main Profile Content: Avatar, Details & XP */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Avatar with Camera Overlay & Name/Details */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Avatar with Camera Overlay Icon - Perfect Circle */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-xl object-cover backdrop-blur-md bg-white/10 flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-white/80" />
              )}
            </div>

            {/* Level Badge Overlay (Top Left) */}
            <span className="absolute -top-1 -left-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-md uppercase tracking-wider">
              Lvl {userLevel}
            </span>

            {/* Camera / Edit Badge Overlay (Bottom Right) */}
            <button
              type="button"
              onClick={handleOpenEdit}
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 bg-red-600 border-2 border-white text-white shadow-md hover:bg-red-700 transition-transform hover:scale-110 cursor-pointer"
              title="फोटो परिवर्तन तथा काँटछाँट गर्नुहोस् (Edit & Crop Photo)"
            >
              <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>

            {/* Hidden Photo Upload Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Student Profile Identity Details */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {user.name ? `नमस्ते, ${user.name}! 👋` : 'नमस्ते, परीक्षार्थी! 👋'}
              </h1>
            </div>

            {/* Target Exam, Province & District Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-200 text-xs font-bold border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-red-400" />
                <span>{targetExam}</span>
              </span>

              {user.province && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-bold border border-slate-700">
                  <span className="text-xs">🏛️</span>
                  <span>{user.province}</span>
                </span>
              )}

              {user.district && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-bold border border-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{user.district}</span>
                </span>
              )}
            </div>

            {/* Contact Information */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
              {user.email && (
                <p className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </p>
              )}
              {user.phone && (
                <p className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Subtle Dark Glassmorphic XP Bar & Study Streak Card */}
        <div className="w-full lg:w-72 space-y-3 bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>अध्ययन XP: {currentXp}</span>
            </span>
            <span className="text-slate-300 text-[11px]">
              अगिल्लो तह: Lvl {userLevel + 1}
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>प्रगति: {xpProgressPercent}%</span>
            <span>{nextLevelXp - (currentXp % 500)} XP बाँकी</span>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            id="dashboard-edit-profile-btn"
            onClick={handleOpenEdit}
            className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm border border-white/15 backdrop-blur-sm"
            title="प्रोफाइल सम्पादन गर्नुहोस् (Edit Profile)"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>प्रोफाइल सम्पादन गर्नुहोस्</span>
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="relative z-10 mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-3">
        {/* Primary CTA button styled in Crimson Red */}
        <button
          type="button"
          onClick={() => {
            if (onStartChallenge) {
              onStartChallenge();
            } else {
              setActiveTab('quiz');
            }
          }}
          className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shadow-lg shadow-red-950/30 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>आजको १० प्रश्न Challenge (Start)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenNotes) {
              onOpenNotes();
            } else {
              setActiveTab('free-notes');
            }
          }}
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl transition border border-white/20 flex items-center gap-2 cursor-pointer backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI परीक्षा नोट्स जेनेरेटर</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className="ml-auto text-xs text-slate-400 hover:text-white font-bold transition flex items-center gap-1 py-2"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>सम्पूर्ण रिपोर्ट तथा श्रेणी हेर्नुहोस् &rarr;</span>
        </button>
      </div>

    </div>
  );
};
