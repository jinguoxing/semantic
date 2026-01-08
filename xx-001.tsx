< !DOCTYPE html >
    <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>业务对象治理平台</title>

                    <!-- Tailwind CSS -->
                    <script src="https://cdn.tailwindcss.com"></script>

                    <!-- React & ReactDOM -->
                    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>

                    <!-- Babel for JSX -->
                    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

                    <!-- Lucide React Icons (UMD) -->
                    <script src="https://unpkg.com/lucide-react@0.263.1/dist/lucide-react.umd.min.js"></script>

                    <!-- Fonts -->
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

                        <style>
                            body {
                                font - family: 'Inter', sans-serif;
                            background-color: #f8fafc;
        }
                            /* Custom Scrollbar */
                            ::-webkit-scrollbar {
                                width: 6px;
                            height: 6px;
        }
                            ::-webkit-scrollbar-track {
                                background: #f1f5f9; 
        }
                            ::-webkit-scrollbar-thumb {
                                background: #cbd5e1;
                            border-radius: 3px;
        }
                            ::-webkit-scrollbar-thumb:hover {
                                background: #94a3b8; 
        }
                            .fade-in {
                                animation: fadeIn 0.3s ease-in-out;
        }
                            @keyframes fadeIn {
                                from {opacity: 0; transform: translateY(10px); }
                            to {opacity: 1; transform: translateY(0); }
        }
                            .table-row-hover:hover td {
                                background - color: #f8fafc;
        }
                        </style>
                    </head>
                    <body>
                        <div id="root"></div>

                        <script type="text/babel">
                            const {useState, useEffect, useMemo} = React;

                            // --- Icon Handling ---
                            const LucideIcons = window.lucideReact || window.lucide || { };
                            const {
                                LayoutDashboard,
                                Database, // For Business Modeling
                                Search,   // For Data Discovery
                                Settings,
                                Plus,
                                Trash2,
                                MoreHorizontal,
                                Menu,
                                X,
                                Bell,
                                User,
                                Layers,
                                FileText,
                                Table,
                                Filter,
                                ArrowRight,
                                ShieldCheck,
                                Activity
                            } = LucideIcons;

                            // --- Mock Data: 业务建模 (Business Modeling) ---
                            const MOCK_MODELS = [
                            {id: 'BM001', name: '客户全景视图 (Customer 360)', domain: '营销域', owner: '张三', status: 'published', lastUpdated: '2023-10-25', description: '包含客户基础信息、交易记录及行为偏好' },
                            {id: 'BM002', name: '全渠道订单 (Omni-Channel Order)', domain: '交易域', owner: '李四', status: 'draft', lastUpdated: '2023-10-24', description: '线上线下全渠道统一订单模型' },
                            {id: 'BM003', name: '商品主数据 (Product Master)', domain: '商品域', owner: '王五', status: 'published', lastUpdated: '2023-10-26', description: '标准化SKU及SPU定义' },
                            {id: 'BM004', name: '供应链库存 (Supply Chain Inventory)', domain: '库存域', owner: '赵六', status: 'reviewing', lastUpdated: '2023-10-25', description: '实时多仓库存快照' },
                            ];

                            // --- Mock Data: 数据发现 (Data Discovery) ---
                            const MOCK_ASSETS = [
                            {id: 'DA001', name: 'dw_customer_fact', type: 'Table', source: 'Hive', qualityScore: 98, accessCount: 1250, description: '客户事实表，每日T+1更新' },
                            {id: 'DA002', name: 'api_order_query_v2', type: 'API', source: 'Gateway', qualityScore: 100, accessCount: 8900, description: '订单查询标准接口' },
                            {id: 'DA003', name: 'ods_logistics_track', type: 'Topic', source: 'Kafka', qualityScore: 85, accessCount: 56000, description: '物流轨迹实时流数据' },
                            {id: 'DA004', name: 'dim_region_code', type: 'Table', source: 'MySQL', qualityScore: 100, accessCount: 300, description: '行政区划维度表' },
                            ];

                            // --- Components ---

                            // 1. Sidebar Component
                            const Sidebar = ({activeTab, setActiveTab, isMobileOpen, setIsMobileOpen}) => {
            const menuItems = [
                            {id: 'dashboard', icon: LayoutDashboard, label: '治理概览' },
                            {id: 'modeling', icon: Database, label: '业务建模' },
                            {id: 'discovery', icon: Search, label: '数据发现' },
                            {id: 'standards', icon: Layers, label: '数据标准' },
                            {id: 'quality', icon: ShieldCheck, label: '质量监控' },
                            ];

                            return (
                            <>
                                {/* Mobile Overlay */}
                                {isMobileOpen && (
                                    <div
                                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                                        onClick={() => setIsMobileOpen(false)}
                                    ></div>
                                )}

                                {/* Sidebar */}
                                <aside className={`
                        fixed lg:static inset-y-0 left-0 z-30
                        w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out
                        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        flex flex-col
                    `}>
                                    <div className="h-16 flex items-center px-6 border-b border-slate-800">
                                        <div className="flex items-center gap-3 font-bold text-white text-lg">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                                {Layers && <Layers size={20} />}
                                            </div>
                                            <span>DataGov</span>
                                        </div>
                                        <button onClick={() => setIsMobileOpen(false)} className="lg:hidden ml-auto text-slate-400">
                                            {X && <X size={24} />}
                                        </button>
                                    </div>

                                    <nav className="flex-1 px-3 py-6 space-y-1">
                                        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            核心功能
                                        </div>
                                        {menuItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    setIsMobileOpen(false);
                                                }}
                                                className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${activeTab === item.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'hover:bg-slate-800 hover:text-white'}
                                    `}
                                            >
                                                {item.icon && <item.icon size={18} />}
                                                {item.label}
                                            </button>
                                        ))}
                                    </nav>

                                    <div className="p-4 border-t border-slate-800">
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                                            {Settings && <Settings size={18} />}
                                            系统设置
                                        </button>
                                    </div>
                                </aside>
                            </>
                            );
        };

        // 2. Dashboard View (Overview)
        const DashboardView = () => {
            return (
                            <div className="space-y-6 fade-in">
                                <h2 className="text-2xl font-bold text-slate-900">治理工作台</h2>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    {[
                                        { label: '业务模型总数', value: '128', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: '数据资产总量', value: '3,450', icon: Table, color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { label: '平均质量分', value: '94.5', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
                                        { label: '待处理工单', value: '12', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                                    <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                                                </div>
                                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                                    {stat.icon && <stat.icon size={20} />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts / Activity Area Placeholder */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px]">
                                        <h3 className="font-bold text-slate-900 mb-4">资产增长趋势</h3>
                                        <div className="flex items-end justify-between h-48 px-2 space-x-2">
                                            {[40, 65, 50, 80, 70, 90, 100].map((h, i) => (
                                                <div key={i} className="w-full bg-blue-100 rounded-t-sm relative group">
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600"
                                                        style={{ height: `${h}%` }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-slate-400">
                                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-900 mb-4">最近更新模型</h3>
                                        <div className="space-y-4">
                                            {MOCK_MODELS.slice(0, 3).map((model) => (
                                                <div key={model.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                                                            {Database && <Database size={16} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">{model.name}</div>
                                                            <div className="text-xs text-slate-500">{model.owner} • {model.lastUpdated}</div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${model.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {model.status === 'published' ? '已发布' : '草稿'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
        };

        // 3. Business Modeling View (业务建模)
        const BusinessModelingView = () => {
            return (
                            <div className="space-y-6 fade-in h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">业务建模</h2>
                                        <p className="text-sm text-slate-500 mt-1">定义和管理企业核心业务对象及其关系</p>
                                    </div>
                                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                        {Plus && <Plus size={18} />}
                                        新建模型
                                    </button>
                                </div>

                                {/* Filter Bar */}
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                                    <div className="flex-1 relative">
                                        {Search && <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />}
                                        <input
                                            type="text"
                                            placeholder="搜索模型名称、编码或负责人..."
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                                        {Filter && <Filter size={18} />}
                                        筛选域
                                    </button>
                                </div>

                                {/* Models Table */}
                                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4">模型名称 / 编码</th>
                                                    <th className="px-6 py-4">所属域</th>
                                                    <th className="px-6 py-4">负责人</th>
                                                    <th className="px-6 py-4">状态</th>
                                                    <th className="px-6 py-4">最后更新</th>
                                                    <th className="px-6 py-4 text-right">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {MOCK_MODELS.map((model) => (
                                                    <tr key={model.id} className="table-row-hover transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-slate-900">{model.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{model.id}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                                {model.domain}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">
                                                                    {model.owner[0]}
                                                                </div>
                                                                {model.owner}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${model.status === 'published'
                                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                                    : model.status === 'draft'
                                                                        ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                                                        : 'bg-orange-50 text-orange-700 border border-orange-100'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${model.status === 'published' ? 'bg-green-500' : model.status === 'draft' ? 'bg-slate-400' : 'bg-orange-500'
                                                                    }`}></span>
                                                                {model.status === 'published' ? '已发布' : model.status === 'draft' ? '草稿' : '审核中'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">{model.lastUpdated}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-slate-400 hover:text-blue-600 transition-colors">
                                                                {MoreHorizontal && <MoreHorizontal size={18} />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            );
        };

        // 4. Data Discovery View (数据发现)
        const DataDiscoveryView = () => {
            return (
                            <div className="space-y-6 fade-in h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">数据发现</h2>
                                        <p className="text-sm text-slate-500 mt-1">快速检索企业数据资产，查看元数据和血缘</p>
                                    </div>
                                </div>

                                {/* Search Hero Area */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
                                    <div className="max-w-3xl mx-auto text-center space-y-6">
                                        <h3 className="text-2xl font-semibold">搜索全域数据资产</h3>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="输入表名、指标、报表或业务术语..."
                                                className="w-full px-6 py-4 rounded-xl text-slate-900 focus:outline-none shadow-xl"
                                            />
                                            <button className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors">
                                                搜索
                                            </button>
                                        </div>
                                        <div className="flex justify-center gap-4 text-sm text-blue-100">
                                            <span>热门搜索:</span>
                                            <span className="cursor-pointer hover:text-white border-b border-transparent hover:border-white transition-all">客户留存</span>
                                            <span className="cursor-pointer hover:text-white border-b border-transparent hover:border-white transition-all">GMV日报</span>
                                            <span className="cursor-pointer hover:text-white border-b border-transparent hover:border-white transition-all">库存周转</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Asset List */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {MOCK_ASSETS.map(asset => (
                                        <div key={asset.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${asset.type === 'Table' ? 'bg-blue-50 text-blue-600' :
                                                            asset.type === 'API' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {asset.type === 'Table' ? (Table && <Table size={18} />) :
                                                            asset.type === 'API' ? (Activity && <Activity size={18} />) : (Layers && <Layers size={18} />)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{asset.name}</h4>
                                                        <div className="text-xs text-slate-500 mt-0.5">{asset.id} • {asset.source}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium text-slate-600">
                                                    {asset.type}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{asset.description}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                                                <div className="flex gap-4 text-slate-500">
                                                    <span>热度 {asset.accessCount}</span>
                                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                                        {ShieldCheck && <ShieldCheck size={12} />}
                                                        质量分 {asset.qualityScore}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                    查看详情 {ArrowRight && <ArrowRight size={14} />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            );
        };

        // --- Main App Component ---
        const App = () => {
            const [activeTab, setActiveTab] = useState('modeling'); // Default to modeling as requested
                            const [isMobileOpen, setIsMobileOpen] = useState(false);

            const renderContent = () => {
                switch(activeTab) {
                    case 'dashboard': return <DashboardView />;
                            case 'modeling': return <BusinessModelingView />;
                            case 'discovery': return <DataDiscoveryView />;
                            default: return <div className="p-10 text-center text-slate-500">该功能模块正在开发中...</div>;
                }
            };

                            return (
                            <div className="flex h-screen bg-slate-50 overflow-hidden">
                                <Sidebar
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    isMobileOpen={isMobileOpen}
                                    setIsMobileOpen={setIsMobileOpen}
                                />

                                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                                    {/* Header */}
                                    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setIsMobileOpen(true)}
                                                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                                            >
                                                {Menu && <Menu size={20} />}
                                            </button>
                                            {/* Breadcrumb like placeholder */}
                                            <div className="text-sm text-slate-500 hidden sm:block">
                                                工作台 / <span className="text-slate-900 font-medium">
                                                    {activeTab === 'dashboard' ? '治理概览' :
                                                        activeTab === 'modeling' ? '业务建模' :
                                                            activeTab === 'discovery' ? '数据发现' : '数据标准'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                                                {Bell && <Bell size={20} />}
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                            </button>
                                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-sm font-medium text-slate-900">Admin User</div>
                                                    <div className="text-xs text-slate-500">数据管理员</div>
                                                </div>
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200">
                                                    {User && <User size={18} />}
                                                </div>
                                            </div>
                                        </div>
                                    </header>

                                    {/* Main Content Area */}
                                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
                                        <div className="max-w-7xl mx-auto h-full">
                                            {renderContent()}
                                        </div>
                                    </div>
                                </main>
                            </div>
                            );
        };

                            const root = ReactDOM.createRoot(document.getElementById('root'));
                            root.render(<App />);
                        </script>
                    </body>
                </html>