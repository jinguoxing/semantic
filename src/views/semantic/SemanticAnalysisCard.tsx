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
    const [showLifecycle, setShowLifecycle] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);

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
                            <span className={`text-sm px-2 py-0.5 rounded-full border ${profile.finalScore > 0.8 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                置信度: {profile.finalScore.toFixed(2)}
                            </span>
                        </h3>

                        {/* V2 Beta: Business Identity Section */}
                        <div className="bg-blue-50/50 rounded-lg p-4 mb-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-bold text-blue-700">🏷️ 业务身份</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Business Name */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">业务名称</label>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={profile.businessName}
                                                onChange={(e) => onProfileChange?.({ businessName: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                                            />
                                        ) : (
                                            <span className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm">{profile.businessName}</span>
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

                        {/* Collapsible Sections: Lifecycle & Security */}
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setShowLifecycle(!showLifecycle)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${showLifecycle ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                ⏱️ 生命周期
                                {showLifecycle ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <button
                                onClick={() => setShowSecurity(!showSecurity)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${showSecurity ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                🛡️ 质量安全
                                {showSecurity ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        </div>

                        {/* Lifecycle Section (Collapsed by default) */}
                        {showLifecycle && (
                            <div className="bg-amber-50/50 rounded-lg p-4 mb-4 border border-amber-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">数据层级</label>
                                        <select
                                            value={profile.dataLayer || 'DWD'}
                                            onChange={(e) => onProfileChange?.({ dataLayer: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            disabled={!isEditing}
                                        >
                                            <option value="ODS">ODS (原始层)</option>
                                            <option value="DWD">DWD (明细层)</option>
                                            <option value="DWS">DWS (汇总层)</option>
                                            <option value="ADS">ADS (应用层)</option>
                                            <option value="其他">其他</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">更新策略</label>
                                        <select
                                            value={profile.updateStrategy || '增量追加'}
                                            onChange={(e) => onProfileChange?.({ updateStrategy: e.target.value as any })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            disabled={!isEditing}
                                        >
                                            <option value="增量追加">增量追加</option>
                                            <option value="全量覆盖">全量覆盖</option>
                                            <option value="缓慢变化维">缓慢变化维</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">存储周期</label>
                                        <select
                                            value={profile.retentionPeriod || '永久'}
                                            onChange={(e) => onProfileChange?.({ retentionPeriod: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            disabled={!isEditing}
                                        >
                                            <option value="永久">永久</option>
                                            <option value="3年">3年</option>
                                            <option value="1年">1年</option>
                                            <option value="6个月">6个月</option>
                                            <option value="30天">30天</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section (Collapsed by default) */}
                        {showSecurity && (
                            <div className="bg-emerald-50/50 rounded-lg p-4 mb-4 border border-emerald-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">安全等级</label>
                                        <div className="flex gap-2">
                                            {(['L1', 'L2', 'L3', 'L4'] as const).map(level => (
                                                <label
                                                    key={level}
                                                    className={`flex-1 text-center px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-all ${profile.securityLevel === level
                                                        ? level === 'L1' ? 'bg-green-100 border-green-300 border text-green-700'
                                                            : level === 'L2' ? 'bg-blue-100 border-blue-300 border text-blue-700'
                                                                : level === 'L3' ? 'bg-orange-100 border-orange-300 border text-orange-700'
                                                                    : 'bg-red-100 border-red-300 border text-red-700'
                                                        : 'bg-white border border-slate-200'
                                                        } ${!isEditing ? 'pointer-events-none opacity-70' : ''}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="securityLevel"
                                                        value={level}
                                                        checked={profile.securityLevel === level}
                                                        onChange={() => onProfileChange?.({ securityLevel: level })}
                                                        className="sr-only"
                                                        disabled={!isEditing}
                                                    />
                                                    {level}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">数据负责人</label>
                                        <input
                                            type="text"
                                            value={profile.dataOwner || ''}
                                            onChange={(e) => onProfileChange?.({ dataOwner: e.target.value })}
                                            placeholder="选择负责人..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
        </div>
    );
};
