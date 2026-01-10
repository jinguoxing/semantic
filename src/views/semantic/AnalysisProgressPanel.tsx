import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, Loader2, Zap, Shield, Database, Sparkles } from 'lucide-react';

interface AnalysisStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'done';
    result?: string;
    icon: React.ReactNode;
}

interface AnalysisProgressPanelProps {
    tableName: string;
    onComplete: (results: any) => void;
    mockAnalysisResult: any;
}

export const AnalysisProgressPanel: React.FC<AnalysisProgressPanelProps> = ({
    tableName,
    onComplete,
    mockAnalysisResult
}) => {
    const [steps, setSteps] = useState<AnalysisStep[]>([
        {
            id: 'scan',
            title: '扫描元数据',
            description: '读取表结构、字段类型、注释信息...',
            status: 'pending',
            icon: <Database size={16} />
        },
        {
            id: 'pattern',
            title: '特征识别',
            description: '分析字段命名模式、数据分布...',
            status: 'pending',
            icon: <Zap size={16} />
        },
        {
            id: 'semantic',
            title: '语义推理',
            description: '调用AI模型推断业务含义...',
            status: 'pending',
            icon: <Brain size={16} />
        },
        {
            id: 'security',
            title: '安全评估',
            description: '检测敏感字段、匹配安全规则...',
            status: 'pending',
            icon: <Shield size={16} />
        },
        {
            id: 'generate',
            title: '生成结论',
            description: '综合分析，生成语义画像...',
            status: 'pending',
            icon: <Sparkles size={16} />
        }
    ]);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [streamingText, setStreamingText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    // Streaming text for each step
    const stepDetails: Record<string, string[]> = {
        scan: [
            `📊 发现 ${mockAnalysisResult?.fields?.length || 12} 个字段`,
            `📝 表注释: ${tableName.includes('order') ? '订单交易主表' : '业务数据表'}`,
            `🔑 检测到主键字段: id`
        ],
        pattern: [
            '🔍 检测到 ID 类字段命名模式',
            '📅 发现生命周期字段 (create_time, update_time)',
            `📏 字段命名规范度: ${Math.floor(85 + Math.random() * 10)}%`
        ],
        semantic: [
            `🤖 AI 分析中...`,
            `💡 识别对象类型: ${mockAnalysisResult?.objectType === 'entity' ? '主体对象' : '行为对象'}`,
            `🏷️ 推断业务域: ${mockAnalysisResult?.businessDomain || '交易域'}`,
            `📐 数据粒度: ${mockAnalysisResult?.dataGrain || '单条记录'}`
        ],
        security: [
            '🔒 扫描敏感字段...',
            `⚠️ 发现 ${Math.floor(Math.random() * 3)} 个潜在敏感字段`,
            `🛡️ 推荐安全等级: ${mockAnalysisResult?.securityLevel || 'L2'}`
        ],
        generate: [
            '✨ 综合评估分析结果...',
            `📊 置信度评分: ${(mockAnalysisResult?.finalScore || 0.86).toFixed(2)}`,
            '✅ 语义画像生成完成!'
        ]
    };

    useEffect(() => {
        if (currentStepIndex >= steps.length) {
            setIsComplete(true);
            // Wait for result to be available, with polling
            const checkResult = () => {
                if (mockAnalysisResult) {
                    setTimeout(() => {
                        onComplete(mockAnalysisResult);
                    }, 500);
                } else {
                    // Keep checking until result is ready
                    setTimeout(checkResult, 200);
                }
            };
            checkResult();
            return;
        }

        // Start current step
        setSteps(prev => prev.map((s, i) => ({
            ...s,
            status: i === currentStepIndex ? 'running' : i < currentStepIndex ? 'done' : 'pending'
        })));

        const currentStepId = steps[currentStepIndex].id;
        const details = stepDetails[currentStepId] || [];

        // Stream text for current step
        let textIndex = 0;
        const textInterval = setInterval(() => {
            if (textIndex < details.length) {
                setStreamingText(details[textIndex]);
                textIndex++;
            } else {
                clearInterval(textInterval);
                // Mark step as done and move to next
                setSteps(prev => prev.map((s, i) => ({
                    ...s,
                    status: i === currentStepIndex ? 'done' : s.status,
                    result: i === currentStepIndex ? details[details.length - 1] : s.result
                })));
                setTimeout(() => {
                    setCurrentStepIndex(prev => prev + 1);
                }, 300);
            }
        }, 400);

        return () => clearInterval(textInterval);
    }, [currentStepIndex, mockAnalysisResult]);

    return (
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Brain className="animate-pulse" size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">AI 语义理解引擎</h3>
                        <p className="text-purple-100 text-sm">正在分析: {tableName}</p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="p-6">
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`flex items-start gap-4 p-3 rounded-lg transition-all duration-300 ${step.status === 'running'
                                ? 'bg-purple-50 border-2 border-purple-200 shadow-sm'
                                : step.status === 'done'
                                    ? 'bg-emerald-50/50'
                                    : 'opacity-50'
                                }`}
                        >
                            {/* Step Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.status === 'running'
                                ? 'bg-purple-100 text-purple-600'
                                : step.status === 'done'
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                {step.status === 'running' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : step.status === 'done' ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    step.icon
                                )}
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${step.status === 'running' ? 'text-purple-700' :
                                        step.status === 'done' ? 'text-emerald-700' : 'text-slate-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                    {step.status === 'running' && (
                                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full animate-pulse">
                                            处理中
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {step.status === 'running' ? streamingText || step.description : step.description}
                                </p>
                                {step.status === 'done' && step.result && (
                                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                                        {step.result}
                                    </p>
                                )}
                            </div>

                            {/* Step Number */}
                            <span className={`text-xs font-mono ${step.status === 'done' ? 'text-emerald-500' : 'text-slate-300'
                                }`}>
                                {index + 1}/{steps.length}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>分析进度</span>
                        <span>{Math.round((currentStepIndex / steps.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
                            style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {isComplete && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
                        <CheckCircle size={18} />
                        <span className="font-medium">分析完成！正在加载结果...</span>
                    </div>
                )}
            </div>
        </div>
    );
};
