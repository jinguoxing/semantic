import { useState } from 'react';
import { Database, Search, ChevronRight, Cpu, CheckCircle, Star, Tag, FileText, Layers, ShieldCheck, Activity, ArrowLeft, Table, Clock, Server, RefreshCw, X, AlertCircle, Settings, AlertTriangle, Share2, Shield, Plus, Edit3 } from 'lucide-react';

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
    // Batch Analysis State
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [batchAnalyzing, setBatchAnalyzing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [batchResults, setBatchResults] = useState<{
        tableId: string;
        tableName: string;
        businessName: string;
        status: 'success' | 'error' | 'pending';
        scorePercent: number;
        needsReview?: boolean;
        userAction?: 'accepted' | 'rejected' | 'pending';
    }[]>([]);
    const [showBatchReview, setShowBatchReview] = useState(false);


    // Detail View State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [detailTab, setDetailTab] = useState<'fields' | 'graph' | 'dimensions' | 'quality'>('fields');
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');
    const [expandedFields, setExpandedFields] = useState<string[]>([]);
    // Track user's conflict resolution choices: fieldName -> { role: string, source: 'rule' | 'ai' }
    const [fieldRoleOverrides, setFieldRoleOverrides] = useState<Record<string, { role: string; source: 'rule' | 'ai' }>>({});
    // Track which field's conflict popover is currently open (click-based)
    const [openConflictPopover, setOpenConflictPopover] = useState<string | null>(null);
    // Track user's sensitivity level overrides: fieldName -> sensitivityLevel
    const [sensitivityOverrides, setSensitivityOverrides] = useState<Record<string, 'L1' | 'L2' | 'L3' | 'L4'>>({});
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
    // Relationship editing state
    const [showRelModal, setShowRelModal] = useState(false);
    const [editingRel, setEditingRel] = useState<{ index: number | null; targetTable: string; type: string; key: string }>({
        index: null, targetTable: '', type: 'Many-to-One', key: ''
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

    // Conflict resolution: user chooses to adopt rule or AI suggestion
    const resolveConflict = (fieldName: string, choice: 'rule' | 'ai', ruleRole: string, aiRole: string) => {
        const chosenRole = choice === 'rule' ? ruleRole : aiRole;
        setFieldRoleOverrides(prev => ({
            ...prev,
            [fieldName]: { role: chosenRole, source: choice }
        }));
    };

    // Toggle table selection for batch analysis
    const toggleTableSelection = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        );
    };

    // Handle batch analysis for selected tables
    const handleBatchAnalyze = async () => {
        if (selectedTables.length === 0) return;
        setBatchAnalyzing(true);
        setBatchProgress({ current: 0, total: selectedTables.length });
        const results: typeof batchResults = [];
        const CONFIDENCE_THRESHOLD = 70;

        for (let i = 0; i < selectedTables.length; i++) {
            const tableId = selectedTables[i];
            const table = scanResults.find((t: any) => t.table === tableId);
            if (!table) continue;

            setBatchProgress({ current: i + 1, total: selectedTables.length });

            // Simulate AI analysis with random delay
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

            // Mock analysis result with random scores
            const scorePercent = Math.floor(50 + Math.random() * 50);
            const businessName = table.table
                .replace(/^t_/, '')
                .split('_')
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('');
            const needsReview = scorePercent < CONFIDENCE_THRESHOLD;

            results.push({
                tableId: table.table,
                tableName: table.table,
                businessName,
                status: 'success',
                scorePercent,
                needsReview,
                userAction: 'pending'
            });

            // Update scanResults to mark as pending_review
            setScanResults((prev: any[]) => prev.map((item: any) =>
                item.table === tableId
                    ? { ...item, status: 'pending_review', scorePercent }
                    : item
            ));
        }

        setBatchResults(results);
        setBatchAnalyzing(false);
        setSelectedTables([]);

        // Show review modal if there are results needing review
        if (results.some(r => r.needsReview)) {
            setShowBatchReview(true);
        }
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
        <>
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
                                {/* Batch Action Toolbar */}
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTables.length > 0 && selectedTables.length === filteredAssets.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTables(filteredAssets.map(a => a.table));
                                                    } else {
                                                        setSelectedTables([]);
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                            />
                                            全选
                                        </label>
                                        {selectedTables.length > 0 && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                已选 {selectedTables.length} 张表
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {batchAnalyzing ? (
                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                分析中 {batchProgress.current}/{batchProgress.total}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleBatchAnalyze}
                                                disabled={selectedTables.length === 0}
                                                className={`px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${selectedTables.length > 0
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Activity size={14} />
                                                批量分析
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 w-10"></th>
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
                                                className={`hover:bg-blue-50/50 cursor-pointer group transition-colors ${selectedTables.includes(asset.table) ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTables.includes(asset.table)}
                                                        onChange={() => toggleTableSelection(asset.table)}
                                                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                                    />
                                                </td>
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
                                        <button
                                            onClick={() => setDetailTab('dimensions')}
                                            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'dimensions' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                        >
                                            <Layers size={16} /> 语义维度
                                        </button>
                                        <button
                                            onClick={() => setDetailTab('quality')}
                                            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${detailTab === 'quality' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                        >
                                            <Activity size={16} /> 质量概览
                                        </button>
                                    </div>

                                    {/* Relationships View (Simple Visualization) */}
                                    {/* Tab Content Rendering */}
                                    {detailTab === 'graph' ? (
                                        // Graph Tab with Edit Functionality
                                        <div className="p-6 bg-slate-50/30 min-h-[400px]">
                                            {/* Toolbar */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Share2 size={16} className="text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        实体关系图谱
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        ({semanticProfile.relationships?.length || 0} 个关联)
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setEditingRel({ index: null, targetTable: '', type: 'Many-to-One', key: '' });
                                                        setShowRelModal(true);
                                                    }}
                                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                                >
                                                    <Plus size={14} />
                                                    添加关系
                                                </button>
                                            </div>

                                            {semanticProfile.relationships && semanticProfile.relationships.length > 0 ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="relative flex items-center">
                                                        <div className="z-10 w-32 h-32 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center p-2 text-center shadow-lg border-4 border-blue-100">
                                                            <Database size={24} className="mb-1 opacity-80" />
                                                            <div className="text-xs font-bold truncate w-full px-2">{selectedTable.table}</div>
                                                            <div className="text-[10px] opacity-80">当前实体</div>
                                                        </div>
                                                        {semanticProfile.relationships.map((rel, idx) => {
                                                            const angle = (idx * (360 / semanticProfile.relationships!.length)) * (Math.PI / 180);
                                                            const radius = 180;
                                                            const x = Math.cos(angle) * radius;
                                                            const y = Math.sin(angle) * radius;
                                                            return (
                                                                <div key={idx} className="absolute flex flex-col items-center group" style={{ transform: `translate(${x}px, ${y}px)` }}>
                                                                    <div className="absolute top-1/2 left-1/2 -z-10 h-[2px] bg-slate-300 origin-center"
                                                                        style={{ transform: `translate(-50%, -50%) rotate(${angle * (180 / Math.PI) + 180}deg)`, width: `${radius}px`, left: `${-x / 2}px`, top: `${-y / 2}px` }} />
                                                                    <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center p-2 text-center z-10 hover:border-blue-400 transition-all cursor-pointer relative">
                                                                        <div className="text-[10px] font-bold text-slate-500 mb-1">{rel.type}</div>
                                                                        <div className="text-xs font-bold text-slate-700 break-all leading-tight">{rel.targetTable}</div>
                                                                        <div className="mt-1 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{rel.key}</div>
                                                                        {/* Edit/Delete buttons on hover */}
                                                                        <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingRel({ index: idx, targetTable: rel.targetTable, type: rel.type, key: rel.key });
                                                                                    setShowRelModal(true);
                                                                                }}
                                                                                className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
                                                                            >
                                                                                <Edit3 size={10} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSemanticProfile(prev => ({
                                                                                        ...prev,
                                                                                        relationships: prev.relationships?.filter((_, i) => i !== idx)
                                                                                    }));
                                                                                }}
                                                                                className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                                                            >
                                                                                <X size={10} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                                                    <Share2 size={48} className="opacity-20 mb-4" />
                                                    <p>暂无关联关系数据</p>
                                                    <p className="text-xs mt-2">点击上方「添加关系」创建第一个关联</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : detailTab === 'dimensions' ? (
                                        // Dimensions Tab - Seven Dimension Accordion View
                                        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-sm text-slate-500">共 {selectedTable.fields?.length || 0} 个字段</span>
                                                <button
                                                    onClick={() => setExpandedFields(expandedFields.length === selectedTable.fields?.length ? [] : selectedTable.fields?.map((f: any) => f.name) || [])}
                                                    className="text-xs text-blue-600 hover:text-blue-700"
                                                >
                                                    {expandedFields.length === selectedTable.fields?.length ? '全部折叠' : '全部展开'}
                                                </button>
                                            </div>
                                            {selectedTable.fields?.map((field: any, idx: number) => {
                                                const isExpanded = expandedFields.includes(field.name);
                                                // Semantic calculations
                                                const ruleRole = field.name.endsWith('_id') ? 'Identifier' :
                                                    field.name.includes('time') ? 'EventHint' :
                                                        field.name.includes('status') ? 'Status' : 'BusAttr';
                                                const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                    if (name.includes('id_card') || name.includes('bank')) return 'L4';
                                                    if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                    if (name.includes('user') || name.includes('employee')) return 'L2';
                                                    return 'L1';
                                                };
                                                const sensitivity = getSensitivity(field.name);
                                                const getValueDomain = (type: string): string => {
                                                    if (type.includes('tinyint') || type.includes('enum')) return '枚举型';
                                                    if (type.includes('decimal') || type.includes('int')) return '范围型';
                                                    if (type.includes('varchar') && type.includes('18')) return '格式型';
                                                    return '自由文本';
                                                };
                                                const valueDomain = getValueDomain(field.type);
                                                const nullRate = Math.floor(Math.random() * 10);
                                                const uniqueness = field.name.includes('id') ? 100 : Math.floor(Math.random() * 50) + 50;

                                                return (
                                                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                                                        <button
                                                            onClick={() => setExpandedFields(isExpanded
                                                                ? expandedFields.filter(f => f !== field.name)
                                                                : [...expandedFields, field.name]
                                                            )}
                                                            className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <ChevronRight size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                                <span className="font-mono font-medium text-slate-700">{field.name}</span>
                                                                <span className="text-xs text-slate-400">({field.type})</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600">{ruleRole}</span>
                                                                <span className={`px-2 py-0.5 rounded text-xs ${sensitivity === 'L4' ? 'bg-red-50 text-red-600' : sensitivity === 'L3' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>{sensitivity}</span>
                                                            </div>
                                                        </button>
                                                        {isExpanded && (
                                                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-01 语义角色</div>
                                                                    <div className="font-medium text-slate-700">{ruleRole}</div>
                                                                    <div className="text-xs text-slate-400 mt-1">置信度: 95%</div>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-02 类型语义</div>
                                                                    <div className="font-medium text-slate-700">{field.type}</div>
                                                                    <div className="text-xs text-slate-400 mt-1">推断: {field.comment || '未知'}</div>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-03 值域特征</div>
                                                                    <div className="font-medium text-slate-700">{valueDomain}</div>
                                                                    {/* Enhanced value domain details */}
                                                                    {valueDomain === '枚举型' && (
                                                                        <div className="mt-2">
                                                                            <div className="text-[10px] text-slate-400 mb-1">可能值:</div>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {(field.name.includes('status')
                                                                                    ? ['待处理', '进行中', '已完成', '已取消']
                                                                                    : field.name.includes('type')
                                                                                        ? ['普通', 'VIP', '企业']
                                                                                        : ['值1', '值2', '值3']
                                                                                ).map((v, i) => (
                                                                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">{v}</span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {valueDomain === '格式型' && (
                                                                        <div className="mt-2 text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded">
                                                                            {field.name.includes('mobile') || field.name.includes('phone')
                                                                                ? '格式: ^1[3-9]\\d{9}$'
                                                                                : field.name.includes('id_card') || field.name.includes('sfz')
                                                                                    ? '格式: ^\\d{17}[\\dX]$'
                                                                                    : field.name.includes('email')
                                                                                        ? '格式: ^[\\w.-]+@[\\w.-]+$'
                                                                                        : '格式: 固定18位'}
                                                                        </div>
                                                                    )}
                                                                    {valueDomain === '范围型' && (
                                                                        <div className="mt-2 flex items-center gap-3 text-[10px]">
                                                                            <span className="text-slate-400">MIN: <span className="text-slate-600 font-medium">{field.name.includes('amt') || field.name.includes('price') ? '0.01' : '1'}</span></span>
                                                                            <span className="text-slate-400">MAX: <span className="text-slate-600 font-medium">{field.name.includes('amt') || field.name.includes('price') ? '99999.99' : '9999'}</span></span>
                                                                            <span className="text-slate-400">AVG: <span className="text-slate-600 font-medium">{field.name.includes('amt') || field.name.includes('price') ? '258.50' : '156'}</span></span>
                                                                        </div>
                                                                    )}
                                                                    {valueDomain === '自由文本' && (
                                                                        <div className="mt-2 text-[10px] text-slate-500">
                                                                            长度分布: 平均 {Math.floor(Math.random() * 50) + 20} 字符
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-04 敏感等级</div>
                                                                    <div className={`font-medium ${sensitivity === 'L4' ? 'text-red-600' : sensitivity === 'L3' ? 'text-orange-600' : 'text-slate-700'}`}>
                                                                        {sensitivity === 'L4' ? 'L4 高敏' : sensitivity === 'L3' ? 'L3 敏感' : sensitivity === 'L2' ? 'L2 内部' : 'L1 公开'}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-05 业务元信息</div>
                                                                    <input
                                                                        type="text"
                                                                        defaultValue={field.comment || ''}
                                                                        placeholder="业务名称..."
                                                                        className="w-full text-sm font-medium text-slate-700 border-b border-slate-200 focus:border-blue-400 outline-none bg-transparent"
                                                                    />
                                                                    {/* Enhanced metadata */}
                                                                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                                                                        <div>
                                                                            <span className="text-slate-400">责任人:</span>
                                                                            <span className="ml-1 text-slate-600">{field.name.includes('user') ? '用户中心' : field.name.includes('order') ? '交易中心' : '数据管理部'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-slate-400">标准:</span>
                                                                            <span className="ml-1 text-blue-600">{field.name.includes('id') ? 'GB/T 35273' : field.name.includes('time') ? 'ISO 8601' : '-'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-06 质量信号</div>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="text-slate-500">空值率</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div className={`h-full rounded-full ${nullRate > 10 ? 'bg-red-500' : nullRate > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(nullRate * 5, 100)}%` }}></div>
                                                                                </div>
                                                                                <span className={`font-medium ${nullRate > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>{nullRate}%</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="text-slate-500">唯一性</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${uniqueness}%` }}></div>
                                                                                </div>
                                                                                <span className="font-medium text-slate-700">{uniqueness}%</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <span className="text-slate-500">格式一致</span>
                                                                            <span className="font-medium text-emerald-600">{field.name.includes('id') ? '100%' : Math.floor(95 + Math.random() * 5) + '%'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white p-3 rounded-lg border border-slate-100 col-span-2 lg:col-span-3">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">D-07 关联性</div>
                                                                    <div className="text-sm text-slate-600">
                                                                        {field.name.endsWith('_id') ? (
                                                                            <div className="flex items-center gap-4">
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <Share2 size={12} className="text-blue-500" />
                                                                                    <span className="text-slate-500">外键:</span>
                                                                                    <span className="font-mono text-blue-600">t_{field.name.replace('_id', '')}</span>
                                                                                </span>
                                                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded">显式FK</span>
                                                                            </div>
                                                                        ) : field.name.includes('code') || field.name.includes('no') ? (
                                                                            <div className="flex items-center gap-4">
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <Share2 size={12} className="text-amber-500" />
                                                                                    <span className="text-slate-500">潜在关联:</span>
                                                                                    <span className="font-mono text-amber-600">可能与外部系统关联</span>
                                                                                </span>
                                                                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded">隐式FK</span>
                                                                            </div>
                                                                        ) : field.name.includes('total') || field.name.includes('sum') || field.name.includes('count') ? (
                                                                            <div className="flex items-center gap-4">
                                                                                <span className="flex items-center gap-1.5">
                                                                                    <Activity size={12} className="text-purple-500" />
                                                                                    <span className="text-slate-500">派生字段</span>
                                                                                </span>
                                                                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded">计算字段</span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-slate-400">无关联</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Upgrade Suggestions Section */}
                                            {(() => {
                                                // Status Object Detection: status/state fields with expected multiple values
                                                const statusFields = (selectedTable.fields || []).filter((f: any) =>
                                                    f.name.includes('status') || f.name.includes('state') ||
                                                    f.name.includes('phase') || f.name.includes('stage')
                                                );

                                                // Behavior Object Detection: time fields with verb-like semantics
                                                const behaviorVerbs = ['pay', 'create', 'update', 'submit', 'approve', 'confirm', 'cancel', 'delete', 'login', 'logout', 'sign', 'complete', 'finish', 'start', 'end'];
                                                const behaviorFields = (selectedTable.fields || []).filter((f: any) => {
                                                    if (!f.name.includes('time') && !f.name.includes('date') && !f.name.includes('_at')) return false;
                                                    return behaviorVerbs.some(verb => f.name.includes(verb));
                                                });

                                                if (statusFields.length === 0 && behaviorFields.length === 0) return null;

                                                return (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Activity size={16} className="text-amber-500" />
                                                            <span className="text-sm font-bold text-slate-700">升级建议</span>
                                                            <span className="text-xs text-slate-400">基于语义分析自动识别</span>
                                                        </div>

                                                        {statusFields.length > 0 && (
                                                            <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Layers size={14} className="text-amber-600" />
                                                                    <span className="text-sm font-medium text-amber-800">状态对象</span>
                                                                    <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">
                                                                        发现 {statusFields.length} 个
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-amber-700 mb-2">
                                                                    状态字段通常包含多个业务状态值，建议升级为独立的状态对象以便管理状态流转
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {statusFields.map((field: any, idx: number) => (
                                                                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-amber-100">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-mono text-sm text-slate-600">{field.name}</span>
                                                                                <span className="text-slate-400">→</span>
                                                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                                                                    {field.name.replace(/^(.*?)_?(status|state|phase|stage)$/i, '$1')}状态对象
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <button className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600">
                                                                                    升级
                                                                                </button>
                                                                                <button className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
                                                                                    忽略
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {behaviorFields.length > 0 && (
                                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Clock size={14} className="text-blue-600" />
                                                                    <span className="text-sm font-medium text-blue-800">行为对象</span>
                                                                    <span className="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">
                                                                        发现 {behaviorFields.length} 个
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-blue-700 mb-2">
                                                                    时间字段配合动词语义，表示业务行为发生的时刻，建议升级为独立的行为对象
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {behaviorFields.map((field: any, idx: number) => {
                                                                        // Extract verb from field name
                                                                        const matchedVerb = behaviorVerbs.find(v => field.name.includes(v));
                                                                        const behaviorName = matchedVerb ?
                                                                            (matchedVerb === 'pay' ? '支付' :
                                                                                matchedVerb === 'create' ? '创建' :
                                                                                    matchedVerb === 'update' ? '更新' :
                                                                                        matchedVerb === 'submit' ? '提交' :
                                                                                            matchedVerb === 'approve' ? '审批' :
                                                                                                matchedVerb === 'confirm' ? '确认' :
                                                                                                    matchedVerb === 'cancel' ? '取消' :
                                                                                                        matchedVerb === 'delete' ? '删除' :
                                                                                                            matchedVerb === 'login' ? '登录' :
                                                                                                                matchedVerb === 'logout' ? '登出' :
                                                                                                                    matchedVerb === 'sign' ? '签署' :
                                                                                                                        matchedVerb === 'complete' ? '完成' :
                                                                                                                            matchedVerb === 'finish' ? '结束' :
                                                                                                                                matchedVerb === 'start' ? '开始' :
                                                                                                                                    matchedVerb === 'end' ? '终止' : matchedVerb) + '行为'
                                                                            : '业务行为';

                                                                        return (
                                                                            <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-100">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono text-sm text-slate-600">{field.name}</span>
                                                                                    <span className="text-slate-400">→</span>
                                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                                        {behaviorName}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                                                                        升级
                                                                                    </button>
                                                                                    <button className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded">
                                                                                        忽略
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : detailTab === 'quality' ? (
                                        // Quality Overview Tab
                                        <div className="p-6 space-y-6">
                                            {/* Overall Grade */}
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-slate-800">数据质量总览</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500">综合评级:</span>
                                                    <span className="px-3 py-1 text-lg font-bold bg-emerald-100 text-emerald-700 rounded-lg">B+</span>
                                                </div>
                                            </div>

                                            {/* Quality Metrics Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {/* Completeness */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-slate-700">完整性 (非空率)</span>
                                                        <span className="text-lg font-bold text-emerald-600">82%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: '82%' }}></div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        问题字段: <span className="text-amber-600 font-medium">description (空值率 35%)</span>
                                                    </div>
                                                </div>

                                                {/* Consistency */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-slate-700">一致性 (格式符合率)</span>
                                                        <span className="text-lg font-bold text-blue-600">95%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: '95%' }}></div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        问题字段: <span className="text-amber-600 font-medium">mobile (5% 格式异常)</span>
                                                    </div>
                                                </div>

                                                {/* Uniqueness */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-slate-700">唯一性 (主键/标识字段)</span>
                                                        <span className="text-lg font-bold text-purple-600">100%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div className="bg-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        <span className="text-emerald-600">✓ 无重复主键</span>
                                                    </div>
                                                </div>

                                                {/* Timeliness */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-slate-700">时效性 (数据新鲜度)</span>
                                                        <span className="text-lg font-bold text-orange-600">72%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div className="bg-orange-500 h-3 rounded-full transition-all duration-500" style={{ width: '72%' }}></div>
                                                    </div>
                                                    <div className="mt-2 text-xs text-slate-500">
                                                        最后更新: <span className="text-slate-700">2024-05-21 02:00:00</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sensitivity Distribution */}
                                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                <h4 className="font-medium text-slate-700 mb-4">敏感字段分布</h4>
                                                <div className="flex items-end gap-4 h-32">
                                                    {(() => {
                                                        const fields = selectedTable.fields || [];
                                                        const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                            if (name.includes('id_card') || name.includes('bank')) return 'L4';
                                                            if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                            if (name.includes('user') || name.includes('employee')) return 'L2';
                                                            return 'L1';
                                                        };
                                                        const counts = { L1: 0, L2: 0, L3: 0, L4: 0 };
                                                        fields.forEach((f: any) => counts[getSensitivity(f.name)]++);
                                                        const maxCount = Math.max(...Object.values(counts), 1);
                                                        const config = [
                                                            { level: 'L1', label: '公开', color: 'bg-slate-300', count: counts.L1 },
                                                            { level: 'L2', label: '内部', color: 'bg-blue-400', count: counts.L2 },
                                                            { level: 'L3', label: '敏感', color: 'bg-orange-400', count: counts.L3 },
                                                            { level: 'L4', label: '高敏', color: 'bg-red-500', count: counts.L4 },
                                                        ];
                                                        return config.map((item, i) => (
                                                            <div key={i} className="flex-1 flex flex-col items-center">
                                                                <div className={`w-full ${item.color} rounded-t-lg transition-all duration-500`}
                                                                    style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '8px' : '0' }}>
                                                                </div>
                                                                <div className="mt-2 text-center">
                                                                    <div className="text-lg font-bold text-slate-700">{item.count}</div>
                                                                    <div className="text-xs text-slate-500">{item.level}</div>
                                                                    <div className="text-[10px] text-slate-400">{item.label}</div>
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Problem Fields Summary */}
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                                                    <AlertTriangle size={16} /> 质量问题字段 ({Math.min(2, selectedTable.fields?.length || 0)})
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                        <span className="font-mono text-slate-700">description</span>
                                                        <span className="text-amber-600">空值率过高 (35%)</span>
                                                    </div>
                                                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg text-sm">
                                                        <span className="font-mono text-slate-700">remark</span>
                                                        <span className="text-amber-600">字段未使用 (100% 空值)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (() => {
                                        // Calculate conflict stats for batch actions
                                        const allFields = selectedTable.fields || [];
                                        // Filter fields by search term
                                        const filteredFields = fieldSearchTerm.trim()
                                            ? allFields.filter((field: any) =>
                                                field.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                field.type?.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                                                field.comment?.toLowerCase().includes(fieldSearchTerm.toLowerCase())
                                            )
                                            : allFields;
                                        const conflictFields = allFields.filter((field: any) => {
                                            const ruleRole = field.name.endsWith('_id') ? 'Identifier' :
                                                field.name.includes('time') ? 'EventHint' :
                                                    field.name.includes('status') ? 'Status' : 'BusAttr';
                                            const aiRole = field.suggestion ? field.suggestion : ruleRole;
                                            const isResolved = !!fieldRoleOverrides[field.name];
                                            return ruleRole !== aiRole && aiRole !== 'unknown' && !isResolved;
                                        });
                                        const resolvedCount = Object.keys(fieldRoleOverrides).length;

                                        // Batch resolve all conflicts
                                        const batchResolve = (choice: 'rule' | 'ai') => {
                                            const newOverrides: Record<string, { role: string; source: 'rule' | 'ai' }> = { ...fieldRoleOverrides };
                                            conflictFields.forEach((field: any) => {
                                                const ruleRole = field.name.endsWith('_id') ? 'Identifier' :
                                                    field.name.includes('time') ? 'EventHint' :
                                                        field.name.includes('status') ? 'Status' : 'BusAttr';
                                                const aiRole = field.suggestion ? field.suggestion : ruleRole;
                                                newOverrides[field.name] = {
                                                    role: choice === 'rule' ? ruleRole : aiRole,
                                                    source: choice
                                                };
                                            });
                                            setFieldRoleOverrides(newOverrides);
                                        };

                                        return (
                                            // Fields Tab (default)
                                            <div className="overflow-x-auto">
                                                {/* Batch Action Toolbar */}
                                                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                    <div className="flex items-center gap-4 text-xs">
                                                        {/* Search Input */}
                                                        <div className="relative">
                                                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input
                                                                type="text"
                                                                placeholder="搜索字段..."
                                                                value={fieldSearchTerm}
                                                                onChange={(e) => setFieldSearchTerm(e.target.value)}
                                                                className="pl-7 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            {fieldSearchTerm && (
                                                                <button
                                                                    onClick={() => setFieldSearchTerm('')}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="text-slate-600">
                                                            {fieldSearchTerm ? (
                                                                <>匹配 <span className="font-bold text-blue-600">{filteredFields.length}</span> / {allFields.length} 字段</>
                                                            ) : (
                                                                <>共 <span className="font-bold text-slate-800">{allFields.length}</span> 个字段</>
                                                            )}
                                                        </span>
                                                        {/* Show complementary analysis stats */}
                                                        <span className="flex items-center gap-1 text-emerald-600">
                                                            <Layers size={12} />
                                                            融合分析完成
                                                        </span>
                                                        {/* Sensitivity stats */}
                                                        {allFields.filter((f: any) => {
                                                            const name = f.name.toLowerCase();
                                                            return name.includes('id_card') || name.includes('sfz') || name.includes('bank') ||
                                                                name.includes('mobile') || name.includes('phone') || name.includes('address');
                                                        }).length > 0 && (
                                                                <span className="flex items-center gap-1 text-orange-600">
                                                                    <Shield size={12} />
                                                                    <span className="font-medium">{allFields.filter((f: any) => {
                                                                        const name = f.name.toLowerCase();
                                                                        return name.includes('id_card') || name.includes('sfz') || name.includes('bank') ||
                                                                            name.includes('mobile') || name.includes('phone') || name.includes('address');
                                                                    }).length}</span> 敏感字段
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                                {/* Large dataset warning */}
                                                {allFields.length > 50 && (
                                                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-600 flex items-center gap-2">
                                                        <Layers size={14} />
                                                        大表提示: 该表包含 {allFields.length} 个字段，建议使用批量操作或筛选功能
                                                    </div>
                                                )}
                                                <div className={allFields.length > 30 ? "max-h-[500px] overflow-y-auto" : ""}>
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                            <tr>
                                                                <th className="px-4 py-2 w-10">#</th>
                                                                <th className="px-4 py-2">物理字段</th>
                                                                <th className="px-4 py-2">类型</th>
                                                                <th className="px-4 py-2">
                                                                    <span className="flex items-center gap-1 text-purple-600"><Settings size={12} /> 规则判定</span>
                                                                </th>
                                                                <th className="px-4 py-2">
                                                                    <span className="flex items-center gap-1 text-blue-600"><Cpu size={12} /> AI 建议</span>
                                                                </th>
                                                                <th className="px-4 py-2">
                                                                    <span className="flex items-center gap-1 text-orange-600"><Shield size={12} /> 敏感等级</span>
                                                                </th>
                                                                <th className="px-4 py-2 text-center w-28">
                                                                    <span className="flex items-center justify-center gap-1 text-emerald-600"><Layers size={12} /> 融合结果</span>
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {filteredFields.length === 0 && fieldSearchTerm ? (
                                                                <tr>
                                                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                                        <Search size={24} className="mx-auto mb-2 opacity-50" />
                                                                        <div className="text-sm">未找到匹配 "{fieldSearchTerm}" 的字段</div>
                                                                        <button
                                                                            onClick={() => setFieldSearchTerm('')}
                                                                            className="mt-2 text-xs text-blue-500 hover:underline"
                                                                        >
                                                                            清除搜索
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ) : filteredFields.map((field: any, idx: number) => {
                                                                // Semantic role determination
                                                                const ruleRole = field.name.endsWith('_id') ? 'Identifier' :
                                                                    field.name.includes('time') ? 'EventHint' :
                                                                        field.name.includes('status') ? 'Status' : 'BusAttr';
                                                                const aiRole = field.suggestion ? field.suggestion : ruleRole;

                                                                // Check if user has resolved this conflict
                                                                const override = fieldRoleOverrides[field.name];
                                                                const isResolved = !!override;
                                                                const hasConflict = ruleRole !== aiRole && aiRole !== 'unknown' && !isResolved;
                                                                const displayRole = override?.role || ruleRole;

                                                                // Sensitivity level inference (with override support)
                                                                const getInferredSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
                                                                    if (name.includes('id_card') || name.includes('sfz') || name.includes('bank')) return 'L4';
                                                                    if (name.includes('mobile') || name.includes('phone') || name.includes('name') || name.includes('address')) return 'L3';
                                                                    if (name.includes('user') || name.includes('employee')) return 'L2';
                                                                    return 'L1';
                                                                };
                                                                const inferredSensitivity = getInferredSensitivity(field.name);
                                                                const sensitivity = sensitivityOverrides[field.name] || inferredSensitivity;
                                                                const isOverridden = !!sensitivityOverrides[field.name];

                                                                const sensitivityConfig: Record<string, { bg: string, text: string, label: string, selectBg: string }> = {
                                                                    'L1': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'L1 公开', selectBg: 'bg-slate-50' },
                                                                    'L2': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'L2 内部', selectBg: 'bg-blue-50' },
                                                                    'L3': { bg: 'bg-orange-50', text: 'text-orange-600', label: 'L3 敏感', selectBg: 'bg-orange-50' },
                                                                    'L4': { bg: 'bg-red-50', text: 'text-red-600', label: 'L4 高敏', selectBg: 'bg-red-50' },
                                                                };

                                                                return (
                                                                    <tr key={idx} className="hover:bg-slate-50">
                                                                        <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                                        <td className="px-4 py-2.5 font-mono text-slate-700 font-medium">{field.name}</td>
                                                                        <td className="px-4 py-2.5 text-xs text-slate-500">{field.type}</td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-mono ${override?.source === 'rule' ? 'border-2 border-purple-400 bg-purple-100 text-purple-800' : 'border border-purple-100 bg-purple-50 text-purple-700'}`}>
                                                                                {ruleRole}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            {isAnalyzing ? (
                                                                                <span className="animate-pulse bg-slate-200 h-4 w-12 rounded inline-block"></span>
                                                                            ) : (
                                                                                <span className={`px-2 py-0.5 rounded text-xs font-mono ${override?.source === 'ai' ? 'border-2 border-blue-400 bg-blue-100 text-blue-800' : 'border border-blue-100 bg-blue-50 text-blue-700'}`}>
                                                                                    {aiRole}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <select
                                                                                value={sensitivity}
                                                                                onChange={(e) => setSensitivityOverrides(prev => ({
                                                                                    ...prev,
                                                                                    [field.name]: e.target.value as 'L1' | 'L2' | 'L3' | 'L4'
                                                                                }))}
                                                                                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer outline-none border transition-all ${isOverridden ? 'border-2 border-emerald-400' : 'border-transparent'} ${sensitivityConfig[sensitivity].bg} ${sensitivityConfig[sensitivity].text}`}
                                                                            >
                                                                                <option value="L1" className="bg-white text-slate-600">L1 公开</option>
                                                                                <option value="L2" className="bg-white text-blue-600">L2 内部</option>
                                                                                <option value="L3" className="bg-white text-orange-600">L3 敏感</option>
                                                                                <option value="L4" className="bg-white text-red-600">L4 高敏</option>
                                                                            </select>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-center">
                                                                            {/* Merged Result - Rule + AI Complementary */}
                                                                            <div className="flex flex-wrap items-center justify-center gap-1">
                                                                                {/* Show rule role as structural tag */}
                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 border border-purple-100">
                                                                                    {ruleRole}
                                                                                </span>
                                                                                {/* Show AI role if different (adds semantic context) */}
                                                                                {aiRole !== ruleRole && aiRole !== 'unknown' && (
                                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                                                                                        +{aiRole}
                                                                                    </span>
                                                                                )}
                                                                                {/* Show sensitivity tag if L3/L4 */}
                                                                                {(sensitivity === 'L3' || sensitivity === 'L4') && (
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${sensitivity === 'L4' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                                        {sensitivity === 'L4' ? '高敏' : '敏感'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Relationship Edit Modal */}
            {showRelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-[450px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Share2 size={18} className="text-blue-600" />
                                {editingRel.index !== null ? '编辑关系' : '添加关系'}
                            </h3>
                            <button onClick={() => setShowRelModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">目标表名</label>
                                <input
                                    type="text"
                                    value={editingRel.targetTable}
                                    onChange={(e) => setEditingRel(prev => ({ ...prev, targetTable: e.target.value }))}
                                    placeholder="例如: t_user_profile"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">关系类型</label>
                                <select
                                    value={editingRel.type}
                                    onChange={(e) => setEditingRel(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                >
                                    <option value="Many-to-One">Many-to-One (多对一)</option>
                                    <option value="One-to-Many">One-to-Many (一对多)</option>
                                    <option value="One-to-One">One-to-One (一对一)</option>
                                    <option value="Many-to-Many">Many-to-Many (多对多)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">关联键</label>
                                <input
                                    type="text"
                                    value={editingRel.key}
                                    onChange={(e) => setEditingRel(prev => ({ ...prev, key: e.target.value }))}
                                    placeholder="例如: user_id"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={() => setShowRelModal(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    if (!editingRel.targetTable || !editingRel.key) return;
                                    const newRel = { targetTable: editingRel.targetTable, type: editingRel.type, key: editingRel.key, description: '' };
                                    if (editingRel.index !== null) {
                                        // Edit existing
                                        setSemanticProfile(prev => ({
                                            ...prev,
                                            relationships: prev.relationships?.map((r, i) => i === editingRel.index ? newRel : r)
                                        }));
                                    } else {
                                        // Add new
                                        setSemanticProfile(prev => ({
                                            ...prev,
                                            relationships: [...(prev.relationships || []), newRel]
                                        }));
                                    }
                                    setShowRelModal(false);
                                }}
                                disabled={!editingRel.targetTable || !editingRel.key}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${editingRel.targetTable && editingRel.key
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {editingRel.index !== null ? '保存修改' : '添加关系'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Review Modal */}
            {
                showBatchReview && batchResults.length > 0 && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Activity size={20} className="text-blue-600" />
                                        批量分析结果审核
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        共 {batchResults.length} 项，
                                        <span className="text-emerald-600">{batchResults.filter(r => !r.needsReview && r.status === 'success').length} 项通过</span>，
                                        <span className="text-amber-600">{batchResults.filter(r => r.needsReview).length} 项需审核</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowBatchReview(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Results List */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                                {batchResults.map((result, idx) => (
                                    <div
                                        key={result.tableId}
                                        className={`p-4 rounded-lg border transition-all ${result.userAction === 'accepted' ? 'bg-emerald-50 border-emerald-200' :
                                            result.userAction === 'rejected' ? 'bg-red-50 border-red-200 opacity-60' :
                                                result.needsReview ? 'bg-amber-50 border-amber-200' :
                                                    'bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm text-slate-600">{result.tableName}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="font-medium text-slate-800">{result.businessName}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${result.scorePercent >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        置信度 {result.scorePercent}%
                                                    </span>
                                                    {result.needsReview && (
                                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                                            <AlertTriangle size={12} /> 需人工确认
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {result.userAction === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => setBatchResults(prev => prev.map((r, i) =>
                                                                i === idx ? { ...r, userAction: 'accepted' } : r
                                                            ))}
                                                            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                                        >
                                                            接受
                                                        </button>
                                                        <button
                                                            onClick={() => setBatchResults(prev => prev.map((r, i) =>
                                                                i === idx ? { ...r, userAction: 'rejected' } : r
                                                            ))}
                                                            className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                                        >
                                                            拒绝
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`text-xs flex items-center gap-1 ${result.userAction === 'accepted' ? 'text-emerald-600' : 'text-red-500'
                                                        }`}>
                                                        {result.userAction === 'accepted' ? <><CheckCircle size={14} /> 已接受</> : <><X size={14} /> 已拒绝</>}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                                <div className="text-sm text-slate-600">
                                    已确认 {batchResults.filter(r => r.userAction !== 'pending').length} / {batchResults.length} 项
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setBatchResults(prev => prev.map(r => ({ ...r, userAction: 'accepted' as const })))}
                                        className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                    >
                                        全部接受
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Apply accepted results
                                            batchResults.forEach(result => {
                                                if (result.userAction === 'accepted') {
                                                    setScanResults((prev: any[]) => prev.map((item: any) =>
                                                        item.table === result.tableId
                                                            ? { ...item, status: 'analyzed' }
                                                            : item
                                                    ));
                                                } else {
                                                    setScanResults((prev: any[]) => prev.map((item: any) =>
                                                        item.table === result.tableId
                                                            ? { ...item, status: 'scanned' }
                                                            : item
                                                    ));
                                                }
                                            });
                                            setShowBatchReview(false);
                                            setBatchResults([]);
                                        }}
                                        disabled={batchResults.some(r => r.userAction === 'pending')}
                                        className={`px-4 py-2 text-sm rounded-lg transition-colors ${batchResults.some(r => r.userAction === 'pending')
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        确认提交 ({batchResults.filter(r => r.userAction === 'accepted').length} 项)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default DataSemanticUnderstandingView;
