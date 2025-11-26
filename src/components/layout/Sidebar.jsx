/**
 * 사이드바 컴포넌트
 */

import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/results', label: '분석 결과', icon: 'pie_chart' },
  { path: '/preferences', label: 'Preferences', icon: 'settings' },
];

function NavItem({ path, label, icon }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          isActive
            ? 'bg-[#2b8cee] text-white'
            : 'text-slate-300 hover:text-white hover:bg-white/5'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="material-symbols-outlined text-2xl"
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200/10 bg-[#111a22] p-4 sticky top-0">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="material-symbols-outlined text-[#2b8cee] text-3xl">
            signal_cellular_alt
          </span>
          <h1 className="text-white text-lg font-bold tracking-tight">
            3GPP KPI Dashboard
          </h1>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-200/10">
        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2b8cee] to-[#1a5fb4] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">person</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">Network Engineer</span>
            <span className="text-slate-400 text-xs">engineer@telecom.com</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

