import { useState } from 'react';
import {
    Activity,
    ArrowRight,
    BarChart3,
    CheckCircle,
    GitMerge,
    Layers,
    ShieldAlert,
    Sparkles,
    Target
} from 'lucide-react';
import semanticCollaborationMock from '../data/semanticCollaborationMock';

interface DashboardViewProps {
    setActiveModule: (module: string) => void;
}

const DashboardView = ({ setActiveModule }: DashboardViewProps) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const data = semanticCollaborationMock.ranges[timeRange];
    const collaboration = semanticCollaborationMock.collaboration;
    const riskAndTodo = semanticCollaborationMock.riskAndTodo;
    const percentText = (value: number) => `${Math.round(value * 100)}%`;

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{semanticCollaborationMock.title}</h2>
                    <p className="text-slate-500 mt-1">业务视角与技术视角协同治理推进语义建模</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full bg-white border border-slate-200 p-1 text-xs text-slate-500">
                        {(['7d', '30d', '90d'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-2 py-0.5 rounded-full transition-colors ${timeRange === range
                                    ? 'bg-slate-900 text-white'
                                    : 'hover:bg-slate-100'
                                    }`}
                            >
                                {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
                            </button>
                        ))}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={12} /> 协同运行中
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button
                    onClick={() => setActiveModule('td_modeling')}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">对象规模</p>
                            <p className="text-2xl font-bold text-slate-800">{data.summary.objectScale.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Layers size={18} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        已发布 {data.summary.objectScale.published} / 草稿 {data.summary.objectScale.draft} / 归档 {data.summary.objectScale.archived}
                    </div>
                    <div className="mt-3">
                        <svg viewBox="0 0 120 36" className="w-full h-9">
                            <defs>
                                <linearGradient id="objTrend" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <polyline
                                points="4,28 20,22 36,24 52,18 68,16 84,12 100,10 116,8"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                            />
                            <polygon points="4,28 20,22 36,24 52,18 68,16 84,12 100,10 116,8 116,32 4,32" fill="url(#objTrend)" />
                        </svg>
                    </div>
                    <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-blue-500" style={{ width: `${(data.summary.objectScale.published / data.summary.objectScale.total) * 100}%` }} />
                        <div className="bg-amber-400" style={{ width: `${(data.summary.objectScale.draft / data.summary.objectScale.total) * 100}%` }} />
                    </div>
                </button>
                <button
                    onClick={() => setActiveModule('candidate_confirmation')}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">候选与审核</p>
                            <p className="text-2xl font-bold text-slate-800">{data.summary.candidates.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Sparkles size={18} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        待确认 {data.summary.candidates.pending} / 已确认 {data.summary.candidates.confirmed} / 忽略 {data.summary.candidates.ignored}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <svg viewBox="0 0 44 44" className="w-10 h-10">
                            <circle cx="22" cy="22" r="18" stroke="#e2e8f0" strokeWidth="6" fill="none" />
                            <circle
                                cx="22"
                                cy="22"
                                r="18"
                                stroke="#8b5cf6"
                                strokeWidth="6"
                                fill="none"
                                strokeDasharray={`${(data.summary.candidates.pending / data.summary.candidates.total) * 113} 113`}
                                transform="rotate(-90 22 22)"
                            />
                        </svg>
                        <div className="text-[10px] text-slate-500">
                            待确认占比 {Math.round((data.summary.candidates.pending / data.summary.candidates.total) * 100)}%
                        </div>
                    </div>
                    <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-purple-500" style={{ width: `${(data.summary.candidates.pending / data.summary.candidates.total) * 100}%` }} />
                        <div className="bg-emerald-400" style={{ width: `${(data.summary.candidates.confirmed / data.summary.candidates.total) * 100}%` }} />
                        <div className="bg-slate-300" style={{ width: `${(data.summary.candidates.ignored / data.summary.candidates.total) * 100}%` }} />
                    </div>
                </button>
                <button
                    onClick={() => setActiveModule('governance')}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-left transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500">冲突与风险</p>
                            <p className="text-2xl font-bold text-slate-800">{data.summary.conflicts.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                            <ShieldAlert size={18} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        待处理 {data.summary.conflicts.open} / 已解决 {data.summary.conflicts.resolved}
                    </div>
                    <div className="mt-3">
                        <svg viewBox="0 0 120 36" className="w-full h-9">
                            <polyline
                                points="4,20 20,18 36,22 52,16 68,20 84,12 100,14 116,10"
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="2"
                            />
                            <circle cx="116" cy="10" r="2.5" fill="#f43f5e" />
                        </svg>
                    </div>
                    <div className="mt-3 flex gap-2 text-[10px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">严重 {data.summary.conflicts.severity.critical}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">警告 {data.summary.conflicts.severity.warning}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">提示 {data.summary.conflicts.severity.info}</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveModule('mapping')}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm p-5 text-left text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-300">协同成熟度指数</p>
                            <p className="text-2xl font-bold">{data.summary.collaborationIndex.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center">
                            <Activity size={18} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-300">
                        目标覆盖 {percentText(data.summary.collaborationIndex.coverageRate)} · 口径一致 {percentText(data.summary.collaborationIndex.kpiConsistencyRate)} · 映射达标 {percentText(data.summary.collaborationIndex.mappingRate)}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-white/10">分值</span>
                        <span>近7日趋势稳定</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${data.summary.collaborationIndex.value}%` }} />
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Target size={16} className="text-blue-500" />
                            业务视角
                        </h3>
                        <button
                            onClick={() => setActiveModule('td_goals')}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            去业务梳理 <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">业务目标覆盖</p>
                            <p className="text-xl font-bold text-slate-800">{percentText(data.businessView.goalCoverageRate)}</p>
                            <p className="text-xs text-slate-500 mt-2">
                                目标 {data.businessView.goals.total} · 规划 {data.businessView.goals.planning} · 建模 {data.businessView.goals.modeling} · 已实施 {data.businessView.goals.implemented}
                            </p>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${data.businessView.goalCoverageRate * 100}%` }} />
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">KPI 口径覆盖</p>
                            <p className="text-xl font-bold text-slate-800">{data.businessView.kpiCoverage.defined}/{data.businessView.kpiCoverage.total}</p>
                            <p className="text-xs text-slate-500 mt-2">口径一致率 {percentText(data.summary.collaborationIndex.kpiConsistencyRate)}</p>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${(data.businessView.kpiCoverage.defined / data.businessView.kpiCoverage.total) * 100}%` }} />
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-emerald-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">场景落地</p>
                            <p className="text-xl font-bold text-slate-800">{data.businessView.scenarios.active}/{data.businessView.scenarios.total}</p>
                            <p className="text-xs text-slate-500 mt-2">运行中 {data.businessView.scenarios.active} · 草稿 {data.businessView.scenarios.draft}</p>
                            <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">运行</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">草稿</span>
                                <div className="ml-auto flex h-1.5 w-16 rounded-full overflow-hidden bg-slate-100">
                                    <div className="bg-emerald-500" style={{ width: `${(data.businessView.scenarios.active / data.businessView.scenarios.total) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">关键对象热度</p>
                            <p className="text-xs text-slate-400 mt-1">TOP 5 业务对象</p>
                            <div className="mt-3 space-y-2">
                                {data.businessView.hotObjects.map(item => (
                                    <div key={item} className="text-xs text-slate-600 bg-slate-100 rounded px-2 py-1">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-emerald-600" />
                            技术视角
                        </h3>
                        <button
                            onClick={() => setActiveModule('bu_connect')}
                            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                            去数据发现 <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-emerald-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">资产接入</p>
                            <p className="text-xl font-bold text-slate-800">{data.governanceView.dataSources.connected}/{data.governanceView.dataSources.total}</p>
                            <p className="text-xs text-slate-500 mt-2">扫描表 {data.governanceView.tables.count} · 可用资产 {data.governanceView.tables.scanResults}</p>
                            <div className="mt-3 flex gap-2 text-[10px]">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">已连接 {data.governanceView.dataSources.connected}</span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">扫描中 {data.governanceView.dataSources.scanning}</span>
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600">异常 {data.governanceView.dataSources.error}</span>
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-emerald-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">映射进度</p>
                            <p className="text-xl font-bold text-slate-800">{data.governanceView.mapping.mappedObjects}/{data.governanceView.mapping.mappedObjects + data.governanceView.mapping.unmappedObjects}</p>
                            <p className="text-xs text-slate-500 mt-2">缺口对象: {data.governanceView.mapping.missingObjects.join('、')}</p>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(data.governanceView.mapping.mappedObjects / (data.governanceView.mapping.mappedObjects + data.governanceView.mapping.unmappedObjects)) * 100}%` }} />
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-amber-200 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">质量与规则</p>
                            <p className="text-xl font-bold text-slate-800">{percentText(data.governanceView.quality.namingComplianceRate)}</p>
                            <p className="text-xs text-slate-500 mt-2">冲突 {data.governanceView.quality.conflicts} · 待治理</p>
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${data.governanceView.quality.namingComplianceRate * 100}%` }} />
                            </div>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition">
                            <p className="text-xs text-slate-500">发布与变更</p>
                            <p className="text-xl font-bold text-slate-800">{percentText(data.governanceView.release.successRate)}</p>
                            <p className="text-xs text-slate-500 mt-2">发布 {data.governanceView.release.publishCount} · 回滚 {data.governanceView.release.rollbackCount}</p>
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                                <BarChart3 size={14} className="text-slate-400" />
                                近 30 天稳定运行
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <GitMerge size={16} className="text-purple-600" />
                        协同联动区
                    </h3>
                    <button
                        onClick={() => setActiveModule('mapping')}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                    >
                        去映射工作台 <ArrowRight size={12} />
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition">
                        <p className="text-xs text-slate-500">目标覆盖率</p>
                        <p className="text-xl font-bold text-slate-800">{percentText(data.summary.collaborationIndex.coverageRate)}</p>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${data.summary.collaborationIndex.coverageRate * 100}%` }} />
                        </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition">
                        <p className="text-xs text-slate-500">口径一致率</p>
                        <p className="text-xl font-bold text-slate-800">{percentText(data.summary.collaborationIndex.kpiConsistencyRate)}</p>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${data.summary.collaborationIndex.kpiConsistencyRate * 100}%` }} />
                        </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4 hover:border-emerald-200 hover:shadow-sm transition">
                        <p className="text-xs text-slate-500">映射达标率</p>
                        <p className="text-xl font-bold text-slate-800">{percentText(data.summary.collaborationIndex.mappingRate)}</p>
                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${data.summary.collaborationIndex.mappingRate * 100}%` }} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 bg-slate-50 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200">协同流程链</span>
                        <span>业务驱动 {'->'} 治理保障 {'->'} 资产服务化</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        {collaboration.flow.map((step, index) => (
                            <div key={step} className="flex items-center gap-3">
                                <div className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    {step}
                                </div>
                                {index < collaboration.flow.length - 1 && (
                                    <ArrowRight size={14} className="text-slate-400" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                        示例目标：{collaboration.example.goal} · KPI：{collaboration.example.kpis.join('、')} · 对象：{collaboration.example.objects.join('、')}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Target size={16} className="text-rose-500" />
                            业务阻点
                        </h3>
                        <span className="text-[10px] text-slate-400">需业务侧推进</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {riskAndTodo.business.map(item => (
                            <div key={item} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-600">
                                <span>{item}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white text-rose-500">待处理</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-amber-500" />
                            治理阻点
                        </h3>
                        <span className="text-[10px] text-slate-400">需治理侧推进</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {riskAndTodo.governance.map(item => (
                            <div key={item} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-600">
                                <span>{item}</span>
                                <span className="px-2 py-0.5 rounded-full bg-white text-amber-500">待处理</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <BarChart3 size={16} className="text-emerald-600" />
                            快捷处理入口
                        </h3>
                        <span className="text-[10px] text-slate-400">协同加速</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {riskAndTodo.actions.map(action => (
                            <button
                                key={action}
                                className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
                            >
                                <span>{action}</span>
                                <ArrowRight size={12} className="text-slate-400" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
