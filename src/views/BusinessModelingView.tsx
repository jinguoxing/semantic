import { useState } from 'react';
import {
    Layout, Database, Search, CheckCircle, Plus, X,
    FileText, Settings, Layers, Trash2
} from 'lucide-react';

// Domain Group Configuration
const DOMAIN_GROUPS = [
    {
        title: '👥 组织与人力资源',
        domains: ['组织人事域', '薪酬福利域', '考勤工时域', '人才发展域']
    },
    {
        title: '📦 供应链中心',
        domains: ['商品域', '采购域', '库存域', '物流域']
    },
    {
        title: '👥 用户与交易',
        domains: ['用户域', '交易域']
    },
    {
        title: '🏛️ 政务服务场景',
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

    const toggleSelection = (id: string) => {
        setSelectedBoIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBatchPublish = () => {
        if (selectedBoIds.length === 0) return;
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

    const uniqueDomains = Array.from(new Set(businessObjects.map(bo => bo.domain).filter(Boolean)));

    const filteredBOs = businessObjects.filter(bo => {
        const matchesSearch = bo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bo.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'ALL' || bo.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    return (
        <div className="space-y-6 h-[calc(100vh-theme(spacing.24))] flex flex-col animate-fade-in relative">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">业务对象建模</h2>
                    <p className="text-slate-500 mt-1">定义核心业务实体、属性及其数据标准</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索对象或编码..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm shadow-sm"
                        />
                    </div>
                    {selectedBoIds.length > 0 && (
                        <button
                            onClick={handleBatchPublish}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 font-medium animate-fade-in"
                        >
                            <CheckCircle size={18} />
                            <span>批量发布 ({selectedBoIds.length})</span>
                        </button>
                    )}
                    <button
                        onClick={handleCreateBO}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        <span>新建对象</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area with Sidebar */}
            <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Sidebar - Domain Tree */}
                <div className="w-64 bg-white rounded-xl border border-slate-200 flex flex-col flex-shrink-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Layers size={18} className="text-blue-500" />
                            业务域
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-4">
                        <button
                            onClick={() => setSelectedDomain('ALL')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${selectedDomain === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span className="flex items-center gap-2"><Layers size={14} /> 全部域</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedDomain === 'ALL' ? 'bg-blue-200/50' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                {businessObjects.length}
                            </span>
                        </button>

                        {/* Render Groups */}
                        {DOMAIN_GROUPS.map((group, idx) => (
                            <div key={idx}>
                                <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">
                                    {group.title}
                                </h4>
                                <div className="space-y-0.5">
                                    {group.domains.map(domain => {
                                        const count = businessObjects.filter(bo => bo.domain === domain).length;
                                        return (
                                            <button
                                                key={domain}
                                                onClick={() => setSelectedDomain(domain)}
                                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ml-2 border-l border-slate-100 ${selectedDomain === domain ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{domain}</span>
                                                {count > 0 && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDomain === domain ? 'bg-blue-200/50' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                        {count}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Render Others */}
                        {uniqueDomains.filter(d => !DOMAIN_GROUPS.flatMap(g => g.domains).includes(d)).length > 0 && (
                            <div>
                                <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">
                                    📂 其他
                                </h4>
                                <div className="space-y-0.5">
                                    {uniqueDomains.filter(d => !DOMAIN_GROUPS.flatMap(g => g.domains).includes(d)).map(domain => {
                                        const count = businessObjects.filter(bo => bo.domain === domain).length;
                                        return (
                                            <button
                                                key={domain}
                                                onClick={() => setSelectedDomain(domain)}
                                                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between group ml-2 border-l border-slate-100 ${selectedDomain === domain ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{domain}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedDomain === domain ? 'bg-blue-200/50' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Grid - BO List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                        {filteredBOs.map(bo => (
                            <div key={bo.id} className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-all group cursor-pointer relative ${selectedBoIds.includes(bo.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-slate-200'}`} onClick={() => onNavigateToMapping(bo)}>
                                {bo.status !== 'published' && (
                                    <div onClick={(e) => { e.stopPropagation(); toggleSelection(bo.id); }} className="absolute top-4 left-4 z-10 p-2 -ml-2 -mt-2 hover:bg-slate-100 rounded-full">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedBoIds.includes(bo.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                            {selectedBoIds.includes(bo.id) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-4 pl-8">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Layout size={20} />
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {bo.status === 'published' ? '已发布' : (bo.status === 'draft' ? '草稿' : bo.status)}
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">{bo.name}</h3>
                                <p className="text-xs font-mono text-slate-500 mb-4 bg-slate-50 inline-block px-2 py-0.5 rounded">{bo.code}</p>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-6 h-10">{bo.description || '暂无描述'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Layers size={14} /> {bo.domain}</span>
                                        <span className="flex items-center gap-1"><CheckCircle size={14} /> {bo.fields?.length || 0} 字段</span>
                                    </div>
                                    <div className="hidden group-hover:flex items-center gap-1 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditBO(bo); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="编辑">
                                            <Settings size={16} />
                                        </button>
                                        {bo.status !== 'published' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBO(bo.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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
        </div>
    );
};

export default BusinessModelingView;
