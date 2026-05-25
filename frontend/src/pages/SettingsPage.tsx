import { useNavigate } from 'react-router-dom';
import { ChevronRight, KeyRound, LogOut, Moon, Palette, Sun, UserCog } from 'lucide-react';

import { RoleBadge } from '../components/ui/RoleBadge';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { getInitials } from '../lib/initials';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-border dark:border-[#1F2A44]">
        <h3 className="text-[14px] font-semibold text-text-primary dark:text-[#F5F7FF]">{title}</h3>
        {subtitle && (
          <p className="text-[12px] text-text-muted dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-5 sm:px-6 py-2 divide-y divide-border dark:divide-[#1F2A44]">{children}</div>
    </div>
  );
}

interface RowProps {
  icon: typeof UserCog;
  iconColor: string;
  label: string;
  desc?: string;
  trailing: React.ReactNode;
  onClick?: () => void;
}

function Row({ icon: Icon, iconColor, label, desc, trailing, onClick }: RowProps) {
  const interactive = !!onClick;
  const Wrapper = interactive ? 'button' : 'div';
  return (
    <Wrapper
      {...(interactive
        ? { type: 'button' as const, onClick }
        : {})}
      className={
        'w-full text-left flex items-center gap-3 py-3.5 transition ' +
        (interactive ? 'hover:opacity-90 cursor-pointer' : '')
      }
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconColor + '1F', color: iconColor }}
        aria-hidden="true"
      >
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-text-primary dark:text-[#F5F7FF]">{label}</div>
        {desc && <div className="text-[11.5px] text-text-muted dark:text-[#94A3B8] mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{trailing}</div>
    </Wrapper>
  );
}

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={
        'relative w-11 h-6 rounded-full transition shrink-0 ' +
        (isDark ? 'bg-accent' : 'bg-surface-muted dark:bg-[#1F2A44]')
      }
    >
      <span
        className={
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all flex items-center justify-center ' +
          (isDark ? 'left-[22px]' : 'left-0.5')
        }
      >
        {isDark ? <Moon size={11} className="text-accent" aria-hidden="true" /> : <Sun size={11} className="text-warning" aria-hidden="true" />}
      </span>
    </button>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useDarkMode();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-7 py-5 sm:py-7 flex flex-col gap-4 sm:gap-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-text-primary dark:text-[#F5F7FF] tracking-tight">
          Settings
        </h1>
        <p className="text-[12.5px] sm:text-[13px] text-text-muted dark:text-[#94A3B8] mt-1">
          App preferences and your account
        </p>
      </div>

      {/* Account summary */}
      <div className="rounded-2xl bg-white dark:bg-[#1A233A] border border-border dark:border-[#1F2A44] shadow-card p-5 sm:p-6 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-[16px] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #5B5CF0 0%, #38BDF8 100%)' }}
          aria-hidden="true"
        >
          {getInitials(user?.fullName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[15px] font-bold text-text-primary dark:text-[#F5F7FF] truncate">
              {user?.fullName ?? '—'}
            </div>
            {user && <RoleBadge role={user.role} />}
          </div>
          <div className="text-[12.5px] text-text-muted dark:text-[#94A3B8] truncate mt-0.5">
            {user?.email ?? '—'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="h-9 px-3 rounded-lg border border-border-strong dark:border-[#2D3956] bg-white dark:bg-[#1A233A] text-text-muted dark:text-[#94A3B8] hover:text-text-primary dark:hover:text-[#F5F7FF] transition text-[12.5px] font-semibold"
        >
          View profile
        </button>
      </div>

      {/* Appearance */}
      <Section title="Appearance" subtitle="How ExpenseTrack looks on this device">
        <Row
          icon={Palette}
          iconColor="#F59E0B"
          label={isDark ? 'Dark mode' : 'Light mode'}
          desc="Stored locally in your browser"
          trailing={<ThemeToggle isDark={isDark} onToggle={toggleTheme} />}
        />
      </Section>

      {/* Account */}
      <Section title="Account" subtitle="Your sign-in and credentials">
        <Row
          icon={UserCog}
          iconColor="#5B5CF0"
          label="Profile details"
          desc="View your name, email and role"
          trailing={<ChevronRight size={16} className="text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />}
          onClick={() => navigate('/profile')}
        />
        <Row
          icon={KeyRound}
          iconColor="#10B981"
          label="Change password"
          desc="Update your sign-in password"
          trailing={<ChevronRight size={16} className="text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />}
          onClick={() => navigate('/profile')}
        />
      </Section>

      {/* Session */}
      <Section title="Session">
        <Row
          icon={LogOut}
          iconColor="#EF4444"
          label="Sign out"
          desc="End your session on this device"
          trailing={<ChevronRight size={16} className="text-text-muted dark:text-[#94A3B8]" aria-hidden="true" />}
          onClick={handleLogout}
        />
      </Section>
    </div>
  );
}
