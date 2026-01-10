import React from 'react';
import { Lock } from 'lucide-react';

interface EnhancedFieldRowProps {
    field: any;
    index: number;
}

export const EnhancedFieldRow: React.FC<EnhancedFieldRowProps> = ({ field, index }) => {
    // Mock security and quality data based on field characteristics
    const isSensitive = field.name.includes('phone') || field.name.includes('mobile') ||
        field.name.includes('id_card') || field.name.includes('name') ||
        field.name.includes('email') || field.name.includes('address');
    const securityLevel = isSensitive ? (Math.random() > 0.5 ? 'L3' : 'L2') : 'L1';
    const qualityGrade = field.name.includes('id') || field.name.includes('code') ? 'A' :
        (Math.random() > 0.3 ? 'A' : 'B');

    const roleInfo = field.name.includes('id') ? { label: '标识符', color: 'purple' } :
        field.name.includes('time') || field.name.includes('date') ? { label: '时间', color: 'blue' } :
            field.name.includes('status') || field.name.includes('state') ? { label: '状态', color: 'amber' } :
                { label: '业务属性', color: 'slate' };

    return (
        <tr className="hover:bg-white transition-colors">
            <td className="px-2 py-1.5 font-mono text-sm text-blue-600">{field.name}</td>
            <td className="px-2 py-1.5 text-xs text-slate-500">{field.type}</td>
            <td className="px-2 py-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium
                    bg-${roleInfo.color}-100 text-${roleInfo.color}-700`}>
                    {roleInfo.label}
                </span>
            </td>
            <td className="px-2 py-1.5">
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium ${securityLevel === 'L3' ? 'bg-red-50 text-red-600 border border-red-200' :
                        securityLevel === 'L2' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                            'bg-slate-100 text-slate-500'
                    }`}>
                    {(securityLevel === 'L2' || securityLevel === 'L3') && <Lock size={10} />}
                    {securityLevel}
                </span>
            </td>
            <td className="px-2 py-1.5">
                <span className={`w-5 h-5 inline-flex items-center justify-center rounded text-[10px] font-bold ${qualityGrade === 'A' ? 'bg-emerald-100 text-emerald-600' :
                        qualityGrade === 'B' ? 'bg-blue-100 text-blue-600' :
                            'bg-amber-100 text-amber-600'
                    }`} title={qualityGrade === 'A' ? '空值率<5%, 唯一性100%' : '空值率<10%, 唯一性>90%'}>
                    {qualityGrade}
                </span>
            </td>
            <td className="px-2 py-1.5 text-xs text-slate-400 truncate max-w-[150px]">
                {field.comment || '-'}
            </td>
        </tr>
    );
};

interface EnhancedFieldListProps {
    fields: any[];
    maxShow?: number;
}

export const EnhancedFieldList: React.FC<EnhancedFieldListProps> = ({ fields, maxShow = 10 }) => {
    return (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>📋 字段详情 ({fields.length}个)</span>
                <span className="text-[10px] text-slate-400">含安全&质量评估</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                    <thead className="bg-slate-100 sticky top-0">
                        <tr>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">字段名</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">类型</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">语义</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">安全</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">质量</th>
                            <th className="px-2 py-1.5 text-left text-slate-500 font-medium">说明</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fields.slice(0, maxShow).map((field, idx) => (
                            <EnhancedFieldRow key={idx} field={field} index={idx} />
                        ))}
                    </tbody>
                </table>
                {fields.length > maxShow && (
                    <div className="text-center text-xs text-slate-400 py-2 bg-slate-50">
                        还有 {fields.length - maxShow} 个字段未显示...
                    </div>
                )}
            </div>
        </div>
    );
};
