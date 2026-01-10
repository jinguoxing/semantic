import React, { useState } from 'react';
import { Table, Columns, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { TableSemanticProfile } from '../../types/semantic';

interface RuleItem {
    code: string;
    name: string;
    status: 'pass' | 'fail';
    value: string;
}

interface DimensionSummaryProps {
    profile: TableSemanticProfile;
}

export const DimensionSummary: React.FC<DimensionSummaryProps> = ({ profile }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Table Dimension Rules - 用户友好的名称
    const tableRules: RuleItem[] = [
        { code: '命名', name: '表名是否有业务含义', status: 'pass', value: profile.ruleScore.naming > 0.5 ? '语义明确' : '弱语义' },
        { code: '主键', name: '是否存在主键字段', status: profile.gateResult.details.primaryKey ? 'pass' : 'fail', value: profile.gateResult.details.primaryKey ? '已识别' : '缺失' },
        { code: '时间', name: '是否有生命周期字段', status: profile.gateResult.details.lifecycle ? 'pass' : 'fail', value: profile.gateResult.details.lifecycle ? '已识别' : '缺失' },
        { code: '类型', name: '是否为有效业务表', status: profile.gateResult.details.tableType ? 'pass' : 'fail', value: profile.gateResult.details.tableType ? '有效' : '非业务表' },
    ];

    // Field Dimension Rules
    const fieldCount = profile.fields.length;
    const keyFields = profile.fields.filter(f => f.role === 'Identifier' || f.role === 'BusAttr').length;
    const sensitiveFields = profile.fields.filter(f => f.sensitivity !== 'L1').length;

    const fieldRules: RuleItem[] = [
        { code: '核心', name: '核心字段占比', status: 'pass', value: `${keyFields}/${fieldCount} 个` },
        { code: '敏感', name: '敏感数据检测', status: 'pass', value: `${sensitiveFields} 个` },
        { code: '命名', name: '字段命名规范', status: 'pass', value: '高' },
    ];

    const tablePassedCount = tableRules.filter(r => r.status === 'pass').length;
    const fieldPassedCount = fieldRules.filter(r => r.status === 'pass').length;
    const failedRules = tableRules.filter(r => r.status === 'fail');

    const tableScore = profile.ruleScore.total;
    const fieldScore = profile.fieldScore || 0.85;

    return (
        <div className="mb-4">
            {/* Summary Line */}
            <div
                className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-6">
                    {/* Table Dimension Summary */}
                    <div className="flex items-center gap-2">
                        <Table size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">表维度:</span>
                        <span className={`text-sm font-bold ${tableScore > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {tableScore.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">
                            ({tablePassedCount}/{tableRules.length}通过)
                        </span>
                    </div>

                    <div className="w-px h-4 bg-slate-300"></div>

                    {/* Field Dimension Summary */}
                    <div className="flex items-center gap-2">
                        <Columns size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700">字段维度:</span>
                        <span className={`text-sm font-bold ${fieldScore > 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {fieldScore.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400">
                            ({fieldPassedCount}/{fieldRules.length}通过)
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {failedRules.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                            <AlertTriangle size={12} />
                            {failedRules.length} 项未通过
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                        <ChevronRight size={18} className="text-slate-400" />
                    )}
                </div>
            </div>

            {/* Failed Rules Warning */}
            {!isExpanded && failedRules.length > 0 && (
                <div className="mt-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    <span>未通过项:</span>
                    {failedRules.map((r, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-amber-100 rounded">
                            {r.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Table Dimension Details */}
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Table size={16} className="text-blue-600" />
                            <span className="font-medium text-slate-700">表维度分析</span>
                            <span className="ml-auto text-sm font-bold text-blue-600">{tableScore.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                            {tableRules.map((rule, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-mono">{rule.code}</span>
                                        <span className="text-slate-600">{rule.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{rule.value}</span>
                                        {rule.status === 'pass' ? (
                                            <CheckCircle size={14} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Field Dimension Details */}
                    <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Columns size={16} className="text-emerald-600" />
                            <span className="font-medium text-slate-700">字段维度分析</span>
                            <span className="ml-auto text-sm font-bold text-emerald-600">{fieldScore.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                            {fieldRules.map((rule, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-mono">{rule.code}</span>
                                        <span className="text-slate-600">{rule.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">{rule.value}</span>
                                        {rule.status === 'pass' ? (
                                            <CheckCircle size={14} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={14} className="text-red-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Gate Result Message */}
            {profile.gateResult.reasons.length > 0 && (
                <div className="mt-3 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div>
                        {profile.gateResult.reasons.map((reason, i) => (
                            <div key={i}>{reason}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
