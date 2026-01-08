import { useState } from 'react';
import { Database, Search, ChevronRight, Cpu, CheckCircle, Star, Tag, FileText, Layers, ShieldCheck, Activity, ArrowLeft, Table, Clock, Server, RefreshCw, X, AlertCircle, Settings, AlertTriangle, Share2 } from 'lucide-react';

interface DataSemanticUnderstandingViewProps {
    scanResults: any[];
    setScanResults: (fn: (prev: any[]) => any[]) => void;
}

const DataSemanticUnderstandingView = ({ scanResults, setScanResults }: DataSemanticUnderstandingViewProps) => {
    // State
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(null); // null means all
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);
    const [searchTerm, setSearchTerm] = useState('');

    // Detail View State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [detailTab, setDetailTab] = useState<'fields' | 'graph'>('fields');
    const [semanticProfile, setSemanticProfile] = useState<{
        analysisStep: 'idle' | 'analyzing' | 'done';
        gateResult: 'PASS' | 'REJECT' | 'REVIEW';
        gateDetail?: { t01: string, t02: string, t03: string, t04: string };
        finalScore: number;
        aiScore: number;
        ruleScore: number;
        aiEvidence?: string[];
        businessName: string;
        description: string;
        scenarios: string[];
        coreFields: { field: string; reason: string }[];
        qualityScore: number;
        privacyLevel: string;
        relationships?: { targetTable: string; type: string; key: string; description: string }[];
    }>({
        analysisStep: 'idle',
        gateResult: 'PASS',
        finalScore: 0,
        aiScore: 0,
        ruleScore: 0,
        businessName: '',
        description: '',
        scenarios: [],
        coreFields: [],
        qualityScore: 0,
        privacyLevel: 'Low'
    });

    // Derived Data
    // Get unique data sources from scan results (assuming scanResults contains source info)
    // Or we use a mock list of sources if scanResults doesn't have full source metadata, 
    // but usually scanResults items should have 'sourceId', 'sourceName', 'sourceType'.
    // We will extract unique sources from the assets list.
    const assets = scanResults.filter(r => r.status === 'scanned' || r.status === 'analyzed');

    const dataSourcesMap = assets.reduce((acc: any, asset: any) => {
        if (!asset.sourceId) return acc;
        if (!acc[asset.sourceId]) {
            acc[asset.sourceId] = {
                id: asset.sourceId,
                name: asset.sourceName || 'Unknown Source',
                type: asset.sourceType || 'MySQL'
            };
        }
        return acc;
    }, {});
    const dataSources = Object.values(dataSourcesMap);

    // Group Sources by Type for the Left Tree
    const typeGroups = dataSources.reduce((acc: Record<string, any[]>, ds: any) => {
        if (!acc[ds.type]) acc[ds.type] = [];
        acc[ds.type].push(ds);
        return acc;
    }, {} as Record<string, any[]>);

    // Filtered Assets list for Right Panel
    const filteredAssets = assets.filter(asset => {
        const matchesSource = selectedDataSourceId ? asset.sourceId === selectedDataSourceId : true;
        const matchesSearch = searchTerm === '' ||
            asset.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.comment || '').includes(searchTerm) ||
            (asset.semanticAnalysis?.chineseName || '').includes(searchTerm);
        return matchesSource && matchesSearch;
    });

    const selectedTable = assets.find(a => a.table === selectedTableId);

    // Helpers
    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleDataSourceSelect = (dsId: string | null) => {
        setSelectedDataSourceId(dsId);
        setViewMode('list');
        setSelectedTableId(null);
    };

    const handleTableClick = (tableId: string) => {
        setSelectedTableId(tableId);

        // Prepare semantic profile for detail view
        const asset = assets.find(a => a.table === tableId);
        if (asset?.semanticAnalysis) {
            setSemanticProfile({
                analysisStep: asset.semanticAnalysis.analysisStep || 'done',
                gateResult: asset.semanticAnalysis.gateResult || 'PASS',
                gateDetail: asset.semanticAnalysis.gateDetail,
                finalScore: asset.semanticAnalysis.finalScore ?? 0.85,
                aiScore: asset.semanticAnalysis.aiScore ?? 0.9,
                ruleScore: asset.semanticAnalysis.ruleScore ?? 0.8,
                aiEvidence: asset.semanticAnalysis.aiEvidence,
                businessName: asset.semanticAnalysis.businessName || asset.semanticAnalysis.chineseName || '',
                description: asset.semanticAnalysis.description || '',
                scenarios: (asset.semanticAnalysis.scenarios || []).map((s: any) => typeof s === 'string' ? s : s.type),
                coreFields: asset.semanticAnalysis.coreFields || [],
                qualityScore: asset.semanticAnalysis.qualityScore || 85,
                privacyLevel: asset.semanticAnalysis.privacyLevel || 'L2',
                relationships: asset.semanticAnalysis.relationships || []
            });
            // If already analyzed (done), start in View mode (editMode = false). If not using semantic analysis, start in Edit mode.
            setEditMode(asset.semanticAnalysis.analysisStep !== 'done');
        } else {
            // New / Unanalyzed
            setSemanticProfile({
                analysisStep: 'idle',
                gateResult: 'PASS',
                finalScore: 0,
                aiScore: 0,
                ruleScore: 0,
                businessName: '',
                description: '',
                scenarios: [],
                coreFields: [],
                qualityScore: 0,
                privacyLevel: 'L1',
                relationships: []
            });
            setEditMode(true);
        }

        setViewMode('detail');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTableId(null);
    };

    const handleAnalyze = () => {
        if (!selectedTable) return;
        setIsAnalyzing(true);
        // Reset state for new analysis
        setSemanticProfile(prev => ({ ...prev, analysisStep: 'analyzing', gateResult: 'PASS' }));

        setTimeout(() => {
            // Mock AI Analysis Result
            const isLogTable = selectedTable.table.toLowerCase().includes('log');

            const result = {
                analysisStep: 'done' as const,
                gateResult: isLogTable ? 'REJECT' as const : 'PASS' as const,
                gateDetail: {
                    t01: isLogTable ? 'fail' : 'pass',
                    t02: 'pass',
                    t03: 'pass',
                    t04: isLogTable ? 'fail' : 'pass',
                },
                finalScore: isLogTable ? 0.35 : 0.88,
                aiScore: isLogTable ? 0.2 : 0.92,
                ruleScore: 0.85,
                aiEvidence: isLogTable ? ['Table name contains "log"', 'High density of timestamp fields'] : ['Naming matches entity pattern', 'Primary key identified', 'Rich business attributes'],

                businessName: selectedTable.table.replace('t_', '').replace(/_/g, ' '),
                description: `AI 智能分析：该数据实体主要用于存储和管理 ${selectedTable.table.split('_')[1] || '业务'} 相关信息。`,
                scenarios: ['业务查询', '统计报表', '数据归档'],
                coreFields: (selectedTable.fields || []).slice(0, 3).map((f: any) => ({ field: f.name, reason: '高频查询字段' })),
                qualityScore: Math.floor(Math.random() * 15) + 80,
                privacyLevel: ['L1', 'L2', 'L3'][Math.floor(Math.random() * 3)],
                // Preserve existing relationships or mock new ones if empty
                relationships: semanticProfile.relationships && semanticProfile.relationships.length > 0
                    ? semanticProfile.relationships
                    : selectedTable.table === 't_order_main' ? [
                        { targetTable: 't_user_profile', type: 'Many-to-One', key: 'user_id' },
                        { targetTable: 't_order_item', type: 'One-to-Many', key: 'order_id' },
                        { targetTable: 't_pay_flow', type: 'One-to-One', key: 'pay_id' }
                    ] : []
            };

            setSemanticProfile(result as any);
            setIsAnalyzing(false);
            setEditMode(true); // Allow review/edit after analysis
        }, 1500);
    };

    const handleIgnore = () => {
        if (!selectedTable) return;
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, status: 'ignored' }
                : item
        ));
        setViewMode('list');
        setSelectedTableId(null);
    };

    const handleSaveToMetadata = () => {
        if (!selectedTable) return;
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, status: 'analyzed', semanticAnalysis: { ...semanticProfile } }
                : item
        ));
        setEditMode(false);
    };

    const typeConfig: Record<string, { color: string; bgColor: string }> = {
        MySQL: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
        Oracle: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
        PostgreSQL: { color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    };

    return (
        <div className="h-full flex animate-fade-in gap-4">
            {/* Left Panel - Source Tree */}
            <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Database size={16} className="text-blue-600" /> 数据源视图
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <button
                        onClick={() => handleDataSourceSelect(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 font-medium transition-colors ${selectedDataSourceId === null ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Layers size={14} />
                        全部数据源
                    </button>

                    {Object.entries(typeGroups).map(([type, items]: [string, any]) => (
                        <div key={type} className="mb-1">
                            <button onClick={() => toggleType(type)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors text-slate-700">
                                <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedTypes.includes(type) ? 'rotate-90' : ''}`} />
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.bgColor || 'bg-slate-100'} ${typeConfig[type]?.color || ''}`}>{type}</span>
                            </button>
                            {expandedTypes.includes(type) && (
                                <div className="ml-5 space-y-0.5 mt-1 border-l border-slate-100 pl-1">
                                    {items.map((ds: any) => (
                                        <button key={ds.id} onClick={() => handleDataSourceSelect(ds.id)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${selectedDataSourceId === ds.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                                            <Server size={12} className={selectedDataSourceId === ds.id ? 'text-blue-500' : 'text-slate-400'} />
                                            <span className="truncate" title={ds.name}>{ds.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel - List or Detail */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {viewMode === 'list' && (
                    <div className="flex flex-col h-full">
                        {/* List Header & Filter */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">逻辑视图列表</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {selectedDataSourceId
                                        ? `当前筛选: ${(dataSources.find((d: any) => d.id === selectedDataSourceId) as any)?.name}`
                                        : '显示所有已扫描的物理资产'}
                                </p>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="搜索表名、业务名..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Data Grid */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">表技术名称</th>
                                        <th className="px-6 py-3 font-medium">表业务名称</th>
                                        <th className="px-6 py-3 font-medium">所属数据源</th>
                                        <th className="px-6 py-3 font-medium w-24">行数</th>
                                        <th className="px-6 py-3 font-medium w-40">更新时间</th>
                                        <th className="px-6 py-3 font-medium w-24 text-center">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAssets.map(asset => (
                                        <tr key={asset.table}
                                            onClick={() => handleTableClick(asset.table)}
                                            className="hover:bg-blue-50/50 cursor-pointer group transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-mono text-blue-600 font-medium">
                                                    <Table size={14} className="opacity-50" />
                                                    {asset.table}
                                                </div>
                                                {asset.comment && <div className="text-xs text-slate-400 mt-0.5 pl-6 truncate w-48">{asset.comment}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {asset.semanticAnalysis?.chineseName ? (
                                                    <span className="text-slate-800 font-medium">{asset.semanticAnalysis.chineseName}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">- 未定义 -</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${typeConfig[asset.sourceType]?.bgColor.replace('bg-', 'bg-') || 'bg-slate-400'}`}></span>
                                                    {asset.sourceName}
                                                </div>
                                                <div className="text-[10px] text-slate-400 pl-3">{asset.sourceType}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono">
                                                {asset.rows || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {asset.updateTime?.split(' ')[0] || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {asset.status === 'analyzed' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">
                                                        <CheckCircle size={10} /> 已分析
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                                                        待分析
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAssets.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <Search size={48} className="mx-auto mb-4 opacity-10" />
                                    <p>没有找到匹配的表</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'detail' && selectedTable && (
                    <div className="flex flex-col h-full animate-slide-in-right">
                        {/* Detail Header */}
                        <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-start">
                            <div className="flex gap-4">
                                <button onClick={handleBackToList} className="mt-1 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors h-fit">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-bold text-slate-800">{selectedTable.table}</h2>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[selectedTable.sourceType]?.bgColor || 'bg-slate-100'} ${typeConfig[selectedTable.sourceType]?.color || 'text-slate-600'}`}>
                                            {selectedTable.sourceType}
                                        </span>
                                        {/* Analysis Status Badge */}
                                        {semanticProfile.analysisStep === 'done' ? (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle size={10} /> 语义分析完成
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs border border-slate-200">
                                                未分析
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">{selectedTable.comment || '暂无物理表注释'}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleBackToList} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                                    返回列表
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || semanticProfile.analysisStep === 'done'}
                                    className={`px-4 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2 text-white transition-all ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' :
                                        semanticProfile.analysisStep === 'done' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isAnalyzing ? (
                                        <><RefreshCw size={14} className="animate-spin" /> 分析计算中...</>
                                    ) : semanticProfile.analysisStep === 'done' ? (
                                        <><RefreshCw size={14} /> 重新分析</>
                                    ) : (
                                        <><Cpu size={14} /> 开始语义识别</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

                            {/* Analysis Progress / Result Area */}
                            {(isAnalyzing || semanticProfile.analysisStep !== 'idle') && (
                                <div className="mb-6 space-y-6">

                                    {/* Stage 1: Gate Check */}
                                    <div className={`p-4 rounded-xl border transition-all duration-300 ${semanticProfile.gateResult === 'REJECT' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <ShieldCheck size={18} className={semanticProfile.gateResult === 'PASS' ? "text-emerald-500" : "text-slate-400"} />
                                            第一阶段：规则门控 (Gate Keepers)
                                        </h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { code: 'T-01', name: '表名语义', status: semanticProfile.gateDetail?.t01 },
                                                { code: 'T-02', name: '主键校验', status: semanticProfile.gateDetail?.t02 },
                                                { code: 'T-03', name: '生命周期', status: semanticProfile.gateDetail?.t03 },
                                                { code: 'T-04', name: '排除列表', status: semanticProfile.gateDetail?.t04 },
                                            ].map((rule) => (
                                                <div key={rule.code} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div>
                                                        <div className="text-xs text-slate-400 font-mono">{rule.code}</div>
                                                        <div className="text-sm font-medium text-slate-700">{rule.name}</div>
                                                    </div>
                                                    {rule.status === 'pass' && <CheckCircle size={16} className="text-emerald-500" />}
                                                    {rule.status === 'fail' && <X size={16} className="text-red-500" />}
                                                    {rule.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />}
                                                </div>
                                            ))}
                                        </div>
                                        {semanticProfile.gateResult === 'REJECT' && (
                                            <div className="mt-3 text-red-600 text-sm flex items-center gap-2">
                                                <AlertCircle size={14} />
                                                此表被规则引擎识别为非业务实体（如日志/临时表），建议跳过建模。
                                            </div>
                                        )}
                                    </div>

                                    {/* Stage 2 & 3 - Only show if Gate Passed */}
                                    {semanticProfile.gateResult === 'PASS' && semanticProfile.analysisStep === 'done' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">

                                            {/* Score Card */}
                                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                    <Activity size={18} className="text-blue-500" />
                                                    第二阶段：混合评分
                                                </h3>
                                                <div className="flex items-end justify-between mb-4">
                                                    <div className="text-center">
                                                        <div className="text-3xl font-bold text-slate-800">{semanticProfile.finalScore}</div>
                                                        <div className="text-xs text-slate-500">最终置信度</div>
                                                    </div>
                                                    <div className="text-2xl font-light text-slate-300">=</div>
                                                    <div className="text-center">
                                                        <div className="text-xl font-semibold text-blue-600">0.55 × {semanticProfile.aiScore}</div>
                                                        <div className="text-xs text-slate-500">AI 评分</div>
                                                    </div>
                                                    <div className="text-2xl font-light text-slate-300">+</div>
                                                    <div className="text-center">
                                                        <div className="text-xl font-semibold text-purple-600">0.45 × {semanticProfile.ruleScore}</div>
                                                        <div className="text-xs text-slate-500">规则加权</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                                    <div className="text-xs font-medium text-slate-500">AI 判定依据 (Evidence):</div>
                                                    {semanticProfile.aiEvidence?.map((e: string, i: number) => (
                                                        <div key={i} className="text-xs text-slate-600 flex gap-2">
                                                            <span className="text-blue-500">•</span> {e}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* AI Suggestion */}
                                            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                        <Cpu size={18} className="text-purple-500" />
                                                        语义结论建议
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">建议业务名称</label>
                                                            <div className="flex items-center gap-2">
                                                                {editMode ? (
                                                                    <input
                                                                        type="text"
                                                                        value={semanticProfile.businessName}
                                                                        onChange={(e) => setSemanticProfile({ ...semanticProfile, businessName: e.target.value })}
                                                                        className="text-lg font-bold text-slate-800 border-b border-blue-300 focus:outline-none focus:border-blue-500 bg-transparent w-full"
                                                                    />
                                                                ) : (
                                                                    <div className="text-lg font-bold text-slate-800">{semanticProfile.businessName}</div>
                                                                )}
                                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100 pointer-events-none whitespace-nowrap">AI 生成</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-500 block mb-1">识别业务域</label>
                                                            <div className="flex gap-2">
                                                                {semanticProfile.scenarios.map((s, i) => (
                                                                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{s}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="text-xs text-slate-500 block mb-1">业务描述</label>
                                                            {editMode ? (
                                                                <textarea
                                                                    value={semanticProfile.description}
                                                                    onChange={(e) => setSemanticProfile({ ...semanticProfile, description: e.target.value })}
                                                                    className="w-full text-sm text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none h-24"
                                                                />
                                                            ) : (
                                                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                                                                    {semanticProfile.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                                                    <button onClick={handleIgnore} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-colors">忽略此对象</button>
                                                    <button onClick={handleSaveToMetadata} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm flex items-center gap-2 transition-transform active:scale-95">
                                                        <CheckCircle size={16} /> 确认并生成逻辑实体
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Field List & Relationships (Tabs) */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="border-b border-slate-100 bg-slate-50 flex items-center px-2">
                                    <button
                                        onClick={() => setDetailTab('fields')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'fields' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                    >
                                        <Table size={16} /> 字段结构 ({selectedTable.fields?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setDetailTab('graph')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'graph' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                    >
                                        <Share2 size={16} /> 关系图谱 ({semanticProfile.relationships?.length || 0})
                                    </button>
                                </div>

                                {/* Relationships View (Simple Visualization) */}
                                {detailTab === 'graph' ? (
                                    semanticProfile.relationships && semanticProfile.relationships.length > 0 ? (
                                        <div className="p-6 bg-slate-50/30 min-h-[400px]">
                                            <div className="flex items-center justify-center py-8">
                                                {/* Star Topology Visualization */}
                                                <div className="relative flex items-center">
                                                    {/* Center Node */}
                                                    <div className="z-10 w-32 h-32 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center p-2 text-center shadow-lg border-4 border-blue-100 animate-pulse-subtle">
                                                        <Database size={24} className="mb-1 opacity-80" />
                                                        <div className="text-xs font-bold truncate w-full px-2">{selectedTable.table}</div>
                                                        <div className="text-[10px] opacity-80">当前实体</div>
                                                    </div>

                                                    {/* Connected Nodes */}
                                                    {semanticProfile.relationships.map((rel, idx) => {
                                                        // Calculate position in a circle
                                                        const angle = (idx * (360 / semanticProfile.relationships!.length)) * (Math.PI / 180);
                                                        const radius = 180;
                                                        const x = Math.cos(angle) * radius;
                                                        const y = Math.sin(angle) * radius;

                                                        return (
                                                            <div key={idx} className="absolute flex flex-col items-center group" style={{ transform: `translate(${x}px, ${y}px)` }}>
                                                                {/* Connection Line */}
                                                                <div className="absolute top-1/2 left-1/2 -z-10 w-[180px] h-[2px] bg-slate-300 origin-center"
                                                                    style={{
                                                                        transform: `translate(-50%, -50%) rotate(${angle * (180 / Math.PI) + 180}deg)`,
                                                                        width: `${radius}px`,
                                                                        left: `${-x / 2}px`,
                                                                        top: `${-y / 2}px`
                                                                    }}>
                                                                </div>

                                                                <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center p-2 text-center z-10 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                                                                    <div className="text-[10px] font-bold text-slate-500 mb-1">{rel.type}</div>
                                                                    <div className="text-xs font-bold text-slate-700 break-all leading-tight">{rel.targetTable}</div>
                                                                    <div className="mt-1 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{rel.key}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-slate-400 min-h-[400px] flex flex-col items-center justify-center">
                                            <Share2 size={48} className="opacity-20 mb-4" />
                                            <p>暂无关联关系数据</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-2 w-10">#</th>
                                                    <th className="px-5 py-2">物理字段</th>
                                                    <th className="px-5 py-2">类型</th>
                                                    <th className="px-5 py-2">
                                                        <span className="flex items-center gap-1 text-purple-600"><Settings size={12} /> 规则判定</span>
                                                    </th>
                                                    <th className="px-5 py-2">
                                                        <span className="flex items-center gap-1 text-blue-600"><Cpu size={12} /> AI 建议</span>
                                                    </th>
                                                    <th className="px-5 py-2 text-center">状态</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {selectedTable.fields?.map((field: any, idx: number) => {
                                                    // Mock determination just for display
                                                    const ruleRole = field.name.endsWith('_id') ? 'Identifier' : field.name.includes('time') ? 'EventHint' : 'BusAttr';
                                                    const aiRole = field.suggestion ? field.suggestion : ruleRole;
                                                    const hasConflict = ruleRole !== aiRole && aiRole !== 'unknown';

                                                    return (
                                                        <tr key={idx} className={`hover:bg-slate-50 ${hasConflict ? 'bg-amber-50/50' : ''}`}>
                                                            <td className="px-5 py-2 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                            <td className="px-5 py-2 font-mono text-slate-700">{field.name}</td>
                                                            <td className="px-5 py-2 text-xs text-slate-500">{field.type}</td>
                                                            <td className="px-5 py-2">
                                                                <span className="px-2 py-0.5 rounded text-xs border border-purple-100 bg-purple-50 text-purple-700 font-mono">
                                                                    {ruleRole}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-2">
                                                                {isAnalyzing ? (
                                                                    <span className="animate-pulse bg-slate-200 h-4 w-12 rounded inline-block"></span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded text-xs border border-blue-100 bg-blue-50 text-blue-700 font-mono">
                                                                        {aiRole}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-2 text-center">
                                                                {hasConflict && !isAnalyzing && (
                                                                    <div className="flex justify-center group relative">
                                                                        <AlertTriangle size={16} className="text-amber-500 cursor-help" />
                                                                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded z-10">
                                                                            规则判定为 {ruleRole}，但 AI 建议为 {aiRole}，请确认。
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSemanticUnderstandingView;
