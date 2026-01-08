import { Layout, Database, GitMerge, Server, AlertCircle, Activity } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StepItem from '../components/common/StepItem';

interface DashboardViewProps {
    setActiveModule: (module: string) => void;
}

const DashboardView = ({ setActiveModule }: DashboardViewProps) => (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="L1 业务对象" value="142" trend="+3" icon={Layout} color="blue" />
            <StatCard label="已扫描物理表" value="8,920" trend="+12" icon={Database} color="emerald" />
            <StatCard label="已对齐映射" value="89" trend="65%" icon={GitMerge} color="purple" />
            <StatCard label="API 服务调用" value="1.2M" trend="High" icon={Server} color="orange" />
        </div>

        {/* 核心架构可视化卡片 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">语义层构建流水线</h2>
                    <p className="text-slate-500 text-sm">业务模型与技术实现的融合状态</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                        <Activity size={12} /> System Healthy
                    </span>
                </div>
            </div>

            <div className="flex items-stretch gap-8">
                {/* 左侧 TD 流 */}
                <div className="flex-1 bg-blue-50/50 rounded-xl border border-blue-100 p-5 relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setActiveModule('td_modeling')}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Layout size={80} className="text-blue-500" />
                    </div>
                    <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 业务意图
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <StepItem status="done" text="A1. 政策文件解析 (出生一件事)" />
                        <StepItem status="done" text="A2. L1 业务对象定义 (142个)" />
                        <StepItem status="process" text="A4. 场景语义编排" />
                    </div>
                </div>

                {/* 中间 汇聚流 */}
                <div className="w-48 flex flex-col justify-center items-center relative">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-200 -z-10"></div>
                    <div className="bg-white p-4 rounded-full border-2 border-purple-100 shadow-lg mb-4 hover:scale-110 transition-transform cursor-pointer z-10" onClick={() => setActiveModule('mapping')}>
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <GitMerge size={32} />
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-slate-800">语义对齐</div>
                        <div className="text-xs text-slate-500 mt-1">冲突检测中...</div>
                        <div className="mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertCircle size={10} /> 14 个待解决冲突
                        </div>
                    </div>
                </div>

                {/* 右侧 BU 流 */}
                <div className="flex-1 bg-emerald-50/50 rounded-xl border border-emerald-100 p-5 relative overflow-hidden group hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => setActiveModule('bu_discovery')}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database size={80} className="text-emerald-500" />
                    </div>
                    <h3 className="text-emerald-900 font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 技术实现
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <StepItem status="done" text="B1. 挂载卫健委前置机 (MySQL)" />
                        <StepItem status="done" text="B2. 自动元数据采集" />
                        <StepItem status="done" text="B4. 候选对象生成 (AI 识别)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default DashboardView;
