import { useState } from 'react';
import {
    MessageCircle, Send, Sparkles, Table, Box, Database,
    ChevronRight, RefreshCw, Copy, ThumbsUp, ThumbsDown,
    BarChart3, PieChart, TrendingUp, FileText, Search,
    ArrowRight, Zap, Clock, CheckCircle
} from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'text' | 'sql' | 'chart' | 'table';
    data?: any;
}

interface ScenarioExample {
    id: string;
    title: string;
    description: string;
    query: string;
    icon: React.ElementType;
    category: string;
}

const AskDataView = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '您好！我是数据问答助手，可以帮您查询和分析数据。您可以用自然语言描述您的需求，例如：\n\n• "查询最近30天的订单趋势"\n• "统计各部门的销售业绩"\n• "找出客户表和订单表的关联关系"\n\n请问有什么可以帮您的？',
            timestamp: new Date(),
            type: 'text'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const scenarioExamples: ScenarioExample[] = [
        {
            id: '1',
            title: '订单趋势分析',
            description: '查询最近30天的订单数量和金额趋势',
            query: '帮我分析最近30天的订单趋势，包括订单数量和订单金额',
            icon: TrendingUp,
            category: '趋势分析'
        },
        {
            id: '2',
            title: '客户分布统计',
            description: '按地区统计客户数量分布',
            query: '统计各地区的客户数量分布情况，生成饼图',
            icon: PieChart,
            category: '分布统计'
        },
        {
            id: '3',
            title: '销售业绩排名',
            description: '查看各销售人员的业绩排名',
            query: '查询本月各销售人员的业绩排名，显示前10名',
            icon: BarChart3,
            category: '排名分析'
        },
        {
            id: '4',
            title: '库存预警查询',
            description: '查找库存不足的商品',
            query: '查询库存数量低于安全库存的商品列表',
            icon: Search,
            category: '预警查询'
        },
        {
            id: '5',
            title: '表关系探索',
            description: '分析业务对象之间的关联关系',
            query: '帮我分析"客户"和"订单"业务对象之间的关联关系',
            icon: Database,
            category: '关系分析'
        },
        {
            id: '6',
            title: '数据质量检查',
            description: '检查数据完整性和一致性',
            query: '检查订单表的数据质量，包括空值率和重复率',
            icon: CheckCircle,
            category: '数据治理'
        }
    ];

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
            type: 'text'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const mockResponses = generateMockResponse(inputValue);
            setMessages(prev => [...prev, ...mockResponses]);
            setIsLoading(false);
        }, 1500);
    };

    const generateMockResponse = (query: string): Message[] => {
        const responses: Message[] = [];

        if (query.includes('订单') && query.includes('趋势')) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '我已为您分析了最近30天的订单趋势。以下是生成的SQL查询和结果：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT 
    DATE(create_time) as order_date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_amount
FROM orders
WHERE create_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(create_time)
ORDER BY order_date;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '📊 分析结果：\n\n• 30天总订单数：2,847 单\n• 总交易金额：¥1,256,890\n• 日均订单：95 单\n• 订单增长率：+12.5%\n• 高峰日期：周末订单量明显增加\n\n建议：考虑在周末增加运营资源以应对订单高峰。',
                timestamp: new Date(),
                type: 'text'
            });
        } else if (query.includes('客户') && (query.includes('分布') || query.includes('地区'))) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '已完成客户地区分布统计，以下是查询结果：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `SELECT 
    region,
    COUNT(*) as customer_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM customers
GROUP BY region
ORDER BY customer_count DESC;`,
                timestamp: new Date(),
                type: 'sql'
            });
            responses.push({
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '🌍 地区分布：\n\n• 华东地区：35.2% (4,521 客户)\n• 华南地区：28.7% (3,687 客户)\n• 华北地区：18.5% (2,377 客户)\n• 西南地区：10.3% (1,323 客户)\n• 其他地区：7.3% (938 客户)\n\n华东和华南地区占据客户总量的63.9%，是核心市场区域。',
                timestamp: new Date(),
                type: 'text'
            });
        } else if (query.includes('关联') || query.includes('关系')) {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: '我已分析了业务对象之间的关联关系：',
                timestamp: new Date(),
                type: 'text'
            });
            responses.push({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '🔗 关联关系分析：\n\n**客户 (Customer) ↔ 订单 (Order)**\n• 关系类型：一对多 (1:N)\n• 关联键：customer_id\n• 物理表映射：t_customer.id → t_order.customer_id\n\n**订单 (Order) ↔ 订单明细 (OrderItem)**\n• 关系类型：一对多 (1:N)\n• 关联键：order_id\n• 物理表映射：t_order.id → t_order_item.order_id\n\n**商品 (Product) ↔ 订单明细 (OrderItem)**\n• 关系类型：一对多 (1:N)\n• 关联键：product_id\n• 物理表映射：t_product.id → t_order_item.product_id',
                timestamp: new Date(),
                type: 'text'
            });
        } else {
            responses.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: `我理解您想要查询关于"${query}"的信息。让我帮您分析：\n\n基于您的问题，我可以：\n1. 生成相应的SQL查询\n2. 分析相关的业务对象\n3. 可视化展示数据结果\n\n请问您需要我进一步细化哪个方面？`,
                timestamp: new Date(),
                type: 'text'
            });
        }

        return responses;
    };

    const handleScenarioClick = (scenario: ScenarioExample) => {
        setInputValue(scenario.query);
    };

    return (
        <div className="h-full flex gap-4 animate-fade-in">
            {/* Left Panel - Chat Interface */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <MessageCircle size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">智能问数</h2>
                            <p className="text-xs text-slate-500">用自然语言探索您的数据</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                            >
                                {message.type === 'sql' ? (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600">
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <pre className="text-xs font-mono bg-slate-800 text-green-400 p-3 rounded-lg overflow-x-auto">
                                            {message.content}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                )}
                                {message.role === 'assistant' && message.type === 'text' && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/50">
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-green-600 transition-colors">
                                            <ThumbsUp size={14} />
                                        </button>
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-600 transition-colors">
                                            <ThumbsDown size={14} />
                                        </button>
                                        <button className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <RefreshCw size={16} className="animate-spin text-indigo-500" />
                                <span className="text-sm text-slate-500">正在分析...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="输入您的问题，例如：查询最近一周的销售数据..."
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${inputValue.trim() && !isLoading
                                        ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <Sparkles size={12} />
                        <span>AI 驱动的智能数据问答</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Scenario Examples */}
            <div className="w-80 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        场景示例
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">点击快速开始</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {scenarioExamples.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario)}
                            className="w-full p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                                    <scenario.icon size={16} className="text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800 text-sm">{scenario.title}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{scenario.category}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">{scenario.description}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-1" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Queries */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Clock size={12} />
                        <span>最近查询</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-600 hover:text-indigo-600 cursor-pointer truncate">
                            • 本月销售额统计
                        </div>
                        <div className="text-xs text-slate-600 hover:text-indigo-600 cursor-pointer truncate">
                            • 客户订单关联查询
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AskDataView;
