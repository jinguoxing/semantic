import { useState } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, FileText, Activity, Cpu, Link,
    RefreshCw, ChevronRight, Shield, CheckSquare,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send,
    Book, Tag, CheckCircle, ArrowRight, Sparkles, Box, Edit, XCircle, ZoomIn, ZoomOut, Eye, Share2, Network, GitBranch, Table, Globe, ChevronDown, Check
} from 'lucide-react';

interface SidebarProps {
    activeModule: string;
    setActiveModule: (module: string) => void;
}

const Sidebar = ({ activeModule, setActiveModule }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menus = [
        {
            title: '数据服务超市',
            color: 'text-indigo-400',
            items: [
                { id: 'ask_data', label: '问数', icon: MessageCircle },
                { id: 'data_supermarket', label: '找数', icon: Search }
            ]
        },
        {
            title: '数据应用',
            color: 'text-teal-400',
            items: [
                { id: 'scenario_orchestration', label: '场景编排', icon: Layers }
            ]
        },
        {
            title: '语义建模',
            color: 'text-blue-400',
            items: [
                { id: 'dashboard', label: '语义协同中心', icon: Activity },
                { id: 'td_goals', label: '业务梳理', icon: FileText },
                { id: 'td_modeling', label: '业务对象建模', icon: Layout },
                { id: 'resource_knowledge_network', label: '资源知识网络', icon: Network },
                { id: 'bu_semantic', label: '逻辑视图', icon: FileText },
                { id: 'candidate_confirmation', label: '候选业务对象', icon: CheckSquare }
            ]
        },
        {
            title: '语义资产管理',
            color: 'text-purple-400',
            items: [
                { id: 'term_mgmt', label: '术语管理', icon: Book },
                { id: 'tag_mgmt', label: '标签管理', icon: Tag }
            ]
        },
        {
            title: '数据发现',
            color: 'text-emerald-400',
            items: [
                { id: 'bu_connect', label: '数据源管理', icon: Database },
                { id: 'bu_scan', label: '资产扫描', icon: Search },
                // { id: 'bu_semantic', label: '逻辑视图', icon: FileText },
                // { id: 'bu_candidates', label: '候选生成', icon: Cpu },
            ]
        },
        /*
        {
            title: '语义治理中心',
            color: 'text-purple-400',
            items: [
                // { id: 'mapping', label: '映射工作台', icon: GitMerge },
                // { id: 'governance', label: '冲突检测', icon: Shield },
                // { id: 'sg_candidate_confirm', label: '候选业务对象确认', icon: CheckCircle },
                // { id: 'smart_data', label: '智能数据中心', icon: Cpu },
            ]
        },
        */
        {
            title: 'EE 服务执行',
            color: 'text-orange-400',
            items: [
                { id: 'ee_api', label: 'API 网关', icon: Server },
                { id: 'ee_cache', label: '缓存策略', icon: RefreshCw },
            ]
        },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20 transition-all duration-300`}>
            {/* Logo Header */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <Link className="text-white" size={18} />
                </div>
                {!isCollapsed && (
                    <div className="ml-3 overflow-hidden">
                        <h1 className="font-bold text-white tracking-tight whitespace-nowrap">数据语义治理</h1>
                        <p className="text-[10px] text-slate-500 tracking-wider whitespace-nowrap">企业版</p>
                    </div>
                )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {menus.map((group, idx) => (
                    <div key={idx} className={`mb-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                        {!isCollapsed && (
                            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${group.color || 'text-slate-500'}`}>
                                {group.title}
                            </h3>
                        )}
                        {isCollapsed && idx > 0 && (
                            <div className="border-t border-slate-700 my-2" />
                        )}
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveModule(item.id)}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2' : 'px-3'} py-2 rounded-md text-sm transition-all duration-200 ${activeModule === item.id
                                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={16} strokeWidth={1.5} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    {!isCollapsed && activeModule === item.id && <ChevronRight size={14} className="ml-auto opacity-50 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="mx-2 mb-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                title={isCollapsed ? '展开菜单' : '收起菜单'}
            >
                <ChevronRight size={16} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {/* User Profile */}
            <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white" title="John Doe">
                        JD
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white shrink-0">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">John Doe</div>
                            <div className="text-xs text-slate-500 truncate">Chief Data Architect</div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
