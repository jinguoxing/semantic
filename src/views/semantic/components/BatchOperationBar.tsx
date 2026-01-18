import React from 'react';
import { Sparkles } from 'lucide-react';
import { StreamingProgressPanel } from '../StreamingProgressPanel';

interface BatchOperationBarProps {
    selectedCount: number;
    isAnalyzing: boolean;
    runConfig: {
        concurrency: number;
        sampleRows: number;
    };
    onOpenRunModal: () => void;
    progressProps: {
        currentAnalyzing: string | null;
        completedResults: any[];
        progress: { current: number; total: number };
        onResultClick: (tableId: string) => void;
    };
}

export const BatchOperationBar: React.FC<BatchOperationBarProps> = ({
    selectedCount,
    isAnalyzing,
    runConfig,
    onOpenRunModal,
    progressProps
}) => {
    if (isAnalyzing) {
        return (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                <StreamingProgressPanel
                    currentAnalyzing={progressProps.currentAnalyzing}
                    completedResults={progressProps.completedResults}
                    progress={progressProps.progress}
                    onResultClick={progressProps.onResultClick}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={onOpenRunModal}
                disabled={selectedCount === 0}
                className={`px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-all ${selectedCount > 0
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 shadow-md hover:shadow-lg'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
            >
                <Sparkles size={14} />
                批量生成建议（{selectedCount}）
            </button>
            <div className="text-[10px] text-slate-400">
                {selectedCount > 0
                    ? `预计耗时 ${Math.max(1, Math.ceil(selectedCount / Math.max(runConfig.concurrency, 1)) * 2)}~${Math.max(2, Math.ceil(selectedCount / Math.max(runConfig.concurrency, 1)) * 2 + 1)} 分钟 · 采样 ${runConfig.sampleRows / 1000}k 行/表 · 队列 ${Math.min(selectedCount, runConfig.concurrency)}/${runConfig.concurrency}`
                    : '请选择表以生成建议'}
            </div>
        </div>
    );
};
