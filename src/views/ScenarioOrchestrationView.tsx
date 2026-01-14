// ==========================================
// Scenario Orchestration View (TD-04)
// ==========================================
// Location: tt5.tsx:3065-3438

import React, { useState } from 'react';
import {
    Layers, Plus, Search, Box, MousePointer, Move, ZoomIn, ZoomOut,
    Play, Save, Settings, MoreHorizontal, CheckCircle, RefreshCw, X, Link
} from 'lucide-react';
import { BusinessObject } from '../types/semantic';

interface ScenarioOrchestrationViewProps {
    businessObjects: BusinessObject[];
}

interface ScenarioNode {
    id: string;
    type: 'start' | 'end' | 'action' | 'object';
    label: string;
    objectId: string | null;
    status: 'done' | 'process' | 'pending';
    x: number;
    y: number;
}

interface ScenarioEdge {
    from: string;
    to: string;
    label: string;
}

interface Scenario {
    id: string;
    name: string;
    status: 'active' | 'draft';
    description: string;
    involvedObjects: string[];
    nodes: ScenarioNode[];
    edges: ScenarioEdge[];
}

const ScenarioOrchestrationView: React.FC<ScenarioOrchestrationViewProps> = ({ businessObjects }) => {
    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Node Dragging State
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

    const [activeScenarioId, setActiveScenarioId] = useState('SC_SCM_001');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newScenario, setNewScenario] = useState({
        name: '',
        description: '',
        involvedObjects: [] as string[]
    });

    // 模拟场景数据
    const mockScenarios: Scenario[] = [
        {
            id: 'SC_001',
            name: '出生医学证明申领流程',
            status: 'active',
            description: '新生儿出生后，由医院发起信息登记，监护人确认申领，最终系统自动签发电子证照。',
            involvedObjects: ['新生儿', '出生医学证明'],
            nodes: [
                { id: 'n1', type: 'start', label: '出生登记', objectId: 'BO_NEWBORN', status: 'done', x: 100, y: 100 },
                { id: 'n2', type: 'action', label: '监护人申领', objectId: null, status: 'done', x: 300, y: 100 },
                { id: 'n3', type: 'object', label: '生成证明', objectId: 'BO_CERT', status: 'process', x: 500, y: 100 },
                { id: 'n4', type: 'end', label: '归档完成', objectId: null, status: 'pending', x: 700, y: 100 },
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '触发' },
                { from: 'n2', to: 'n3', label: '提交申请' },
                { from: 'n3', to: 'n4', label: '自动归档' },
            ]
        },
        {
            id: 'SC_002',
            name: '新生儿落户办理',
            status: 'draft',
            description: '基于出生医学证明和监护人户口簿，办理新生儿户口登记。',
            involvedObjects: ['出生医学证明'],
            nodes: [
                { id: 'n1', type: 'start', label: '获取证明', objectId: 'BO_CERT', status: 'pending', x: 100, y: 100 },
                { id: 'n2', type: 'object', label: '户籍登记', objectId: null, status: 'pending', x: 300, y: 100 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '作为依据' }
            ]
        },
        {
            id: 'SC_003',
            name: '疫苗接种管理',
            status: 'draft',
            description: '新生儿疫苗接种计划制定和执行跟踪。',
            involvedObjects: ['新生儿'],
            nodes: [
                { id: 'n1', type: 'start', label: '制定计划', objectId: 'BO_NEWBORN', status: 'pending', x: 100, y: 100 },
                { id: 'n2', type: 'action', label: '接种提醒', objectId: null, status: 'pending', x: 300, y: 100 },
                { id: 'n3', type: 'end', label: '记录完成', objectId: null, status: 'pending', x: 500, y: 100 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '生成' },
                { from: 'n2', to: 'n3', label: '执行' }
            ]
        },
        // 🚚 SG-DEMO: Supply Chain Traceability
        {
            id: 'SC_SCM_001',
            name: '供应链全链路追踪',
            status: 'active',
            description: '从供应商采购到入库再到物流配送的全链路数据流转场景。',
            involvedObjects: ['供应商', '采购订单', '库存', '物流运单'],
            nodes: [
                { id: 'n1', type: 'start', label: '供应商入驻', objectId: 'BO_SCM_SUPPLIER', status: 'done', x: 100, y: 150 },
                { id: 'n2', type: 'action', label: '采购下单', objectId: null, status: 'done', x: 300, y: 150 },
                { id: 'n3', type: 'object', label: '采购订单', objectId: 'BO_SCM_PO', status: 'done', x: 500, y: 150 },
                { id: 'n4', type: 'action', label: '入库作业', objectId: null, status: 'process', x: 700, y: 150 },
                { id: 'n5', type: 'object', label: '库存更新', objectId: 'BO_SCM_INVENTORY', status: 'pending', x: 900, y: 150 },
                { id: 'n6', type: 'action', label: '物流发货', objectId: null, status: 'pending', x: 1100, y: 150 },
                { id: 'n7', type: 'end', label: '物流配送', objectId: 'BO_SCM_DELIVERY', status: 'pending', x: 1300, y: 150 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '发起采购' },
                { from: 'n2', to: 'n3', label: '生成订单' },
                { from: 'n3', to: 'n4', label: '收货入库' },
                { from: 'n4', to: 'n5', label: '更新库存' },
                { from: 'n5', to: 'n6', label: '安排发货' },
                { from: 'n6', to: 'n7', label: '生成运单' }
            ]
        }
    ];

    const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios);
    const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

    // Canvas Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // If clicking on a node (handled by node onMouseDown), ignore canvas drag
        // But we need to check if we are clicking canvas or node
        // Actually, we can put onMouseDown on the container. 
        // If target is node, setDraggedNodeId. Else set setIsDraggingCanvas.

        // However, to keep it clean, let's assume if draggedNodeId is null, we are panning.
        if (draggedNodeId) return;

        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        } else if (draggedNodeId) {
            // Calculate new position relative to canvas origin (taking zoom into account)
            // This is tricky. Delta movement needs to be divided by zoom.
            // Simplified approach: Update node position directly.

            // We need the movement delta
            const movementX = e.movementX / zoom;
            const movementY = e.movementY / zoom;

            const updatedScenarios = scenarios.map(sc => {
                if (sc.id === activeScenarioId) {
                    return {
                        ...sc,
                        nodes: sc.nodes.map(n => {
                            if (n.id === draggedNodeId) {
                                return { ...n, x: n.x + movementX, y: n.y + movementY };
                            }
                            return n;
                        })
                    };
                }
                return sc;
            });
            setScenarios(updatedScenarios);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingCanvas(false);
        setDraggedNodeId(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };


    const handleSaveScenario = () => {
        if (!newScenario.name) return;
        const scenarioData: Scenario = {
            id: `SC_${Date.now()}`,
            ...newScenario,
            status: 'draft',
            nodes: [
                { id: 'n1', type: 'start', label: '开始', objectId: null, status: 'pending', x: 100, y: 100 }
            ],
            edges: []
        };
        setScenarios([...scenarios, scenarioData]);
        setIsModalOpen(false);
        setNewScenario({ name: '', description: '', involvedObjects: [] });
    };

    return (
        <div className="flex h-full flex-col gap-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="text-purple-500" /> 场景编排
                    </h2>
                    <p className="text-slate-500 mt-1">可视化业务流程设计和对象关联编排</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm shadow-purple-200"
                >
                    <Plus size={16} /> 新建场景
                </button>
            </div>

            <div className="flex h-full gap-6 overflow-hidden">
                {/* 左侧：场景列表 */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">业务场景列表</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {scenarios.length} 个
                        </span>
                    </div>
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="搜索场景..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {scenarios.map(sc => (
                            <div
                                key={sc.id}
                                onClick={() => setActiveScenarioId(sc.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${activeScenarioId === sc.id
                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm truncate ${activeScenarioId === sc.id ? 'text-purple-800' : 'text-slate-700'}`}>
                                        {sc.name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {sc.status === 'active' ? '生效' : '草稿'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 line-clamp-2 mb-2">{sc.description}</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Box size={10} />
                                    <span>{sc.involvedObjects.length} 个对象</span>
                                    <span className="mx-1">•</span>
                                    <span>{sc.nodes.length} 个节点</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 中间：编排画布 */}
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl shadow-inner flex flex-col overflow-hidden relative">
                    {/* 工具栏 */}
                    {/* 工具栏 */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                        <button
                            className={`p-2 rounded ${!draggedNodeId && !isDraggingCanvas ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                            title="选择模式"
                        >
                            <MousePointer size={18} />
                        </button>
                        <button
                            className={`p-2 rounded ${isDraggingCanvas ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                            title="移动画布 (按住拖拽)"
                        >
                            <Move size={18} />
                        </button>
                        <div className="h-px bg-slate-200 my-1"></div>
                        <button onClick={handleZoomIn} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="放大">
                            <ZoomIn size={18} />
                        </button>
                        <button onClick={handleZoomOut} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="缩小">
                            <ZoomOut size={18} />
                        </button>
                        <button onClick={handleResetZoom} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="重置视图">
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    {/* 操作按钮 */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg shadow-sm hover:bg-slate-50">
                            <Play size={14} className="text-emerald-500" /> 模拟运行
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg shadow-sm hover:bg-purple-700 shadow-purple-200">
                            <Save size={14} /> 保存场景
                        </button>
                    </div>

                    {/* 画布内容 */}
                    {/* 画布内容 */}
                    <div
                        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-50"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* 变换容器 (Zoom & Pan) */}
                        <div
                            className="absolute inset-0 transition-transform duration-75 ease-linear origin-top-left"
                            style={{
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                                width: '10000px', // Large canvas area
                                height: '10000px'
                            }}
                        >
                            {/* Grid Background */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />

                            {/* Nodes */}
                            {activeScenario.nodes.map((node) => {
                                const matchedBO = businessObjects.find((bo) => bo.id === node.objectId);

                                return (
                                    <React.Fragment key={node.id}>
                                        <div
                                            className={`absolute w-48 bg-white rounded-xl shadow-lg border-2 cursor-move hover:shadow-xl hover:z-50 ${node.type === 'start' ? 'border-blue-400' :
                                                node.type === 'end' ? 'border-slate-400' :
                                                    node.type === 'object' ? 'border-purple-400' : 'border-orange-400'
                                                }`}
                                            style={{ left: node.x, top: node.y }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation(); // Prevent canvas drag
                                                setDraggedNodeId(node.id);
                                            }}
                                        >
                                            <div className={`px-4 py-2 rounded-t-lg border-b text-xs font-bold uppercase tracking-wider flex justify-between items-center ${node.type === 'start' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                node.type === 'end' ? 'bg-slate-50 border-slate-100 text-slate-600' :
                                                    node.type === 'object' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-orange-50 border-orange-100 text-orange-600'
                                                }`}>
                                                <span>{node.type}</span>
                                                {node.status === 'done' && <CheckCircle size={14} className="text-emerald-500" />}
                                                {node.status === 'process' && <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />}
                                            </div>

                                            <div className="p-4">
                                                <div className="font-bold text-slate-800 mb-1">{node.label}</div>
                                                {matchedBO ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit mb-2">
                                                        <Box size={12} /> {matchedBO.name}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic mb-2">无关联对象</div>
                                                )}
                                            </div>

                                            <div className="px-4 py-2 border-t border-slate-100 flex justify-end gap-2">
                                                <Settings size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                                <MoreHorizontal size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}

                            {/* SVG Edges Layer */}
                            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                                    </marker>
                                </defs>
                                {activeScenario.edges.map((edge, idx) => {
                                    const fromNode = activeScenario.nodes.find(n => n.id === edge.from);
                                    const toNode = activeScenario.nodes.find(n => n.id === edge.to);
                                    if (!fromNode || !toNode) return null;

                                    // Bezier Curve Logic: Right -> Left
                                    const sourceX = fromNode.x + 192; // Width of w-48 is 12rem = 192px
                                    const sourceY = fromNode.y + 60;  // Approx half height
                                    const targetX = toNode.x;
                                    const targetY = toNode.y + 60;

                                    // Control Points for Cubic Bezier
                                    const curvature = 0.5;
                                    const deltaX = Math.abs(targetX - sourceX) * curvature;
                                    // Ensure a minimum curvature to avoid flat lines looking weird if close
                                    const controlDist = Math.max(deltaX, 80);

                                    const cp1X = sourceX + controlDist;
                                    const cp1Y = sourceY;
                                    const cp2X = targetX - controlDist;
                                    const cp2Y = targetY;

                                    const pathData = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;

                                    // Label Position (Center of the Bezier curve approximation)
                                    // For Cubic Bezier: B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3
                                    // Midpoint at t=0.5
                                    const t = 0.5;
                                    const labelX = Math.pow(1 - t, 3) * sourceX + 3 * Math.pow(1 - t, 2) * t * cp1X + 3 * (1 - t) * Math.pow(t, 2) * cp2X + Math.pow(t, 3) * targetX;
                                    const labelY = Math.pow(1 - t, 3) * sourceY + 3 * Math.pow(1 - t, 2) * t * cp1Y + 3 * (1 - t) * Math.pow(t, 2) * cp2Y + Math.pow(t, 3) * targetY;

                                    return (
                                        <g key={`${edge.from}-${edge.to}`}>
                                            <path
                                                d={pathData}
                                                stroke="#94a3b8"
                                                strokeWidth="2"
                                                fill="none"
                                                markerEnd="url(#arrowhead)"
                                                className="transition-all duration-75"
                                            />
                                            {/* Edge Label */}
                                            <foreignObject x={labelX - 20} y={labelY - 10} width="40" height="20">
                                                <div className="text-[10px] bg-white border border-slate-200 text-slate-500 rounded px-1 text-center truncate shadow-sm">
                                                    {edge.label}
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Add Button (Floating) */}
                            {/* In absolute mode, maybe we remove the add button or make it a tool? */}
                            {/* Keeping it simple for now, maybe fixed position or removed. 
                                The user didn't ask for "Add Node" mechanics, just optimizations. 
                                Let's remove the visual dashed circle for now as it doesn't fit absolute layout well without logic.
                            */}
                        </div>
                    </div>
                </div>

                {/* 右侧：对象库 */}
                <div className="w-60 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Box size={16} className="text-purple-500" />
                            业务对象库
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">拖拽对象至画布以建立关联</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {businessObjects.map((bo) => (
                            <div key={bo.id} className="p-3 bg-white border border-slate-200 rounded shadow-sm cursor-grab hover:border-purple-300 hover:shadow-md transition-all group active:cursor-grabbing">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-slate-700">{bo.name}</span>
                                    <Link size={12} className="text-slate-300 group-hover:text-purple-500" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{bo.code}</div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    {bo.fields?.length || 0} 属性 • {bo.status}
                                </div>
                            </div>
                        ))}

                        <div className="p-2 border-t border-slate-100 mt-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">流程节点组件</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-blue-400 cursor-pointer">
                                    开始
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-orange-400 cursor-pointer">
                                    动作
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-slate-400 cursor-pointer">
                                    结束
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-green-400 cursor-pointer">
                                    判断
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 新建场景模态框 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">新建业务场景</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    场景名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newScenario.name}
                                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    placeholder="例如：企业开办一件事"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">场景描述</label>
                                <textarea
                                    value={newScenario.description}
                                    onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm h-24 resize-none"
                                    placeholder="请描述业务场景的流程和目标..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">涉及对象</label>
                                <div className="border border-slate-300 rounded-md p-2 max-h-32 overflow-y-auto">
                                    {businessObjects.map((bo) => (
                                        <label key={bo.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded text-sm">
                                            <input
                                                type="checkbox"
                                                checked={newScenario.involvedObjects.includes(bo.name)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewScenario({
                                                            ...newScenario,
                                                            involvedObjects: [...newScenario.involvedObjects, bo.name]
                                                        });
                                                    } else {
                                                        setNewScenario({
                                                            ...newScenario,
                                                            involvedObjects: newScenario.involvedObjects.filter(name => name !== bo.name)
                                                        });
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span>{bo.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveScenario}
                                disabled={!newScenario.name}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newScenario.name ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                    }`}
                            >
                                创建场景
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScenarioOrchestrationView;
