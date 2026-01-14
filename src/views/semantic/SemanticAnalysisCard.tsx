import React, { useState } from 'react';
import { Sparkles, Activity, CheckCircle, ChevronDown, ChevronRight, Bot } from 'lucide-react';
import { TableSemanticProfile, BUSINESS_DOMAINS, ObjectType } from '../../types/semantic';
import { DimensionSummary } from './DimensionSummary';
import { DeepAnalysisTabs } from './DeepAnalysisTabs';
import { ConfidenceBoostingPanel } from './ConfidenceBoostingPanel';
import { generateBoostingTasks } from '../../services/mockAiService';
import { CommentGenerationModal } from './CommentGenerationModal';
import { JsonFieldModal } from './JsonFieldModal';
import { TermAutocomplete } from '../../components/TermAutocomplete';
import { getAllTerms, depositNewTerm } from '../../data/mockData';
import { ScoringBreakdownPanel } from './ScoringBreakdownPanel';
import { UpgradeSuggestionCard, generateUpgradeSuggestion } from './UpgradeSuggestionCard';

interface SemanticAnalysisCardProps {
    profile: TableSemanticProfile;
    fields: any[]; // Physical table fields for deep analysis
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isEditing?: boolean;
    onProfileChange?: (updates: Partial<TableSemanticProfile>) => void;
    onSaveEdit?: () => void;
    onUpgradeAccepted?: (beforeState: TableSemanticProfile, afterState: any) => void;
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
    onSaveEdit,
    onUpgradeAccepted
}) => {
    const [showLifecycle, setShowLifecycle] = useState(true);  // 优化: 默认展开
    const [showSecurity, setShowSecurity] = useState(true);    // 优化: 默认展开

    // V2.3: Modal states for action buttons
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [activeTabOverride, setActiveTabOverride] = useState<string | null>(null);
    const [highlightRole, setHighlightRole] = useState<string | null>(null);

    // V2.3F P3: Security detail expansion state
    const [showSecurityDetail, setShowSecurityDetail] = useState(false);

    // Action handler for Confidence Boosting Panel buttons
    const handleActionClick = (actionType: string) => {
        console.log('🎯 Action clicked:', actionType);

        switch (actionType) {
            case 'BATCH_GENERATE':
                // Open comment generation modal
                setShowCommentModal(true);
                break;

            case 'SPECIFY_PK':
                // Switch to field list tab and highlight primary key selector
                setActiveTabOverride('fields');
                setHighlightRole('标识符');
                // Clear highlighting after 3 seconds
                setTimeout(() => {
                    setHighlightRole(null);
                    setActiveTabOverride(null);
                }, 3000);
                break;

            case 'IDENTIFY_JSON':
                // Open JSON field identification modal
                setShowJsonModal(true);
                break;

            default:
                console.warn('Unknown action type:', actionType);
        }
    };

    // Generate mock comment suggestions
    const generateCommentSuggestions = () => {
        const fieldsWithoutComments = fields.filter(f => !f.comment || f.comment.trim() === '');
        return fieldsWithoutComments.map(f => ({
            fieldName: f.name,
            fieldType: f.type,
            currentComment: f.comment || '',
            suggestedComment: `${f.name.includes('id') ? '唯一标识' :
                f.name.includes('name') ? '名称' :
                    f.name.includes('time') || f.name.includes('date') ? '时间' :
                        f.name.includes('status') ? '状态' :
                            f.name.includes('type') ? '类型' :
                                '业务字段'}`
        }));
    };

    // Generate mock JSON field suggestions
    const generateJsonFieldSuggestions = () => {
        const jsonFields = fields.filter(f =>
            f.type.toLowerCase().includes('json') ||
            f.type.toLowerCase().includes('text') && f.name.includes('ext')
        );
        return jsonFields.map(f => ({
            fieldName: f.name,
            fieldType: f.type,
            sampleData: JSON.stringify({ status: 1, config: { theme: 'dark' } }, null, 2),
            jsonStructure: { status: 1, config: { theme: 'dark' } }
        }));
    };

    // Handle comment modal confirmation
    const handleCommentConfirm = (updates: { fieldName: string; comment: string }[]) => {
        console.log('✅ Applying comments:', updates);
        // TODO: Update field comments in the parent component
        setShowCommentModal(false);
        // Show success toast (optional)
    };

    // Handle JSON field identification
    const handleJsonIdentify = (fieldNames: string[]) => {
        console.log('🔍 Identified as JSON:', fieldNames);
        // TODO: Update field types
        setShowJsonModal(false);
    };

    // Handle JSON field extension marking
    const handleJsonMarkExtension = (fieldNames: string[]) => {
        console.log('🏷️ Marked as extension:', fieldNames);
        // TODO: Update field tags
        setShowJsonModal(false);
    };

    // V2.3F P2: Handle business name change from TermAutocomplete
    const handleBusinessNameChange = (value: string, isStandard: boolean) => {
        onProfileChange?.({ businessName: value });

        // Deposit new term if not standard
        if (!isStandard && value.trim()) {
            depositNewTerm(value, 'table');
        }
    };

    // V2.3F P5: Upgrade suggestion handlers
    const upgradeSuggestion = generateUpgradeSuggestion(profile);

    const handleUpgradeAccept = () => {
        if (!upgradeSuggestion) return;
        console.log('Upgrade accepted:', upgradeSuggestion);
        // Apply upgrade changes to profile
        if (onProfileChange) {
            const beforeState = { ...profile };
            onProfileChange(upgradeSuggestion.afterState);
            onUpgradeAccepted?.(beforeState, upgradeSuggestion.afterState);
        }
    };

    const handleUpgradeReject = (reason: string) => {
        console.log('Upgrade rejected. Reason:', reason);
        // Log rejection feedback for model optimization
    };

    const handleUpgradeLater = () => {
        console.log('Upgrade postponed');
        // Can implement a reminder system here
    };


    // V2.3F P3: Security analysis helper functions
    const calculateHighestSecurityLevel = (fieldsList: any[]): 'L1' | 'L2' | 'L3' | 'L4' => {
        if (!fieldsList || fieldsList.length === 0) return 'L1';

        const levels = fieldsList.map(f => f.sensitivity || 'L1');
        if (levels.includes('L4')) return 'L4';
        if (levels.includes('L3')) return 'L3';
        if (levels.includes('L2')) return 'L2';
        return 'L1';
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'L4': return 'text-red-600';
            case 'L3': return 'text-red-600';
            case 'L2': return 'text-orange-600';
            default: return 'text-slate-600';
        }
    };

    const getLevelText = (level: string) => {
        switch (level) {
            case 'L4': return '机密';
            case 'L3': return '敏感';
            case 'L2': return '内部';
            default: return '公开';
        }
    };

    // P3: Calculate actual security level from fields (strong consistency)
    const actualSecurityLevel = calculateHighestSecurityLevel(fields);

    // P3: Categorize fields by security level
    const securityBreakdown = {
        L4: fields.filter(f => (f.sensitivity || 'L1') === 'L4'),
        L3: fields.filter(f => (f.sensitivity || 'L1') === 'L3'),
        L2: fields.filter(f => (f.sensitivity || 'L1') === 'L2'),
        L1: fields.filter(f => (f.sensitivity || 'L1') === 'L1')
    };

    const sensitiveFieldCount = securityBreakdown.L4.length + securityBreakdown.L3.length + securityBreakdown.L2.length;
    const topSensitiveFields = [...securityBreakdown.L4, ...securityBreakdown.L3]
        .slice(0, 3)
        .map(f => f.name);

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

                {/* V2.3F P6: Scoring Breakdown Panel */}
                <ScoringBreakdownPanel profile={profile} fields={fields} />

                {/* V2.3F P5: Upgrade Suggestion (conditional) */}
                {upgradeSuggestion && (
                    <UpgradeSuggestionCard
                        suggestion={upgradeSuggestion}
                        onAccept={handleUpgradeAccept}
                        onReject={handleUpgradeReject}
                        onLater={handleUpgradeLater}
                    />
                )}

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
                                {/* Business Name - V2.3F P2: Term Naming Loop */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">业务名称</label>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <TermAutocomplete
                                                value={profile.businessName || ''}
                                                onChange={handleBusinessNameChange}
                                                standardTerms={getAllTerms('table')}
                                                aiSuggestion={profile.aiScore > 0 ? profile.businessName : undefined}
                                                placeholder="请输入业务名称..."
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

                    {/* V2.3: Confidence Boosting Panel (when score < 0.7) */}
                    {profile.aiScore < 0.7 && (
                        <div className="mb-4">
                            <ConfidenceBoostingPanel
                                currentScore={profile.aiScore}
                                tasks={generateBoostingTasks(fields, profile.aiScore, profile)}
                                onActionClick={handleActionClick}
                            />
                        </div>
                    )}

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

                        {/* Card 3: 安全合规 - V2.3F P3 Enhanced */}
                        <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🛡️</span>
                                <span className="text-sm font-bold text-red-700">安全合规</span>
                                <button
                                    onClick={() => setShowSecurityDetail(!showSecurityDetail)}
                                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ChevronDown size={16} className={`transition-transform ${showSecurityDetail ? '' : '-rotate-90'}`} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {/* Primary: Highest Level (calculated from fields) */}
                                <div>
                                    <div className={`text-lg font-bold ${getLevelColor(actualSecurityLevel)}`}>
                                        {actualSecurityLevel} {getLevelText(actualSecurityLevel)}
                                    </div>
                                    <div className="text-xs text-slate-500">最高安全等级 (强一致性)</div>
                                </div>

                                {/* Secondary: Field Count */}
                                <div className="pt-2 border-t border-red-100">
                                    <div className="text-sm text-slate-600">
                                        {sensitiveFieldCount} 个敏感字段
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {topSensitiveFields.length > 0
                                            ? `包含 PII: ${topSensitiveFields.join(', ')}`
                                            : '包含 PII 数据'}
                                    </div>
                                </div>

                                {/* Expandable Detail: PII Field Breakdown */}
                                {showSecurityDetail && (
                                    <div className="pt-3 border-t border-red-100 space-y-3">
                                        <div className="text-xs font-medium text-slate-600 mb-2">
                                            📋 PII 字段来源透视
                                        </div>

                                        {/* L4 Fields */}
                                        {securityBreakdown.L4.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-red-600 mb-1.5 flex items-center gap-1">
                                                    <span>🔴</span>
                                                    <span>L4 机密 ({securityBreakdown.L4.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L4.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-mono">
                                                            {f.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* L3 Fields */}
                                        {securityBreakdown.L3.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-orange-600 mb-1.5 flex items-center gap-1">
                                                    <span>🟠</span>
                                                    <span>L3 敏感 ({securityBreakdown.L3.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L3.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-mono">
                                                            {f.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* L2 Fields */}
                                        {securityBreakdown.L2.length > 0 && (
                                            <div>
                                                <div className="text-xs font-medium text-amber-600 mb-1.5 flex items-center gap-1">
                                                    <span>🟡</span>
                                                    <span>L2 内部 ({securityBreakdown.L2.length}个)</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {securityBreakdown.L2.map(f => (
                                                        <span key={f.name} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-mono">
                                                            {f.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* L1 Fields (optional, collapsed by default) */}
                                        {securityBreakdown.L1.length > 0 && (
                                            <div className="opacity-60">
                                                <div className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                                                    <span>⚪</span>
                                                    <span>L1 公开 ({securityBreakdown.L1.length}个)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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

            {/* V2.3: Modals */}
            {showCommentModal && (
                <CommentGenerationModal
                    fields={generateCommentSuggestions()}
                    onConfirm={handleCommentConfirm}
                    onCancel={() => setShowCommentModal(false)}
                />
            )}

            {showJsonModal && (
                <JsonFieldModal
                    fields={generateJsonFieldSuggestions()}
                    onIdentifyAsJson={handleJsonIdentify}
                    onMarkAsExtension={handleJsonMarkExtension}
                    onCancel={() => setShowJsonModal(false)}
                />
            )}
        </div>
    );
};
