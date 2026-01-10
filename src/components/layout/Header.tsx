import { AlertCircle, ChevronRight } from 'lucide-react';

interface HeaderProps {
    activeModule: string;
}

const Header = ({ activeModule }: HeaderProps) => (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center text-sm breadcrumbs text-slate-500">
            <span>Platform</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-slate-800 capitalize">{activeModule.replace('td_goals', '业务梳理').replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 relative">
                <AlertCircle size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
                发布版本 (v1.0.4)
            </button>
        </div>
    </header>
);

export default Header;
