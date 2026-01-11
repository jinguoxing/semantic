import React, { useState } from 'react';
import { TrendingUp, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { TableSemanticProfile } from '../../types/semantic';

interface ScoringDimension {
    name: string;
    weight: number;
    score: number;
    status: 'pass' | 'warning' | 'info';
    diagnosis: string;
    suggestion: string;
    optional?: boolean;
}

interface ScoringScenario {
    name: string;
    focus: string;
    dimensions: ScoringDimension[];
}

interface ScoringBreakdownPanelProps {
    profile: TableSemanticProfile;
    fields: any[];
}

export const ScoringBreakdownPanel: React.FC<ScoringBreakdownPanelProps> = ({ profile, fields }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Detect scenario based on table characteristics
    const detectScenario = (): 'DWS' | 'DWD' | 'DIM' => {
        const tableName = profile.tableName.toLowerCase();

        // DWS: 汇总宽表 (summary/aggregate tables)
        if (tableName.includes('_sum') || tableName.includes('_agg') || tableName.includes('dws_')) {
            return 'DWS';
        }

        // DIM: 维度表 (dimension tables)
        if (tableName.includes('_dim') || tableName.includes('dim_') || profile.objectType === 'attribute') {
            return 'DIM';
        }

        // DWD: 明细表 (detail tables) - default
        return 'DWD';
    };

    // Calculate dimension scores
    const calculateDimensions = (scenarioType: 'DWS' | 'DWD' | 'DIM'): ScoringDimension[] => {
        // Comment coverage
        const fieldsWithComment = fields.filter(f => f.comment && f.comment.trim() !== '').length;
        const commentCoverage = fields.length > 0 ? (fieldsWithComment / fields.length) * 100 : 0;

        // Primary key detection
        const hasPrimaryKey = fields.some(f => f.key === 'PK' || f.role === 'Identifier');

        // Naming convention check (simple heuristic)
        const wellNamedFields = fields.filter(f => {
            const name = f.name.toLowerCase();
            return name.length > 2 && !name.includes('col') && !name.includes('field');
        }).length;
        const namingScore = fields.length > 0 ? (wellNamedFields / fields.length) * 100 : 0;

        if (scenarioType === 'DWS') {
            const commentDim: ScoringDimension = {
                name: '业务注释',
                weight: 50,
                score: Math.round(commentCoverage / 100 * 50),
                status: commentCoverage >= 60 ? 'pass' : 'warning',
                diagnosis: commentCoverage >= 60 ? '注释覆盖率良好' : '注释覆盖率不足',
                suggestion: commentCoverage >= 60 ? '继续保持良好的注释习惯' : '建议：补充关键指标字段注释'
            };

            const pkDim: ScoringDimension = {
                name: '物理主键',
                weight: 20,
                score: hasPrimaryKey ? 20 : 0,
                status: 'info',
                diagnosis: hasPrimaryKey ? '已检测到主键' : '未检测到物理主键',
                suggestion: '(注：汇总表不强制，但建议指定逻辑主键)',
                optional: true
            };

            const namingDim: ScoringDimension = {
                name: '字段命名',
                weight: 30,
                score: Math.round(namingScore / 100 * 30),
                status: namingScore >= 70 ? 'pass' : 'warning',
                diagnosis: namingScore >= 70 ? '命名规范良好' : '部分字段命名不规范',
                suggestion: namingScore >= 70 ? '命名清晰易懂' : '建议：使用有业务含义的字段名'
            };

            return [commentDim, pkDim, namingDim];
        }

        else if (scenarioType === 'DWD') {
            const pkDim: ScoringDimension = {
                name: '主键完整性',
                weight: 40,
                score: hasPrimaryKey ? 40 : 0,
                status: hasPrimaryKey ? 'pass' : 'warning',
                diagnosis: hasPrimaryKey ? '主键定义完整' : '缺少主键定义',
                suggestion: hasPrimaryKey ? '主键设置正确' : '建议：明确指定业务主键字段'
            };

            const commentDim: ScoringDimension = {
                name: '业务注释',
                weight: 30,
                score: Math.round(commentCoverage / 100 * 30),
                status: commentCoverage >= 50 ? 'pass' : 'warning',
                diagnosis: commentCoverage >= 50 ? '注释覆盖率达标' : '注释覆盖率偏低',
                suggestion: commentCoverage >= 50 ? '保持注释习惯' : '建议：补充核心字段注释'
            };

            const lifecycleDim: ScoringDimension = {
                name: '生命周期字段',
                weight: 30,
                score: profile.gateResult.details.lifecycle ? 30 : 0,
                status: profile.gateResult.details.lifecycle ? 'pass' : 'warning',
                diagnosis: profile.gateResult.details.lifecycle ? '生命周期字段完备' : '缺少时间字段',
                suggestion: profile.gateResult.details.lifecycle ? '时间字段设置合理' : '建议：添加 created_time/updated_time'
            };

            return [pkDim, commentDim, lifecycleDim];
        }

        else { // DIM
            const pkDim: ScoringDimension = {
                name: '维度主键',
                weight: 40,
                score: hasPrimaryKey ? 40 : 0,
                status: hasPrimaryKey ? 'pass' : 'warning',
                diagnosis: hasPrimaryKey ? '维度主键明确' : '缺少维度主键',
                suggestion: hasPrimaryKey ? '主键定义清晰' : '建议：设置维度表唯一标识'
            };

            const namingDim: ScoringDimension = {
                name: '属性规范性',
                weight: 35,
                score: Math.round(namingScore / 100 * 35),
                status: namingScore >= 80 ? 'pass' : 'warning',
                diagnosis: namingScore >= 80 ? '属性命名规范' : '属性命名需优化',
                suggestion: namingScore >= 80 ? '属性定义清晰' : '建议：统一属性命名风格'
            };

            const commentDim: ScoringDimension = {
                name: '枚举说明',
                weight: 25,
                score: Math.round(commentCoverage / 100 * 25),
                status: commentCoverage >= 70 ? 'pass' : 'info',
                diagnosis: commentCoverage >= 70 ? '枚举值说明完整' : '建议补充枚举说明',
                suggestion: '维度表应详细说明各属性的取值范围'
            };

            return [pkDim, namingDim, commentDim];
        }
    };

    const scenarioType = detectScenario();
    const dimensions = calculateDimensions(scenarioType);
    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    const maxScore = dimensions.reduce((sum, d) => sum + d.weight, 0);
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const scenarioNames = {
        'DWS': 'DWS 汇总宽表标准',
        'DWD': 'DWD 明细表标准',
        'DIM': 'DIM 维度表标准'
    };

    const scenarioFocus = {
        'DWS': '重点考核语义清晰度',
        'DWD': '重点考核主键完整性',
        'DIM': '重点考核属性规范性'
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass':
                return <CheckCircle size={14} className="text-emerald-500" />;
            case 'warning':
                return <AlertTriangle size={14} className="text-amber-500" />;
            default:
                return <Info size={14} className="text-blue-500" />;
        }
    };

    return (
        <div className="mb-4">
            {/* Summary Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100 cursor-pointer hover:shadow-md transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="text-indigo-600" />
                        <div>
                            <div className="font-bold text-slate-800">📊 评分透视</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                当前策略：{scenarioNames[scenarioType]} ({scenarioFocus[scenarioType]})
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">{scorePercentage}%</div>
                            <div className="text-xs text-slate-500">{totalScore}/{maxScore} 分</div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? '收起 ▲' : '展开 ▼'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            {isExpanded && (
                <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">考核维度</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-600 w-24">得分</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-600">诊断结果与修复建议</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {dimensions.map((dim, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(dim.status)}
                                            <span className="font-medium text-slate-700">{dim.name}</span>
                                            {dim.optional && (
                                                <span className="text-xs text-slate-400 italic">(可选)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-bold ${dim.status === 'pass' ? 'text-emerald-600' :
                                                dim.status === 'warning' ? 'text-amber-600' :
                                                    'text-blue-600'
                                            }`}>
                                            {dim.score}/{dim.weight}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className={`font-medium ${dim.status === 'pass' ? 'text-emerald-700' :
                                                    dim.status === 'warning' ? 'text-amber-700' :
                                                        'text-blue-700'
                                                }`}>
                                                {dim.status === 'pass' && '✓ '}
                                                {dim.status === 'warning' && '⚠️ '}
                                                {dim.status === 'info' && 'ℹ️ '}
                                                {dim.diagnosis}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 italic">
                                                {dim.suggestion}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
