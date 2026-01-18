import React from 'react';
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { GovernanceStatus } from '../../../types/semantic';
import { getGovernanceDisplay, typeConfig } from '../utils';

interface SemanticHeaderProps {
    table: {
        table: string;
        sourceType: string;
        comment?: string;
    };
    governanceStatus: GovernanceStatus;
    rolledBack?: boolean;
    isAnalyzing: boolean;
    analysisStep: 'idle' | 'analyzing' | 'done';
    onBack: () => void;
    onAnalyze: () => void;
}

export const SemanticHeader: React.FC<SemanticHeaderProps> = ({
    table,
    governanceStatus,
    rolledBack,
    isAnalyzing,
    analysisStep,
    onBack,
    onAnalyze
}) => {
    // Determine status display
    // If explicit status is S0 but analysis is done, treat as S1 (logic copied from view)
    const effectiveStatus = (governanceStatus || (analysisStep === 'done' ? 'S1' : 'S0')) as GovernanceStatus;
    const display = getGovernanceDisplay(effectiveStatus, rolledBack);

    const isIdle = analysisStep === 'idle';

    return (
        <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-start">
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="mt-1 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors h-fit"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800">{table.table}</h2>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[table.sourceType]?.bgColor || 'bg-slate-100'} ${typeConfig[table.sourceType]?.color || 'text-slate-600'}`}>
                            {table.sourceType}
                        </span>
                        {/* Analysis Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${display.tone}`}>
                            {effectiveStatus === 'S1' && !rolledBack && <Sparkles size={10} />}
                            {display.label}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">{table.comment || '暂无物理表注释'}</p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="flex gap-2">
                    <button
                        onClick={onBack}
                        className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                    >
                        返回列表
                    </button>
                    <button
                        onClick={onAnalyze}
                        disabled={isAnalyzing}
                        className={`px-4 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2 text-white transition-all ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' :
                            analysisStep === 'done' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600'
                            }`}
                    >
                        {isAnalyzing ? (
                            <><RefreshCw size={14} className="animate-spin" /> 语义理解中...</>
                        ) : analysisStep === 'done' ? (
                            <><RefreshCw size={14} /> 重新理解</>
                        ) : (
                            <><Sparkles size={14} /> 开始语义理解</>
                        )}
                    </button>
                </div>
                {isIdle && (
                    <div className="text-xs text-slate-400">
                        将基于规则与 AI 生成语义建议，需人工确认后生效。
                    </div>
                )}
            </div>
        </div>
    );
};
