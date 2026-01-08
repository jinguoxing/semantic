import { useState } from 'react';
import { Database, Search, ChevronRight, Cpu, CheckCircle, Star, Tag, FileText, Layers, ShieldCheck, Activity, ArrowLeft, Table, Clock, Server } from 'lucide-react';

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
    const [semanticProfile, setSemanticProfile] = useState<{
        businessName: string;
        description: string;
        scenarios: string[];
        coreFields: { field: string; reason: string }[];
        qualityScore: number;
        privacyLevel: string;
    }>({
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
                businessName: asset.semanticAnalysis.chineseName || '',
                description: asset.semanticAnalysis.description || '',
                scenarios: asset.semanticAnalysis.scenarios?.map((s: any) => s.type) || [],
                coreFields: asset.semanticAnalysis.coreFields || [],
                qualityScore: asset.semanticAnalysis.qualityScore || 85,
                privacyLevel: asset.semanticAnalysis.privacyLevel || 'L2'
            });
            setEditMode(false);
        } else {
            setSemanticProfile({
                businessName: '', description: '', scenarios: [], coreFields: [],
                qualityScore: 0, privacyLevel: 'L1'
            });
            setEditMode(true); // Default to edit mode if not analyzed
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

        setTimeout(() => {
            // Mock AI Analysis
            const result = {
                businessName: selectedTable.table.replace('t_', '').replace(/_/g, ' '),
                description: `AI 智能分析：该数据实体主要用于存储和管理 ${selectedTable.table.split('_')[1] || '业务'} 相关信息。`,
                scenarios: ['业务查询', '统计报表', '数据归档'],
                coreFields: (selectedTable.fields || []).slice(0, 3).map((f: any) => ({ field: f.name, reason: '高频查询字段' })),
                qualityScore: Math.floor(Math.random() * 15) + 80,
                privacyLevel: ['L1', 'L2', 'L3'][Math.floor(Math.random() * 3)]
            };

            setSemanticProfile(result as any);
            setIsAnalyzing(false);
            setEditMode(true);
        }, 1500);
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
                                        ? `当前筛选: ${dataSources.find((d: any) => d.id === selectedDataSourceId)?.name}`
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
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[selectedTable.sourceType]?.bgColor} ${typeConfig[selectedTable.sourceType]?.color}`}>
                                            {selectedTable.sourceType}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">{selectedTable.comment || '暂无物理表注释'}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Server size={12} /> {selectedTable.sourceName}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> 最后更新: {selectedTable.updateTime || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleBackToList} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                                    返回列表
                                </button>
                                <button onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 shadow-sm shadow-emerald-200 flex items-center gap-2">
                                    <Cpu size={14} className={isAnalyzing ? "animate-spin" : ""} />
                                    {isAnalyzing ? '分析中...' : 'AI 语义重分析'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Semantic Definition */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Semantic Info Card */}
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <FileText size={18} className="text-blue-500" />
                                            业务语义定义
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">业务名称</label>
                                                <input
                                                    type="text"
                                                    value={semanticProfile.businessName}
                                                    onChange={e => setSemanticProfile({ ...semanticProfile, businessName: e.target.value })}
                                                    disabled={!editMode}
                                                    placeholder="请输入业务名称"
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1">详细描述</label>
                                                <textarea
                                                    value={semanticProfile.description}
                                                    onChange={e => setSemanticProfile({ ...semanticProfile, description: e.target.value })}
                                                    disabled={!editMode}
                                                    rows={3}
                                                    placeholder="业务描述..."
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Field List Card */}
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                <Table size={18} className="text-slate-500" />
                                                字段结构
                                            </h3>
                                            <span className="text-xs text-slate-500">{selectedTable.fields?.length || 0} 个字段</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-5 py-2 w-10">#</th>
                                                        <th className="px-5 py-2">字段名</th>
                                                        <th className="px-5 py-2">类型</th>
                                                        <th className="px-5 py-2">注释</th>
                                                        <th className="px-5 py-2">AI 建议</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedTable.fields?.map((field: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-5 py-2 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                            <td className="px-5 py-2 font-mono text-slate-700">{field.name}</td>
                                                            <td className="px-5 py-2 text-xs text-slate-500 max-w-[100px] truncate">{field.type}</td>
                                                            <td className="px-5 py-2 text-slate-600 truncate max-w-[150px]">{field.comment || '-'}</td>
                                                            <td className="px-5 py-2">
                                                                {field.suggestion ? (
                                                                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">{field.suggestion}</span>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: AI Insights */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Activity size={18} className="text-emerald-500" />
                                            AI 质量评估
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">质量得分</span>
                                                <span className="text-xl font-bold text-emerald-600">{semanticProfile.qualityScore}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${semanticProfile.qualityScore}%` }}></div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-slate-600">隐私等级</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${semanticProfile.privacyLevel.includes('L3') || semanticProfile.privacyLevel.includes('L4') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {semanticProfile.privacyLevel}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">
                                                    {semanticProfile.privacyLevel.includes('L3') || semanticProfile.privacyLevel.includes('L4')
                                                        ? '包含敏感个人信息，建议开启字段级加密。'
                                                        : '低敏感数据，可作为一般业务实体使用。'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Star size={18} className="text-amber-500" />
                                            核心字段
                                        </h4>
                                        <div className="space-y-2">
                                            {semanticProfile.coreFields.map((cf, i) => (
                                                <div key={i} className="text-sm border-l-2 border-amber-400 pl-3 py-1">
                                                    <div className="font-mono font-medium text-slate-700">{cf.field}</div>
                                                    <div className="text-xs text-slate-400">{cf.reason}</div>
                                                </div>
                                            ))}
                                            {semanticProfile.coreFields.length === 0 && <p className="text-xs text-slate-400">暂无核心字段</p>}
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Tag size={18} className="text-slate-500" />
                                            场景标签
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {semanticProfile.scenarios.map((s, i) => (
                                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                                    {s}
                                                </span>
                                            ))}
                                            {editMode && <button className="px-2 py-1 border border-dashed border-slate-300 rounded text-xs text-slate-400 hover:text-slate-600 hover:border-slate-400">+ Tag</button>}
                                        </div>
                                    </div>

                                    {editMode && (
                                        <button onClick={handleSaveToMetadata} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
                                            <CheckCircle size={16} /> 保存配置
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSemanticUnderstandingView;
