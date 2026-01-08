import React, { useState, useEffect } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X
} from 'lucide-react';

// ==========================================
// 模拟数据 (Mock Data)
// ==========================================

// TD: 业务梳理数据 (原业务目标)
const mockBusinessGoals = [
    {
        id: 'G_001',
        title: '出生一件事高效办成',
        type: '改革事项',
        priority: 'High',
        status: 'modeling', // planning, modeling, implemented
        progress: 65,
        owner: '卫健委 / 数局',
        lastUpdate: '2024-05-20',
        description: '整合出生医学证明、户口登记、医保参保等多个事项，实现“一表申请、一网通办”。',
        relatedObjects: ['新生儿', '出生医学证明', '户籍信息']
    },
    {
        id: 'G_002',
        title: '企业开办全流程优化',
        type: '改革事项',
        priority: 'Medium',
        status: 'planning',
        progress: 15,
        owner: '市场监管局',
        lastUpdate: '2024-05-18',
        description: '压缩企业开办时间至0.5个工作日，涉及工商、税务、社保等数据打通。',
        relatedObjects: []
    },
    {
        id: 'G_003',
        title: '公共数据归集管理办法',
        type: '政策文件',
        priority: 'Low',
        status: 'implemented',
        progress: 100,
        owner: '大数据中心',
        lastUpdate: '2024-01-10',
        description: '规范全市公共数据归集、共享、开放及安全管理活动。',
        relatedObjects: ['数据目录', '归集任务']
    }
];

// TD: 业务对象 (恢复丢失的数据)
const mockBusinessObjects = [
    {
        id: 'BO_NEWBORN',
        name: '新生儿 (Newborn)',
        code: 'biz_newborn',
        domain: '出生一件事',
        owner: '卫健委业务处',
        status: 'published',
        description: '自然人出生登记的核心业务对象',
        fields: [
            { name: '姓名', type: 'String', required: true },
            { name: '身份证号', type: 'String', required: true },
            { name: '出生时间', type: 'DateTime', required: true },
            { name: '血型', type: 'Enum', required: false }, // 冲突点
            { name: '出生体重', type: 'Decimal', required: false },
        ]
    },
    {
        id: 'BO_CERT',
        name: '出生医学证明',
        code: 'biz_birth_cert',
        domain: '出生一件事',
        owner: '医院管理处',
        status: 'draft',
        fields: []
    }
];

// BU: 物理表
const mockPhysicalTables = [
    {
        id: 'TBL_POP_BASE',
        name: 't_pop_base_info_2024',
        source: 'HOSP_DB_01 (MySQL)',
        scannedAt: '2024-05-20 10:00:00',
        rows: '1,204,500',
        fields: [
            { name: 'id', type: 'bigint', key: 'PK' },
            { name: 'p_name', type: 'varchar(50)' },
            { name: 'id_card_num', type: 'varchar(18)' },
            { name: 'birth_ts', type: 'datetime' },
            { name: 'weight_kg', type: 'decimal(4,2)' },
            { name: 'hospital_id', type: 'int' },
            { name: 'is_deleted', type: 'tinyint' }
        ]
    }
];

// SG: 映射关系
const mockMappings = [
    { boField: '姓名', tblField: 'p_name', rule: 'Direct Copy' },
    { boField: '身份证号', tblField: 'id_card_num', rule: 'Direct Copy' },
    { boField: '出生时间', tblField: 'birth_ts', rule: 'Format: YYYY-MM-DD HH:mm:ss' },
    { boField: '出生体重', tblField: 'weight_kg', rule: 'Direct Copy' },
];

// ==========================================
// 组件定义
// ==========================================

