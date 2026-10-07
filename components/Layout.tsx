import React, { useState } from 'react';
import { Tab, UserRole, User } from '../types';
import { Home, BookOpen, GraduationCap, MessageSquare, User as UserIcon, LogOut, Users, CalendarCheck, UserPlus, Layers, CheckSquare, Crown, Trophy, FileText, Inbox, Phone, Send, Instagram, X, Copy, Check, ExternalLink } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BatchLogo } from './BatchLogo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  user: User | null;
  onLogout: () => void;
  onOpenDriveModal?: () => void;
  onOpenRepModal?: () => void;
  joinRequestsCount?: number;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  user,
  onLogout,
  onOpenDriveModal,
  onOpenRepModal,
  joinRequestsCount = 0,
}) => {
  const [isDevContactOpen, setIsDevContactOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyContact = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  if (!user) return <>{children}</>;

  let navItems = [
    { id: Tab.HOME, icon: Home, label: 'الرئيسية' },
    { id: Tab.LEADERBOARD, icon: Trophy, label: 'المتصدرين 🏆' },
    { id: Tab.ASSIGNMENTS, icon: CheckSquare, label: 'الواجبات' },
    { id: Tab.SCHEDULE, icon: CalendarCheck, label: 'الجدول' },
    { id: Tab.GRADES, icon: GraduationCap, label: 'الدرجات' },
    { id: Tab.ATTENDANCE, icon: CalendarCheck, label: 'الحضور' },
    { id: Tab.MATERIALS, icon: BookOpen, label: 'المحاضرات' },
    { id: Tab.SUMMARIES, icon: FileText, label: 'الملخصات 📝' },
    { id: Tab.SUGGESTIONS, icon: Inbox, label: 'صندوق الدفعة 📬' },
    { id: Tab.PROJECTS, icon: Layers, label: 'المشاريع' },
    { id: Tab.CHAT, icon: MessageSquare, label: 'الدفعة' },
    { id: Tab.PROFILE, icon: UserIcon, label: 'حسابي' },
  ];

  // Filter based on role and batch membership
  if (user.role === UserRole.STUDENT && !user.batchCode) {
    navItems = [
      { id: Tab.HOME, icon: Home, label: 'البداية' },
      { id: Tab.PROFILE, icon: UserIcon, label: 'حسابي' },
    ];
  } else {
    // Representative & Owner tabs
    if (user.role === UserRole.REPRESENTATIVE || user.role === UserRole.OWNER) {
      navItems.splice(6, 0, { id: Tab.STUDENTS, icon: Users, label: 'إدارة الطلاب' });
      navItems.splice(7, 0, { id: Tab.COURSES, icon: BookOpen, label: 'المواد' });
      navItems.splice(8, 0, { id: Tab.REQUESTS, icon: UserPlus, label: 'الطلبات' });
    } else if (user.role === UserRole.ASSISTANT_REP) {
      navItems.splice(7, 0, { id: Tab.COURSES, icon: BookOpen, label: 'المواد' });
    }
    if (user.role === UserRole.OWNER) {
      navItems.splice(9, 0, { id: Tab.BATCHES, icon: Layers, label: 'النسخ والدفعات' });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row h-screen overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex-col shadow-lg z-20 transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
          <BatchLogo
            className="w-11 h-11 hover:scale-110 transition-transform duration-300"
            showBackground
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">دفعتي</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              تم التطوير بواسطة{" "}
              <button
                type="button"
                onClick={() => setIsDevContactOpen(true)}
                className="font-bold text-primary hover:underline cursor-pointer transition"
              >
                "أحمد عامر"
              </button>
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRequestsTab = item.id === Tab.REQUESTS;
            const hasRequests = isRequestsTab && joinRequestsCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/30' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon size={22} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-white'} />
                  {hasRequests && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="font-semibold">{item.label}</span>
                {hasRequests && (
                  <span className="mr-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-sm animate-pulse">
                    {joinRequestsCount}
                  </span>
                )}
                {isActive && !hasRequests && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
              </button>
            );
          })}
        </nav>

        {onOpenRepModal && (
          <div className="px-4 pb-2">
            <button
              onClick={onOpenRepModal}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 transition-all duration-200 group text-right shadow-sm"
              title="إدارة وتعيين الممثلين وتوليد الأكواد"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Crown size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold block">إدارة الممثلين</span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400 block font-medium">أكواد وتعيين ونقل</span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                👑
              </span>
            </button>
          </div>
        )}

        <div className="px-4 pb-2">
          <PWAInstallButton />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm" alt="User" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.role === UserRole.OWNER ? 'المطور 💻' : user.role === UserRole.REPRESENTATIVE ? 'ممثل الدفعة 👑' : user.role === UserRole.ASSISTANT_REP ? 'ممثل معاون 🎖️' : 'طالب'}
              </p>
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-slate-800 text-gray-800 dark:text-white p-4 shadow-sm z-20 flex justify-between items-center sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-2">
             <BatchLogo className="w-9 h-9" showBackground />
             <div>
               <span className="font-bold text-base block leading-tight">دفعتي</span>
               <p className="text-[10px] text-gray-500 dark:text-gray-400">
                 تم التطوير بواسطة{" "}
                 <button
                   type="button"
                   onClick={() => setIsDevContactOpen(true)}
                   className="font-bold text-primary hover:underline cursor-pointer"
                 >
                   "أحمد عامر"
                 </button>
               </p>
             </div>
          </div>
          <div className="flex items-center gap-1.5">
            <PWAInstallButton compact />
            {onOpenRepModal && (
              <button
                onClick={onOpenRepModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 transition shadow-sm"
                title="إدارة وتعيين الممثلين"
              >
                <Crown size={15} className="text-amber-500" />
                <span>الممثلين</span>
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 dark:bg-slate-900 pb-24 md:pb-0 relative transition-colors duration-300">
          <div className="max-w-5xl mx-auto md:p-8 p-0">
             {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 flex overflow-x-auto no-scrollbar items-center py-2 pb-5 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300 px-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRequestsTab = item.id === Tab.REQUESTS;
            const hasRequests = isRequestsTab && joinRequestsCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-1 px-2.5 min-w-[62px] shrink-0 transition-all duration-300 relative ${
                  isActive ? 'text-primary -translate-y-1' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all relative ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {hasRequests && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800 animate-pulse">
                        {joinRequestsCount > 9 ? '+9' : joinRequestsCount}
                      </span>
                    )}
                </div>
                <span className={`text-[10px] mt-0.5 font-medium whitespace-nowrap transition-opacity ${isActive ? 'opacity-100 font-bold' : 'opacity-70'}`}>{item.label}</span>
                {isActive && <span className="absolute bottom-0 w-1 h-1 bg-primary rounded-full"></span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Developer Contact Modal ("أحمد عامر") */}
      {isDevContactOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsDevContactOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <BatchLogo className="w-12 h-12" showBackground />
                <div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block mb-0.5">
                    مطور المنصة 💻
                  </span>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white">
                    أحمد عامر
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDevContactOpen(false)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contact Links */}
            <div className="space-y-2.5" dir="ltr">
              {/* Phone / WhatsApp */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
                      Phone / WhatsApp
                    </span>
                    <span className="text-sm font-black text-gray-800 dark:text-white font-mono">
                      07866330605
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyContact('07866330605', 'phone')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-emerald-600 border border-emerald-200 dark:border-slate-700 transition"
                    title="نسخ الرقم"
                  >
                    {copiedField === 'phone' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <a
                    href="https://wa.me/9647866330605"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-xs"
                    title="مراسلة عبر واتساب"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-200/70 dark:border-pink-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Instagram size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-pink-700 dark:text-pink-400 block">
                      Instagram
                    </span>
                    <span className="text-sm font-black text-gray-800 dark:text-white font-mono">
                      @yicn
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyContact('yicn', 'insta')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-pink-600 border border-pink-200 dark:border-slate-700 transition"
                    title="نسخ اليوزر"
                  >
                    {copiedField === 'insta' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <a
                    href="https://instagram.com/yicn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white transition shadow-xs"
                    title="فتح حساب إنستغرام"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Send size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 block">
                      Telegram
                    </span>
                    <span className="text-sm font-black text-gray-800 dark:text-white font-mono">
                      @xwebj
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyContact('xwebj', 'tg')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:text-sky-600 border border-sky-200 dark:border-slate-700 transition"
                    title="نسخ اليوزر"
                  >
                    {copiedField === 'tg' ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                  </button>
                  <a
                    href="https://t.me/xwebj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition shadow-xs"
                    title="مراسلة عبر تيليجرام"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDevContactOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold text-xs transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
