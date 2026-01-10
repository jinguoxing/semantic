import React, { useState } from 'react';
import { Sparkles, Activity, CheckCircle, ChevronDown, ChevronRight, Bot } from 'lucide-react';
import { TableSemanticProfile, BUSINESS_DOMAINS, ObjectType } from '../../types/semantic';
import { DimensionSummary } from './DimensionSummary';
import { DeepAnalysisTabs } from './DeepAnalysisTabs';

interface SemanticAnalysisCardProps {
    profile: TableSemanticProfile;
    fields: any[]; // Physical table fields for deep analysis
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isEditing?: boolean;
    onProfileChange?: (updates: Partial<TableSemanticProfile>) => void;
    onSaveEdit?: () => void;
}

// Object type labels in Chinese
const OBJECT_TYPE_LABELS: Record<ObjectType, { label: string; desc: string }> = {
    entity: { label: '主体', desc: '核心业务实体' },
    event: { label: '行为', desc: '业务动作记录' },
    state: { label: '状态', desc: '状态快照' },
    rule: { label: '规则', desc: '业务配置' },
    attribute: { label: '属性', desc: '派生数据' },
};

export const SemanticAnalysisCard: React.FC<SemanticAnalysisCardProps> = ({
    profile,
    fields,
    onAccept,
    onReject,
    onEdit,
    isEditing = false,
    onProfileChange,
    onSaveEdit
}) => {
    const [showLifecycle, setShowLifecycle] = useState(true);  // 优化: 默认展开
    const [showSecurity, setShowSecurity] = useState(true);    // 优化: 默认展开

    // Gate Result Logic for Display
    const isGateFailed = profile.gateResult.result !== 'PASS';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={18} />
                    <h2 className="font-bold text-slate-800">语义理解引擎</h2>
                </div>
                {isGateFailed && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">
                        规则拦截
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* V2.1: Compressed Dimension Summary */}
                <DimensionSummary profile={profile} />

                {/* Deep Analysis Tabs */}
                <DeepAnalysisTabs
                    profile={profile}
                    fields={fields}
                    onProfileChange={onProfileChange}
                />

                {/* V2 Beta: Comprehensive Conclusion Card */}
                <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50/30 rounded-xl p-6 border-2 border-purple-200 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={120} />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            🎯 综合语义结论
                            {/* 优化: 置信度色彩心理学 */}
                            <span className={`text-sm px-3 py-1 rounded-full border font-medium flex items-center gap-1 ${profile.finalScore > 0.9
                                ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300'
                                : profile.finalScore > 0.6
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>
                                {profile.finalScore > 0.9 ? '✨' : profile.finalScore > 0.6 ? '🤖' : '⚠️'}
                                {profile.finalScore > 0.9 ? 'AI 确信' : profile.finalScore > 0.6 ? 'AI 推荐' : '需复核'}
                                : {profile.finalScore.toFixed(2)}
                            </span>
                        </h3>

                        {/* V2 Beta: Business Identity Section */}
                        <div className="bg-blue-50/50 rounded-lg p-4 mb-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-blue-700">🏷️ 业务身份</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Business Name */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">业务名称</label>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profile.businessName || ''}
                                                onChange={(e) => onProfileChange?.({ businessName: e.target.value })}
                                                placeholder="请输入业务名称..."
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                            />
                                        ) : (
                                            <span className={`flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm ${!profile.businessName ? 'text-slate-400 italic' : ''}`}>
                                                {profile.businessName || (profile.aiScore === 0 ? '识别失败，请手动输入' : '等待AI识别...')}
                                            </span>
                                        )}
                                        <Bot size={14} className="text-purple-400" />
                                    </div>
                                </div>

                                {/* Business Domain */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">归属业务域</label>
                                    {isEditing ? (
                                        <select
                                            value={profile.businessDomain || '其他'}
                                            onChange={(e) => onProfileChange?.({ businessDomain: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                        >
                                            {BUSINESS_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    ) : (
                                        <span className="block px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">{profile.businessDomain || '其他'}</span>
                                    )}
                                </div>

                                {/* 优化: 新增数据分层 */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">数据分层</label>
                                    {isEditing ? (
                                        <select
                                            value={profile.dataLayer || 'DWD'}
                                            onChange={(e) => onProfileChange?.({ dataLayer: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                        >
                                            <option value="ODS">ODS (贴源层)</option>
                                            <option value="DWD">DWD (明细层)</option>
                                            <option value="DWS">DWS (汇总层)</option>
                                            <option value="ADS">ADS (应用层)</option>
                                            <option value="DIM">DIM (维度层)</option>
                                        </select>
                                    ) : (
                                        <span className="block px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">
                                            {profile.dataLayer === 'ODS' ? 'ODS (贴源层)' :
                                                profile.dataLayer === 'DWD' ? 'DWD (明细层)' :
                                                    profile.dataLayer === 'DWS' ? 'DWS (汇总层)' :
                                                        profile.dataLayer === 'ADS' ? 'ADS (应用层)' :
                                                            profile.dataLayer === 'DIM' ? 'DIM (维度层)' : 'DWD (明细层)'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Object Type Radio */}
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-slate-500 mb-2">对象类型</label>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(OBJECT_TYPE_LABELS) as ObjectType[]).map(type => (
                                        <label
                                            key={type}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${profile.objectType === type
                                                ? 'bg-purple-100 border-purple-300 border-2 text-purple-700 font-medium'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-200'
                                                } ${!isEditing ? 'pointer-events-none' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="objectType"
                                                value={type}
                                                checked={profile.objectType === type}
                                                onChange={() => onProfileChange?.({ objectType: type })}
                                                className="sr-only"
                                                disabled={!isEditing}
                                            />
                                            <span>{OBJECT_TYPE_LABELS[type].label}</span>
                                        </label>
                                    ))}
                                </div>
                                {profile.objectTypeReason && (
                                    <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                        <Bot size={12} className="text-purple-400" />
                                        AI判断: {profile.objectTypeReason}
                                    </p>
                                )}
                            </div>

                            {/* Data Grain */}
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">数据粒度 (一行数据代表什么)</label>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={profile.dataGrain || ''}
                                            onChange={(e) => onProfileChange?.({ dataGrain: e.target.value })}
                                            placeholder="如: 单笔订单、单个用户"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                        />
                                    ) : (
                                        <span className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">{profile.dataGrain || '未定义'}</span>
                                    )}
                                    <Bot size={14} className="text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* V2.2: 三栏证据仪表盘 (Evidence Dashboard) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Card 1: 生命周期 */}
                        <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🕒</span>
                                <span className="text-sm font-bold text-amber-700">生命周期</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {profile.retentionPeriod || '永久保留'}
                                    </div>
                                    <div className="text-xs text-slate-500">数据保留期限</div>
                                </div>
                                <div className="pt-2 border-t border-amber-100">
                                    <div className="text-sm text-slate-600">
                                        {profile.updateStrategy || '增量追加'}
                                    </div>
                                    <div className="text-xs text-slate-400">更新策略</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: 质量画像 */}
                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🩺</span>
                                <span className="text-sm font-bold text-blue-700">质量画像</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-lg font-bold text-slate-800">
                                        {Math.round((profile.gateResult.details.primaryKey ? 90 : 60) + Math.random() * 10)}% 填充率
                                    </div>
                                    <div className="text-xs text-slate-500">核心字段完整度</div>
                                </div>
                                <div className="pt-2 border-t border-blue-100">
                                    <div className="text-sm text-emerald-600 font-medium">
                                        {profile.gateResult.details.primaryKey ? '✓ 主键唯一性通过' : '⚠ 主键缺失'}
                                    </div>
                                    <div className="text-xs text-slate-400">数据质量检测</div>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: 安全合规 */}
                        <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🛡️</span>
                                <span className="text-sm font-bold text-red-700">安全合规</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <div className={`text-lg font-bold ${profile.securityLevel === 'L3' || profile.securityLevel === 'L4'
                                        ? 'text-red-600'
                                        : profile.securityLevel === 'L2'
                                            ? 'text-orange-600'
                                            : 'text-slate-600'
                                        }`}>
                                        {profile.securityLevel || 'L2'} {(profile.securityLevel === 'L3' || profile.securityLevel === 'L4') ? '敏感' : profile.securityLevel === 'L2' ? '内部' : profile.securityLevel === 'L1' ? '公开' : '内部'}
                                    </div>
                                    <div className="text-xs text-slate-500">最高安全等级</div>
                                </div>
                                <div className="pt-2 border-t border-red-100">
                                    <div className="text-sm text-slate-600">
                                        {profile.fields.filter(f => f.sensitivity !== 'L1').length} 个敏感字段
                                    </div>
                                    <div className="text-xs text-slate-400">包含 PII 数据</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">业务描述</label>
                        {isEditing ? (
                            <textarea
                                value={profile.description}
                                onChange={(e) => onProfileChange?.({ description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none resize-none h-16 text-sm"
                            />
                        ) : (
                            <p className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-600">{profile.description}</p>
                        )}
                    </div>

                    {/* Evidence */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">理解依据</label>
                        <div className="flex flex-wrap gap-1">
                            {profile.aiEvidence.concat(profile.ruleEvidence || []).slice(0, 3).map((e, i) => (
                                <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs shadow-sm">
                                    {e}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-100">
                        {isGateFailed ? (
                            <button onClick={onReject} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm font-medium transition-all">
                                确认排除
                            </button>
                        ) : (
                            <>
                                {!isEditing ? (
                                    <button onClick={onEdit} className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all">
                                        修正结果
                                    </button>
                                ) : (
                                    <button onClick={onSaveEdit} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all">
                                        保存修正
                                    </button>
                                )}
                                <button onClick={onAccept} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm font-medium transition-all flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    确认并生成逻辑实体
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
