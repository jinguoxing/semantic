import { useState } from 'react';
import {
    Layout, Database, Search, CheckCircle, Plus, X,
    FileText, Settings, Layers, Trash2, ChevronDown, ChevronRight,
    Folder, FolderOpen, Box, Grid, PanelLeftClose, PanelLeftOpen,
    ChevronsDown, ChevronsUp, History, Upload, User, Zap, Tag, Link2, Sparkles, Table2, MessageSquare, Wand2
} from 'lucide-react';
import SemanticVersionPanel from './components/semantic-version/SemanticVersionPanel';
import PublishVersionDialog from './components/semantic-version/PublishVersionDialog';
import { semanticVersionService } from '../services/semantic/semanticVersionService';

// Object Type Configuration
type ObjectType = 'entity' | 'event' | 'rule' | 'state';

const getObjectTypeConfig = (type?: string) => {
    const typeMap: Record<ObjectType, { icon: React.ElementType; bg: string; text: string; border: string; label: string }> = {
        entity: { icon: User, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: '主体' },
        event: { icon: Zap, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: '行为' },
        rule: { icon: Settings, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: '规则' },
        state: { icon: Tag, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', label: '状态' }
    };
    const normalizedType = (type?.toLowerCase() || 'entity') as ObjectType;
    return typeMap[normalizedType] || typeMap.entity;
};

// Domain Group Configuration
// Domain Group Configuration
const DOMAIN_GROUPS = [
    {
        title: '组织与人力资源',
        domains: ['组织人事域', '薪酬福利域', '考勤工时域', '人才发展域']
    },
    {
        title: '供应链中心',
        domains: ['商品域', '采购域', '库存域', '物流域']
    },
    {
        title: '用户与交易',
        domains: ['用户域', '交易域']
    },
    {
        title: '政务服务场景',
        domains: ['出生一件事']
    }
];

interface BusinessModelingViewProps {
    businessObjects: any[];
    setBusinessObjects: (fn: (prev: any[]) => any[]) => void;
    onNavigateToMapping: (bo: any) => void;
}

const BusinessModelingView = ({ businessObjects, setBusinessObjects, onNavigateToMapping }: BusinessModelingViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBO, setEditingBO] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [currentField, setCurrentField] = useState<any>(null);
    const [selectedBoIds, setSelectedBoIds] = useState<string[]>([]);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
    const [domainSearch, setDomainSearch] = useState('');
    const [collapseAllDomains, setCollapseAllDomains] = useState(false);
    const [collapseDomainPanel, setCollapseDomainPanel] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterOwner, setFilterOwner] = useState('all');
    const [filterMappingStatus, setFilterMappingStatus] = useState('all');
    const [filterObjectType, setFilterObjectType] = useState('all');
    const [sortBy, setSortBy] = useState('recent');

    // Semantic Version State
    const [showVersionPanel, setShowVersionPanel] = useState(false);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const [activeSemanticVersion, setActiveSemanticVersion] = useState<string | null>(null);

    // AI Modeling State
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);
    const [showAIModelingModal, setShowAIModelingModal] = useState(false);
    const [showTableExtractModal, setShowTableExtractModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiGenerating, setAiGenerating] = useState(false);

    // Load active version on mount
    useState(() => {
        semanticVersionService.getActiveVersion().then(v => {
            if (v) setActiveSemanticVersion(v.version);
        });
    });

    // Initial Form State
    const initialBoState = {
        name: '',
        code: '',
        domain: '',
        owner: '',
        status: 'draft',
        description: '',
        fields: [] as any[]
    };

    const [boFormData, setBoFormData] = useState(initialBoState);

    // Initial Field State
    const initialFieldState = {
        name: '',
        type: 'String',
        required: false,
        description: ''
    };
    const [fieldFormData, setFieldFormData] = useState(initialFieldState);

    // Handlers
    const handleCreateBO = () => {
        setEditingBO(null);
        setBoFormData(initialBoState);
        setIsModalOpen(true);
    };

    const handleEditBO = (bo: any) => {
        setEditingBO(bo);
        setBoFormData({ ...bo });
        setIsModalOpen(true);
    };

    const handleDeleteBO = (id: string) => {
        if (confirm('确认删除此业务对象吗？')) {
            setBusinessObjects((prev: any[]) => prev.filter((item: any) => item.id !== id));
        }
    };

    const handleSaveBO = () => {
        if (!boFormData.name || !boFormData.code) return;

        if (editingBO) {
            setBusinessObjects((prev: any[]) => prev.map((item: any) => item.id === editingBO.id ? { ...boFormData, id: item.id } : item));
        } else {
            const newBO = {
                ...boFormData,
                id: `BO_${Date.now()}`,
                status: 'draft'
            };
            setBusinessObjects((prev: any[]) => [newBO, ...prev]);
        }
        setIsModalOpen(false);
    };

    // Field Handlers
    const handleAddField = () => {
        setCurrentField(null);
        setFieldFormData(initialFieldState);
        setShowFieldModal(true);
    };

    const handleEditField = (field: any, index: number) => {
        setCurrentField({ ...field, index });
        setFieldFormData({ ...field });
        setShowFieldModal(true);
    };

    const handleSaveField = () => {
        const newFields = [...boFormData.fields];
        if (currentField) {
            newFields[currentField.index] = fieldFormData;
        } else {
            newFields.push(fieldFormData);
        }
        setBoFormData({ ...boFormData, fields: newFields });
        setShowFieldModal(false);
    };

    const handleDeleteField = (index: number) => {
        const newFields = [...boFormData.fields];
        newFields.splice(index, 1);
        setBoFormData({ ...boFormData, fields: newFields });
    };

    const getMappingStatus = (bo: any) => {
        if (!bo.fields || bo.fields.length === 0) {
            return { label: '未映射', tone: 'bg-slate-100 text-slate-500' };
        }
        if (bo.status === 'published') {
            return { label: '已映射', tone: 'bg-emerald-50 text-emerald-600' };
        }
        return { label: '部分映射', tone: 'bg-amber-50 text-amber-600' };
    };

    const getMappingProgress = (bo: any) => {
        if (!bo.fields || bo.fields.length === 0) return 0;
        if (bo.status === 'published') return 100;
        return Math.min(70, 40 + bo.fields.length * 5);
    };

    const toggleSelection = (id: string) => {
        setSelectedBoIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBatchPublish = () => {
        const hasDraft = businessObjects.some(bo => selectedBoIds.includes(bo.id) && bo.status !== 'published');
        if (!hasDraft) return;
        setShowPublishConfirm(true);
    };

    const confirmBatchPublish = () => {
        setBusinessObjects(prev => prev.map(bo =>
            selectedBoIds.includes(bo.id) ? { ...bo, status: 'published' } : bo
        ));
        setSelectedBoIds([]);
        setShowPublishConfirm(false);
        // Removed alert to be less intrusive, or could add a toast here
    };

    const handleBatchArchive = () => {
        if (selectedBoIds.length === 0) return;
        if (!confirm('确认归档所选业务对象吗？')) return;
        setBusinessObjects(prev => prev.map(bo =>
            selectedBoIds.includes(bo.id) ? { ...bo, status: 'archived' } : bo
        ));
        setSelectedBoIds([]);
    };

    const handleBatchDelete = () => {
        if (selectedBoIds.length === 0) return;
        if (!confirm('确认删除所选业务对象吗？此操作不可撤销。')) return;
        setBusinessObjects(prev => prev.filter(bo => !selectedBoIds.includes(bo.id)));
        setSelectedBoIds([]);
    };

    const uniqueDomains = Array.from(new Set(businessObjects.map(bo => bo.domain).filter(Boolean)));
    const normalizedDomainSearch = domainSearch.trim().toLowerCase();
    const showDomainList = (!collapseAllDomains || normalizedDomainSearch.length > 0) && !collapseDomainPanel;
    const filteredDomainGroups = DOMAIN_GROUPS.map(group => ({
        ...group,
        domains: group.domains.filter(domain => domain.toLowerCase().includes(normalizedDomainSearch))
    })).filter(group => group.domains.length > 0);
    const otherDomains = uniqueDomains.filter(d => !DOMAIN_GROUPS.flatMap(g => g.domains).includes(d));
    const filteredOtherDomains = otherDomains.filter(domain => domain.toLowerCase().includes(normalizedDomainSearch));
    const uniqueOwners = Array.from(new Set(businessObjects.map(bo => bo.owner).filter(Boolean)));

    const filteredBOs = businessObjects.filter(bo => {
        const matchesSearch = bo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bo.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'ALL' || bo.domain === selectedDomain;
        const matchesStatus = filterStatus === 'all' || bo.status === filterStatus;
        const matchesOwner = filterOwner === 'all' || (bo.owner || '未设置') === filterOwner;

        // Mapping status filter
        const mappedTables = bo.mappedTables || bo.mapping?.tables || [];
        const isMapped = mappedTables.length > 0 || bo.status === 'published';
        const hasAbnormal = bo.mappingAbnormal === true;
        let matchesMappingStatus = true;
        if (filterMappingStatus === 'mapped') matchesMappingStatus = isMapped && !hasAbnormal;
        else if (filterMappingStatus === 'unmapped') matchesMappingStatus = !isMapped;
        else if (filterMappingStatus === 'abnormal') matchesMappingStatus = hasAbnormal;

        // Object type filter
        const objType = (bo.objectType || bo.type || 'entity').toLowerCase();
        let matchesObjectType = true;
        if (filterObjectType !== 'all') matchesObjectType = objType === filterObjectType;

        return matchesSearch && matchesDomain && matchesStatus && matchesOwner && matchesMappingStatus && matchesObjectType;
    }).sort((a, b) => {
        if (sortBy === 'fields') {
            return (b.fields?.length || 0) - (a.fields?.length || 0);
        }
        if (sortBy === 'mapping') {
            return getMappingProgress(b) - getMappingProgress(a);
        }
        return 0;
    });
    const boCards = filteredBOs.map(bo => {
        const typeConfig = getObjectTypeConfig(bo.objectType || bo.type);
        const TypeIcon = typeConfig.icon;
        return (
            <div key={bo.id} className={`bg-white rounded-xl border p-5 hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden ${selectedBoIds.includes(bo.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : typeConfig.border}`} onClick={() => onNavigateToMapping(bo)}>
                {/* Type Color Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${typeConfig.bg.replace('50', '400')}`} />

                <div onClick={(e) => { e.stopPropagation(); toggleSelection(bo.id); }} className="absolute top-4 left-4 z-10 p-2 -ml-2 -mt-2 hover:bg-slate-100 rounded-full">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBoIds.includes(bo.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                        {selectedBoIds.includes(bo.id) && <CheckCircle size={14} className="text-white" />}
                    </div>
                </div>
                <div className="flex justify-between items-start mb-3 pl-8 pt-1">
                    <div className={`w-9 h-9 rounded-lg ${typeConfig.bg} flex items-center justify-center ${typeConfig.text}`}>
                        <TypeIcon size={18} />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${typeConfig.bg} ${typeConfig.text}`}>
                            {typeConfig.label}
                        </span>
                        {/* Version difference indicator */}
                        {bo.status === 'published' && bo.hasUnpublishedChanges && (
                            <div className="group/version relative">
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-700 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    待发布
                                </span>
                                <div className="absolute top-full right-0 mt-1 hidden group-hover/version:block z-20">
                                    <div className="bg-slate-800 text-white text-[10px] rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                                        此对象已修改但尚未发布新版本
                                        <br />
                                        <span className="text-amber-400">问数/AI 仍在使用旧版本</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-700' : bo.status === 'archived' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-600'}`}>
                            {bo.status === 'published' ? '已发布' : (bo.status === 'draft' ? '草稿' : bo.status === 'archived' ? '归档' : bo.status)}
                        </div>
                    </div>
                </div>
                <h3 className="font-bold text-base text-slate-800 mb-1">{bo.name}</h3>
                <p className="text-xs font-mono text-slate-500 mb-3 bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">{bo.code}</p>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8 leading-relaxed">{bo.description || '暂无描述'}</p>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Layers size={12} /> {bo.domain}</span>
                    <span className="flex items-center gap-1"><CheckCircle size={12} /> {bo.fields?.length || 0} 字段</span>
                </div>

                {/* Mapping Status - Enhanced with table info */}
                {(() => {
                    const mappedTables = bo.mappedTables || bo.mapping?.tables || [];
                    const tableCount = mappedTables.length;
                    const isMapped = tableCount > 0 || bo.status === 'published';

                    return (
                        <div className="mb-3">
                            {isMapped ? (
                                <div className="group/mapping relative">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                                            <Link2 size={12} />
                                            已映射 {tableCount || 1} 张物理表
                                        </span>
                                        <span className="text-slate-400 text-[10px]">{getMappingProgress(bo)}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${getMappingProgress(bo)}%` }} />
                                    </div>
                                    {/* Hover Tooltip */}
                                    {tableCount > 0 && (
                                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/mapping:block z-20">
                                            <div className="bg-slate-800 text-white text-[10px] rounded-lg px-3 py-2 shadow-lg">
                                                <div className="font-medium mb-1 text-slate-300">映射的物理表:</div>
                                                {mappedTables.slice(0, 5).map((table: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-1 py-0.5">
                                                        <Database size={10} className="text-slate-400" />
                                                        <span className="font-mono">{table}</span>
                                                    </div>
                                                ))}
                                                {tableCount > 5 && (
                                                    <div className="text-slate-400 mt-1">还有 {tableCount - 5} 张...</div>
                                                )}
                                            </div>
                                            <div className="absolute top-full left-4 w-2 h-2 bg-slate-800 transform rotate-45 -mt-1" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs">
                                        <Link2 size={12} className="text-slate-400" />
                                        未映射
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); /* TODO: AI auto-find */ }}
                                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors font-medium"
                                        title="使用 AI 自动寻找匹配的物理表"
                                    >
                                        <Sparkles size={10} />
                                        AI 自动寻找
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigateToMapping(bo); }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium px-2 py-1 -ml-2 rounded hover:bg-blue-50 transition-colors"
                    >
                        去映射
                        <ChevronRight size={12} />
                    </button>
                    <div className="hidden group-hover:flex items-center gap-1 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleEditBO(bo); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="编辑">
                            <Settings size={14} />
                        </button>
                        {bo.status !== 'published' && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBO(bo.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    });

    return (
        <div className="space-y-6 h-[calc(100vh-theme(spacing.24))] flex flex-col animate-fade-in relative">
            {/* Header Row - Title & Action Buttons */}
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">业务对象建模</h2>
                    <p className="text-slate-500 mt-0.5 text-sm">定义核心业务实体、属性及其数据标准</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Split Button: New Object with AI Options */}
                    <div className="relative">
                        <div className="flex items-stretch">
                            <button
                                onClick={handleCreateBO}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 transition-all font-medium"
                            >
                                <Plus size={18} />
                                <span>新建对象</span>
                            </button>
                            <button
                                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                className="px-2 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-all border-l border-blue-500"
                            >
                                <ChevronDown size={16} className={`transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        {showCreateDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCreateDropdown(false)} />
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                                    <button
                                        onClick={() => { handleCreateBO(); setShowCreateDropdown(false); }}
                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Plus size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">手动新建</div>
                                            <div className="text-[10px] text-slate-500">从空白开始创建业务对象</div>
                                        </div>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button
                                        onClick={() => { setShowAIModelingModal(true); setShowCreateDropdown(false); }}
                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-indigo-50 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                            <Sparkles size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                                                AI 辅助建模
                                                <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full">NEW</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">用自然语言描述，AI 自动生成</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { setShowTableExtractModal(true); setShowCreateDropdown(false); }}
                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-emerald-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <Table2 size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-800">从物理表提取</div>
                                            <div className="text-[10px] text-slate-500">AI 逆向生成业务对象</div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="h-6 w-px bg-slate-200" />

                    <button
                        onClick={() => setShowVersionPanel(true)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="版本历史"
                    >
                        <History size={18} />
                        {activeSemanticVersion && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                                v{activeSemanticVersion}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowPublishDialog(true)}
                        disabled={businessObjects.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${businessObjects.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                            }`}
                    >
                        <Upload size={18} />
                        <span>发布语义版本</span>
                    </button>
                </div>
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-3 flex-shrink-0 bg-slate-50/50 -mx-6 px-6 py-3 border-y border-slate-100">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="搜索对象或编码..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-48 text-sm bg-white"
                    />
                </div>

                <div className="h-5 w-px bg-slate-200" />

                {/* Status Filters */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">筛选:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                        <option value="all">全部状态</option>
                        <option value="published">已发布</option>
                        <option value="draft">草稿</option>
                        <option value="archived">归档</option>
                    </select>
                    <select
                        value={filterMappingStatus}
                        onChange={(e) => setFilterMappingStatus(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                        <option value="all">全部映射</option>
                        <option value="mapped">🟢 已映射</option>
                        <option value="unmapped">⚪ 未映射</option>
                        <option value="abnormal">🟡 异常</option>
                    </select>
                    <select
                        value={filterObjectType}
                        onChange={(e) => setFilterObjectType(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                        <option value="all">全部类型</option>
                        <option value="entity">🔵 主体</option>
                        <option value="event">🟢 行为</option>
                        <option value="rule">🟡 规则</option>
                        <option value="state">🟣 状态</option>
                    </select>
                    <select
                        value={filterOwner}
                        onChange={(e) => setFilterOwner(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                        <option value="all">全部负责人</option>
                        {uniqueOwners.map(owner => (
                            <option key={owner} value={owner}>{owner}</option>
                        ))}
                        {!uniqueOwners.includes('未设置') && (
                            <option value="未设置">未设置</option>
                        )}
                    </select>
                </div>

                <div className="h-5 w-px bg-slate-200" />

                {/* Sort */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">排序:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    >
                        <option value="recent">最近更新</option>
                        <option value="fields">字段数</option>
                        <option value="mapping">映射完整度</option>
                    </select>
                </div>

                {/* Results Count */}
                <div className="ml-auto text-xs text-slate-500">
                    共 <span className="font-semibold text-slate-700">{filteredBOs.length}</span> 个对象
                </div>
            </div>

            {selectedBoIds.length > 0 && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="text-sm text-slate-600">
                        已选 <span className="font-semibold text-slate-800">{selectedBoIds.length}</span> 个对象
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBatchPublish}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <CheckCircle size={16} />
                            发布
                        </button>
                        <button
                            onClick={handleBatchArchive}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                            归档
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                            <Trash2 size={16} />
                            删除
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area with Sidebar */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Sidebar - Domain Tree */}
                <div className={`${collapseDomainPanel ? 'w-14' : 'w-64'} bg-white rounded-xl border border-slate-200 flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200`}>
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center justify-between h-7">
                            <h3 className={`font-bold text-slate-700 flex items-center gap-2 ${collapseDomainPanel ? 'justify-center w-full' : ''}`}>
                                {collapseDomainPanel ? (
                                    <button
                                        onClick={() => setCollapseDomainPanel(false)}
                                        className="text-slate-400 hover:text-blue-600 transition-colors"
                                        title="展开面板"
                                    >
                                        <PanelLeftOpen size={20} />
                                    </button>
                                ) : (
                                    <>
                                        <Layers size={18} className="text-blue-500" />
                                        <span>业务域</span>
                                    </>
                                )}
                            </h3>
                            {!collapseDomainPanel && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCollapseAllDomains(prev => !prev)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors"
                                        title={collapseAllDomains ? '展开全部' : '收起全部'}
                                    >
                                        {collapseAllDomains ? <ChevronsDown size={16} /> : <ChevronsUp size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setCollapseDomainPanel(true)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-200 rounded transition-colors"
                                        title="收起面板"
                                    >
                                        <PanelLeftClose size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {!collapseDomainPanel && (
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    value={domainSearch}
                                    onChange={(e) => setDomainSearch(e.target.value)}
                                    placeholder="搜索业务域..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    )}
                    {!collapseDomainPanel && (
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            {/* Tree Root: All Domains */}
                            <div className="mb-2">
                                <button
                                    onClick={() => setSelectedDomain('ALL')}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedDomain === 'ALL' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="flex items-center gap-2"><Grid size={16} className={selectedDomain === 'ALL' ? 'text-blue-600' : 'text-slate-400'} /> 全部业务域</span>
                                    <span className={`text-xs px-1.5 min-w-[20px] text-center rounded-full ${selectedDomain === 'ALL' ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                        {businessObjects.length}
                                    </span>
                                </button>
                            </div>

                            {/* Domain Groups (Folders) */}
                            <div className="space-y-1">
                                {showDomainList && filteredDomainGroups.map((group, idx) => {
                                    const isCollapsed = collapsedGroups[group.title];
                                    const groupActive = group.domains.includes(selectedDomain);
                                    return (
                                        <div key={idx} className="select-none">
                                            <button
                                                onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.title]: !prev[group.title] }))}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-slate-50 ${groupActive ? 'text-blue-800' : 'text-slate-700'}`}
                                            >
                                                <span className="text-slate-400 transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                                                    <ChevronDown size={14} />
                                                </span>
                                                {isCollapsed ? (
                                                    <Folder size={16} className={groupActive ? 'text-blue-500' : 'text-amber-400'} fill="currentColor" fillOpacity={0.2} />
                                                ) : (
                                                    <FolderOpen size={16} className={groupActive ? 'text-blue-500' : 'text-amber-400'} fill="currentColor" fillOpacity={0.2} />
                                                )}
                                                <span className="font-medium truncate flex-1 text-left">{group.title}</span>
                                            </button>

                                            {!isCollapsed && (
                                                <div className="mt-0.5 ml-6 space-y-0.5 border-l border-slate-200 pl-1">
                                                    {group.domains.map(domain => {
                                                        const count = businessObjects.filter(bo => bo.domain === domain).length;
                                                        const isActive = selectedDomain === domain;
                                                        return (
                                                            <button
                                                                key={domain}
                                                                onClick={() => setSelectedDomain(domain)}
                                                                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group relative ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <Layers size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                                                                    <span className="truncate">{domain}</span>
                                                                </div>
                                                                {count > 0 && (
                                                                    <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                                        {count}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Others Group */}
                            {showDomainList && filteredOtherDomains.length > 0 && (
                                <div className="mt-1 select-none">
                                    <button
                                        onClick={() => setCollapsedGroups(prev => ({ ...prev, '其他': !prev['其他'] }))}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-slate-50 text-slate-700"
                                    >
                                        <span className="text-slate-400 transition-transform duration-200" style={{ transform: collapsedGroups['其他'] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                                            <ChevronDown size={14} />
                                        </span>
                                        {collapsedGroups['其他'] ? (
                                            <Folder size={16} className="text-slate-400" fill="currentColor" fillOpacity={0.2} />
                                        ) : (
                                            <FolderOpen size={16} className="text-slate-400" fill="currentColor" fillOpacity={0.2} />
                                        )}
                                        <span className="font-medium truncate flex-1 text-left">未分组</span>
                                    </button>

                                    {!collapsedGroups['其他'] && (
                                        <div className="mt-0.5 ml-6 space-y-0.5 border-l border-slate-200 pl-1">
                                            {filteredOtherDomains.map(domain => {
                                                const count = businessObjects.filter(bo => bo.domain === domain).length;
                                                const isActive = selectedDomain === domain;
                                                return (
                                                    <button
                                                        key={domain}
                                                        onClick={() => setSelectedDomain(domain)}
                                                        className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <Box size={14} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                                                            <span className="truncate">{domain}</span>
                                                        </div>
                                                        <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                            {count}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Grid - BO List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                        {boCards}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">
                                    {editingBO ? '编辑业务对象' : '新建业务对象'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">配置对象的元数据及字段结构</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200"><X size={24} /></button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-8">
                            {/* Basic Info */}
                            <div className="flex gap-8 mb-8">
                                <div className="w-1/3 space-y-5">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <FileText size={18} className="text-blue-500" /> 基本信息
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">通过名称 <span className="text-red-500">*</span></label>
                                        <input type="text" value={boFormData.name} onChange={e => setBoFormData({ ...boFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：客户" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">标识编码 <span className="text-red-500">*</span></label>
                                        <input type="text" value={boFormData.code} onChange={e => setBoFormData({ ...boFormData, code: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：BO_CUSTOMER" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">所属域</label>
                                        <input type="text" value={boFormData.domain} onChange={e => setBoFormData({ ...boFormData, domain: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
                                        <input type="text" value={boFormData.owner} onChange={e => setBoFormData({ ...boFormData, owner: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                        <textarea value={boFormData.description} onChange={e => setBoFormData({ ...boFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {/* Fields List */}
                                <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Database size={18} className="text-emerald-500" /> 数据结构 ({boFormData.fields.length})
                                        </h4>
                                        <button onClick={handleAddField} className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-blue-300 hover:text-blue-600 transition-all font-medium shadow-sm">
                                            <Plus size={14} /> 添加字段
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3">字段名称</th>
                                                    <th className="px-4 py-3">类型</th>
                                                    <th className="px-4 py-3 text-center">必填</th>
                                                    <th className="px-4 py-3">描述</th>
                                                    <th className="px-4 py-3 text-right">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {boFormData.fields.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">暂无字段，请点击添加</td>
                                                    </tr>
                                                ) : (
                                                    boFormData.fields.map((field: any, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/30 group">
                                                            <td className="px-4 py-3 font-medium text-slate-800">{field.name}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-blue-600 bg-blue-50/50 rounded inline-block my-2 mx-4 px-2">{field.type}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                {field.required && <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{field.description || '-'}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleEditField(field, idx)} className="text-slate-400 hover:text-blue-600"><Settings size={14} /></button>
                                                                    <button onClick={() => handleDeleteField(idx)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md font-medium transition-colors">取消</button>
                            <button onClick={handleSaveBO} className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium shadow-sm shadow-blue-200 transition-colors">保存配置</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Confirmation Modal */}
            {showPublishConfirm && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-[480px] p-0 animate-scale-up overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                    <Database size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">确认发布业务对象</h3>
                                    <p className="text-sm text-slate-500 mb-4">
                                        您即将发布 <span className="font-bold text-slate-800">{selectedBoIds.length}</span> 个业务对象到智能数据中心。
                                        发布后，这些对象将对所有用户可见并可用于数据查询。
                                    </p>

                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 max-h-[150px] overflow-y-auto mb-2 custom-scrollbar">
                                        <ul className="space-y-2">
                                            {businessObjects
                                                .filter(bo => selectedBoIds.includes(bo.id))
                                                .map(bo => (
                                                    <li key={bo.id} className="flex items-center gap-2 text-sm text-slate-700">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                        <span className="font-medium">{bo.name}</span>
                                                        <span className="text-slate-400 font-mono text-xs">({bo.code})</span>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPublishConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmBatchPublish}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle size={16} />
                                确认发布
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Field Edit Modal (Nested) */}
            {showFieldModal && (
                <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-zoom-in">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">{currentField ? '编辑字段' : '添加字段'}</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">字段名称</label>
                                <input type="text" autoFocus value={fieldFormData.name} onChange={e => setFieldFormData({ ...fieldFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="如：mobile_phone" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">数据类型</label>
                                    <select value={fieldFormData.type} onChange={e => setFieldFormData({ ...fieldFormData, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                        <option value="String">String</option>
                                        <option value="Integer">Integer</option>
                                        <option value="Decimal">Decimal</option>
                                        <option value="Boolean">Boolean</option>
                                        <option value="DateTime">DateTime</option>
                                        <option value="Enum">Enum</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={fieldFormData.required} onChange={e => setFieldFormData({ ...fieldFormData, required: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                                        <span className="text-sm text-slate-700 font-medium">必须填写</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">字段描述</label>
                                <textarea value={fieldFormData.description} onChange={e => setFieldFormData({ ...fieldFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 h-20 resize-none" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowFieldModal(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">取消</button>
                                <button onClick={handleSaveField} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded" disabled={!fieldFormData.name}>确认</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Semantic Version Panel */}
            <SemanticVersionPanel
                isOpen={showVersionPanel}
                onClose={() => setShowVersionPanel(false)}
                onVersionChange={() => {
                    semanticVersionService.getActiveVersion().then(v => {
                        if (v) setActiveSemanticVersion(v.version);
                    });
                }}
            />

            {/* Publish Version Dialog */}
            <PublishVersionDialog
                isOpen={showPublishDialog}
                onClose={() => setShowPublishDialog(false)}
                businessObjects={businessObjects}
                onPublished={(version) => {
                    setActiveSemanticVersion(version.version);
                    setShowPublishDialog(false);
                }}
            />

            {/* AI Modeling Modal */}
            {showAIModelingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-[540px] max-h-[80vh] flex flex-col animate-fade-in">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-xl">
                            <div className="flex items-center gap-2 text-white">
                                <Sparkles size={20} />
                                <h2 className="font-bold">AI 辅助建模</h2>
                            </div>
                            <button
                                onClick={() => { setShowAIModelingModal(false); setAiPrompt(''); }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1">
                            <p className="text-sm text-slate-600 mb-4">
                                用自然语言描述您想要建模的业务对象，AI 将自动生成对象定义和字段结构。
                            </p>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    业务描述
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="例如：我要建一个电商退款模型，包含退款单号、退款金额、退款原因、申请时间、处理状态等字段..."
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm"
                                    rows={5}
                                    autoFocus
                                />
                            </div>

                            {/* Examples */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">示例提示</div>
                                <div className="space-y-1.5">
                                    {[
                                        '创建用户对象，包含用户ID、姓名、手机号、注册时间',
                                        '建一个订单模型，需要订单号、下单时间、金额、状态',
                                        '出生医学证明，包含新生儿姓名、出生日期、父母信息'
                                    ].map((example, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setAiPrompt(example)}
                                            className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded transition-colors"
                                        >
                                            "{example}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                            <button
                                onClick={() => { setShowAIModelingModal(false); setAiPrompt(''); }}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Call AI service
                                    setAiGenerating(true);
                                    setTimeout(() => {
                                        // Mock: Create a new BO based on prompt
                                        const newBO = {
                                            id: `BO_AI_${Date.now()}`,
                                            name: aiPrompt.slice(0, 10) + '...',
                                            code: `BO_AI_${Date.now()}`,
                                            domain: '待分类',
                                            status: 'draft',
                                            description: aiPrompt,
                                            fields: [],
                                            objectType: 'event'
                                        };
                                        setBusinessObjects((prev: any[]) => [newBO, ...prev]);
                                        setAiGenerating(false);
                                        setShowAIModelingModal(false);
                                        setAiPrompt('');
                                    }, 1500);
                                }}
                                disabled={!aiPrompt.trim() || aiGenerating}
                                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${!aiPrompt.trim() || aiGenerating
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90'
                                    }`}
                            >
                                {aiGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={16} />
                                        开始生成
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Extraction Modal */}
            {showTableExtractModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-[480px] flex flex-col animate-fade-in">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Table2 size={20} className="text-emerald-600" />
                                <h2 className="font-bold text-slate-800">从物理表提取</h2>
                            </div>
                            <button
                                onClick={() => setShowTableExtractModal(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <p className="text-sm text-slate-600 mb-4">
                                选择一张物理表，AI 将分析表结构并自动生成对应的业务对象定义。
                            </p>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    选择数据源
                                </label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                                    <option>MySQL - 业务主库</option>
                                    <option>PostgreSQL - 分析库</option>
                                    <option>Oracle - ERP系统</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    搜索表名
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="输入表名搜索..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Table List */}
                            <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                                {['t_order_master', 't_user_info', 't_product_sku', 't_refund_order', 'ods_birth_cert'].map((table, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-none"
                                    >
                                        <Database size={14} className="text-slate-400" />
                                        <span className="text-sm font-mono text-slate-700">{table}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                            <button
                                onClick={() => setShowTableExtractModal(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                            >
                                <Sparkles size={16} />
                                AI 提取
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessModelingView;
