import { useState } from 'react';
import { Database, Search, ChevronRight, Cpu, CheckCircle, Star, Tag, FileText, Layers, ShieldCheck, Activity, ArrowRight, Table } from 'lucide-react';

interface DataSemanticUnderstandingViewProps {
    scanResults: any[];
    setScanResults: (fn: (prev: any[]) => any[]) => void;
}

const DataSemanticUnderstandingView = ({ scanResults, setScanResults }: DataSemanticUnderstandingViewProps) => {
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);

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

    const assets = scanResults.filter(r => r.status === 'scanned' || r.status === 'analyzed');
    const selectedTable = assets.find(a => a.table === selectedTableId);

    const typeConfig: Record<string, { color: string; bgColor: string }> = {
        MySQL: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
        Oracle: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
        PostgreSQL: { color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
    };

    const groupedAssets = assets.reduce((acc: Record<string, any[]>, asset) => {
        const type = asset.sourceType || 'MySQL';
        if (!acc[type]) acc[type] = [];
        if (searchTerm === '' ||
            asset.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.aiSuggestion || '').toLowerCase().includes(searchTerm.toLowerCase())) {
            acc[type].push(asset);
        }
        return acc;
    }, {});

    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSelectTable = (tableName: string) => {
        setSelectedTableId(tableName);
        const asset = assets.find(a => a.table === tableName);
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
            setEditMode(true);
        }
    };

    const handleAnalyze = () => {
        if (!selectedTable) return;
        setIsAnalyzing(true);

        setTimeout(() => {
            const mockResults: Record<string, any> = {
                't_user_profile': {
                    businessName: '用户画像表',
                    description: '记录核心用户基础画像信息，包含用户ID、姓名、联系方式等属性。数据质量较高，但包含敏感隐私信息。',
                    scenarios: ['客户管理', '画像分析', '精准营销'],
                    coreFields: [{ field: 'user_id', reason: '用户唯一标识' }, { field: 'name', reason: '用户姓名' }],
                    qualityScore: 92,
                    privacyLevel: 'L3 (高敏感)'
                },
                't_order_main': {
                    businessName: '订单主表',
                    description: '存储订单核心交易信息，是交易域的主实体。',
                    scenarios: ['订单管理', '交易分析', '财务对账'],
                    coreFields: [{ field: 'order_id', reason: '订单唯一标识' }],
                    qualityScore: 88,
                    privacyLevel: 'L2 (中敏感)'
                }
            };

            const result = mockResults[selectedTable.table] || {
                businessName: selectedTable.table.replace('t_', '').replace(/_/g, ' '),
                description: `AI 自动生成的描述：该表似乎存储了关于 ${selectedTable.table.split('_')[1] || '业务'} 的数据。`,
                scenarios: ['通用查询', '统计分析'],
                coreFields: (selectedTable.fields || []).slice(0, 2).map((f: any) => ({ field: f.name, reason: 'AI 自动推荐为标识符' })),
                qualityScore: Math.floor(Math.random() * 20) + 70,
                privacyLevel: 'L1 (低敏感)'
            };

            setSemanticProfile(result);
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

    return (
        <div className="h-full flex animate-fade-in gap-4">
            {/* Left Panel - Asset Tree */}
            <div className="w-72 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Database size={16} className="text-emerald-500" /> 物理资产
                    </h3>
                </div>
                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            placeholder="搜索表名..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {Object.entries(groupedAssets).map(([type, items]) => (
                        <div key={type} className="mb-2">
                            <button onClick={() => toggleType(type)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors">
                                <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedTypes.includes(type) ? 'rotate-90' : ''}`} />
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.bgColor || 'bg-slate-100'} ${typeConfig[type]?.color || ''}`}>{type}</span>
                            </button>
                            {expandedTypes.includes(type) && (
                                <div className="ml-4 space-y-1 mt-1 transition-all">
                                    {items.map((asset: any) => (
                                        <button key={asset.table} onClick={() => handleSelectTable(asset.table)}
                                            className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-colors ${selectedTableId === asset.table ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'hover:bg-slate-50 text-slate-600'}`}>
                                            <Table size={12} className={selectedTableId === asset.table ? 'text-emerald-600' : 'text-slate-400'} />
                                            <span className="truncate font-mono">{asset.table}</span>
                                            {asset.status === 'analyzed' && <CheckCircle size={10} className="text-emerald-500 ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {Object.keys(groupedAssets).length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            <Database size={32} className="mx-auto mb-2 opacity-30" />
                            <p>暂无扫描数据</p>
                            <p className="opacity-60 mt-1">请先在「资产扫描」中同步并选择表</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {selectedTable ? (
                    <>
                        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-xl flex items-center gap-2">
                                        <Database size={20} className="opacity-80" />
                                        {selectedTable.table}
                                    </h3>
                                    <p className="text-emerald-100 text-sm mt-1 opacity-90">{selectedTable.comment || '暂无物理表注释'}</p>
                                </div>
                                <button onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-all shadow-sm">
                                    <Cpu size={16} className={isAnalyzing ? "animate-pulse" : ""} />
                                    {isAnalyzing ? 'DeepSeek 思考中...' : 'AI 语义解析'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <div className="relative w-20 h-20 mb-6">
                                        <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <Cpu size={32} className="absolute inset-0 m-auto text-emerald-500 animate-pulse" />
                                    </div>
                                    <h4 className="font-bold text-lg text-slate-700 mb-2">AI 正在深度分析</h4>
                                    <div className="space-y-1 text-center text-sm">
                                        <p>正在分析表结构...</p>
                                        <p className="animate-pulse delay-75">正在推理业务含义...</p>
                                        <p className="animate-pulse delay-150">正在识别核心字段...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Edit Area */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <FileText size={18} className="text-emerald-600" />
                                                业务语义定义
                                            </h4>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">业务名称</label>
                                                    <input type="text" value={semanticProfile.businessName}
                                                        onChange={e => setSemanticProfile({ ...semanticProfile, businessName: e.target.value })}
                                                        disabled={!editMode}
                                                        placeholder="例如：用户画像"
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">详细描述</label>
                                                    <textarea value={semanticProfile.description}
                                                        onChange={e => setSemanticProfile({ ...semanticProfile, description: e.target.value })}
                                                        disabled={!editMode} rows={4}
                                                        placeholder="描述该表的业务用途、数据来源及更新频率..."
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                <Star size={18} className="text-amber-500" />
                                                核心资产识别
                                            </h4>
                                            <div className="space-y-3">
                                                {semanticProfile.coreFields.length === 0 && (
                                                    <p className="text-sm text-slate-400 italic py-2">还未识别出核心字段，请点击 AI 分析</p>
                                                )}
                                                {semanticProfile.coreFields.map((cf, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">Key</div>
                                                            <div>
                                                                <div className="font-mono text-sm font-bold text-slate-700">{cf.field}</div>
                                                                <div className="text-xs text-amber-700 opacity-80">{cf.reason}</div>
                                                            </div>
                                                        </div>
                                                        <CheckCircle size={16} className="text-amber-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Insights & Tags */}
                                    <div className="space-y-6">
                                        {/* AI Metrics Card */}
                                        <div className="bg-slate-800 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                <Activity size={100} />
                                            </div>
                                            <h4 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                                                <Activity size={18} className="text-emerald-400" />
                                                AI 洞察指标
                                            </h4>

                                            <div className="space-y-4 relative z-10">
                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-slate-300">数据质量分</span>
                                                        <span className="font-bold text-emerald-400">{semanticProfile.qualityScore}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${semanticProfile.qualityScore}%` }}></div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-slate-300">隐私等级</span>
                                                        <span className="font-bold text-orange-400">{semanticProfile.privacyLevel}</span>
                                                    </div>
                                                    <div className="flex gap-1 mt-1">
                                                        {['L1', 'L2', 'L3', 'L4'].map((l, idx) => (
                                                            <div key={l} className={`h-1.5 flex-1 rounded-full ${idx < parseInt(semanticProfile.privacyLevel?.slice(1, 2) || '1')
                                                                    ? 'bg-orange-500'
                                                                    : 'bg-slate-700'
                                                                }`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags Card */}
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <Tag size={16} className="text-blue-500" />
                                                业务场景标签
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {semanticProfile.scenarios.length === 0 && <span className="text-sm text-slate-400">-</span>}
                                                {semanticProfile.scenarios.map((s, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium flex items-center gap-1">
                                                        {s}
                                                    </span>
                                                ))}
                                                {editMode && (
                                                    <button className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-xs hover:bg-slate-200">
                                                        + 添加
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-900 text-sm">
                                            <h5 className="font-bold mb-2 flex items-center gap-2">
                                                <ShieldCheck size={16} /> 合规建议
                                            </h5>
                                            <p className="opacity-80 text-xs leading-relaxed">
                                                根据隐私等级 {semanticProfile.privacyLevel}，建议对 {semanticProfile.coreFields[0]?.field || '敏感字段'} 开启数据脱敏策略。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {editMode && !isAnalyzing && (
                            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <button onClick={() => setEditMode(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                    取消
                                </button>
                                <button onClick={handleSaveToMetadata}
                                    className="px-6 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold shadow-md shadow-emerald-200 transition-transform active:scale-95 flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    保存到元数据
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                            <Layers size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-600">逻辑视图未就绪</h3>
                        <p className="text-sm mt-2 max-w-xs text-center">请从左侧选择一个物理表，AI 将自动将其转化为具有业务含义的逻辑视图。</p>

                        <div className="flex items-center gap-4 mt-8 opacity-50">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded border border-slate-300 bg-white flex items-center justify-center"><Database size={16} /></div>
                                <span className="text-xs">物理表</span>
                            </div>
                            <ArrowRight size={16} />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded border border-emerald-300 bg-emerald-50 text-emerald-600 flex items-center justify-center"><Cpu size={16} /></div>
                                <span className="text-xs text-emerald-600 font-bold">AI 解析</span>
                            </div>
                            <ArrowRight size={16} />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded border border-slate-300 bg-white flex items-center justify-center"><Layers size={16} /></div>
                                <span className="text-xs">逻辑实体</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSemanticUnderstandingView;
