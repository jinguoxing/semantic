import { useState } from 'react';
import { Search, Plus, X, FileText, Layers, Layout, ArrowRight } from 'lucide-react';
import { mockBusinessObjects } from '../data/mockData';

const ScenarioOrchestrationView = () => {
    // Mock Data for Scenarios
    const [scenarios, setScenarios] = useState<any[]>([
        {
            id: 'SC_001',
            name: '出生一件事高效办成',
            description: '整合出生医学证明、户口登记、医保参保等多个事项，实现"一表申请、一网通办"。',
            steps: [
                { id: 1, name: '医院签发出生证', boId: 'BO_CERT', type: 'trigger' },
                { id: 2, name: '推送落户申请', boId: 'BO_NEWBORN', type: 'action' },
                { id: 3, name: '医保自动参保', boId: 'BO_INSURANCE', type: 'action' }
            ],
            status: 'published',
            lastUpdate: '2024-05-20'
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScenario, setEditingScenario] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStepForm, setShowStepForm] = useState(false);
    const [currentStep, setCurrentStep] = useState<any>(null);

    const initialScenarioState = {
        name: '',
        description: '',
        steps: [] as any[],
        status: 'draft',
        lastUpdate: ''
    };

    const [formData, setFormData] = useState<any>(initialScenarioState);

    // Handlers
    const handleCreate = () => {
        setEditingScenario(null);
        setFormData(initialScenarioState);
        setIsModalOpen(true);
    };

    const handleEdit = (scenario: any) => {
        setEditingScenario(scenario);
        setFormData({ ...scenario });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('确认删除此场景吗？')) {
            setScenarios(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingScenario) {
            setScenarios(prev => prev.map((s: any) => s.id === editingScenario.id ? { ...s, ...formData } : s));
        } else {
            const newScenario = {
                ...formData,
                id: `SC_${Date.now()}`,
                lastUpdate: new Date().toISOString().split('T')[0]
            };
            setScenarios(prev => [newScenario, ...prev]);
        }
        setIsModalOpen(false);
    };

    // Step Handlers
    const handleAddStep = () => {
        setCurrentStep({ name: '', boId: '', type: 'action' });
        setShowStepForm(true);
    };

    const handleSaveStep = () => {
        if (!currentStep.name) return;

        const newSteps = [...formData.steps];
        if (currentStep.id) {
            const idx = newSteps.findIndex(s => s.id === currentStep.id);
            if (idx !== -1) newSteps[idx] = currentStep;
        } else {
            newSteps.push({ ...currentStep, id: Date.now() });
        }
        setFormData({ ...formData, steps: newSteps });
        setShowStepForm(false);
    };

    const handleDeleteStep = (stepId: number) => {
        setFormData({ ...formData, steps: formData.steps.filter((s: any) => s.id !== stepId) });
    };

    const filteredScenarios = scenarios.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">场景编排</h2>
                    <p className="text-slate-500 mt-1">定义跨部门业务流程与数据流转路径</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索场景..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        <span>新建场景</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredScenarios.map(scenario => (
                    <div key={scenario.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group relative cursor-pointer" onClick={() => handleEdit(scenario)}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{scenario.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${scenario.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {scenario.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm max-w-2xl">{scenario.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">最后更新</p>
                                <p className="text-sm font-mono text-slate-600">{scenario.lastUpdate}</p>
                            </div>
                        </div>

                        {/* Visual Flow Preview */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-4 overflow-x-auto">
                            <div className="flex items-center min-w-max">
                                {scenario.steps.map((step: any, idx: number) => (
                                    <div key={step.id} className="flex items-center">
                                        <div className="bg-white border border-slate-200 rounded px-3 py-2 flex flex-col items-center min-w-[120px] shadow-sm">
                                            <span className="text-xs font-medium text-slate-800">{step.name}</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded mt-1">{step.boId || 'No Object'}</span>
                                        </div>
                                        {idx < scenario.steps.length - 1 && (
                                            <div className="mx-2 text-slate-300">
                                                <ArrowRight size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {scenario.steps.length === 0 && <span className="text-sm text-slate-400 italic">暂无步骤</span>}
                            </div>
                        </div>

                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(scenario.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-fade-in-up">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-xl text-slate-800">{editingScenario ? '编辑场景' : '新建场景'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Left: Config */}
                            <div className="w-1/3 border-r border-slate-100 p-6 overflow-y-auto bg-white z-10">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> 基础信息</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">场景名称</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="draft">Draft</option>
                                            <option value="planning">Planning</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={16} /> 流程步骤</h4>
                                        <button onClick={handleAddStep} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium">Add Step</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.steps.map((step: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center group hover:border-blue-300 transition-colors">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-800">{step.name}</div>
                                                    <div className="text-xs text-slate-500">{step.boId || 'No Binding'}</div>
                                                </div>
                                                <button onClick={() => handleDeleteStep(step.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Visualization */}
                            <div className="flex-1 bg-slate-50/50 p-8 flex flex-col relative overflow-hidden">
                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-slate-500 border border-slate-200 shadow-sm">
                                    流程预览
                                </div>
                                <div className="flex-1 flex items-center justify-center overflow-auto">
                                    <div className="flex items-center gap-4">
                                        {formData.steps.length === 0 ? (
                                            <div className="text-slate-400 flex flex-col items-center">
                                                <Layers size={48} className="mb-2 opacity-20" />
                                                <p>点击左侧 "Add Step" 添加流程节点</p>
                                            </div>
                                        ) : (
                                            formData.steps.map((step: any, idx: number) => (
                                                <div key={idx} className="flex items-center animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                                    <div className="relative group">
                                                        <div className="w-40 bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-default z-10 relative">
                                                            <div className="text-xs font-bold text-blue-500 uppercase mb-1 tracking-wider">{step.type}</div>
                                                            <div className="font-bold text-slate-800 mb-2">{step.name}</div>
                                                            <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-center gap-1 truncate">
                                                                <Layout size={10} />
                                                                {step.boId ? mockBusinessObjects.find(b => b.id === step.boId)?.name || step.boId : '未关联对象'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {idx < formData.steps.length - 1 && (
                                                        <div className="w-12 h-0.5 bg-slate-300 mx-2 relative">
                                                            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-xl z-20">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium">取消</button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium shadow-sm shadow-blue-200">保存场景</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step Form Modal */}
            {showStepForm && (
                <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-zoom-in">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">添加/编辑步骤</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">步骤名称</label>
                                <input type="text" autoFocus value={currentStep.name} onChange={e => setCurrentStep({ ...currentStep, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">关联业务对象</label>
                                <select value={currentStep.boId} onChange={e => setCurrentStep({ ...currentStep, boId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                    <option value="">-- 选择对象 --</option>
                                    {mockBusinessObjects.map(bo => (
                                        <option key={bo.id} value={bo.id}>{bo.name} ({bo.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">类型</label>
                                <div className="flex gap-4 mt-1">
                                    {['trigger', 'action', 'decision'].map(t => (
                                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="stepType" checked={currentStep.type === t} onChange={() => setCurrentStep({ ...currentStep, type: t })} className="text-blue-600" />
                                            <span className="text-sm capitalize text-slate-700">{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowStepForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">取消</button>
                                <button onClick={handleSaveStep} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded" disabled={!currentStep.name}>确认</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScenarioOrchestrationView;
