import React from 'react';
import Link from 'next/link';
import { Database, LayoutDashboard, AlertCircle, Wand2, FileText, DownloadCloud } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-slate-900">
            <Database className="w-6 h-6 text-indigo-600" />
            TransactIQ
          </Link>
          <div className="h-5 w-px bg-slate-300 mx-4" />
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Enterprise Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Online
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 py-6 px-4 flex flex-col hidden md:flex">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">Validation Center</div>
          <nav className="flex-1 space-y-1">
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" active />
            <NavItem href="/dashboard#errors" icon={AlertCircle} label="Error Explorer" />
            <NavItem href="/dashboard#corrections" icon={Wand2} label="Auto-Corrections" />
            <NavItem href="/dashboard#reports" icon={FileText} label="Audit Reports" />
            <NavItem href="/dashboard#chunks" icon={DownloadCloud} label="Chunk Manager" />
          </nav>
        </aside>
        
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
      {label}
    </Link>
  );
}
