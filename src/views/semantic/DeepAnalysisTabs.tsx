import React, { useState } from 'react';
import {
    Table, Share2, Activity, ChevronRight, ChevronDown,
    Clock, Layers, Edit3, Plus, X, Database
} from 'lucide-react';
import { TableSemanticProfile, FieldSemanticProfile } from '../../types/semantic';

interface DeepAnalysisTabsProps {
    profile: TableSemanticProfile;
    fields: any[];
    onProfileChange?: (updates: Partial<TableSemanticProfile>) => void;
}

export const DeepAnalysisTabs: React.FC<DeepAnalysisTabsProps> = ({
    profile,
    fields,
    onProfileChange
}) => {
    const [activeTab, setActiveTab] = useState<'fields' | 'graph' | 'quality'>('fields');
    const [expandedFields, setExpandedFields] = useState<string[]>([]);
    const [showRelModal, setShowRelModal] = useState(false);
    const [editingRel, setEditingRel] = useState<{ index: number | null; targetTable: string; type: string; key: string }>({
        index: null, targetTable: '', type: '多对一', key: ''
    });

    const toggleFieldExpand = (fieldName: string) => {
        setExpandedFields(prev =>
            prev.includes(fieldName)
                ? prev.filter(f => f !== fieldName)
                : [...prev, fieldName]
        );
    };

    // Helper functions for field analysis
    const getSemanticRole = (name: string, primaryKey?: boolean): string => {
        if (primaryKey || /^id$/.test(name) || /_id$/.test(name)) return '标识符';
        if (/status|state|phase|stage/.test(name)) return '状态';
        if (/time$|date$|_at$/.test(name)) return '时间标记';
        return '业务属性';
    };

    const getSensitivity = (name: string): 'L1' | 'L2' | 'L3' | 'L4' => {
        if (/id_card|bank/.test(name)) return 'L4';
        if (/mobile|phone|name|address/.test(name)) return 'L3';
        if (/user|employee/.test(name)) return 'L2';
        return 'L1';
    };

    const getQualityGrade = (name: string): string => {
        if (name.includes('id')) return 'A';
        return Math.random() > 0.3 ? 'B' : 'C';
    };

    const handleSaveRelationship = () => {
        if (!editingRel.targetTable || !editingRel.key) return;

        const newRel = {
            targetTable: editingRel.targetTable,
            type: editingRel.type,
            key: editingRel.key,
            description: ''
        };

        const updatedRels = [...(profile.relationships || [])];
        if (editingRel.index !== null) {
            updatedRels[editingRel.index] = newRel;
        } else {
            updatedRels.push(newRel);
        }

        onProfileChange?.({ relationships: updatedRels });
        setShowRelModal(false);
        setEditingRel({ index: null, targetTable: '', type: '多对一', key: '' });
    };

    const handleDeleteRelationship = (index: number) => {
        const updatedRels = (profile.relationships || []).filter((_, i) => i !== index);
        onProfileChange?.({ relationships: updatedRels });
    };

    return (
        <div className="mt-6 border-t border-slate-200 pt-4">
            {/* Tab Header */}
            <div className="flex items-center gap-1 mb-4 border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-400 mr-2 font-medium">深入分析</span>
                <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'fields'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <Table size={14} /> 字段结构 ({fields.length})
                </button>
                <button
                    onClick={() => setActiveTab('graph')}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'graph'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <Share2 size={14} /> 关系图谱 ({profile.relationships?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('quality')}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'quality'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <Activity size={14} /> 质量概览
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden">
                {activeTab === 'fields' && (
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">字段名</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">类型</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">语义角色</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">敏感等级</th>
                                    <th className="px-4 py-2 text-left font-medium text-slate-600">质量</th>
                                    <th className="px-4 py-2 text-center font-medium text-slate-600 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {fields.map((field: any, idx: number) => {
                                    const role = getSemanticRole(field.name, field.primaryKey);
                                    const sensitivity = getSensitivity(field.name);
                                    const grade = getQualityGrade(field.name);
                                    const isExpanded = expandedFields.includes(field.name);

                                    return (
                                        <React.Fragment key={idx}>
                                            <tr
                                                className="bg-white hover:bg-slate-50 cursor-pointer"
                                                onClick={() => toggleFieldExpand(field.name)}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                        <span className="font-mono text-slate-700">{field.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500">{field.type}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-600">{role}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${sensitivity === 'L4' ? 'bg-red-50 text-red-600' :
                                                        sensitivity === 'L3' ? 'bg-orange-50 text-orange-600' :
                                                            sensitivity === 'L2' ? 'bg-yellow-50 text-yellow-600' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {sensitivity} {sensitivity !== 'L1' && '⚠'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`font-bold ${grade === 'A' ? 'text-emerald-600' :
                                                        grade === 'B' ? 'text-blue-600' :
                                                            'text-amber-600'
                                                        }`}>{grade}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <button className="text-slate-400 hover:text-blue-600">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50">
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="grid grid-cols-3 gap-3 text-xs">
                                                            <div className="bg-white p-2 rounded border border-slate-100">
                                                                <div className="text-slate-400 mb-1">D-01 语义角色</div>
                                                                <div className="font-medium text-slate-700">{role}</div>
                                                            </div>
                                                            <div className="bg-white p-2 rounded border border-slate-100">
                                                                <div className="text-slate-400 mb-1">D-04 敏感等级</div>
                                                                <div className="font-medium text-slate-700">{sensitivity}</div>
                                                            </div>
                                                            <div className="bg-white p-2 rounded border border-slate-100">
                                                                <div className="text-slate-400 mb-1">D-06 质量信号</div>
                                                                <div className="font-medium text-slate-700">空值率: {Math.floor(Math.random() * 10)}%</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'graph' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-slate-500">发现 {profile.relationships?.length || 0} 个关联关系</span>
                            <button
                                onClick={() => {
                                    setEditingRel({ index: null, targetTable: '', type: 'Many-to-One', key: '' });
                                    setShowRelModal(true);
                                }}
                                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Plus size={14} /> 添加关系
                            </button>
                        </div>

                        {profile.relationships && profile.relationships.length > 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="relative flex items-center">
                                    <div className="z-10 w-28 h-28 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center p-2 text-center shadow-lg border-4 border-blue-100">
                                        <Database size={20} className="mb-1 opacity-80" />
                                        <div className="text-xs font-bold truncate w-full px-1">{profile.tableName}</div>
                                    </div>
                                    {profile.relationships.map((rel, idx) => {
                                        const angle = (idx * (360 / profile.relationships!.length)) * (Math.PI / 180);
                                        const radius = 140;
                                        const x = Math.cos(angle) * radius;
                                        const y = Math.sin(angle) * radius;
                                        return (
                                            <div key={idx} className="absolute flex flex-col items-center group" style={{ transform: `translate(${x}px, ${y}px)` }}>
                                                <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center p-2 text-center z-10 hover:border-blue-400">
                                                    <div className="text-[9px] font-bold text-slate-500 mb-0.5">{rel.type}</div>
                                                    <div className="text-[10px] font-bold text-slate-700 break-all leading-tight">{rel.targetTable}</div>
                                                    <div className="mt-0.5 text-[8px] text-slate-400 bg-slate-50 px-1 rounded">{rel.key}</div>
                                                </div>
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
                                                            handleDeleteRelationship(idx);
                                                        }}
                                                        className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <Share2 size={36} className="mx-auto opacity-20 mb-2" />
                                <p className="text-sm">暂无关联关系</p>
                                <p className="text-xs mt-1">点击「添加关系」创建第一个关联</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-slate-700">数据质量总览</span>
                            <span className="px-3 py-1 text-sm font-bold bg-emerald-100 text-emerald-700 rounded-lg">B+</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">完整性</span>
                                    <span className="font-bold text-emerald-600">82%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">唯一性</span>
                                    <span className="font-bold text-blue-600">95%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">一致性</span>
                                    <span className="font-bold text-purple-600">78%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">时效性</span>
                                    <span className="font-bold text-amber-600">88%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Relationship Modal */}
            {showRelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRelModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg text-slate-800 mb-4">
                            {editingRel.index !== null ? '编辑关系' : '添加关系'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 block mb-1">目标表</label>
                                <input
                                    type="text"
                                    value={editingRel.targetTable}
                                    onChange={e => setEditingRel(prev => ({ ...prev, targetTable: e.target.value }))}
                                    placeholder="e.g. t_user"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 block mb-1">关系类型</label>
                                <select
                                    value={editingRel.type}
                                    onChange={e => setEditingRel(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                >
                                    <option value="多对一">多对一</option>
                                    <option value="一对多">一对多</option>
                                    <option value="多对多">多对多</option>
                                    <option value="一对一">一对一</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 block mb-1">关联字段</label>
                                <input
                                    type="text"
                                    value={editingRel.key}
                                    onChange={e => setEditingRel(prev => ({ ...prev, key: e.target.value }))}
                                    placeholder="e.g. user_id"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowRelModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveRelationship}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
