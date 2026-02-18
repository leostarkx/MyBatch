import React from 'react';
import { Tab, UserRole, User } from '../types';
import { Home, BookOpen, GraduationCap, MessageSquare, User as UserIcon, LogOut, Users, CalendarCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, user, onLogout }) => {
  if (!user) return <>{children}</>;

  const navItems = [
    { id: Tab.HOME, icon: Home, label: 'الرئيسية' },
    { id: Tab.GRADES, icon: GraduationCap, label: 'الدرجات' },
    { id: Tab.ATTENDANCE, icon: CalendarCheck, label: 'الحضور' },
    { id: Tab.MATERIALS, icon: BookOpen, label: 'المحاضرات' },
    { id: Tab.CHAT, icon: MessageSquare, label: 'الدفعة' },
    { id: Tab.PROFILE, icon: UserIcon, label: 'حسابي' },
  ];

  // Add Students Management Tab for Admins
  if (user.role === UserRole.ADMIN) {
    navItems.splice(5, 0, { id: Tab.STUDENTS, icon: Users, label: 'إدارة الطلاب' });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col md:flex-row h-screen overflow-hidden transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex-col shadow-lg z-20 transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
          <img 
            src="https://image2url.com/r2/default/images/1771267640581-35bff80f-1346-49cc-bf93-a392d06b2588.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain hover:scale-110 transition-transform duration-300"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">دفعتي</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">تطبيق الدفعة الموحد</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/30' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary dark:group-hover:text-white'} />
                <span className="font-semibold">{item.label}</span>
                {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-600 shadow-sm" alt="User" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.role === 'ADMIN' ? 'مسؤول النظام' : 'طالب'}</p>
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
             <img 
               src="https://image2url.com/r2/default/images/1771267640581-35bff80f-1346-49cc-bf93-a392d06b2588.png" 
               alt="Logo" 
               className="w-8 h-8 object-contain"
             />
             <span className="font-bold text-lg">دفعتي</span>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-gray-50/50 dark:bg-slate-900 pb-24 md:pb-0 relative transition-colors duration-300">
          <div className="max-w-5xl mx-auto md:p-8 p-0">
             {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border-t border-gray-200 dark:border-slate-700 flex justify-around items-center py-2 pb-5 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center p-2 transition-all duration-300 relative ${
                  isActive ? 'text-primary -translate-y-1' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
                {isActive && <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;