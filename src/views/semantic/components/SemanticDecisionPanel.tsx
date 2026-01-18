import React, { useState, useEffect } from 'react';
import { Check, X, Tag, BookOpen, AlertTriangle, Wand2, ArrowRight } from 'lucide-react';
import { FieldSemanticProfile, SemanticRole } from '../../../types/semantic';

interface SemanticDecisionPanelProps {
    fieldName: string;
    fieldProfile: FieldSemanticProfile;
    onDecision: (decision: {
        role: SemanticRole;
        term?: string;
        tags?: string[];
        action: 'ACCEPT_AI' | 'ACCEPT_RULE' | 'MODIFY' | 'REJECT';
        comment?: string;
    }) => void;
    className?: string;
}

const ROLES: SemanticRole[] = [
    'Identifier', 'ForeignKey', 'Status', 'Time', 'Measure', 'Attribute', 'Audit', 'Technical'
];

export const SemanticDecisionPanel: React.FC<SemanticDecisionPanelProps> = ({
    fieldName,
    fieldProfile,
    onDecision,
    className
}) => {
    const [role, setRole] = useState<SemanticRole>(fieldProfile.role || 'Attribute');
    const [term, setTerm] = useState(fieldProfile.aiSuggestion || ''); // Mock: assuming suggestion is term-like
    const [tags, setTags] = useState<string[]>(fieldProfile.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    // Reset state when field changes
    useEffect(() => {
        setRole(fieldProfile.role || 'Attribute');
        setTerm(fieldProfile.aiSuggestion || ''); // Assuming AI suggestion might be useful as term base
        setTags(fieldProfile.tags || []);
        setShowRejectInput(false);
        setRejectReason('');
    }, [fieldName, fieldProfile]);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleAcceptAI = () => {
        onDecision({
            role,
            term,
            tags,
            action: 'ACCEPT_AI'
        });
    };

    const handleModify = () => {
        onDecision({
            role,
            term,
            tags,
            action: 'MODIFY'
        });
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        onDecision({
            role,
            action: 'REJECT',
            comment: rejectReason
        });
    };

    const isAiSuggestion = fieldProfile.semanticStatus === 'SUGGESTED';
    const isRuleMatched = fieldProfile.semanticStatus === 'RULE_MATCHED';
    const isDecided = fieldProfile.semanticStatus === 'DECIDED';

    return (
        <div className={`flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-full ${className}`}>
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-600" />
                    语义判定
                </h3>
                {isDecided && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Check size={12} /> 已确认
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* AI / Rule Suggestion Alert */}
                {(isAiSuggestion || isRuleMatched) && !isDecided && (
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-start gap-3">
                        <Wand2 size={16} className="text-purple-600 mt-0.5 shrink-0" />
                        <div>
                            <div className="text-sm font-medium text-purple-900">
                                {isAiSuggestion ? 'AI 语义建议' : '规则匹配结果'}
                            </div>
                            <div className="text-xs text-purple-700 mt-1">
                                建议将此字段标记为 <span className="font-bold">{fieldProfile.role}</span>
                                {fieldProfile.aiSuggestion && `，并关联术语 "${fieldProfile.aiSuggestion}"`}。
                            </div>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            语义角色 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as SemanticRole)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">
                            决定字段在模型中的核心作用
                        </p>
                    </div>

                    {/* Term Binding */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <BookOpen size={14} /> 标准术语
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder="搜索标准术语..."
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow pl-9"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            关联标准术语以统一口径
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                            <Tag size={14} /> 业务标签
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100 min-h-[38px]">
                            {tags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-1">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder={tags.length === 0 ? "输入标签按回车..." : ""}
                                className="bg-transparent border-none outline-none text-xs min-w-[100px] flex-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Reject Input */}
                {showRejectInput && (
                    <div className="animate-fade-in-down">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            驳回原因 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none transition-shadow h-20 resize-none"
                            placeholder="请填写驳回或忽略此字段的原因..."
                        ></textarea>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                {!showRejectInput ? (
                    <div className="flex flex-col gap-2">
                        {isDecided ? (
                            <button
                                onClick={handleModify}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
                            >
                                更新判定
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleAcceptAI}
                                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> 确认并采纳
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleModify} // Treated same as accept but implies manual changes made
                                        className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        手动修改
                                    </button>
                                    <button
                                        onClick={() => setShowRejectInput(true)}
                                        className="py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                                    >
                                        驳回/忽略
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowRejectInput(false)}
                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            确认驳回
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple internal component for search icon
const SearchIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