export default function SemanticLayerApp() {
    const [activeModule, setActiveModule] = useState('dashboard');
    // 确保 mockBusinessObjects 存在且不为空，避免 undefined 错误
    const [selectedBO, setSelectedBO] = useState(mockBusinessObjects && mockBusinessObjects.length > 0 ? mockBusinessObjects[0] : null);
    const [showRuleEditor, setShowRuleEditor] = useState(null);

    // 渲染主内容区域
    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardView setActiveModule={setActiveModule} />;
            case 'td_goals': return <BusinessGoalsView />; // 新增路由
            case 'mapping': return <MappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} />;
            case 'td_modeling': return <BusinessModelingView />;
            case 'bu_discovery': return <TechDiscoveryView />;
            default: return <DashboardView setActiveModule={setActiveModule} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* 侧边栏 */}
            <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

            {/* 主界面 */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header activeModule={activeModule} />
                <main className="flex-1 overflow-auto p-6 relative">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 侧边栏组件
// ------------------------------------------------------------------
const Sidebar = ({ activeModule, setActiveModule }) => {
    const menus = [
        { title: '概览', items: [{ id: 'dashboard', label: '控制台 Dashboard', icon: Activity }] },
        {
            title: '业务建模',
            color: 'text-blue-400',
            items: [
                { id: 'td_goals', label: '业务梳理 (TD-01)', icon: FileText },
                { id: 'td_modeling', label: '对象建模器 (TD-03)', icon: Layout },
                { id: 'td_scenario', label: '场景编排 (TD-04)', icon: Layers },
            ]
        },
        {
            title: '数据发现',
            color: 'text-emerald-400',
            items: [
                { id: 'bu_connect', label: '数据源管理 (BU-01)', icon: Database },
                { id: 'bu_discovery', label: '资产扫描 (BU-02)', icon: Search },
                { id: 'bu_candidates', label: '候选生成 (BU-04)', icon: Cpu },
            ]
        },
        {
            title: 'SG 语义治理中心',
            color: 'text-purple-400',
            items: [
                { id: 'mapping', label: '映射工作台 (SG-01)', icon: GitMerge },
                { id: 'governance', label: '冲突检测 (SG-02)', icon: Shield },
                { id: 'catalog', label: '统一元数据 (SG-04)', icon: BookIcon },
            ]
        },
        {
            title: 'EE 服务执行',
            color: 'text-orange-400',
            items: [
                { id: 'ee_api', label: 'API 网关 (EE-05)', icon: Server },
                { id: 'ee_cache', label: '缓存策略 (EE-06)', icon: RefreshCw },
            ]
        },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Link className="text-white" size={18} />
                </div>
                <div>
                    <h1 className="font-bold text-white tracking-tight">SemanticLink</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise Edition</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {menus.map((group, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${group.color || 'text-slate-500'}`}>
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveModule(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${activeModule === item.id
                                            ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                                            : 'hover:bg-slate-800/50 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={16} strokeWidth={1.5} />
                                    <span>{item.label}</span>
                                    {activeModule === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                        JD
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-white">John Doe</div>
                        <div className="text-xs text-slate-500">Chief Data Architect</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

// ------------------------------------------------------------------
// Header 组件
// ------------------------------------------------------------------
const Header = ({ activeModule }) => (
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

// ------------------------------------------------------------------
// 视图 1: 仪表盘 Dashboard
// ------------------------------------------------------------------
const DashboardView = ({ setActiveModule }) => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="L1 业务对象" value="142" trend="+3" icon={Layout} color="blue" />
            <StatCard label="已扫描物理表" value="8,920" trend="+12" icon={Database} color="emerald" />
            <StatCard label="已对齐映射" value="89" trend="65%" icon={GitMerge} color="purple" />
            <StatCard label="API 服务调用" value="1.2M" trend="High" icon={Server} color="orange" />
        </div>

        {/* 核心架构可视化卡片 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">语义层构建流水线</h2>
                    <p className="text-slate-500 text-sm">业务模型与技术实现的融合状态</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                        <Activity size={12} /> System Healthy
                    </span>
                </div>
            </div>

            <div className="flex items-stretch gap-8">
                {/* 左侧 TD 流 */}
                <div className="flex-1 bg-blue-50/50 rounded-xl border border-blue-100 p-5 relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setActiveModule('td_modeling')}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layout size={80} className="text-blue-500" />
                    </div>
                    <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 业务意图
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <StepItem status="done" text="A1. 政策文件解析 (出生一件事)" />
                        <StepItem status="done" text="A2. L1 业务对象定义 (142个)" />
                        <StepItem status="process" text="A4. 场景语义编排" />
                    </div>
                </div>

                {/* 中间 汇聚流 */}
                <div className="w-48 flex flex-col justify-center items-center relative">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
                    <div className="bg-white p-4 rounded-full border-2 border-purple-100 shadow-lg mb-4 hover:scale-110 transition-transform cursor-pointer z-10" onClick={() => setActiveModule('mapping')}>
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <GitMerge size={32} />
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-slate-800">语义对齐</div>
                        <div className="text-xs text-slate-500 mt-1">冲突检测中...</div>
                        <div className="mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertCircle size={10} /> 14 个待解决冲突
                        </div>
                    </div>
                </div>

                {/* 右侧 BU 流 */}
                <div className="flex-1 bg-emerald-50/50 rounded-xl border border-emerald-100 p-5 relative overflow-hidden group hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setActiveModule('bu_discovery')}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database size={80} className="text-emerald-500" />
                    </div>
                    <h3 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 技术实现
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <StepItem status="done" text="B1. 挂载卫健委前置机 (MySQL)" />
                        <StepItem status="done" text="B2. 自动元数据采集" />
                        <StepItem status="done" text="B4. 候选对象生成 (AI 识别)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ------------------------------------------------------------------
// 视图 2: 映射工作台 (核心功能 SG-01)
// ------------------------------------------------------------------
const MappingStudioView = ({ selectedBO, showRuleEditor, setShowRuleEditor }) => {
    if (!selectedBO) return <div className="p-4">Please select a Business Object</div>;

    return (
        <div className="h-full flex flex-col">
            {/* 顶部工具栏 */}
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center rounded-t-xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <GitMerge className="text-purple-600" size={20} />
                        语义映射工作台 (Mapping Studio)
                    </h2>
                    <p className="text-xs text-slate-500">Drag to connect Business Fields with Physical Columns</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors">
                        <Cpu size={14} /> 自动推测 (AI)
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 rounded hover:bg-purple-700 shadow-sm transition-colors">
                        <CheckCircle size={14} /> 保存并生效
                    </button>
                </div>
            </div>

            {/* 映射操作区 */}
            <div className="flex-1 bg-slate-100 p-6 overflow-hidden flex gap-8">

                {/* 左侧：业务对象卡片 */}
                <div className="flex-1 flex flex-col bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-blue-900">{selectedBO.name}</div>
                            <div className="text-xs text-blue-600 font-mono mt-0.5">{selectedBO.code}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-white text-blue-600 text-[10px] font-bold border border-blue-200 rounded uppercase">Target</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {selectedBO.fields.map((field, idx) => {
                            const isMapped = mockMappings.find(m => m.boField === field.name);
                            return (
                                <div key={idx} className={`flex items-center justify-between p-3 mb-2 rounded border ${isMapped ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'} group relative`}>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-700">{field.name}</span>
                                            {field.required && <span className="text-[10px] text-red-500 font-bold">*</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                    </div>

                                    {/* 连接点 */}
                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-500 cursor-pointer absolute -right-1.5 top-1/2 -translate-y-1/2 z-10"></div>

                                    {!isMapped && (
                                        <div className="absolute right-4 top-3 text-red-500">
                                            <AlertCircle size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 中间：连线与规则区域 */}
                <div className="w-1/3 flex flex-col gap-4">
                    {/* 映射列表 */}
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                            Active Mappings
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {mockMappings.map((m, i) => (
                                <div key={i} className="flex items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                                    <div className="flex-1 text-right text-blue-700 font-medium truncate">{m.boField}</div>
                                    <div className="mx-2 text-slate-400"><Link size={12} /></div>
                                    <div className="flex-1 text-left text-emerald-700 font-mono truncate">{m.tblField}</div>
                                    <button
                                        onClick={() => setShowRuleEditor(m)}
                                        className="ml-2 p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                    >
                                        <Settings size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 规则编辑器 (Contextual) */}
                    {showRuleEditor && (
                        <div className="bg-slate-800 text-slate-200 rounded-lg p-4 shadow-lg animate-fade-in-up border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
                                    <Code size={12} /> 转换规则 (Transformation)
                                </div>
                                <button onClick={() => setShowRuleEditor(null)} className="text-slate-500 hover:text-white">&times;</button>
                            </div>
                            <div className="text-xs text-slate-400 mb-2">
                                当 <span className="text-emerald-400">{showRuleEditor.tblField}</span> 映射到 <span className="text-blue-400">{showRuleEditor.boField}</span> 时:
                            </div>
                            <textarea
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs font-mono text-green-300 focus:outline-none focus:border-purple-500"
                                rows={3}
                                defaultValue={showRuleEditor.rule === 'Direct Copy' ? `source.${showRuleEditor.tblField}` : `format(source.${showRuleEditor.tblField}, 'yyyy-MM-dd')`}
                            ></textarea>
                            <div className="mt-2 flex justify-end">
                                <button className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded">应用规则</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 右侧：物理表卡片 */}
                <div className="flex-1 flex flex-col bg-white rounded-lg border border-emerald-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                        <div>
                            <div className="font-bold text-emerald-900 font-mono text-sm">{mockPhysicalTables[0].name}</div>
                            <div className="text-xs text-emerald-600 mt-0.5">{mockPhysicalTables[0].source}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-white text-emerald-600 text-[10px] font-bold border border-emerald-200 rounded uppercase">Source</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {mockPhysicalTables[0].fields.map((field, idx) => {
                            const isMapped = mockMappings.find(m => m.tblField === field.name);
                            return (
                                <div key={idx} className={`flex items-center justify-between p-3 mb-2 rounded border ${isMapped ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'} group relative`}>
                                    {/* 连接点 */}
                                    <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-400 group-hover:border-emerald-500 cursor-pointer absolute -left-1.5 top-1/2 -translate-y-1/2 z-10"></div>

                                    <div className="ml-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-slate-700">{field.name}</span>
                                            {field.key === 'PK' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">PK</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                    </div>
                                    {/* 数据样本 */}
                                    <div className="text-xs text-slate-300 font-mono truncate max-w-[60px]">
                                        {field.name === 'id' ? '1001' : '...'}
                                    </div>
                                </div>
                            );
                        })}
                        <div className="p-2 text-center text-xs text-slate-400 italic border-t border-slate-100 mt-2">
                            Showing 7 of 45 columns...
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 业务梳理 (TD-01) - 改名并完善新建功能
// ------------------------------------------------------------------
const BusinessGoalsView = () => {
    const [goals, setGoals] = useState(mockBusinessGoals);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        type: '改革事项',
        priority: 'Medium',
        owner: '',
        description: ''
    });

    const handleCreate = () => {
        if (!newGoal.title) return; // 简单校验
        const goalData = {
            id: `G_${Date.now()}`,
            ...newGoal,
            status: 'planning',
            progress: 0,
            lastUpdate: new Date().toISOString().split('T')[0],
            relatedObjects: []
        };
        setGoals([goalData, ...goals]);
        setIsModalOpen(false);
        setNewGoal({ title: '', type: '改革事项', priority: 'Medium', owner: '', description: '' }); // 重置
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* 顶部 Header 区 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">业务梳理</h2>
                    <p className="text-slate-500 mt-1">定义企业核心改革事项与政策文件，驱动自顶向下的数据建模。</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Upload size={16} /> 导入政策文件
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={16} /> 新建梳理事项
                    </button>
                </div>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">活跃事项 (Active Items)</p>
                            <h3 className="text-3xl font-bold">{goals.length}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-100">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white mr-2">本周新增</span>
                        <span>持续更新中</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">建模覆盖率</p>
                            <h3 className="text-3xl font-bold text-slate-800">65%</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <FileCheck size={20} className="text-emerald-600" />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">已完成 8 个目标的 L1 对象定义</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">待解决阻点</p>
                            <h3 className="text-3xl font-bold text-slate-800">3</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-100">数据缺失</span>
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded border border-orange-100">口径冲突</span>
                    </div>
                </div>
            </div>

            {/* 目标列表 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">梳理清单</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="搜索事项..."
                                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-48"
                            />
                        </div>
                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded">
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {goals.map((goal) => (
                        <div key={goal.id} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full ${goal.priority === 'High' ? 'bg-red-500' :
                                            goal.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                                        }`}></span>
                                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer">
                                        {goal.title}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded text-xs border border-slate-200 text-slate-500 bg-white">
                                        {goal.type}
                                    </span>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            <p className="text-slate-500 text-sm mb-4 max-w-3xl leading-relaxed">
                                {goal.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    {/* Status Badge */}
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${goal.status === 'implemented' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            goal.status === 'modeling' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                        {goal.status === 'implemented' && <CheckCircle size={12} />}
                                        {goal.status === 'modeling' && <RefreshCw size={12} className="animate-spin-slow" />}
                                        {goal.status === 'planning' && <Activity size={12} />}
                                        <span className="capitalize">{goal.status}</span>
                                    </div>

                                    {/* Owner */}
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="text-slate-400">Owner:</span>
                                        <span>{goal.owner || '待定'}</span>
                                    </div>

                                    {/* Related Objects */}
                                    {goal.relatedObjects.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Link size={14} className="text-slate-400" />
                                            <div className="flex gap-1">
                                                {goal.relatedObjects.map((obj, i) => (
                                                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">
                                                        {obj}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-3 min-w-[150px]">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-slate-600 w-8 text-right">
                                        {goal.progress}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        查看更多历史记录 <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* 新建 Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">新建业务梳理事项</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">事项名称 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="例如：残疾人服务一件事"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                                    <select
                                        value={newGoal.type}
                                        onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="改革事项">改革事项</option>
                                        <option value="政策文件">政策文件</option>
                                        <option value="重点任务">重点任务</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                                    <select
                                        value={newGoal.priority}
                                        onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    >
                                        <option value="High">High (高)</option>
                                        <option value="Medium">Medium (中)</option>
                                        <option value="Low">Low (低)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">牵头部门</label>
                                <input
                                    type="text"
                                    value={newGoal.owner}
                                    onChange={(e) => setNewGoal({ ...newGoal, owner: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="例如：民政局"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                <textarea
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-24 resize-none"
                                    placeholder="请输入事项的详细背景或目标..."
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newGoal.title}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newGoal.title ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                            >
                                创建事项
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图 3: 业务建模 (Placeholder)
// ------------------------------------------------------------------
const BusinessModelingView = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Layout size={64} className="mb-4 text-slate-200" />
        <h3 className="text-lg font-medium text-slate-600">业务建模工作台 (TD-03)</h3>
        <p className="max-w-md text-center mt-2">在此处定义 L1 业务对象、属性及 L2 场景关系。该模块对应架构图左侧流程。</p>
    </div>
);

// ------------------------------------------------------------------
// 视图 4: 技术发现 (Placeholder)
// ------------------------------------------------------------------
const TechDiscoveryView = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Database size={64} className="mb-4 text-slate-200" />
        <h3 className="text-lg font-medium text-slate-600">数据发现中心 (BU-02)</h3>
        <p className="max-w-md text-center mt-2">在此处配置数据源连接，运行元数据爬虫及 AI 候选对象生成。该模块对应架构图右侧流程。</p>
    </div>
);

// ==========================================
// 辅助小组件
// ==========================================

const StatCard = ({ label, value, trend, icon: Icon, color }) => {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
        purple: "text-purple-600 bg-purple-50 border-purple-200",
        orange: "text-orange-600 bg-orange-50 border-orange-200",
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mr-2">{trend}</span>
                <span className="text-slate-400">vs last week</span>
            </div>
        </div>
    );
};

const StepItem = ({ status, text }) => (
    <div className="flex items-center gap-3">
        {status === 'done' ? (
            <div className="min-w-[20px] h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={12} />
            </div>
        ) : (
            <div className="min-w-[20px] h-5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
        )}
        <span className={`text-sm ${status === 'done' ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>{text}</span>
    </div>
);

// Helper Icon for Catalog
const BookIcon = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);