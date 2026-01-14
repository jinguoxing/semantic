import { useState, useRef } from 'react';
import { Database, Search, ChevronRight, Cpu, CheckCircle, Star, Tag, FileText, Layers, ShieldCheck, Activity, ArrowLeft, Table, Clock, Server, RefreshCw, X, AlertCircle, Settings, AlertTriangle, Share2, Shield, Plus, Edit3, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { checkGatekeeper, analyzeField } from '../logic/semantic/rules';
import { calculateTableRuleScore, calculateFusionScore } from '../logic/semantic/scoring';
import { analyzeTableWithMockAI } from '../services/mockAiService';
import { TableSemanticProfile, FieldSemanticProfile } from '../types/semantic';
import { SemanticAnalysisCard } from './semantic/SemanticAnalysisCard';
import { UpgradeSuggestionCard, generateUpgradeSuggestion } from './semantic/UpgradeSuggestionCard';
import { AnalysisProgressPanel } from './semantic/AnalysisProgressPanel';
import { StreamingProgressPanel } from './semantic/StreamingProgressPanel';

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
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // Batch Analysis State
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [batchAnalyzing, setBatchAnalyzing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [currentAnalyzing, setCurrentAnalyzing] = useState<string | null>(null); // P0: Streaming progress
    const [completedResults, setCompletedResults] = useState<typeof batchResults>([]); // P0: Real-time results
    const [batchResults, setBatchResults] = useState<{
        tableId: string;
        tableName: string;
        businessName: string;
        status: 'success' | 'error' | 'pending';
        scorePercent: number;
        needsReview?: boolean;
        userAction?: 'accepted' | 'rejected' | 'pending';
        upgradeDecision?: 'accepted' | 'rejected' | 'later' | 'rolled_back';
        upgradeRejectReason?: string;
        // Enhanced analysis details
        fieldStats?: { total: number; identifiers: number; status: number; busAttr: number; time: number };
        sensitiveFields?: { count: number; examples: string[] };
        relationships?: { count: number; targets: string[] };
        upgradeSuggestions?: { statusObjects: number; behaviorObjects: number };
        lowConfidenceReasons?: string[];
    }[]>([]);
    const [showBatchReview, setShowBatchReview] = useState(false);
    const [expandedReviewItems, setExpandedReviewItems] = useState<string[]>([]);
    const [upgradeHistory, setUpgradeHistory] = useState<{
        id: string;
        tableId: string;
        tableName: string;
        beforeState: any;
        afterState: any;
        timestamp: string;
        rolledBack: boolean;
    }[]>([]);


    // Detail View State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [pendingAnalysisResult, setPendingAnalysisResult] = useState<TableSemanticProfile | null>(null);
    const [detailTab, setDetailTab] = useState<'fields' | 'graph' | 'dimensions' | 'quality'>('fields');
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');
    const [expandedFields, setExpandedFields] = useState<string[]>([]);
    // Track user's conflict resolution choices: fieldName -> { role: string, source: 'rule' | 'ai' }
    const [fieldRoleOverrides, setFieldRoleOverrides] = useState<Record<string, { role: string; source: 'rule' | 'ai' }>>({});
    // Track which field's conflict popover is currently open (click-based)
    const [openConflictPopover, setOpenConflictPopover] = useState<string | null>(null);
    // Track user's sensitivity level overrides: fieldName -> sensitivityLevel
    const [sensitivityOverrides, setSensitivityOverrides] = useState<Record<string, 'L1' | 'L2' | 'L3' | 'L4'>>({});
    // Left Tree Collapse State
    const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);


    // Default Empty Profile
    const emptyProfile: TableSemanticProfile = {
        tableName: '',
        gateResult: { result: 'PASS', details: { primaryKey: false, lifecycle: false, tableType: false }, reasons: [] },
        ruleScore: { naming: 0, behavior: 0, comment: 0, total: 0 },
        aiScore: 0,
        fieldScore: 0,
        finalScore: 0,
        businessName: '',
        description: '',
        tags: [],
        fields: [],
        aiEvidence: [],
        ruleEvidence: []
    };

    const [semanticProfile, setSemanticProfile] = useState<TableSemanticProfile & { analysisStep: 'idle' | 'analyzing' | 'done', relationships?: any[] }>({
        ...emptyProfile,
        analysisStep: 'idle',
        relationships: []
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
            (asset.semanticAnalysis?.businessName || '').includes(searchTerm);
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
            // If we have saved analysis, load it (adapting structure if necessary)
            // simplified for now: just reset to empty if structure mismatch or use saved
            setSemanticProfile({
                ...emptyProfile,
                ...asset.semanticAnalysis,
                analysisStep: 'done'
            });
            setEditMode(false);
        } else {
            // New / Unanalyzed
            setSemanticProfile({
                ...emptyProfile,
                tableName: tableId,
                analysisStep: 'idle',
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

    const handleAnalyze = async () => {
        if (!selectedTable) return;
        setIsAnalyzing(true);
        setSemanticProfile(prev => ({ ...prev, analysisStep: 'analyzing' }));

        // 1. Logic Layer: Rules Checking
        // Mock fields since selectedTable might not have full field details in assets list
        // In real app, we would fetch fields for selectedTable.table
        const mockFields = selectedTable.fields || [
            { name: 'id', type: 'bigint', primaryKey: true },
            { name: 'create_time', type: 'datetime' },
            { name: 'name', type: 'varchar' }
        ];

        // Gate Check
        const gateResult = checkGatekeeper(selectedTable.table, mockFields);

        // Field Analysis
        const analyzedFields = mockFields.map((f: any) => analyzeField(f));
        const fieldScore = analyzedFields.reduce((acc: number, f: any) => acc + (f.roleConfidence || 0.5), 0) / analyzedFields.length; // Simple average

        // Table Rule Score
        const { score: ruleScore, evidence: ruleEvidence } = calculateTableRuleScore(selectedTable.table, mockFields, selectedTable.comment);

        try {
            // 2. Mock AI Service call
            const aiResult = await analyzeTableWithMockAI(selectedTable.table, mockFields, selectedTable.comment);

            // 3. Fusion Logic
            const finalScore = calculateFusionScore(ruleScore.total, fieldScore, aiResult.aiScore);

            const result: TableSemanticProfile = {
                tableName: selectedTable.table,
                gateResult,
                ruleScore,
                fieldScore, // @ts-ignore
                aiScore: aiResult.aiScore,
                finalScore,
                businessName: aiResult.businessName,
                description: aiResult.description,
                tags: aiResult.tags,
                fields: analyzedFields,
                aiEvidence: aiResult.evidence,
                ruleEvidence,
                // V2 Beta: Business Identity
                objectType: aiResult.objectType,
                objectTypeReason: aiResult.objectTypeReason,
                businessDomain: aiResult.businessDomain,
                dataGrain: aiResult.dataGrain,
                // V2 Beta: Defaults for other dimensions
                dataLayer: 'DWD',
                updateStrategy: '增量追加',
                retentionPeriod: '永久',
                securityLevel: 'L2'
            };

            // Store result in state for AnalysisProgressPanel to use
            setPendingAnalysisResult(result);
            // Note: setIsAnalyzing(false) and state update will be handled by AnalysisProgressPanel.onComplete

        } catch (error) {
            console.error(error);
            setIsAnalyzing(false);
        }
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
        setCompletedResults([]); // P0: Clear previous results
        const results: typeof batchResults = [];
        const CONFIDENCE_THRESHOLD = 70;

        for (let i = 0; i < selectedTables.length; i++) {
            const tableId = selectedTables[i];
            const table = scanResults.find((t: any) => t.table === tableId);
            if (!table) continue;

            // P0: Show current analyzing table
            setCurrentAnalyzing(table.table);
            setBatchProgress({ current: i, total: selectedTables.length });

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
                userAction: 'pending',
                // Enhanced analysis details (mock data)
                fieldStats: {
                    total: table.fields?.length || Math.floor(5 + Math.random() * 15),
                    identifiers: Math.floor(1 + Math.random() * 3),
                    status: Math.floor(Math.random() * 3),
                    busAttr: Math.floor(3 + Math.random() * 8),
                    time: Math.floor(1 + Math.random() * 4)
                },
                sensitiveFields: {
                    count: Math.floor(Math.random() * 4),
                    examples: ['user_name', 'mobile', 'id_card'].slice(0, Math.floor(Math.random() * 3) + 1)
                },
                relationships: {
                    count: Math.floor(1 + Math.random() * 4),
                    targets: ['t_user', 't_product', 't_payment', 't_order_item'].slice(0, Math.floor(1 + Math.random() * 3))
                },
                upgradeSuggestions: {
                    statusObjects: Math.floor(Math.random() * 2),
                    behaviorObjects: Math.floor(Math.random() * 3)
                },
                lowConfidenceReasons: needsReview
                    ? [
                        '部分字段缺少注释，AI无法准确推断业务含义',
                        scorePercent < 60 ? '字段命名不规范，语义识别困难' : null,
                        Math.random() > 0.5 ? '发现未知类型字段 (如 ext_data)' : null
                    ].filter(Boolean) as string[]
                    : []
            });

            // Update scanResults with mock semantic analysis data for detail view
            const mockSemanticAnalysis = {
                businessName: businessName,
                description: `${businessName}的业务数据表`,
                scenarios: ['数据查询', '报表分析'],
                tags: ['核心业务', '交易数据'],
                coreFields: table.fields?.slice(0, 5).map((f: any) => f.name) || ['id', 'name', 'status', 'created_at', 'updated_at'],
                relationships: [
                    { targetTable: 't_user', type: 'Many-to-One', key: 'user_id', description: '用户关联' },
                    { targetTable: 't_product', type: 'Many-to-Many', key: 'product_id', description: '产品关联' }
                ].slice(0, Math.floor(1 + Math.random() * 2)),
                // V2 Beta: Add default dimension values
                objectType: 'entity',
                businessDomain: '交易域',
                securityLevel: 'L2',
                dataGrain: '明细粒度'
            };

            setScanResults((prev: any[]) => prev.map((item: any) =>
                item.table === tableId
                    ? { ...item, status: 'pending_review', scorePercent, semanticAnalysis: mockSemanticAnalysis }
                    : item
            ));
        }

        setCurrentAnalyzing(null); // P0: Clear current analyzing
        setBatchProgress({ current: selectedTables.length, total: selectedTables.length });
        setBatchResults(results);
        setBatchAnalyzing(false);
        setSelectedTables([]);

        // Show review modal if there are results needing review
        if (results.some(r => r.needsReview)) {
            setShowBatchReview(true);
        }
    };

    const recordUpgradeHistory = (tableId: string, tableName: string, beforeState: any, afterState: any) => {
        const id = `${tableId}-${Date.now()}`;
        const timestamp = new Date().toISOString();
        setUpgradeHistory(prev => ([
            { id, tableId, tableName, beforeState, afterState, timestamp, rolledBack: false },
            ...prev
        ]));
    };

    const rollbackUpgrade = (entryId: string) => {
        let target: {
            id: string;
            tableId: string;
            tableName: string;
            beforeState: any;
            afterState: any;
            timestamp: string;
            rolledBack: boolean;
        } | undefined;

        setUpgradeHistory(prev => prev.map(entry => {
            if (entry.id !== entryId || entry.rolledBack) return entry;
            target = entry;
            return { ...entry, rolledBack: true };
        }));

        if (!target) return;

        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === target?.tableId
                ? { ...item, semanticAnalysis: target?.beforeState }
                : item
        ));
        if (selectedTable?.table === target?.tableId) {
            setSemanticProfile(prev => ({
                ...prev,
                ...target?.beforeState,
                analysisStep: 'done',
                relationships: prev.relationships
            }));
        }
        setBatchResults(prev => prev.map((r) =>
            r.tableId === target?.tableId
                ? { ...r, upgradeDecision: 'rolled_back', upgradeRejectReason: undefined }
                : r
        ));
    };

    const handleSaveToMetadata = () => {
        if (!selectedTable) return;

        console.log('✅ 保存语义分析结果:', {
            tableName: selectedTable.table,
            businessName: semanticProfile.businessName,
            objectType: semanticProfile.objectType
        });

        // Update scan results with analyzed status
        setScanResults((prev: any[]) => prev.map((item: any) =>
            item.table === selectedTable.table
                ? { ...item, status: 'analyzed', semanticAnalysis: { ...semanticProfile } }
                : item
        ));

        // Close edit mode
        setEditMode(false);

        // Show success feedback (TODO: Replace with toast library)
        alert('✅ 语义分析结果已保存！\n\n表名: ' + selectedTable.table + '\n业务名称: ' + (semanticProfile.businessName || '未定义'));

        // Optionally return to list view after 1.5 seconds
        // setTimeout(() => {
        //     setViewMode('list');
        // }, 1500);
    };

    // Database logo icons (emoji)
    const typeLogoConfig: Record<string, string> = {
        MySQL: '🐬',           // Dolphin (MySQL mascot)
        Oracle: '🔴',          // Red circle (Oracle brand color)
        PostgreSQL: '🐘',      // Elephant (PostgreSQL mascot)
        SQLServer: '🪟',       // Window (Microsoft)
        MongoDB: '🍃',         // Leaf (MongoDB logo)
        Redis: '⚡',           // Lightning (speed)
        Elasticsearch: '🔍',   // Search magnifier
        ClickHouse: '⚡',      // Lightning (speed)
        TiDB: '🟠',           // Orange circle (TiDB brand color)
        OceanBase: '🌊',      // Ocean wave
        达梦: '🗄️',           // Database cabinet
        人大金仓: '🏛️',       // Classical building
        GaussDB: '🔷',        // Blue diamond
        Hive: '🐝'            // Bee (Hive)
    };

    const typeConfig: Record<string, { color: string; bgColor: string }> = {
        MySQL: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        Oracle: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        PostgreSQL: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        SQLServer: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        MongoDB: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        Redis: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        Elasticsearch: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        ClickHouse: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        TiDB: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        OceanBase: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        达梦: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        人大金仓: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
        GaussDB: { color: 'text-slate-700', bgColor: 'bg-slate-100' }
    };

    return (
        <>
            <div className="h-full flex animate-fade-in gap-4">
                {/* Left Panel - Source Tree */}
                <div className={`${isTreeCollapsed ? 'w-12' : 'w-64'} bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0 transition-all duration-300`}>
                    <div className={`p-4 border-b border-slate-100 bg-slate-50 flex items-center ${isTreeCollapsed ? 'justify-center p-2' : 'justify-between'}`}>
                        {!isTreeCollapsed && (
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                <Database size={16} className="text-blue-600" /> 数据源视图
                            </h3>
                        )}
                        <button
                            onClick={() => setIsTreeCollapsed(!isTreeCollapsed)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                            title={isTreeCollapsed ? "展开视图" : "收起视图"}
                        >
                            {isTreeCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    </div>

                    {!isTreeCollapsed ? (
                        <div className="flex-1 overflow-y-auto p-2 opacity-100 transition-opacity duration-300">
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
                                    <button
                                        onClick={() => toggleType(type)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors text-slate-700"
                                    >
                                        <ChevronRight
                                            size={14}
                                            className={`text-slate-400 transition-transform duration-200 ease-out ${expandedTypes.includes(type) ? 'rotate-90' : ''}`}
                                        />
                                        <span className="text-base">{typeLogoConfig[type] || '💾'}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.bgColor || 'bg-slate-100'} ${typeConfig[type]?.color || ''}`}>{type}</span>
                                        <span className="ml-auto text-xs text-slate-400">{items.length}</span>
                                    </button>
                                    <div
                                        className={`ml-5 space-y-0.5 mt-1 border-l border-slate-100 pl-1 overflow-hidden origin-top transition-all duration-300 ease-in-out ${expandedTypes.includes(type)
                                            ? 'max-h-96 opacity-100'
                                            : 'max-h-0 opacity-0 pointer-events-none'
                                            }`}
                                    >
                                        {items.map((ds: any) => (
                                            <button
                                                key={ds.id}
                                                onClick={() => handleDataSourceSelect(ds.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${selectedDataSourceId === ds.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                                            >
                                                <Server size={12} className={selectedDataSourceId === ds.id ? 'text-blue-500' : 'text-slate-400'} />
                                                <span className="truncate" title={ds.name}>{ds.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center py-4 gap-3 animate-fade-in overflow-y-auto custom-scrollbar">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-2 cursor-pointer hover:bg-blue-100 transition-colors" title="全部数据源" onClick={() => handleDataSourceSelect(null)}>
                                <Layers size={16} />
                            </div>
                            <div className="w-6 h-px bg-slate-100 mb-1"></div>
                            {Object.entries(typeGroups).map(([type, items]: [string, any]) => (
                                <div key={type} className="relative group cursor-pointer" title={`${type} (${items.length})`} onClick={() => {
                                    setIsTreeCollapsed(false);
                                    if (!expandedTypes.includes(type)) toggleType(type);
                                }}>
                                    <div className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-50 rounded-lg transition-colors">
                                        {typeLogoConfig[type] || '💾'}
                                    </div>
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 border border-white text-[9px] font-bold text-slate-600 shadow-sm">
                                        {items.length}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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
                                <div className="flex items-center justify-between py-2 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center">
                                        {/* Checkbox container - same width as table column */}
                                        <div className="w-10 px-3 flex items-center justify-center">
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
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-sm text-slate-600 px-6">全选</span>
                                        {selectedTables.length > 0 && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                已选 {selectedTables.length} 张表
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 pr-4">
                                        {batchAnalyzing ? (
                                            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                                                <StreamingProgressPanel
                                                    currentAnalyzing={currentAnalyzing}
                                                    completedResults={completedResults}
                                                    progress={batchProgress}
                                                    onResultClick={(tableId) => {
                                                        setViewMode('detail');
                                                        setSelectedTableId(tableId);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleBatchAnalyze}
                                                disabled={selectedTables.length === 0}
                                                className={`px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-all ${selectedTables.length > 0
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 shadow-md hover:shadow-lg'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Sparkles size={14} />
                                                语义理解
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3.5 w-12"></th>
                                            <th className="px-4 py-3.5 font-medium text-left min-w-[200px]">表技术名称</th>
                                            <th className="px-4 py-3.5 font-medium text-left min-w-[140px]">表业务名称</th>
                                            <th className="px-4 py-3.5 font-medium text-left min-w-[160px]">所属数据源</th>
                                            <th className="px-4 py-3.5 font-medium text-right w-24">行数</th>
                                            <th className="px-4 py-3.5 font-medium text-center w-32">更新时间</th>
                                            <th className="px-4 py-3.5 font-medium text-center w-28">分析状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(() => {
                                            // Pagination logic
                                            const totalItems = filteredAssets.length;
                                            const totalPages = Math.ceil(totalItems / pageSize);
                                            const startIndex = (currentPage - 1) * pageSize;
                                            const endIndex = startIndex + pageSize;
                                            const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

                                            return paginatedAssets.map((asset, index) => (
                                                <tr key={asset.table}
                                                    onClick={() => handleTableClick(asset.table)}
                                                    className={`hover:bg-purple-50/30 cursor-pointer group transition-all duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} ${selectedTables.includes(asset.table) ? '!bg-purple-50' : ''}`}
                                                >
                                                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTables.includes(asset.table)}
                                                            onChange={() => toggleTableSelection(asset.table)}
                                                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                                                                <Table size={14} className="text-blue-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-blue-600 font-semibold text-sm truncate group-hover:text-blue-700">{asset.table}</div>
                                                                {asset.comment && <div className="text-xs text-slate-400 truncate max-w-[180px]">{asset.comment}</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {asset.semanticAnalysis?.businessName ? (
                                                            <span className="text-slate-800 font-medium">{asset.semanticAnalysis.businessName}</span>
                                                        ) : (
                                                            <span className="text-slate-300 italic text-xs">- 未定义 -</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                                                {asset.sourceType}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{asset.sourceName}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="font-mono text-slate-700 font-medium">
                                                            {typeof asset.rows === 'number'
                                                                ? asset.rows >= 1000000 ? `${(asset.rows / 1000000).toFixed(1)}M`
                                                                    : asset.rows >= 1000 ? `${(asset.rows / 1000).toFixed(1)}K`
                                                                        : asset.rows.toLocaleString()
                                                                : asset.rows || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1 text-slate-500 text-xs">
                                                            <Clock size={12} className="text-slate-400" />
                                                            {asset.updateTime?.split(' ')[0] || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        {asset.status === 'analyzed' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 text-xs font-medium whitespace-nowrap border border-purple-100">
                                                                <Sparkles size={10} /> 已理解
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs whitespace-nowrap">
                                                                待理解
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                                {filteredAssets.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <Search size={48} className="mx-auto mb-4 opacity-10" />
                                        <p>没有找到匹配的表</p>
                                    </div>
                                )}
                                {/* Pagination Controls */}
                                {filteredAssets.length > 0 && (
                                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                            <span>共 {filteredAssets.length} 条记录</span>
                                            <div className="flex items-center gap-2">
                                                <span>每页</span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                                <span>条</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                                className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                首页
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                上一页
                                            </button>
                                            <span className="px-3 py-1 text-sm text-slate-700">
                                                第 <span className="font-medium text-purple-600">{currentPage}</span> / {Math.ceil(filteredAssets.length / pageSize)} 页
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAssets.length / pageSize), p + 1))}
                                                disabled={currentPage >= Math.ceil(filteredAssets.length / pageSize)}
                                                className={`px-3 py-1 text-sm rounded ${currentPage >= Math.ceil(filteredAssets.length / pageSize) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                下一页
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.ceil(filteredAssets.length / pageSize))}
                                                disabled={currentPage >= Math.ceil(filteredAssets.length / pageSize)}
                                                className={`px-2 py-1 text-xs rounded ${currentPage >= Math.ceil(filteredAssets.length / pageSize) ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                末页
                                            </button>
                                        </div>
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
                                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100 flex items-center gap-1">
                                                    <Sparkles size={10} /> 语义理解完成
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs border border-slate-200">
                                                    待理解
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
                                        disabled={isAnalyzing}
                                        className={`px-4 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2 text-white transition-all ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' :
                                            semanticProfile.analysisStep === 'done' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                                            }`}
                                    >
                                        {isAnalyzing ? (
                                            <><RefreshCw size={14} className="animate-spin" /> 语义理解中...</>
                                        ) : semanticProfile.analysisStep === 'done' ? (
                                            <><RefreshCw size={14} /> 重新理解</>
                                        ) : (
                                            <><Sparkles size={14} /> 开始语义理解</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

                                {/* Analysis Progress / Result Area */}
                                {(isAnalyzing || semanticProfile.analysisStep !== 'idle') && (
                                    <div className="mb-6">
                                        {isAnalyzing ? (
                                            <AnalysisProgressPanel
                                                tableName={selectedTable.table}
                                                mockAnalysisResult={pendingAnalysisResult}
                                                onComplete={(result) => {
                                                    setSemanticProfile({
                                                        ...result,
                                                        analysisStep: 'done',
                                                        relationships: semanticProfile.relationships
                                                    });
                                                    setEditMode(true);
                                                    setIsAnalyzing(false);
                                                    setPendingAnalysisResult(null);
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <SemanticAnalysisCard
                                                    profile={semanticProfile}
                                                    fields={selectedTable.fields || []}
                                                    onAccept={handleSaveToMetadata}
                                                    onReject={handleIgnore}
                                                    onEdit={() => setEditMode(true)}
                                                    isEditing={editMode}
                                                    onProfileChange={(updates) => setSemanticProfile(prev => ({ ...prev, ...updates }))}
                                                    onSaveEdit={() => setEditMode(false)}
                                                    onUpgradeAccepted={(beforeState, afterState) => {
                                                        if (!selectedTable) return;
                                                        recordUpgradeHistory(
                                                            selectedTable.table,
                                                            selectedTable.table,
                                                            beforeState,
                                                            afterState
                                                        );
                                                    }}
                                                />
                                                {upgradeHistory.some(entry => entry.tableId === selectedTable.table) && (
                                                    <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
                                                        <div className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-3">
                                                            <Clock size={14} className="text-slate-500" /> 升级操作记录
                                                        </div>
                                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                                            {upgradeHistory
                                                                .filter(entry => entry.tableId === selectedTable.table)
                                                                .map(entry => (
                                                                    <div key={entry.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1.5">
                                                                        <div className="text-slate-600">
                                                                            <span className="font-mono text-slate-700">{entry.tableName}</span>
                                                                            <span className="text-slate-400"> · {entry.timestamp}</span>
                                                                            {entry.rolledBack && (
                                                                                <span className="ml-2 text-orange-600">已撤销</span>
                                                                            )}
                                                                        </div>
                                                                        <button
                                                                            onClick={() => rollbackUpgrade(entry.id)}
                                                                            disabled={entry.rolledBack}
                                                                            className={`px-2 py-1 rounded ${entry.rolledBack
                                                                                ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                                                                : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                                                                }`}
                                                                        >
                                                                            撤销
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}


                                {/* Field List & Relationships (Tabs) - Hidden when SemanticAnalysisCard is shown (V2) */}
                                {semanticProfile.analysisStep === 'idle' && (
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
                                                                <span className="text-xs text-slate-400">基于语义理解自动识别</span>
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
                                                                    <th className="px-3 py-2.5 w-10 text-xs">#</th>
                                                                    <th className="px-3 py-2.5 text-xs">物理字段</th>
                                                                    <th className="px-3 py-2.5 text-xs w-24">类型</th>
                                                                    <th className="px-3 py-2.5 text-xs w-36">
                                                                        <span className="flex items-center gap-1 text-purple-600"><Settings size={12} /> 规则判定</span>
                                                                    </th>
                                                                    <th className="px-3 py-2.5 text-xs w-40">
                                                                        <span className="flex items-center gap-1 text-blue-600"><Sparkles size={12} /> AI 语义</span>
                                                                    </th>
                                                                    <th className="px-3 py-2.5 text-xs w-28">
                                                                        <span className="flex items-center gap-1 text-slate-500"><Database size={12} /> 采样值</span>
                                                                    </th>
                                                                    <th className="px-3 py-2.5 text-xs w-24">
                                                                        <span className="flex items-center gap-1 text-orange-600"><Shield size={12} /> 敏感等级</span>
                                                                    </th>
                                                                    <th className="px-3 py-2.5 text-xs text-center w-32">
                                                                        <span className="flex items-center justify-center gap-1 text-emerald-600"><Layers size={12} /> 融合结果</span>
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {filteredFields.length === 0 && fieldSearchTerm ? (
                                                                    <tr>
                                                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
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
                                                                    // Rule-based role determination with reasoning
                                                                    const getRuleResult = (name: string, type: string) => {
                                                                        if (name.endsWith('_id') || name === 'id') return { role: 'Identifier', reason: '字段名含_id后缀', confidence: 95 };
                                                                        if (name.includes('time') || name.includes('date') || type.includes('datetime') || type.includes('timestamp')) return { role: 'EventHint', reason: '时间类型字段', confidence: 90 };
                                                                        if (name.includes('status') || name.includes('state') || name.includes('type')) return { role: 'Status', reason: '状态/类型字段', confidence: 85 };
                                                                        if (name.includes('amount') || name.includes('price') || name.includes('total') || type.includes('decimal')) return { role: 'Measure', reason: '金额/数量字段', confidence: 80 };
                                                                        return { role: 'BusAttr', reason: '默认业务属性', confidence: 60 };
                                                                    };
                                                                    const ruleResult = getRuleResult(field.name, field.type);
                                                                    const ruleRole = ruleResult.role;

                                                                    // AI semantic analysis with business meaning
                                                                    const getAIResult = (name: string) => {
                                                                        const aiMappings: Record<string, { role: string; meaning: string; scenario: string; confidence: number }> = {
                                                                            'id': { role: 'id', meaning: '记录标识', scenario: '主键关联', confidence: 92 },
                                                                            'user_id': { role: 'user_id', meaning: '用户标识', scenario: '用户关联查询', confidence: 95 },
                                                                            'name': { role: 'name', meaning: '名称属性', scenario: '展示/搜索', confidence: 88 },
                                                                            'mobile': { role: 'phone', meaning: '手机号码', scenario: '联系/验证', confidence: 90 },
                                                                            'phone': { role: 'phone', meaning: '电话号码', scenario: '联系方式', confidence: 90 },
                                                                            'email': { role: 'email', meaning: '电子邮箱', scenario: '通知/登录', confidence: 92 },
                                                                            'status': { role: 'status', meaning: '状态标识', scenario: '状态流转', confidence: 85 },
                                                                            'create_time': { role: 'create_time', meaning: '创建时间', scenario: '审计追踪', confidence: 95 },
                                                                            'update_time': { role: 'update_time', meaning: '更新时间', scenario: '变更追踪', confidence: 95 },
                                                                            'address': { role: 'address', meaning: '地址信息', scenario: '配送/定位', confidence: 85 },
                                                                            'amount': { role: 'amount', meaning: '金额数值', scenario: '财务统计', confidence: 88 },
                                                                            'order_id': { role: 'order_id', meaning: '订单标识', scenario: '订单关联', confidence: 95 },
                                                                        };
                                                                        // Find matching AI result
                                                                        const key = Object.keys(aiMappings).find(k => name.includes(k));
                                                                        if (key) return aiMappings[key];
                                                                        return { role: 'unknown', meaning: '待识别', scenario: '-', confidence: 0 };
                                                                    };
                                                                    const aiResult = getAIResult(field.name);
                                                                    const aiRole = field.suggestion || aiResult.role;

                                                                    // Sample values for the field
                                                                    const getSampleValues = (name: string, type: string): string[] => {
                                                                        if (name.includes('id')) return ['1001', '1002', '1003'];
                                                                        if (name.includes('name')) return ['张三', '李四', '王五'];
                                                                        if (name.includes('mobile') || name.includes('phone')) return ['138****1234', '159****5678'];
                                                                        if (name.includes('status')) return ['1', '2', '3'];
                                                                        if (name.includes('time') || name.includes('date')) return ['2024-01-15', '2024-02-20'];
                                                                        if (name.includes('amount') || name.includes('price')) return ['99.00', '188.50', '520.00'];
                                                                        if (type.includes('varchar')) return ['示例值A', '示例值B'];
                                                                        return ['-'];
                                                                    };
                                                                    const sampleValues = getSampleValues(field.name, field.type);

                                                                    // Check if user has resolved this conflict
                                                                    const override = fieldRoleOverrides[field.name];
                                                                    const isResolved = !!override;
                                                                    const hasConflict = ruleRole.toLowerCase() !== aiRole.toLowerCase() && aiRole !== 'unknown' && !isResolved;
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
                                                                        <tr key={idx} className={`hover:bg-slate-50 ${hasConflict ? 'bg-amber-50/30' : ''}`}>
                                                                            <td className="px-3 py-2.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                                            <td className="px-3 py-2.5 font-mono text-blue-600 font-medium text-sm">{field.name}</td>
                                                                            <td className="px-3 py-2.5 text-xs text-slate-500">{field.type}</td>
                                                                            {/* Enhanced Rule Judgment Column */}
                                                                            <td className="px-3 py-2">
                                                                                <div className={`px-2 py-1 rounded ${override?.source === 'rule' ? 'border-2 border-purple-400 bg-purple-100' : 'bg-purple-50 border border-purple-100'}`}>
                                                                                    <div className="text-xs font-medium text-purple-700">{ruleRole}</div>
                                                                                    <div className="text-[10px] text-purple-500">{ruleResult.reason}</div>
                                                                                    <div className="text-[10px] text-purple-400">置信度 {ruleResult.confidence}%</div>
                                                                                </div>
                                                                            </td>
                                                                            {/* Enhanced AI Semantic Column */}
                                                                            <td className="px-3 py-2">
                                                                                {isAnalyzing ? (
                                                                                    <div className="animate-pulse bg-slate-200 h-12 w-full rounded"></div>
                                                                                ) : (
                                                                                    <div className={`px-2 py-1 rounded ${override?.source === 'ai' ? 'border-2 border-blue-400 bg-blue-100' : 'bg-blue-50 border border-blue-100'}`}>
                                                                                        <div className="text-xs font-medium text-blue-700">{aiResult.meaning}</div>
                                                                                        <div className="text-[10px] text-blue-500">@{aiRole}</div>
                                                                                        <div className="text-[10px] text-blue-400">场景: {aiResult.scenario}</div>
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                            {/* Sample Values Column */}
                                                                            <td className="px-3 py-2.5">
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {sampleValues.slice(0, 3).map((val, i) => (
                                                                                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono truncate max-w-[60px]" title={val}>
                                                                                            {val}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </td>
                                                                            {/* Sensitivity Column */}
                                                                            <td className="px-3 py-2.5">
                                                                                <select
                                                                                    value={sensitivity}
                                                                                    onChange={(e) => setSensitivityOverrides(prev => ({
                                                                                        ...prev,
                                                                                        [field.name]: e.target.value as 'L1' | 'L2' | 'L3' | 'L4'
                                                                                    }))}
                                                                                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer outline-none border transition-all w-full ${isOverridden ? 'border-2 border-emerald-400' : 'border-transparent'} ${sensitivityConfig[sensitivity].bg} ${sensitivityConfig[sensitivity].text}`}
                                                                                >
                                                                                    <option value="L1" className="bg-white text-slate-600">L1 公开</option>
                                                                                    <option value="L2" className="bg-white text-blue-600">L2 内部</option>
                                                                                    <option value="L3" className="bg-white text-orange-600">L3 敏感</option>
                                                                                    <option value="L4" className="bg-white text-red-600">L4 高敏</option>
                                                                                </select>
                                                                            </td>
                                                                            {/* Enhanced Merge Result Column */}
                                                                            <td className="px-3 py-2.5 text-center">
                                                                                <div className="space-y-1">
                                                                                    {/* Conflict indicator */}
                                                                                    {hasConflict && (
                                                                                        <div className="flex items-center justify-center gap-1 text-amber-600 text-[10px]">
                                                                                            <AlertTriangle size={10} /> 待确认
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex flex-wrap items-center justify-center gap-1">
                                                                                        {/* Rule role */}
                                                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 border border-purple-100">
                                                                                            {ruleRole}
                                                                                        </span>
                                                                                        {/* AI supplement if different */}
                                                                                        {aiRole.toLowerCase() !== ruleRole.toLowerCase() && aiRole !== 'unknown' && (
                                                                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                                                                                                +{aiResult.meaning}
                                                                                            </span>
                                                                                        )}
                                                                                        {/* Sensitivity tag for L3/L4 */}
                                                                                        {(sensitivity === 'L3' || sensitivity === 'L4') && (
                                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${sensitivity === 'L4' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                                                {sensitivity === 'L4' ? '高敏' : '敏感'}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
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
                                )}
                            </div >
                        </div >
                    )}
                </div >
            </div >

            {/* Relationship Edit Modal */}
            {
                showRelModal && (
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
                )
            }

            {/* Batch Review Modal */}
            {
                showBatchReview && batchResults.length > 0 && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Sparkles size={20} className="text-purple-600" />
                                        语义理解结果审核
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
                                        {/* Header Row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpandedReviewItems(prev =>
                                                            prev.includes(result.tableId)
                                                                ? prev.filter(id => id !== result.tableId)
                                                                : [...prev, result.tableId]
                                                        )}
                                                        className="text-slate-400 hover:text-slate-600"
                                                    >
                                                        <ChevronRight size={16} className={`transition-transform ${expandedReviewItems.includes(result.tableId) ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    <span className="font-mono text-sm text-slate-600">{result.tableName}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="font-medium text-slate-800">{result.businessName}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-2 pl-6">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${result.scorePercent >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        置信度 {result.scorePercent}%
                                                    </span>
                                                    {result.needsReview && (
                                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                                            <AlertTriangle size={12} /> 需人工确认
                                                        </span>
                                                    )}
                                                    {/* Quick Stats */}
                                                    {result.fieldStats && (
                                                        <span className="text-xs text-slate-400">
                                                            {result.fieldStats.total}字段 · {result.sensitiveFields?.count || 0}敏感 · {result.relationships?.count || 0}关联
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

                                        {/* Expandable Details */}
                                        {expandedReviewItems.includes(result.tableId) && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                                                {/* Analysis Summary */}
                                                <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                        <FileText size={12} /> 分析摘要
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">识别字段:</span>
                                                            <span className="text-slate-700">
                                                                {result.fieldStats?.total}个
                                                                <span className="text-slate-400 ml-1">
                                                                    ({result.fieldStats?.identifiers}主键, {result.fieldStats?.status}状态, {result.fieldStats?.busAttr}业务, {result.fieldStats?.time}时间)
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">敏感字段:</span>
                                                            <span className={`${(result.sensitiveFields?.count || 0) > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                                                                {result.sensitiveFields?.count || 0}个
                                                                {result.sensitiveFields?.examples && result.sensitiveFields.examples.length > 0 && (
                                                                    <span className="text-slate-400 font-mono ml-1">({result.sensitiveFields.examples.join(', ')})</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">发现关系:</span>
                                                            <span className="text-blue-600">
                                                                {result.relationships?.count || 0}个
                                                                {result.relationships?.targets && result.relationships.targets.length > 0 && (
                                                                    <span className="text-slate-400 font-mono ml-1">(→{result.relationships.targets.join(', →')})</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-400">升级建议:</span>
                                                            <span className="text-purple-600">
                                                                {(result.upgradeSuggestions?.statusObjects || 0) + (result.upgradeSuggestions?.behaviorObjects || 0)}个
                                                                {((result.upgradeSuggestions?.statusObjects || 0) > 0 || (result.upgradeSuggestions?.behaviorObjects || 0) > 0) && (
                                                                    <span className="text-slate-400 ml-1">
                                                                        ({result.upgradeSuggestions?.statusObjects}状态对象, {result.upgradeSuggestions?.behaviorObjects}行为对象)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Low Confidence Reasons */}
                                                {result.lowConfidenceReasons && result.lowConfidenceReasons.length > 0 && (
                                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                                        <div className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                                                            <AlertTriangle size={12} /> 低置信度原因
                                                        </div>
                                                        <ul className="text-xs text-amber-600 space-y-1">
                                                            {result.lowConfidenceReasons.map((reason, i) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-amber-400 mt-0.5">•</span>
                                                                    {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const table = scanResults.find((t: any) => t.table === result.tableId);
                                                    const fields = table?.fields || [];
                                                    const derivedProfile = {
                                                        ...(table?.semanticAnalysis || {}),
                                                        fields,
                                                        aiScore: (result.scorePercent || 0) / 100,
                                                        fieldScore: table?.semanticAnalysis?.fieldScore
                                                    };
                                                    const upgradeSuggestion = generateUpgradeSuggestion(derivedProfile);

                                                    return (
                                                        <>
                                                            {upgradeSuggestion && (
                                                                <div className="bg-white rounded-lg p-3 border border-slate-100">
                                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                                        <Activity size={12} /> 升级建议
                                                                    </div>
                                                                    {result.upgradeDecision && (
                                                                        <div className={`text-xs mb-2 ${result.upgradeDecision === 'accepted' ? 'text-emerald-600' :
                                                                            result.upgradeDecision === 'rejected' ? 'text-red-600' :
                                                                                result.upgradeDecision === 'rolled_back' ? 'text-orange-600' :
                                                                                    'text-slate-500'
                                                                            }`}>
                                                                            {result.upgradeDecision === 'accepted' && '已接受升级建议'}
                                                                            {result.upgradeDecision === 'later' && '已标记为稍后处理'}
                                                                            {result.upgradeDecision === 'rejected' && `已拒绝升级建议${result.upgradeRejectReason ? `：${result.upgradeRejectReason}` : ''}`}
                                                                            {result.upgradeDecision === 'rolled_back' && '已撤销升级变更'}
                                                                        </div>
                                                                    )}
                                                                    <UpgradeSuggestionCard
                                                                        suggestion={upgradeSuggestion}
                                                                        onAccept={() => {
                                                                            const beforeState = table?.semanticAnalysis ? { ...table.semanticAnalysis } : {};
                                                                            recordUpgradeHistory(
                                                                                result.tableId,
                                                                                result.tableName,
                                                                                beforeState,
                                                                                upgradeSuggestion.afterState
                                                                            );
                                                                            setBatchResults(prev => prev.map((r) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'accepted', upgradeRejectReason: undefined }
                                                                                    : r
                                                                            ));
                                                                            setScanResults((prev: any[]) => prev.map((item: any) =>
                                                                                item.table === result.tableId
                                                                                    ? { ...item, semanticAnalysis: { ...item.semanticAnalysis, ...upgradeSuggestion.afterState } }
                                                                                    : item
                                                                            ));
                                                                        }}
                                                                        onReject={(reason) => {
                                                                            setBatchResults(prev => prev.map((r) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'rejected', upgradeRejectReason: reason }
                                                                                    : r
                                                                            ));
                                                                        }}
                                                                        onLater={() => {
                                                                            setBatchResults(prev => prev.map((r) =>
                                                                                r.tableId === result.tableId
                                                                                    ? { ...r, upgradeDecision: 'later', upgradeRejectReason: undefined }
                                                                                    : r
                                                                            ));
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                            {fields.length > 0 && (
                                                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                                                    <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                                                        <Layers size={12} /> 字段列表 ({fields.length}个)
                                                                    </div>
                                                                    <div className="max-h-40 overflow-y-auto">
                                                                        <table className="w-full text-xs">
                                                                            <thead className="bg-slate-100 sticky top-0">
                                                                                <tr>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">字段名</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">类型</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">语义角色</th>
                                                                                    <th className="px-2 py-1 text-left text-slate-500">说明</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                {fields.slice(0, 10).map((field: any, i: number) => (
                                                                                    <tr key={i} className="hover:bg-white">
                                                                                        <td className="px-2 py-1.5 font-mono text-blue-600">{field.name}</td>
                                                                                        <td className="px-2 py-1.5 text-slate-500">{field.type}</td>
                                                                                        <td className="px-2 py-1.5">
                                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${field.name.includes('id') ? 'bg-purple-100 text-purple-700' :
                                                                                                field.name.includes('time') || field.name.includes('date') ? 'bg-blue-100 text-blue-700' :
                                                                                                    field.name.includes('status') ? 'bg-amber-100 text-amber-700' :
                                                                                                        'bg-slate-100 text-slate-600'
                                                                                                }`}>
                                                                                                {field.name.includes('id') ? '标识符' :
                                                                                                    field.name.includes('time') || field.name.includes('date') ? '时间' :
                                                                                                        field.name.includes('status') ? '状态' : '业务属性'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-2 py-1.5 text-slate-400 truncate max-w-[120px]">{field.comment || '-'}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                        {fields.length > 10 && (
                                                                            <div className="text-center text-xs text-slate-400 py-1">
                                                                                还有 {fields.length - 10} 个字段...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {/* Relationship Details Section */}
                                                {result.relationships && result.relationships.count > 0 && (
                                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                                        <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                                                            <Share2 size={12} /> 关系详情 ({result.relationships.count}个)
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {result.relationships.targets.map((target: string, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 text-xs">
                                                                    <span className="text-blue-400">→</span>
                                                                    <span className="font-mono text-blue-600">{target}</span>
                                                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px]">
                                                                        {['Many-to-One', 'One-to-Many', 'Many-to-Many'][i % 3]}
                                                                    </span>
                                                                    <span className="text-slate-400">
                                                                        via <span className="font-mono">{target.replace('t_', '')}_id</span>
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {upgradeHistory.length > 0 && (
                                <div className="px-6 pb-4">
                                    <div className="bg-white rounded-lg border border-slate-100 p-3">
                                        <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                            <Clock size={12} /> 升级操作记录
                                        </div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {upgradeHistory.map(entry => (
                                                <div key={entry.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-md px-2 py-1.5">
                                                    <div className="text-slate-600">
                                                        <span className="font-mono text-slate-700">{entry.tableName}</span>
                                                        <span className="text-slate-400"> · {entry.timestamp}</span>
                                                        {entry.rolledBack && (
                                                            <span className="ml-2 text-orange-600">已撤销</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => rollbackUpgrade(entry.id)}
                                                        disabled={entry.rolledBack}
                                                        className={`px-2 py-1 rounded ${entry.rolledBack
                                                            ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                                            : 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                                                            }`}
                                                    >
                                                        撤销
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

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
