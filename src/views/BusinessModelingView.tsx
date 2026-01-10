import { useState } from 'react';
import {
    Layout, Database, Search, CheckCircle, Plus, X,
    FileText, Settings, Layers
} from 'lucide-react';

interface BusinessModelingViewProps {
    businessObjects: any[];
    setBusinessObjects: (fn: (prev: any[]) => any[]) => void;
}

const BusinessModelingView = ({ businessObjects, setBusinessObjects }: BusinessModelingViewProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBO, setEditingBO] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [currentField, setCurrentField] = useState<any>(null);

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

    const filteredBOs = businessObjects.filter(bo =>
        bo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bo.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <button
                        onClick={handleCreateBO}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        <span>新建对象</span>
                    </button>
                </div>
            </div>

            {/* BO Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBOs.map(bo => (
                    <div key={bo.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group cursor-pointer relative" onClick={() => handleEditBO(bo)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Layout size={20} />
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {bo.status}
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
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBO(bo.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
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
