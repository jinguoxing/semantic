import { useState, useEffect } from 'react';
import {
    Layout, Database, GitMerge, CheckCircle, AlertCircle,
    Cpu, Plus, Link, Settings, Sparkles, X
} from 'lucide-react';
import { mockDataSources, mockBOTableMappings } from '../data/mockData';

interface BOMappingStudioViewProps {
    selectedBO: any;
    showRuleEditor: any;
    setShowRuleEditor: (val: any) => void;
    businessObjects: any[];
    setBusinessObjects: (val: any) => void;
}

const BOMappingStudioView = ({ selectedBO, showRuleEditor, setShowRuleEditor, businessObjects, setBusinessObjects }: BOMappingStudioViewProps) => {
    const [activeBOId, setActiveBOId] = useState(selectedBO?.id || 'BO_NEWBORN');
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

    // 数据源树状态
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(mockDataSources[0]?.id || null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    // Get active BO from businessObjects
    const activeBO = businessObjects.find(bo => bo.id === activeBOId) || businessObjects[0];

    // Get associated table mapping
    const tableMapping = mockBOTableMappings[activeBOId] || null;

    // Calculate mapping stats
    const totalFields = activeBO?.fields?.length || 0;
    const mappedCount = tableMapping?.mappings?.length || 0;
    const mappingPercentage = totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0;

    // 获取选中的数据源和表
    const selectedDataSource = mockDataSources.find(ds => ds.id === selectedDataSourceId);
    let selectedTable = selectedDataSource?.tables?.find((t: any) => t.id === selectedTableId);

    // Fallback: If table not found in DS tree (e.g. mock data mismatch), try to construct it from mapping
    if (!selectedTable && tableMapping && (tableMapping.tableId === selectedTableId || !selectedTableId)) {
        selectedTable = {
            id: tableMapping.tableId,
            name: tableMapping.tableName,
            columns: tableMapping.fields.map(f => ({ ...f, comment: '' })), // Map fields to columns for display
            comment: 'Mapped Table',
            rows: 'N/A',
            updateTime: '-'
        };
    }

    // Effect: Auto-select mapped table when BO changes
    useEffect(() => {
        if (!activeBOId) return;
        const mapping = mockBOTableMappings[activeBOId];
        if (mapping) {
            // Try to find the table in data sources
            let found = false;
            for (const ds of mockDataSources) {
                const table = ds.tables?.find((t: any) => t.id === mapping.tableId || t.name === mapping.tableName);
                if (table) {
                    setSelectedDataSourceId(ds.id);
                    setSelectedTableId(table.id);
                    found = true;
                    break;
                }
            }
            // If not found in DS tree, still set the ID so our fallback can work
            if (!found) {
                // Keep current DS or clear it? Keeping current might be less jarring, but technically incorrect. 
                // Let's rely on fallback logic which uses tableMapping directly.
                setSelectedTableId(mapping.tableId);
            }
        } else {
            // No mapping, clear selection or keep previous? 
            // Better to clear to show "Select Table" state? Or maybe keep default.
            // Let's clear table selection to indicate transparency.
            setSelectedTableId(null);
        }
    }, [activeBOId]);

    // Handle One-Click Generate
    const handleGenerateClick = () => {
        if (!activeBO || !selectedTable) return;
        setShowGenerateConfirm(true);
    };

    const confirmGenerateFields = () => {
        if (!activeBO || !selectedTable) return;

        // Generate fields from physical columns
        const newFields = selectedTable.columns.map((col: any) => ({
            id: col.name,
            name: col.comment || col.name,
            code: col.name,
            type: col.type,
            required: false,
            bg: col.name.includes('id') || col.name.includes('key'), // Simple heuristic
            isPrimary: col.name === 'id' || col.name.endsWith('_id')
        }));

        // Update Business Object
        const updatedBO = { ...activeBO, fields: newFields };

        // Update state
        if (setBusinessObjects) {
            setBusinessObjects(businessObjects.map(bo => bo.id === activeBO.id ? updatedBO : bo));
        }

        // Mock creating mapping (since we can't write to mock file, we simulate update visually or assume fields match)
        // In a real app, we would also create the mapping record here.
        setShowGenerateConfirm(false);
    };


    return (
        <div className="h-full flex animate-fade-in gap-3">


            {/* 中间: BO选择器 */}
            <div className="w-56 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">业务对象</h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择要映射的对象</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {businessObjects.map(bo => {
                        const boMapping = mockBOTableMappings[bo.id];
                        const boMappedCount = boMapping?.mappings?.length || 0;
                        const boTotalFields = bo.fields?.length || 0;
                        const hasMapping = boMappedCount > 0;

                        return (
                            <div
                                key={bo.id}
                                onClick={() => setActiveBOId(bo.id)}
                                className={`p-2 rounded-lg mb-2 cursor-pointer transition-all ${activeBOId === bo.id
                                    ? 'bg-purple-50 border-2 border-purple-500 shadow-sm'
                                    : 'bg-slate-50 border border-slate-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center ${hasMapping ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Layout size={12} />
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{bo.name}</div>
                                    </div>
                                    {hasMapping && <CheckCircle size={12} className="text-emerald-600" />}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${hasMapping ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${boTotalFields > 0 ? (boMappedCount / boTotalFields) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{boMappedCount}/{boTotalFields}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 顶部工具栏 */}
                <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <GitMerge className="text-purple-600" size={20} />
                            语义映射工作台
                        </h2>
                        <p className="text-xs text-slate-500">
                            {activeBO?.name} → {selectedTable?.name || tableMapping?.tableName || '选择物理表'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <span className="text-xs text-slate-500">映射进度</span>
                            <span className={`text-sm font-bold ${mappingPercentage === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {mappingPercentage}%
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            <Cpu size={14} /> AI 自动映射
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                            <CheckCircle size={14} /> 保存
                        </button>
                    </div>
                </div>

                {/* 映射画布 */}
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex gap-4 rounded-b-xl border-x border-b border-slate-200">
                    {/* 左侧: 业务对象字段 */}
                    <div className="w-[250px] bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <Layout size={16} />
                                <span className="font-bold text-sm">{activeBO?.name}</span>
                            </div>
                            <div className="text-xs text-blue-100 font-mono mt-1">{activeBO?.code}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {activeBO?.fields?.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs mt-4">
                                    <AlertCircle size={20} className="mx-auto mb-2 opacity-30" />
                                    暂无业务字段
                                </div>
                            )}
                            {activeBO?.fields?.map((field: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.boField === field.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-slate-700">{field.name}</span>
                                                {field.required && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                        </div>
                                        {mapping ? <CheckCircle size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-red-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 中间: 映射关系 */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {tableMapping && tableMapping.mappings.length > 0 ? (
                            <div className="w-full space-y-2 max-h-full overflow-y-auto">
                                {tableMapping.mappings.map((m, idx) => (
                                    <div key={idx} className="flex items-center bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-blue-700">{m.boField}</span>
                                        </div>
                                        <div className="mx-3 flex items-center gap-1">
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-slate-300" />
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-300">
                                                <Link size={10} />
                                            </div>
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-slate-300 to-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs font-mono text-emerald-700">{m.tblField}</span>
                                        </div>
                                        <button onClick={() => setShowRuleEditor(m)} className="ml-2 p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                            <Settings size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <GitMerge size={32} />
                                </div>
                                <p className="text-slate-500 font-medium text-sm">暂无映射关系</p>

                                {activeBO?.fields?.length === 0 && selectedTable ? (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <button
                                            onClick={handleGenerateClick}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 mx-auto text-xs font-bold"
                                        >
                                            <Sparkles size={14} className="text-yellow-300" />
                                            一键生成业务字段 (从物理表)
                                        </button>
                                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                                            将物理表 "{selectedTable.name}" 的所有字段导入到业务对象 "{activeBO.name}" 中
                                        </p>
                                    </div>
                                ) : (
                                    <button className="mt-3 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 mx-auto text-xs">
                                        <Plus size={14} /> 添加映射
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 右侧: 物理表字段 - 显示选中的表 */}
                    <div className="w-[250px] bg-white rounded-xl border border-emerald-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            <div className="flex items-center gap-2">
                                <Database size={16} />
                                <span className="font-bold text-sm truncate">{selectedTable?.name || '选择物理表'}</span>
                            </div>
                            {selectedTable && (
                                <div className="text-xs text-emerald-100 mt-1">{selectedTable.comment} · {selectedTable.rows} 行</div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {selectedTable?.columns?.map((col: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.tblField === col.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-slate-700">{col.name}</div>
                                            <div className="text-[10px] text-slate-400">{col.comment} · {col.type}</div>
                                        </div>
                                        {mapping && <CheckCircle size={12} className="text-emerald-600" />}
                                    </div>
                                );
                            }) || (
                                    <div className="p-4 text-center text-slate-400 text-xs">
                                        <Database size={28} className="mx-auto mb-2 opacity-30" />
                                        请在左侧选择物理表
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showGenerateConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles size={18} className="text-purple-600" />
                                确认生成字段
                            </h3>
                            <button
                                onClick={() => setShowGenerateConfirm(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                    <AlertCircle size={20} className="text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        确定要从物理表 <span className="font-bold text-slate-800">{selectedTable?.name}</span> 生成业务字段吗？
                                    </p>
                                    <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded border border-red-100">
                                        注意：这将覆盖当前业务对象 "{activeBO?.name}" 的所有现有字段（如有）。
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowGenerateConfirm(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmGenerateFields}
                                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors font-medium"
                            >
                                确定生成
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BOMappingStudioView;
