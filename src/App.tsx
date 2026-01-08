import { useState } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send
} from 'lucide-react';

// ==========================================
// 模拟数据 (Mock Data)
// ==========================================

// TD: 业务梳理数据 (原业务目标)
const mockBusinessGoals = [
    {
        id: 'G_001',
        title: '出生一件事高效办成',
        type: '改革事项',
        priority: 'High',
        status: 'modeling', // planning, modeling, implemented
        progress: 65,
        owner: '卫健委 / 数局',
        lastUpdate: '2024-05-20',
        description: '整合出生医学证明、户口登记、医保参保等多个事项，实现“一表申请、一网通办”。',
        relatedObjects: ['新生儿', '出生医学证明', '户籍信息']
    },
    {
        id: 'G_002',
        title: '企业开办全流程优化',
        type: '改革事项',
        priority: 'Medium',
        status: 'planning',
        progress: 15,
        owner: '市场监管局',
        lastUpdate: '2024-05-18',
        description: '压缩企业开办时间至0.5个工作日，涉及工商、税务、社保等数据打通。',
        relatedObjects: []
    },
    {
        id: 'G_003',
        title: '公共数据归集管理办法',
        type: '政策文件',
        priority: 'Low',
        status: 'implemented',
        progress: 100,
        owner: '大数据中心',
        lastUpdate: '2024-01-10',
        description: '规范全市公共数据归集、共享、开放及安全管理活动。',
        relatedObjects: ['数据目录', '归集任务']
    }
];

// TD: 业务对象 (恢复丢失的数据)
const mockBusinessObjects = [
    {
        id: 'BO_NEWBORN',
        name: '新生儿 (Newborn)',
        code: 'biz_newborn',
        domain: '出生一件事',
        owner: '卫健委业务处',
        status: 'published',
        description: '自然人出生登记的核心业务对象',
        fields: [
            { name: '姓名', type: 'String', required: true },
            { name: '身份证号', type: 'String', required: true },
            { name: '出生时间', type: 'DateTime', required: true },
            { name: '血型', type: 'Enum', required: false }, // 冲突点
            { name: '出生体重', type: 'Decimal', required: false },
        ]
    },
    {
        id: 'BO_CERT',
        name: '出生医学证明',
        code: 'biz_birth_cert',
        domain: '出生一件事',
        owner: '医院管理处',
        status: 'draft',
        fields: []
    }
];

// BU: 物理表
const mockPhysicalTables = [
    {
        id: 'TBL_POP_BASE',
        name: 't_pop_base_info_2024',
        source: 'HOSP_DB_01 (MySQL)',
        scannedAt: '2024-05-20 10:00:00',
        rows: '1,204,500',
        fields: [
            { name: 'id', type: 'bigint', key: 'PK' },
            { name: 'p_name', type: 'varchar(50)' },
            { name: 'id_card_num', type: 'varchar(18)' },
            { name: 'birth_ts', type: 'datetime' },
            { name: 'weight_kg', type: 'decimal(4,2)' },
            { name: 'hospital_id', type: 'int' },
            { name: 'is_deleted', type: 'tinyint' }
        ]
    }
];

// SG: 映射关系 (Enhanced with BO-to-Table structure)
const mockMappings = [
    { boField: '姓名', tblField: 'p_name', rule: 'Direct Copy' },
    { boField: '身份证号', tblField: 'id_card_num', rule: 'Direct Copy' },
    { boField: '出生时间', tblField: 'birth_ts', rule: 'Format: YYYY-MM-DD HH:mm:ss' },
    { boField: '出生体重', tblField: 'weight_kg', rule: 'Direct Copy' },
];

// BU: 数据源（包含关联表）
const mockDataSources = [
    {
        id: 'DS_001',
        name: '卫健委_前置库_01',
        type: 'MySQL',
        host: '192.168.10.55',
        port: 3306,
        dbName: 'hosp_pre_db',
        status: 'connected',
        lastScan: '2024-05-20 14:00',
        tableCount: 142,
        desc: '医院端数据同步前置库',
        tables: [
            {
                id: 'TBL_001', name: 't_pop_base_info', comment: '人口基础信息表', rows: '1.2M', updateTime: '2024-05-20 10:00', columns: [
                    { name: 'id', type: 'bigint', comment: '主键' },
                    { name: 'name', type: 'varchar(50)', comment: '姓名' },
                    { name: 'id_card', type: 'varchar(18)', comment: '身份证号' },
                    { name: 'dob', type: 'datetime', comment: '出生日期' }
                ]
            },
            {
                id: 'TBL_002', name: 't_med_birth_cert', comment: '出生证明记录', rows: '450K', updateTime: '2024-05-19 15:30', columns: [
                    { name: 'cert_id', type: 'varchar(32)', comment: '证明编号' },
                    { name: 'baby_name', type: 'varchar(50)', comment: '新生儿姓名' },
                    { name: 'issue_date', type: 'datetime', comment: '签发日期' }
                ]
            },
            {
                id: 'TBL_003', name: 't_hosp_dict', comment: '医院字典表', rows: '200', updateTime: '2024-01-01 00:00', columns: [
                    { name: 'hosp_code', type: 'varchar(20)', comment: '医院编码' },
                    { name: 'hosp_name', type: 'varchar(100)', comment: '医院名称' }
                ]
            },
            {
                id: 'TBL_004', name: 't_vac_record', comment: '疫苗接种记录', rows: '3.5M', updateTime: '2024-05-20 09:45', columns: [
                    { name: 'record_id', type: 'bigint', comment: '记录ID' },
                    { name: 'vac_code', type: 'varchar(20)', comment: '疫苗编码' },
                    { name: 'inject_time', type: 'datetime', comment: '接种时间' }
                ]
            }
        ]
    },
    {
        id: 'DS_002',
        name: '市人口库_主库',
        type: 'Oracle',
        host: '10.2.5.101',
        port: 1521,
        dbName: 'orcl_pop_master',
        status: 'scanning',
        lastScan: 'Scanning...',
        tableCount: 89,
        desc: '全市全员人口基础信息库',
        tables: [
            {
                id: 'TBL_ORC_001', name: 'V_CITIZEN_INFO', comment: '公民基本信息视图', rows: '8.2M', updateTime: '2024-05-21 08:00', columns: [
                    { name: 'CITIZEN_ID', type: 'VARCHAR2(18)', comment: '身份证号' },
                    { name: 'FULL_NAME', type: 'VARCHAR2(50)', comment: '姓名' },
                    { name: 'GENDER', type: 'CHAR(1)', comment: '性别' }
                ]
            },
            {
                id: 'TBL_ORC_002', name: 'T_FAMILY_REL', comment: '家庭关系表', rows: '12.5M', updateTime: '2024-05-20 22:00', columns: [
                    { name: 'REL_ID', type: 'NUMBER(20)', comment: '关系ID' },
                    { name: 'MEMBER_ID', type: 'VARCHAR2(18)', comment: '成员身份证' },
                    { name: 'REL_TYPE', type: 'VARCHAR2(10)', comment: '关系类型' }
                ]
            }
        ]
    },
    {
        id: 'DS_003',
        name: '电子证照_归集库',
        type: 'PostgreSQL',
        host: '192.168.100.20',
        port: 5432,
        dbName: 'cert_archive',
        status: 'error',
        lastScan: '2024-05-18 09:30',
        tableCount: 0,
        desc: '连接超时，请检查防火墙设置',
        tables: []
    },
    {
        id: 'DS_004',
        name: '政务云_数据湖',
        type: 'MySQL',
        host: '10.100.5.88',
        port: 3306,
        dbName: 'gov_lake',
        status: 'connected',
        lastScan: '2024-05-21 06:00',
        tableCount: 256,
        desc: '全市政务数据汇聚湖',
        tables: [
            {
                id: 'TBL_LAKE_001', name: 'ods_enterprise', comment: '企业原始数据', rows: '520K', updateTime: '2024-05-21 02:00', columns: [
                    { name: 'ent_id', type: 'varchar(50)', comment: '企业ID' },
                    { name: 'ent_name', type: 'varchar(200)', comment: '企业名称' },
                    { name: 'reg_capital', type: 'decimal(18,2)', comment: '注册资本' }
                ]
            },
            {
                id: 'TBL_LAKE_002', name: 'ods_license', comment: '许可证原始数据', rows: '180K', updateTime: '2024-05-20 18:00', columns: [
                    { name: 'license_no', type: 'varchar(50)', comment: '许可证号' },
                    { name: 'license_type', type: 'varchar(20)', comment: '许可类型' },
                    { name: 'valid_until', type: 'date', comment: '有效期至' }
                ]
            }
        ]
    }
];

// SG-01: BO-to-Table Mapping Configuration
const mockBOTableMappings: Record<string, { tableId: string; tableName: string; source: string; mappings: { boField: string; tblField: string; rule: string }[]; fields: { name: string; type: string; key?: string }[] }> = {
    'BO_NEWBORN': {
        tableId: 'TBL_POP_BASE',
        tableName: 't_pop_base_info_2024',
        source: 'HOSP_DB_01 (MySQL)',
        mappings: [
            { boField: '姓名', tblField: 'p_name', rule: 'Direct Copy' },
            { boField: '身份证号', tblField: 'id_card_num', rule: 'Direct Copy' },
            { boField: '出生时间', tblField: 'birth_ts', rule: 'Format: YYYY-MM-DD HH:mm:ss' },
            { boField: '出生体重', tblField: 'weight_kg', rule: 'Direct Copy' },
        ],
        fields: [
            { name: 'id', type: 'bigint', key: 'PK' },
            { name: 'p_name', type: 'varchar(50)' },
            { name: 'id_card_num', type: 'varchar(18)' },
            { name: 'birth_ts', type: 'datetime' },
            { name: 'weight_kg', type: 'decimal(4,2)' },
            { name: 'hospital_id', type: 'int' },
            { name: 'is_deleted', type: 'tinyint' }
        ]
    },
    'BO_CERT': {
        tableId: 'TBL_BIRTH_CERT',
        tableName: 't_birth_cert_records',
        source: 'HOSP_DB_01 (MySQL)',
        mappings: [],
        fields: [
            { name: 'cert_id', type: 'bigint', key: 'PK' },
            { name: 'cert_no', type: 'varchar(32)' },
            { name: 'issue_date', type: 'date' },
            { name: 'hospital_code', type: 'varchar(20)' },
            { name: 'mother_id', type: 'varchar(18)' }
        ]
    }
};

// SG-02: 冲突检测 Mock Data
const mockConflicts = [
    {
        id: 'CF_001',
        type: 'type_mismatch',
        severity: 'critical',
        status: 'open',
        boName: '新生儿 (Newborn)',
        boField: '出生体重',
        boFieldType: 'Decimal',
        tableName: 't_pop_base_info_2024',
        tableColumn: 'weight_kg',
        tableColumnType: 'varchar(10)',
        description: 'BO字段类型为Decimal，但物理列类型为varchar(10)，可能导致数据精度丢失或转换错误。',
        suggestion: '建议将物理列类型修改为decimal(4,2)或在映射规则中添加类型转换。',
        createdAt: '2024-05-20 10:30:00'
    },
    {
        id: 'CF_002',
        type: 'semantic_duplicate',
        severity: 'warning',
        status: 'open',
        boName: '新生儿 (Newborn)',
        boField: '血型',
        boFieldType: 'Enum',
        tableName: 't_pop_base_info_2024',
        tableColumn: 'blood_type',
        tableColumnType: 'varchar(5)',
        relatedBO: '出生医学证明',
        relatedField: '新生儿血型',
        description: '发现语义重复：同一物理列被多个业务对象字段引用，可能导致数据一致性问题。',
        suggestion: '建议统一血型字段的归属，或建立主从关系明确数据来源。',
        createdAt: '2024-05-19 14:20:00'
    },
    {
        id: 'CF_003',
        type: 'orphan_mapping',
        severity: 'info',
        status: 'open',
        boName: '出生医学证明',
        boField: '签发医院代码',
        boFieldType: 'String',
        tableName: 't_birth_cert_records',
        tableColumn: 'hospital_code',
        tableColumnType: 'varchar(20)',
        description: '该字段已从业务对象中删除，但物理表映射仍然存在。',
        suggestion: '如不再需要此映射，建议清理孤儿映射以保持元数据整洁。',
        createdAt: '2024-05-18 09:15:00'
    },
    {
        id: 'CF_004',
        type: 'naming_conflict',
        severity: 'warning',
        status: 'resolved',
        boName: '新生儿 (Newborn)',
        boField: '姓名',
        boFieldType: 'String',
        tableName: 't_pop_base_info_2024',
        tableColumn: 'p_name',
        tableColumnType: 'varchar(50)',
        description: '字段命名不符合企业命名规范：物理列使用缩写p_name，建议使用完整名称。',
        suggestion: '可考虑在映射规则中添加别名或在下次DDL变更时修正列名。',
        resolvedAt: '2024-05-21 11:00:00',
        resolvedBy: 'John Doe',
        createdAt: '2024-05-17 16:45:00'
    },
    {
        id: 'CF_005',
        type: 'type_mismatch',
        severity: 'critical',
        status: 'open',
        boName: '订单 (Order)',
        boField: '订单金额',
        boFieldType: 'Decimal(18,2)',
        tableName: 't_order_main',
        tableColumn: 'total_amt',
        tableColumnType: 'float',
        description: '金额字段使用float类型可能导致精度问题，建议使用decimal类型。',
        suggestion: '强烈建议将物理列类型从float修改为decimal(18,2)以确保金额精度。',
        createdAt: '2024-05-22 08:30:00'
    }
];

// SG-04: 统一元数据目录 Mock Data
const mockCatalogItems = [
    {
        id: 'CAT_BO_001',
        type: 'business_object',
        name: '新生儿 (Newborn)',
        code: 'biz_newborn',
        domain: '出生一件事',
        owner: '卫健委业务处',
        status: 'published',
        description: '自然人出生登记的核心业务对象',
        tags: ['核心对象', '出生一件事', 'L1'],
        fieldCount: 5,
        mappingCount: 4,
        lastUpdated: '2024-05-20',
        createdAt: '2024-01-15'
    },
    {
        id: 'CAT_BO_002',
        type: 'business_object',
        name: '出生医学证明',
        code: 'biz_birth_cert',
        domain: '出生一件事',
        owner: '医院管理处',
        status: 'draft',
        description: '出生医学证明相关业务对象',
        tags: ['证照', '出生一件事'],
        fieldCount: 0,
        mappingCount: 0,
        lastUpdated: '2024-05-18',
        createdAt: '2024-02-10'
    },
    {
        id: 'CAT_BO_003',
        type: 'business_object',
        name: '订单 (Order)',
        code: 'biz_order',
        domain: '电商业务',
        owner: '电商业务部',
        status: 'published',
        description: '电商订单核心业务对象',
        tags: ['核心对象', '电商', 'L1'],
        fieldCount: 8,
        mappingCount: 6,
        lastUpdated: '2024-05-22',
        createdAt: '2024-03-01'
    },
    {
        id: 'CAT_TBL_001',
        type: 'physical_table',
        name: 't_pop_base_info_2024',
        code: 't_pop_base_info_2024',
        source: 'HOSP_DB_01 (MySQL)',
        owner: '数据中心',
        status: 'active',
        description: '人口基础信息表（2024年度）',
        tags: ['人口库', '基础表'],
        fieldCount: 7,
        mappingCount: 4,
        lastUpdated: '2024-05-20',
        createdAt: '2024-01-01'
    },
    {
        id: 'CAT_TBL_002',
        type: 'physical_table',
        name: 't_order_main',
        code: 't_order_main',
        source: 'ECOM_DB (PostgreSQL)',
        owner: '电商DBA',
        status: 'active',
        description: '订单主表，存储订单核心信息',
        tags: ['订单库', '核心表', '高频访问'],
        fieldCount: 12,
        mappingCount: 6,
        lastUpdated: '2024-05-22',
        createdAt: '2023-06-15'
    },
    {
        id: 'CAT_TBL_003',
        type: 'physical_table',
        name: 't_user_info',
        code: 't_user_info',
        source: 'USER_DB (MySQL)',
        owner: '用户中心',
        status: 'active',
        description: '用户基础信息表',
        tags: ['用户库', '基础表', '敏感数据'],
        fieldCount: 15,
        mappingCount: 3,
        lastUpdated: '2024-05-19',
        createdAt: '2022-01-10'
    },
    {
        id: 'CAT_MAP_001',
        type: 'mapping',
        name: '新生儿 → t_pop_base_info',
        code: 'map_newborn_pop',
        source: 'biz_newborn',
        target: 't_pop_base_info_2024',
        owner: '语义治理组',
        status: 'active',
        description: '新生儿业务对象与人口表的映射关系',
        tags: ['核心映射', '已验证'],
        fieldCount: 4,
        lastUpdated: '2024-05-20',
        createdAt: '2024-02-20'
    },
    {
        id: 'CAT_MAP_002',
        type: 'mapping',
        name: '订单 → t_order_main',
        code: 'map_order_main',
        source: 'biz_order',
        target: 't_order_main',
        owner: '语义治理组',
        status: 'active',
        description: '订单业务对象与订单主表的映射关系',
        tags: ['核心映射', '已验证', '高性能'],
        fieldCount: 6,
        lastUpdated: '2024-05-22',
        createdAt: '2024-03-15'
    }
];

// ==========================================
// 组件定义
// ==========================================

export default function SemanticLayerApp() {
    const [activeModule, setActiveModule] = useState('dashboard');
    // 确保 mockBusinessObjects 存在且不为空，避免 undefined 错误
    const [selectedBO, setSelectedBO] = useState(mockBusinessObjects && mockBusinessObjects.length > 0 ? mockBusinessObjects[0] : null);
    const [showRuleEditor, setShowRuleEditor] = useState(null);

    // Lifted State: Business Objects
    const [businessObjects, setBusinessObjects] = useState(mockBusinessObjects);

    // Lifted State: Scan Results (Shared between BU-02 and BU-04)
    const [scanResults, setScanResults] = useState<any[]>([]);

    const handleAddBusinessObject = (newBO: any) => {
        setBusinessObjects([...businessObjects, newBO]);
    };

    // 渲染主内容区域
    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardView setActiveModule={setActiveModule} />;
            case 'td_goals': return <BusinessGoalsView />; // 新增路由
            case 'mapping': return <MappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} businessObjects={businessObjects} />;
            case 'td_modeling': return <BusinessModelingView businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} />;
            case 'td_scenario': return <ScenarioOrchestrationView />;
            case 'bu_discovery': return <TechDiscoveryView onAddBusinessObject={handleAddBusinessObject} scanResults={scanResults} setScanResults={setScanResults} />;
            case 'bu_semantic': return <DataSemanticUnderstandingView scanResults={scanResults} setScanResults={setScanResults} />;
            case 'bu_candidates': return <CandidateGenerationView scanResults={scanResults} setScanResults={setScanResults} onAddBusinessObject={handleAddBusinessObject} />;
            case 'governance': return <ConflictDetectionView />;
            case 'smart_data': return <SmartDataHubView />;
            case 'ee_api': return <ApiGatewayView businessObjects={businessObjects} />;
            case 'ee_cache': return <CacheStrategyView />;
            default: return <DashboardView setActiveModule={setActiveModule} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* 侧边栏 */}
            <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

            {/* 主界面 */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header activeModule={activeModule} />
                <main className="flex-1 overflow-auto p-6 relative">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 侧边栏组件
// ------------------------------------------------------------------
const Sidebar = ({ activeModule, setActiveModule }: { activeModule: string, setActiveModule: (module: string) => void }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menus = [
        { title: '概览', items: [{ id: 'dashboard', label: '控制台 Dashboard', icon: Activity }] },
        {
            title: '业务建模',
            color: 'text-blue-400',
            items: [
                { id: 'td_goals', label: '业务梳理 (TD-01)', icon: FileText },
                { id: 'td_modeling', label: '业务对象建模 (TD-03)', icon: Layout },
                { id: 'td_scenario', label: '场景编排 (TD-04)', icon: Layers },
            ]
        },
        {
            title: '数据发现',
            color: 'text-emerald-400',
            items: [
                { id: 'bu_connect', label: '数据源管理 (BU-01)', icon: Database },
                { id: 'bu_discovery', label: '资产扫描 (BU-02)', icon: Search },
                { id: 'bu_semantic', label: '逻辑视图 (BU-03)', icon: FileText },
                { id: 'bu_candidates', label: '候选生成 (BU-04)', icon: Cpu },
            ]
        },
        {
            title: 'SG 语义治理中心',
            color: 'text-purple-400',
            items: [
                { id: 'mapping', label: '映射工作台 (SG-01)', icon: GitMerge },
                { id: 'governance', label: '冲突检测 (SG-02)', icon: Shield },
                { id: 'smart_data', label: '智能数据中心 (SG-04)', icon: Cpu },
            ]
        },
        {
            title: 'EE 服务执行',
            color: 'text-orange-400',
            items: [
                { id: 'ee_api', label: 'API 网关 (EE-05)', icon: Server },
                { id: 'ee_cache', label: '缓存策略 (EE-06)', icon: RefreshCw },
            ]
        },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20 transition-all duration-300`}>
            {/* Logo Header */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <Link className="text-white" size={18} />
                </div>
                {!isCollapsed && (
                    <div className="ml-3 overflow-hidden">
                        <h1 className="font-bold text-white tracking-tight whitespace-nowrap">SemanticLink</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider whitespace-nowrap">Enterprise Edition</p>
                    </div>
                )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {menus.map((group, idx) => (
                    <div key={idx} className={`mb-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                        {!isCollapsed && (
                            <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${group.color || 'text-slate-500'}`}>
                                {group.title}
                            </h3>
                        )}
                        {isCollapsed && idx > 0 && (
                            <div className="border-t border-slate-700 my-2" />
                        )}
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveModule(item.id)}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} ${isCollapsed ? 'px-2' : 'px-3'} py-2 rounded-md text-sm transition-all duration-200 ${activeModule === item.id
                                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={16} strokeWidth={1.5} />
                                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                                    {!isCollapsed && activeModule === item.id && <ChevronRight size={14} className="ml-auto opacity-50 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="mx-2 mb-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                title={isCollapsed ? '展开菜单' : '收起菜单'}
            >
                <ChevronRight size={16} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
            </button>

            {/* User Profile */}
            <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white" title="John Doe">
                        JD
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white shrink-0">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-white truncate">John Doe</div>
                            <div className="text-xs text-slate-500 truncate">Chief Data Architect</div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

// ------------------------------------------------------------------
// Header 组件
// ------------------------------------------------------------------
const Header = ({ activeModule }: { activeModule: string }) => (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center text-sm breadcrumbs text-slate-500">
            <span>Platform</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-slate-800 capitalize">{activeModule.replace('td_goals', '业务梳理').replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 relative">
                <AlertCircle size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors">
                发布版本 (v1.0.4)
            </button>
        </div>
    </header>
);

// ------------------------------------------------------------------
// 视图 1: 仪表盘 Dashboard
// ------------------------------------------------------------------
const DashboardView = ({ setActiveModule }: { setActiveModule: (module: string) => void }) => (
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

// ------------------------------------------------------------------
// 视图 2: 映射工作台 (核心功能 SG-01) - Enhanced with DataSourceTree
// ------------------------------------------------------------------
const MappingStudioView = ({ selectedBO, showRuleEditor, setShowRuleEditor, businessObjects }: { selectedBO: any, showRuleEditor: any, setShowRuleEditor: (val: any) => void, businessObjects: any[] }) => {
    const [activeBOId, setActiveBOId] = useState(selectedBO?.id || 'BO_NEWBORN');

    // 数据源树状态
    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | null>(mockDataSources[0]?.id || null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);
    const [searchTerm, setSearchTerm] = useState('');

    // Get active BO from businessObjects
    const activeBO = businessObjects.find(bo => bo.id === activeBOId) || businessObjects[0];

    // Get associated table mapping
    const tableMapping = mockBOTableMappings[activeBOId] || null;

    // Calculate mapping stats
    const totalFields = activeBO?.fields?.length || 0;
    const mappedCount = tableMapping?.mappings?.length || 0;
    const mappingPercentage = totalFields > 0 ? Math.round((mappedCount / totalFields) * 100) : 0;

    // 获取选中的数据源和表
    const selectedDataSource = mockDataSources.find(ds => ds.id === selectedDataSourceId);
    const selectedTable = selectedDataSource?.tables?.find((t: any) => t.id === selectedTableId);

    // 按数据库类型分组
    const groupedSources = mockDataSources.reduce((acc: Record<string, typeof mockDataSources>, ds) => {
        if (!acc[ds.type]) acc[ds.type] = [];
        acc[ds.type].push(ds);
        return acc;
    }, {} as Record<string, typeof mockDataSources>);

    // 数据库类型配置
    const typeConfig: Record<string, { color: string; shortName: string }> = {
        MySQL: { color: 'text-blue-600 bg-blue-50', shortName: 'My' },
        Oracle: { color: 'text-orange-600 bg-orange-50', shortName: 'Or' },
        PostgreSQL: { color: 'text-emerald-600 bg-emerald-50', shortName: 'Pg' }
    };

    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSelectDataSource = (dsId: string) => {
        setSelectedDataSourceId(dsId);
        const ds = mockDataSources.find(d => d.id === dsId);
        if (ds?.tables?.length > 0) {
            setSelectedTableId(ds.tables[0].id);
        } else {
            setSelectedTableId(null);
        }
    };

    // 过滤数据源
    const filteredGroupedSources = Object.entries(groupedSources).reduce((acc: Record<string, typeof mockDataSources>, [type, sources]) => {
        const filtered = sources.filter(ds =>
            ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ds.dbName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[type] = filtered;
        return acc;
    }, {} as Record<string, typeof mockDataSources>);

    return (
        <div className="h-full flex animate-fade-in gap-3">
            {/* 左侧: 数据源树 */}
            <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Database size={16} className="text-blue-500" />
                        数据源
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择数据源查看表列表</p>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索数据源..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>
                </div>

                {/* Tree Content */}
                <div className="flex-1 overflow-y-auto p-2">
                    {Object.entries(filteredGroupedSources).map(([type, sources]) => (
                        <div key={type} className="mb-2">
                            {/* Type Header */}
                            <button
                                onClick={() => toggleType(type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight
                                    size={14}
                                    className={`text-slate-400 transition-transform ${expandedTypes.includes(type) ? 'rotate-90' : ''}`}
                                />
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.color || 'bg-slate-100'}`}>
                                    {type}
                                </span>
                                <span className="text-xs text-slate-400 ml-auto">{sources.length}</span>
                            </button>

                            {/* Data Sources */}
                            {expandedTypes.includes(type) && (
                                <div className="ml-4 space-y-1 mt-1">
                                    {sources.map(ds => (
                                        <div key={ds.id}>
                                            <button
                                                onClick={() => handleSelectDataSource(ds.id)}
                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left transition-all ${selectedDataSourceId === ds.id
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'hover:bg-slate-50 border border-transparent'
                                                    }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${ds.status === 'connected' ? 'bg-emerald-500' :
                                                    ds.status === 'scanning' ? 'bg-orange-500 animate-pulse' : 'bg-red-500'
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-medium truncate ${selectedDataSourceId === ds.id ? 'text-blue-800' : 'text-slate-700'}`}>
                                                        {ds.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate">{ds.dbName}</div>
                                                </div>
                                                <span className="text-[10px] text-slate-400">{ds.tables?.length || 0}</span>
                                            </button>

                                            {/* Tables under selected data source */}
                                            {selectedDataSourceId === ds.id && ds.tables && ds.tables.length > 0 && (
                                                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-blue-100 pl-2">
                                                    {ds.tables.map((table: any) => (
                                                        <button
                                                            key={table.id}
                                                            onClick={() => setSelectedTableId(table.id)}
                                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${selectedTableId === table.id
                                                                ? 'bg-purple-50 text-purple-700 font-medium'
                                                                : 'text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <Database size={10} className={selectedTableId === table.id ? 'text-purple-500' : 'text-slate-400'} />
                                                            <span className="truncate font-mono">{table.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Selected Info */}
                {selectedDataSource && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">当前选中</div>
                        <div className="text-xs font-medium text-slate-700 truncate">{selectedDataSource.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeConfig[selectedDataSource.type]?.color}`}>
                                {selectedDataSource.type}
                            </span>
                            <span className="text-[10px] text-slate-400">{selectedDataSource.tables?.length || 0} 张表</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 中间: BO选择器 */}
            <div className="w-56 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700">业务对象</h3>
                    <p className="text-[10px] text-slate-400 mt-1">选择要映射的对象</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {businessObjects.map(bo => {
                        const boMapping = mockBOTableMappings[bo.id];
                        const boMappedCount = boMapping?.mappings?.length || 0;
                        const boTotalFields = bo.fields?.length || 0;
                        const hasMapping = boMappedCount > 0;

                        return (
                            <div
                                key={bo.id}
                                onClick={() => setActiveBOId(bo.id)}
                                className={`p-2 rounded-lg mb-2 cursor-pointer transition-all ${activeBOId === bo.id
                                    ? 'bg-purple-50 border-2 border-purple-500 shadow-sm'
                                    : 'bg-slate-50 border border-slate-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded flex items-center justify-center ${hasMapping ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Layout size={12} />
                                        </div>
                                        <div className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{bo.name}</div>
                                    </div>
                                    {hasMapping && <CheckCircle size={12} className="text-emerald-600" />}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${hasMapping ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${boTotalFields > 0 ? (boMappedCount / boTotalFields) * 100 : 0}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{boMappedCount}/{boTotalFields}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* 顶部工具栏 */}
                <div className="bg-white border border-slate-200 rounded-t-xl p-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <GitMerge className="text-purple-600" size={20} />
                            语义映射工作台
                        </h2>
                        <p className="text-xs text-slate-500">
                            {activeBO?.name} → {selectedTable?.name || tableMapping?.tableName || '选择物理表'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                            <span className="text-xs text-slate-500">映射进度</span>
                            <span className={`text-sm font-bold ${mappingPercentage === 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {mappingPercentage}%
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            <Cpu size={14} /> AI 自动映射
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm transition-colors">
                            <CheckCircle size={14} /> 保存
                        </button>
                    </div>
                </div>

                {/* 映射画布 */}
                <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex gap-4 rounded-b-xl border-x border-b border-slate-200">
                    {/* 左侧: 业务对象字段 */}
                    <div className="w-[250px] bg-white rounded-xl border border-blue-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <div className="flex items-center gap-2">
                                <Layout size={16} />
                                <span className="font-bold text-sm">{activeBO?.name}</span>
                            </div>
                            <div className="text-xs text-blue-100 font-mono mt-1">{activeBO?.code}</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {activeBO?.fields?.map((field: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.boField === field.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-slate-700">{field.name}</span>
                                                {field.required && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                                        </div>
                                        {mapping ? <CheckCircle size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-red-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 中间: 映射关系 */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {tableMapping && tableMapping.mappings.length > 0 ? (
                            <div className="w-full space-y-2 max-h-full overflow-y-auto">
                                {tableMapping.mappings.map((m, idx) => (
                                    <div key={idx} className="flex items-center bg-white rounded-lg border border-slate-200 p-2 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex-1 text-right">
                                            <span className="text-xs font-medium text-blue-700">{m.boField}</span>
                                        </div>
                                        <div className="mx-3 flex items-center gap-1">
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-slate-300" />
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-300">
                                                <Link size={10} />
                                            </div>
                                            <div className="w-6 h-0.5 bg-gradient-to-r from-slate-300 to-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-xs font-mono text-emerald-700">{m.tblField}</span>
                                        </div>
                                        <button onClick={() => setShowRuleEditor(m)} className="ml-2 p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                            <Settings size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <GitMerge size={32} />
                                </div>
                                <p className="text-slate-500 font-medium text-sm">暂无映射关系</p>
                                <button className="mt-3 px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 mx-auto text-xs">
                                    <Plus size={14} /> 添加映射
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 右侧: 物理表字段 - 显示选中的表 */}
                    <div className="w-[250px] bg-white rounded-xl border border-emerald-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            <div className="flex items-center gap-2">
                                <Database size={16} />
                                <span className="font-bold text-sm truncate">{selectedTable?.name || '选择物理表'}</span>
                            </div>
                            {selectedTable && (
                                <div className="text-xs text-emerald-100 mt-1">{selectedTable.comment} · {selectedTable.rows} 行</div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {selectedTable?.columns?.map((col: any, idx: number) => {
                                const mapping = tableMapping?.mappings?.find(m => m.tblField === col.name);
                                return (
                                    <div key={idx} className={`flex items-center justify-between p-2 mb-1 rounded-lg border transition-all text-xs ${mapping ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-slate-700">{col.name}</div>
                                            <div className="text-[10px] text-slate-400">{col.comment} · {col.type}</div>
                                        </div>
                                        {mapping && <CheckCircle size={12} className="text-emerald-600" />}
                                    </div>
                                );
                            }) || (
                                    <div className="p-4 text-center text-slate-400 text-xs">
                                        <Database size={28} className="mx-auto mb-2 opacity-30" />
                                        请在左侧选择物理表
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 业务梳理 (TD-01) - 完整CRUD功能
// ------------------------------------------------------------------
const BusinessGoalsView = () => {
    const [goals, setGoals] = useState(mockBusinessGoals);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingGoal, setEditingGoal] = useState<any>(null);
    const [viewingGoal, setViewingGoal] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [openDropdown, setOpenDropdown] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        type: '改革事项',
        priority: 'Medium',
        owner: '',
        description: ''
    });

    // 重置表单
    const resetForm = () => {
        setFormData({ title: '', type: '改革事项', priority: 'Medium', owner: '', description: '' });
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingGoal(null);
    };

    // 创建新事项
    const handleCreate = () => {
        if (!formData.title) return;
        const goalData = {
            id: `G_${Date.now()}`,
            ...formData,
            status: 'planning',
            progress: 0,
            lastUpdate: new Date().toISOString().split('T')[0],
            relatedObjects: []
        };
        setGoals([goalData, ...goals]);
        resetForm();
    };

    // 打开编辑
    const handleEdit = (goal: any) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            type: goal.type,
            priority: goal.priority,
            owner: goal.owner,
            description: goal.description
        });
        setIsEditMode(true);
        setIsModalOpen(true);
        setOpenDropdown(null);
    };

    // 保存编辑
    const handleSaveEdit = () => {
        if (!formData.title) return;
        setGoals(goals.map(g =>
            g.id === editingGoal.id
                ? { ...g, ...formData, lastUpdate: new Date().toISOString().split('T')[0] }
                : g
        ));
        resetForm();
    };

    // 删除事项
    const handleDelete = (id: string) => {
        setGoals(goals.filter(g => g.id !== id));
        setDeleteConfirm(null);
        setOpenDropdown(null);
    };

    // 过滤逻辑
    const filteredGoals = goals.filter(goal => {
        const matchSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || goal.status === filterStatus;
        const matchPriority = filterPriority === 'all' || goal.priority === filterPriority;
        return matchSearch && matchStatus && matchPriority;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* 顶部 Header 区 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">业务梳理</h2>
                    <p className="text-slate-500 mt-1">定义企业核心改革事项与政策文件，驱动自顶向下的数据建模。</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        <Upload size={16} /> 导入政策文件
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={16} /> 新建梳理事项
                    </button>
                </div>
            </div>

            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">活跃事项 (Active Items)</p>
                            <h3 className="text-3xl font-bold">{goals.length}</h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-100">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-white mr-2">本周新增</span>
                        <span>持续更新中</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">建模覆盖率</p>
                            <h3 className="text-3xl font-bold text-slate-800">65%</h3>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <FileCheck size={20} className="text-emerald-600" />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">已完成 8 个目标的 L1 对象定义</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-1">待解决阻点</p>
                            <h3 className="text-3xl font-bold text-slate-800">3</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle size={20} className="text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-100">数据缺失</span>
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded border border-orange-100">口径冲突</span>
                    </div>
                </div>
            </div>

            {/* 目标列表 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-800">梳理清单</h3>
                        <span className="text-sm text-slate-500">{filteredGoals.length} / {goals.length} 项</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索标题、描述或负责人..."
                                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-full"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">全部状态</option>
                            <option value="planning">规划中</option>
                            <option value="modeling">建模中</option>
                            <option value="implemented">已实施</option>
                        </select>
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">全部优先级</option>
                            <option value="High">高优先级</option>
                            <option value="Medium">中优先级</option>
                            <option value="Low">低优先级</option>
                        </select>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredGoals.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-slate-400 mb-2">
                                <Search size={48} className="mx-auto opacity-50" />
                            </div>
                            <p className="text-slate-500 font-medium">未找到匹配的事项</p>
                            <p className="text-slate-400 text-sm mt-1">尝试调整搜索条件或筛选器</p>
                        </div>
                    ) : (
                        filteredGoals.map((goal) => (
                            <div key={goal.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${goal.priority === 'High' ? 'bg-red-500' :
                                            goal.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`}></span>
                                        <h4
                                            onClick={() => setViewingGoal(goal)}
                                            className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            {goal.title}
                                        </h4>
                                        <span className="px-2 py-0.5 rounded text-xs border border-slate-200 text-slate-500 bg-white">
                                            {goal.type}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenDropdown(openDropdown === goal.id ? null : goal.id)}
                                            className="text-slate-300 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>
                                        {openDropdown === goal.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px] animate-fade-in">
                                                <button
                                                    onClick={() => setViewingGoal(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Search size={14} /> 查看详情
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                >
                                                    <Settings size={14} /> 编辑
                                                </button>
                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button
                                                    onClick={() => setDeleteConfirm(goal)}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <X size={14} /> 删除
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm mb-4 max-w-3xl leading-relaxed">
                                    {goal.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        {/* Status Badge */}
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${goal.status === 'implemented' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            goal.status === 'modeling' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                            {goal.status === 'implemented' && <CheckCircle size={12} />}
                                            {goal.status === 'modeling' && <RefreshCw size={12} className="animate-spin-slow" />}
                                            {goal.status === 'planning' && <Activity size={12} />}
                                            <span className="capitalize">{goal.status}</span>
                                        </div>

                                        {/* Owner */}
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="text-slate-400">Owner:</span>
                                            <span>{goal.owner || '待定'}</span>
                                        </div>

                                        {/* Related Objects */}
                                        {goal.relatedObjects.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <Link size={14} className="text-slate-400" />
                                                <div className="flex gap-1">
                                                    {goal.relatedObjects.map((obj, i) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">
                                                            {obj}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-3 min-w-[150px]">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono font-medium text-slate-600 w-8 text-right">
                                            {goal.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                    <button className="text-sm text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1">
                        查看更多历史记录 <ChevronRight size={14} />
                    </button>
                </div>
            </div>


            {/* 新建/编辑 Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800">
                                    {isEditMode ? '编辑业务梳理事项' : '新建业务梳理事项'}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">事项名称 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="例如：残疾人服务一件事"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="改革事项">改革事项</option>
                                            <option value="政策文件">政策文件</option>
                                            <option value="重点任务">重点任务</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">优先级</label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        >
                                            <option value="High">High (高)</option>
                                            <option value="Medium">Medium (中)</option>
                                            <option value="Low">Low (低)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">牵头部门</label>
                                    <input
                                        type="text"
                                        value={formData.owner}
                                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="例如：民政局"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-24 resize-none"
                                        placeholder="请输入事项的详细背景或目标..."
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={isEditMode ? handleSaveEdit : handleCreate}
                                    disabled={!formData.title}
                                    className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!formData.title ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                >
                                    {isEditMode ? '保存修改' : '创建事项'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 查看详情 Modal */}
            {
                viewingGoal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${viewingGoal.priority === 'High' ? 'bg-red-500' : viewingGoal.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
                                    {viewingGoal.title}
                                </h3>
                                <button
                                    onClick={() => setViewingGoal(null)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</h4>
                                        <p className="text-slate-700 font-medium">{viewingGoal.type}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</h4>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium border ${viewingGoal.status === 'implemented' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : viewingGoal.status === 'modeling' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            <span className="capitalize">{viewingGoal.status}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Owner</h4>
                                        <p className="text-slate-700">{viewingGoal.owner || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Progress</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                                <div className="h-full bg-blue-500" style={{ width: `${viewingGoal.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm text-slate-600">{viewingGoal.progress}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                                    <div className="bg-slate-50 rounded-lg p-4 text-slate-700 leading-relaxed text-sm">
                                        {viewingGoal.description}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setViewingGoal(null)}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 删除确认 Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-zoom-in">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">确认删除?</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    您确定要删除 "{deleteConfirm.title}" 吗? 此操作无法撤销。
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-sm"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// ------------------------------------------------------------------
// 视图 3: 业务建模 (Placeholder)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 视图 3: 业务对象建模 (TD-03)
// ------------------------------------------------------------------
const BusinessModelingView = ({ businessObjects, setBusinessObjects }: { businessObjects: any[], setBusinessObjects: any }) => {
    // const [businessObjects, setBusinessObjects] = useState(mockBusinessObjects); // Removed local state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBO, setEditingBO] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [currentField, setCurrentField] = useState<any>(null);

    // Initial Form State
    const initialBoState = {
        name: '',
        code: '',
        domain: '',
        owner: '',
        status: 'draft',
        description: '',
        fields: [] as any[]
    };

    const [boFormData, setBoFormData] = useState(initialBoState);

    // Initial Field State
    const initialFieldState = {
        name: '',
        type: 'String',
        required: false,
        description: ''
    };
    const [fieldFormData, setFieldFormData] = useState(initialFieldState);

    // Handlers
    const handleCreateBO = () => {
        setEditingBO(null);
        setBoFormData(initialBoState);
        setIsModalOpen(true);
    };

    const handleEditBO = (bo: any) => {
        setEditingBO(bo);
        setBoFormData({ ...bo });
        setIsModalOpen(true);
    };

    const handleDeleteBO = (id: string) => {
        if (confirm('确认删除此业务对象吗？')) {
            setBusinessObjects((prev: any[]) => prev.filter((item: any) => item.id !== id));
        }
    };

    const handleSaveBO = () => {
        if (!boFormData.name || !boFormData.code) return;

        if (editingBO) {
            setBusinessObjects((prev: any[]) => prev.map((item: any) => item.id === editingBO.id ? { ...boFormData, id: item.id } : item));
        } else {
            const newBO = {
                ...boFormData,
                id: `BO_${Date.now()}`,
                status: 'draft'
            };
            setBusinessObjects((prev: any[]) => [newBO, ...prev]);
        }
        setIsModalOpen(false);
    };

    // Field Handlers
    const handleAddField = () => {
        setCurrentField(null);
        setFieldFormData(initialFieldState);
        setShowFieldModal(true);
    };

    const handleEditField = (field: any, index: number) => {
        setCurrentField({ ...field, index });
        setFieldFormData({ ...field });
        setShowFieldModal(true);
    };

    const handleSaveField = () => {
        const newFields = [...boFormData.fields];
        if (currentField) {
            newFields[currentField.index] = fieldFormData;
        } else {
            newFields.push(fieldFormData);
        }
        setBoFormData({ ...boFormData, fields: newFields });
        setShowFieldModal(false);
    };

    const handleDeleteField = (index: number) => {
        const newFields = [...boFormData.fields];
        newFields.splice(index, 1);
        setBoFormData({ ...boFormData, fields: newFields });
    };

    const filteredBOs = businessObjects.filter(bo =>
        bo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bo.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">业务对象建模</h2>
                    <p className="text-slate-500 mt-1">定义核心业务实体、属性及其数据标准</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索对象或编码..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleCreateBO}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        <span>新建对象</span>
                    </button>
                </div>
            </div>

            {/* BO Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBOs.map(bo => (
                    <div key={bo.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group cursor-pointer relative" onClick={() => handleEditBO(bo)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Layout size={20} />
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-semibold uppercase ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {bo.status}
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-1">{bo.name}</h3>
                        <p className="text-xs font-mono text-slate-500 mb-4 bg-slate-50 inline-block px-2 py-0.5 rounded">{bo.code}</p>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-6 h-10">{bo.description || '暂无描述'}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Layers size={14} /> {bo.domain}</span>
                                <span className="flex items-center gap-1"><CheckCircle size={14} /> {bo.fields?.length || 0} 字段</span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteBO(bo.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">
                                    {editingBO ? '编辑业务对象' : '新建业务对象'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">配置对象的元数据及字段结构</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200"><X size={24} /></button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-8">
                            {/* Basic Info */}
                            <div className="flex gap-8 mb-8">
                                <div className="w-1/3 space-y-5">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <FileText size={18} className="text-blue-500" /> 基本信息
                                    </h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">通过名称 <span className="text-red-500">*</span></label>
                                        <input type="text" value={boFormData.name} onChange={e => setBoFormData({ ...boFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：客户" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">标识编码 <span className="text-red-500">*</span></label>
                                        <input type="text" value={boFormData.code} onChange={e => setBoFormData({ ...boFormData, code: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：BO_CUSTOMER" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">所属域</label>
                                        <input type="text" value={boFormData.domain} onChange={e => setBoFormData({ ...boFormData, domain: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">负责人</label>
                                        <input type="text" value={boFormData.owner} onChange={e => setBoFormData({ ...boFormData, owner: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                        <textarea value={boFormData.description} onChange={e => setBoFormData({ ...boFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
                                    </div>
                                </div>

                                {/* Fields List */}
                                <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Database size={18} className="text-emerald-500" /> 数据结构 ({boFormData.fields.length})
                                        </h4>
                                        <button onClick={handleAddField} className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:border-blue-300 hover:text-blue-600 transition-all font-medium shadow-sm">
                                            <Plus size={14} /> 添加字段
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                                <tr>
                                                    <th className="px-4 py-3">字段名称</th>
                                                    <th className="px-4 py-3">类型</th>
                                                    <th className="px-4 py-3 text-center">必填</th>
                                                    <th className="px-4 py-3">描述</th>
                                                    <th className="px-4 py-3 text-right">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {boFormData.fields.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">暂无字段，请点击添加</td>
                                                    </tr>
                                                ) : (
                                                    boFormData.fields.map((field: any, idx) => (
                                                        <tr key={idx} className="hover:bg-blue-50/30 group">
                                                            <td className="px-4 py-3 font-medium text-slate-800">{field.name}</td>
                                                            <td className="px-4 py-3 font-mono text-xs text-blue-600 bg-blue-50/50 rounded inline-block my-2 mx-4 px-2">{field.type}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                {field.required && <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{field.description || '-'}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleEditField(field, idx)} className="text-slate-400 hover:text-blue-600"><Settings size={14} /></button>
                                                                    <button onClick={() => handleDeleteField(idx)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md font-medium transition-colors">取消</button>
                            <button onClick={handleSaveBO} className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium shadow-sm shadow-blue-200 transition-colors">保存配置</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Field Edit Modal (Nested) */}
            {showFieldModal && (
                <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-zoom-in">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">{currentField ? '编辑字段' : '添加字段'}</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">字段名称</label>
                                <input type="text" autoFocus value={fieldFormData.name} onChange={e => setFieldFormData({ ...fieldFormData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="如：mobile_phone" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">数据类型</label>
                                    <select value={fieldFormData.type} onChange={e => setFieldFormData({ ...fieldFormData, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                        <option value="String">String</option>
                                        <option value="Integer">Integer</option>
                                        <option value="Decimal">Decimal</option>
                                        <option value="Boolean">Boolean</option>
                                        <option value="DateTime">DateTime</option>
                                        <option value="Enum">Enum</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={fieldFormData.required} onChange={e => setFieldFormData({ ...fieldFormData, required: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                                        <span className="text-sm text-slate-700 font-medium">必须填写</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">字段描述</label>
                                <textarea value={fieldFormData.description} onChange={e => setFieldFormData({ ...fieldFormData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 h-20 resize-none" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setShowFieldModal(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">取消</button>
                                <button onClick={handleSaveField} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded" disabled={!fieldFormData.name}>确认</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图 4: 技术发现 (Placeholder)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// 视图 5: 技术发现 (BU-02)
// ------------------------------------------------------------------
const TechDiscoveryView = ({ onAddBusinessObject, scanResults, setScanResults }: { onAddBusinessObject: (bo: any) => void, scanResults: any[], setScanResults: any }) => {
    // State
    const [dataSources, setDataSources] = useState<any[]>([
        { id: 'DS_001', name: 'CRM Core DB', type: 'MySQL', host: '192.168.1.10', port: '3306', status: 'connected', lastScan: '2024-05-19' },
        { id: 'DS_002', name: 'Legacy Billing', type: 'Oracle', host: '192.168.1.15', port: '1521', status: 'disconnected', lastScan: '-' }
    ]);

    // Candidate Generation State
    const [candidateModalOpen, setCandidateModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [candidateFormData, setCandidateFormData] = useState<any>({ name: '', code: '', description: '', fields: [] });

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    // const [scanResults, setScanResults] = useState<any[]>([]); // Lifted to App
    const [activeTab, setActiveTab] = useState<'sources' | 'results'>('sources');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newSource, setNewSource] = useState({ name: '', type: 'MySQL', host: '', port: '', user: '', password: '' });

    // Discovery Enhanced State
    const [resultSearch, setResultSearch] = useState('');
    const [resultRiskFilter, setResultRiskFilter] = useState('All');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedDetailAsset, setSelectedDetailAsset] = useState<any>(null);

    // Mock Scan Results
    const mockDiscoveredAssets = [
        {
            table: 't_user_profile',
            comment: 'User basic info',
            rowCount: 15420,
            risk: 'Low',
            confidence: 95,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Customer Profile',
            fields: [
                { name: 'user_id', type: 'bigint', suggestion: 'id', distinct: 15420, nullRate: '0%' },
                { name: 'full_name', type: 'varchar(100)', suggestion: 'name', distinct: 15200, nullRate: '0.1%' },
                { name: 'mobile', type: 'varchar(20)', suggestion: 'phone', distinct: 14800, nullRate: '0%' },
                { name: 'status', type: 'tinyint', suggestion: 'status', distinct: 3, nullRate: '0%' },
                { name: 'created_at', type: 'datetime', suggestion: '-', distinct: 15000, nullRate: '0%' }
            ]
        },
        {
            table: 't_order_main',
            comment: 'Order master table',
            rowCount: 45000,
            risk: 'Medium',
            confidence: 88,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Order',
            fields: [
                { name: 'order_no', type: 'varchar(32)', suggestion: 'code', distinct: 45000, nullRate: '0%' },
                { name: 'total_amt', type: 'decimal(18,2)', suggestion: 'amount', distinct: 4200, nullRate: '0%' },
                { name: 'user_id', type: 'bigint', suggestion: 'customer_id', distinct: 8500, nullRate: '0%' },
                { name: 'order_status', type: 'int', suggestion: 'status', distinct: 5, nullRate: '0%' }
            ]
        },
        {
            table: 't_order_item',
            comment: '',
            rowCount: 120000,
            risk: 'Low',
            confidence: 75,
            status: 'scanned',
            aiSuggestion: 'Business Object candidate: Order Item',
            fields: [
                { name: 'id', type: 'bigint', suggestion: 'id', distinct: 120000, nullRate: '0%' },
                { name: 'order_no', type: 'varchar(32)', suggestion: 'order_code', distinct: 45000, nullRate: '0%' }
            ]
        },
    ];

    // Handlers
    const handleMapToBO = (asset: any) => {
        setSelectedAsset(asset);
        // AI Simulation: Map asset to candidate
        setCandidateFormData({
            name: asset.aiSuggestion.split(': ')[1] || asset.table,
            code: `BO_${asset.table.toUpperCase().replace('T_', '')}`,
            description: `Generated from table ${asset.table}. ${asset.comment}`,
            fields: asset.fields ? asset.fields.map((f: any) => ({
                name: f.suggestion || f.name,
                type: 'String', // Simplified
                required: false,
                description: `Mapped from ${f.name}`
            })) : []
        });
        setCandidateModalOpen(true);
    };

    const handleConfirmCandidate = () => {
        if (!onAddBusinessObject) return;

        const newBO = {
            id: `BO_${Date.now()}`,
            name: candidateFormData.name,
            code: candidateFormData.code,
            domain: 'Generated',
            owner: 'System',
            status: 'draft',
            description: candidateFormData.description,
            fields: candidateFormData.fields
        };

        onAddBusinessObject(newBO);
        setCandidateModalOpen(false);
        // Visual feedback
        setScanResults((prev: any[]) => prev.map((item: any) => item.table === selectedAsset.table ? { ...item, status: 'mapped' } : item));
    };

    const handleViewDetail = (asset: any) => {
        setSelectedDetailAsset(asset);
        setIsDrawerOpen(true);
    };

    // Filter Logic
    const filteredResults = scanResults.filter(item => {
        const matchesSearch = item.table.toLowerCase().includes(resultSearch.toLowerCase()) ||
            (item.comment && item.comment.toLowerCase().includes(resultSearch.toLowerCase()));
        const matchesRisk = resultRiskFilter === 'All' || item.risk === resultRiskFilter;
        return matchesSearch && matchesRisk;
    });

    const handleAddSource = () => {
        if (!newSource.name) return;
        const source = {
            id: `DS_${Date.now()}`,
            name: newSource.name,
            type: newSource.type,
            host: newSource.host || 'localhost',
            port: newSource.port || '3306',
            status: 'connected',
            lastScan: 'Just now'
        };
        setDataSources([...dataSources, source]);
        setIsAddModalOpen(false);
    };

    const startScan = (id: string) => {
        setIsScanning(true);
        setActiveTab('results');
        setScanProgress(0);

        // Simulation
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                setScanResults(mockDiscoveredAssets);
                setDataSources(prev => prev.map((d: any) => d.id === id ? { ...d, lastScan: 'Just now' } : d));
            }
        }, 300);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">数据发现中心</h2>
                    <p className="text-slate-500 mt-1">管理数据源连接，自动化扫描元数据与资产发现</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('sources')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sources' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        数据源管理
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        发现结果
                    </button>
                </div>
            </div>

            {activeTab === 'sources' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    <div
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[200px]"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-blue-500">
                            <Plus size={24} />
                        </div>
                        <span className="font-semibold text-slate-600">添加数据源</span>
                    </div>

                    {dataSources.map((ds: any) => (
                        <div key={ds.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{ds.name}</h3>
                                        <p className="text-xs text-slate-500">{ds.type} • {ds.host}:{ds.port}</p>
                                    </div>
                                </div>
                                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${ds.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${ds.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {ds.status === 'connected' ? 'Connected' : 'Error'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">上次扫描</span>
                                    <span className="text-slate-700 font-mono">{ds.lastScan}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <button className="flex-1 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded hover:bg-slate-50">配置</button>
                                    <button onClick={() => startScan(ds.id)} className="flex-1 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                                        <RefreshCw size={12} /> 扫描
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'results' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
                    {isScanning ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">正在扫描元数据...</h3>
                            <p className="text-slate-500 mb-6">正在分析表结构并生成业务含义建议</p>
                            <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{scanProgress}% completed</p>
                        </div>
                    ) : scanResults.length > 0 ? (
                        <div>
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold text-slate-800">扫描结果</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                placeholder="搜索表名或描述..."
                                                value={resultSearch}
                                                onChange={(e) => setResultSearch(e.target.value)}
                                                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                                            />
                                        </div>
                                        <select
                                            value={resultRiskFilter}
                                            onChange={(e) => setResultRiskFilter(e.target.value)}
                                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-600"
                                        >
                                            <option value="All">所有风险等级</option>
                                            <option value="High">High Risk</option>
                                            <option value="Medium">Medium Risk</option>
                                            <option value="Low">Low Risk</option>
                                        </select>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500">{filteredResults.length} assets found</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Asset Name</th>
                                            <th className="px-6 py-3 text-left">Row Count</th>
                                            <th className="px-6 py-3 text-left">Risk Level</th>
                                            <th className="px-6 py-3 text-left w-48">AI Confidence</th>
                                            <th className="px-6 py-3 text-left">AI Suggestion</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredResults.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={() => handleViewDetail(item)}>
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{item.table}</div>
                                                    <div className="text-xs text-slate-400">{item.comment || 'No comment'}</div>
                                                </td>
                                                <td className="px-6 py-3 font-mono text-slate-600">{item.rowCount ? item.rowCount.toLocaleString() : '-'}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.risk === 'High' ? 'bg-red-100 text-red-700' : item.risk === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.risk}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${item.confidence > 90 ? 'bg-emerald-500' : item.confidence > 70 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${item.confidence || 0}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-mono text-slate-500">{item.confidence}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                                                        <Cpu size={14} />
                                                        <span className="text-xs font-medium truncate max-w-[150px]" title={item.aiSuggestion}>{item.aiSuggestion ? item.aiSuggestion.split(': ')[1] : '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {item.status === 'mapped' ? (
                                                        <span className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-1">
                                                            <CheckCircle size={14} /> Mapped
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMapToBO(item); }}
                                                            className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                                                        >
                                                            Map
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p>暂无扫描结果，请从数据源管理中启动扫描。</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add Source Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-zoom-in p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-6">连接新数据源</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">数据库名称</label>
                                <input type="text" value={newSource.name} onChange={e => setNewSource({ ...newSource, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="e.g. Finance DB" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">类型</label>
                                    <select value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                        <option>MySQL</option>
                                        <option>PostgreSQL</option>
                                        <option>Oracle</option>
                                        <option>SQL Server</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">端口</label>
                                    <input type="text" value={newSource.port} onChange={e => setNewSource({ ...newSource, port: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="3306" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">主机地址</label>
                                <input type="text" value={newSource.host} onChange={e => setNewSource({ ...newSource, host: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" placeholder="localhost" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">用户名</label>
                                    <input type="text" value={newSource.user} onChange={e => setNewSource({ ...newSource, user: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">密码</label>
                                    <input type="password" value={newSource.password} onChange={e => setNewSource({ ...newSource, password: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">取消</button>
                            <button onClick={handleAddSource} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">连接</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图 4: 场景编排 (TD-04)
// ------------------------------------------------------------------
const ScenarioOrchestrationView = () => {
    // Mock Data for Scenarios
    const [scenarios, setScenarios] = useState<any[]>([
        {
            id: 'SC_001',
            name: '出生一件事高效办成',
            description: '整合出生医学证明、户口登记、医保参保等多个事项，实现“一表申请、一网通办”。',
            steps: [
                { id: 1, name: '医院签发出生证', boId: 'BO_CERT', type: 'trigger' },
                { id: 2, name: '推送落户申请', boId: 'BO_NEWBORN', type: 'action' },
                { id: 3, name: '医保自动参保', boId: 'BO_INSURANCE', type: 'action' }
            ],
            status: 'published',
            lastUpdate: '2024-05-20'
        }
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingScenario, setEditingScenario] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStepForm, setShowStepForm] = useState(false);
    const [currentStep, setCurrentStep] = useState<any>(null);

    const initialScenarioState = {
        name: '',
        description: '',
        steps: [] as any[],
        status: 'draft',
        lastUpdate: ''
    };

    const [formData, setFormData] = useState<any>(initialScenarioState);

    // Handlers
    const handleCreate = () => {
        setEditingScenario(null);
        setFormData(initialScenarioState);
        setIsModalOpen(true);
    };

    const handleEdit = (scenario: any) => {
        setEditingScenario(scenario);
        setFormData({ ...scenario });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('确认删除此场景吗？')) {
            setScenarios(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = () => {
        if (!formData.name) return;

        if (editingScenario) {
            setScenarios(prev => prev.map((s: any) => s.id === editingScenario.id ? { ...s, ...formData } : s));
        } else {
            const newScenario = {
                ...formData,
                id: `SC_${Date.now()}`,
                lastUpdate: new Date().toISOString().split('T')[0]
            };
            setScenarios(prev => [newScenario, ...prev]);
        }
        setIsModalOpen(false);
    };

    // Step Handlers
    const handleAddStep = () => {
        setCurrentStep({ name: '', boId: '', type: 'action' });
        setShowStepForm(true);
    };

    const handleSaveStep = () => {
        if (!currentStep.name) return;

        const newSteps = [...formData.steps];
        if (currentStep.id) {
            // Edit existing
            const idx = newSteps.findIndex(s => s.id === currentStep.id);
            if (idx !== -1) newSteps[idx] = currentStep;
        } else {
            // Add new
            newSteps.push({ ...currentStep, id: Date.now() });
        }
        setFormData({ ...formData, steps: newSteps });
        setShowStepForm(false);
    };

    const handleDeleteStep = (stepId: number) => {
        setFormData({ ...formData, steps: formData.steps.filter((s: any) => s.id !== stepId) });
    };

    const filteredScenarios = scenarios.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">场景编排</h2>
                    <p className="text-slate-500 mt-1">定义跨部门业务流程与数据流转路径</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索场景..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus size={18} />
                        <span>新建场景</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredScenarios.map(scenario => (
                    <div key={scenario.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group relative cursor-pointer" onClick={() => handleEdit(scenario)}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{scenario.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${scenario.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {scenario.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm max-w-2xl">{scenario.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">最后更新</p>
                                <p className="text-sm font-mono text-slate-600">{scenario.lastUpdate}</p>
                            </div>
                        </div>

                        {/* Visual Flow Preview */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-4 overflow-x-auto">
                            <div className="flex items-center min-w-max">
                                {scenario.steps.map((step: any, idx: number) => (
                                    <div key={step.id} className="flex items-center">
                                        <div className="bg-white border border-slate-200 rounded px-3 py-2 flex flex-col items-center min-w-[120px] shadow-sm">
                                            <span className="text-xs font-medium text-slate-800">{step.name}</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded mt-1">{step.boId || 'No Object'}</span>
                                        </div>
                                        {idx < scenario.steps.length - 1 && (
                                            <div className="mx-2 text-slate-300">
                                                <ArrowRight size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {scenario.steps.length === 0 && <span className="text-sm text-slate-400 italic">暂无步骤</span>}
                            </div>
                        </div>

                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(scenario.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-fade-in-up">
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-xl text-slate-800">{editingScenario ? '编辑场景' : '新建场景'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-hidden flex">
                            {/* Left: Config */}
                            <div className="w-1/3 border-r border-slate-100 p-6 overflow-y-auto bg-white z-10">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} /> 基础信息</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">场景名称</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                            <option value="draft">Draft</option>
                                            <option value="planning">Planning</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Layers size={16} /> 流程步骤</h4>
                                        <button onClick={handleAddStep} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium">Add Step</button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.steps.map((step: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center group hover:border-blue-300 transition-colors">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-800">{step.name}</div>
                                                    <div className="text-xs text-slate-500">{step.boId || 'No Binding'}</div>
                                                </div>
                                                <button onClick={() => handleDeleteStep(step.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Visualization */}
                            <div className="flex-1 bg-slate-50/50 p-8 flex flex-col relative overflow-hidden">
                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-slate-500 border border-slate-200 shadow-sm">
                                    流程预览
                                </div>
                                <div className="flex-1 flex items-center justify-center overflow-auto">
                                    <div className="flex items-center gap-4">
                                        {formData.steps.length === 0 ? (
                                            <div className="text-slate-400 flex flex-col items-center">
                                                <Layers size={48} className="mb-2 opacity-20" />
                                                <p>点击左侧 "Add Step" 添加流程节点</p>
                                            </div>
                                        ) : (
                                            formData.steps.map((step: any, idx: number) => (
                                                <div key={idx} className="flex items-center animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                                    <div className="relative group">
                                                        <div className="w-40 bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-default z-10 relative">
                                                            <div className="text-xs font-bold text-blue-500 uppercase mb-1 tracking-wider">{step.type}</div>
                                                            <div className="font-bold text-slate-800 mb-2">{step.name}</div>
                                                            <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-center gap-1 truncate">
                                                                <Layout size={10} />
                                                                {step.boId ? mockBusinessObjects.find(b => b.id === step.boId)?.name || step.boId : '未关联对象'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {idx < formData.steps.length - 1 && (
                                                        <div className="w-12 h-0.5 bg-slate-300 mx-2 relative">
                                                            <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-xl z-20">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium">取消</button>
                            <button onClick={handleSave} className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium shadow-sm shadow-blue-200">保存场景</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step Form Modal */}
            {showStepForm && (
                <div className="fixed inset-0 bg-black/20 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 animate-zoom-in">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">添加/编辑步骤</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">步骤名称</label>
                                <input type="text" autoFocus value={currentStep.name} onChange={e => setCurrentStep({ ...currentStep, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">关联业务对象</label>
                                <select value={currentStep.boId} onChange={e => setCurrentStep({ ...currentStep, boId: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-blue-500 bg-white">
                                    <option value="">-- 选择对象 --</option>
                                    {mockBusinessObjects.map(bo => (
                                        <option key={bo.id} value={bo.id}>{bo.name} ({bo.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">类型</label>
                                <div className="flex gap-4 mt-1">
                                    {['trigger', 'action', 'decision'].map(t => (
                                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="stepType" checked={currentStep.type === t} onChange={() => setCurrentStep({ ...currentStep, type: t })} className="text-blue-600" />
                                            <span className="text-sm capitalize text-slate-700">{t}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setShowStepForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded">取消</button>
                                <button onClick={handleSaveStep} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded" disabled={!currentStep.name}>确认</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 辅助小组件
// ==========================================

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
        purple: "text-purple-600 bg-purple-50 border-purple-200",
        orange: "text-orange-600 bg-orange-50 border-orange-200",
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${(colorMap as any)[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mr-2">{trend}</span>
                <span className="text-slate-400">vs last week</span>
            </div>
        </div>
    );
};

const StepItem = ({ status, text }: any) => (
    <div className="flex items-center gap-3">
        {status === 'done' ? (
            <div className="min-w-[20px] h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={12} />
            </div>
        ) : (
            <div className="min-w-[20px] h-5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
        )}
        <span className={`text-sm ${status === 'done' ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>{text}</span>
    </div>
);

// Helper Icon for Catalog
const BookIcon = ({ size, className }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

// ------------------------------------------------------------------
// 视图: 逻辑视图 (BU-03) - Enhanced with AI Semantic Analysis
// ------------------------------------------------------------------
const DataSemanticUnderstandingView = ({ scanResults, setScanResults }: { scanResults: any[], setScanResults: any }) => {
    // State
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTypes, setExpandedTypes] = useState<string[]>(['MySQL', 'Oracle', 'PostgreSQL']);

    // Semantic profile state
    const [semanticProfile, setSemanticProfile] = useState<{
        businessName: string;
        description: string;
        scenarios: string[];
        coreFields: { field: string; reason: string }[];
    }>({
        businessName: '',
        description: '',
        scenarios: [],
        coreFields: []
    });

    // Get assets from scan results
    const assets = scanResults.filter(r => r.status === 'scanned' || r.status === 'analyzed');
    const selectedTable = assets.find(a => a.table === selectedTableId);

    // Type config for grouping
    const typeConfig: Record<string, { color: string; bgColor: string; icon: any }> = {
        MySQL: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Database },
        Oracle: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Database },
        PostgreSQL: { color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: Database }
    };

    // Group assets by source type
    const groupedAssets = assets.reduce((acc: Record<string, any[]>, asset) => {
        const type = asset.sourceType || 'MySQL';
        if (!acc[type]) acc[type] = [];
        if (searchTerm === '' ||
            asset.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.aiSuggestion || '').toLowerCase().includes(searchTerm.toLowerCase())) {
            acc[type].push(asset);
        }
        return acc;
    }, {});

    // Toggle type expansion
    const toggleType = (type: string) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    // Load semantic profile when table selected
    const handleSelectTable = (tableName: string) => {
        setSelectedTableId(tableName);
        const asset = assets.find(a => a.table === tableName);
        if (asset?.semanticAnalysis) {
            setSemanticProfile({
                businessName: asset.semanticAnalysis.chineseName || '',
                description: asset.semanticAnalysis.description || '',
                scenarios: asset.semanticAnalysis.scenarios?.map((s: any) => s.type) || [],
                coreFields: asset.semanticAnalysis.coreFields || []
            });
            setEditMode(false);
        } else {
            setSemanticProfile({
                businessName: '',
                description: '',
                scenarios: [],
                coreFields: []
            });
            setEditMode(true);
        }
    };

    // AI Analysis simulation
    const handleAnalyze = () => {
        if (!selectedTable) return;
        setIsAnalyzing(true);

        setTimeout(() => {
            const mockResults: Record<string, any> = {
                't_user_profile': {
                    businessName: '用户画像表',
                    description: '记录用户基础画像信息，包含用户ID、姓名、联系方式等核心属性，用于用户中心和画像分析场景。',
                    scenarios: ['用户管理', '画像分析', '主数据'],
                    coreFields: [
                        { field: 'user_id', reason: '用户唯一标识' },
                        { field: 'name', reason: '用户姓名' },
                        { field: 'phone', reason: '联系方式' }
                    ]
                },
                't_order_main': {
                    businessName: '订单主表',
                    description: '存储订单核心交易信息，包含订单号、金额、状态等，是订单管理和交易分析的核心数据表。',
                    scenarios: ['订单管理', '交易分析', '报表统计'],
                    coreFields: [
                        { field: 'order_id', reason: '订单唯一标识' },
                        { field: 'amount', reason: '订单金额' },
                        { field: 'status', reason: '订单状态' }
                    ]
                }
            };

            const result = mockResults[selectedTable.table] || {
                businessName: selectedTable.table.replace('t_', '').replace(/_/g, ' ') + '表',
                description: `基于表 ${selectedTable.table} 的AI语义分析结果。该表包含 ${selectedTable.fields?.length || 0} 个字段，建议用于业务数据管理场景。`,
                scenarios: ['数据管理', '业务分析'],
                coreFields: selectedTable.fields?.slice(0, 3).map((f: any) => ({
                    field: f.name,
                    reason: f.suggestion || f.name
                })) || []
            };

            setSemanticProfile(result);
            setEditMode(true);
            setIsAnalyzing(false);
        }, 1500);
    };

    // Toggle core field
    const toggleCoreField = (fieldName: string, defaultReason: string) => {
        const exists = semanticProfile.coreFields.find(cf => cf.field === fieldName);
        if (exists) {
            setSemanticProfile(prev => ({
                ...prev,
                coreFields: prev.coreFields.filter(cf => cf.field !== fieldName)
            }));
        } else {
            setSemanticProfile(prev => ({
                ...prev,
                coreFields: [...prev.coreFields, { field: fieldName, reason: defaultReason || '关键业务属性' }]
            }));
        }
    };

    // Save to metadata
    const handleSaveToMetadata = () => {
        if (!selectedTable) return;

        setScanResults((prev: any[]) => prev.map((r: any) =>
            r.table === selectedTable.table
                ? {
                    ...r,
                    status: 'analyzed',
                    semanticAnalysis: {
                        chineseName: semanticProfile.businessName,
                        description: semanticProfile.description,
                        scenarios: semanticProfile.scenarios.map(s => ({ type: s, confidence: 90, description: s })),
                        coreFields: semanticProfile.coreFields,
                        analyzedAt: new Date().toLocaleString('zh-CN')
                    }
                }
                : r
        ));
        setEditMode(false);
    };

    // Stats
    const analyzedCount = assets.filter(a => a.semanticAnalysis).length;
    const pendingCount = assets.filter(a => !a.semanticAnalysis).length;

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Cpu className="text-pink-500" size={24} />
                        逻辑视图
                    </h2>
                    <p className="text-slate-500 mt-1">基于AI分析物理表的业务含义，构建逻辑模型</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium">{analyzedCount} 已分析</span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg font-medium">{pendingCount} 待分析</span>
                    </div>
                </div>
            </div>

            {/* Three-panel layout */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left: Data Source Tree */}
                <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                            <Database size={14} className="text-blue-500" />
                            物理资产
                        </h3>
                        <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索表..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {Object.entries(groupedAssets).map(([type, items]) => (
                            <div key={type} className="mb-2">
                                <button
                                    onClick={() => toggleType(type)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                                >
                                    <ChevronRight
                                        size={14}
                                        className={`text-slate-400 transition-transform ${expandedTypes.includes(type) ? 'rotate-90' : ''}`}
                                    />
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeConfig[type]?.bgColor || 'bg-slate-100'} ${typeConfig[type]?.color || 'text-slate-600'}`}>
                                        {type}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-auto">{items.length}</span>
                                </button>

                                {expandedTypes.includes(type) && (
                                    <div className="ml-4 mt-1 space-y-0.5">
                                        {items.map((asset: any) => (
                                            <button
                                                key={asset.table}
                                                onClick={() => handleSelectTable(asset.table)}
                                                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-all ${selectedTableId === asset.table
                                                    ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono truncate">{asset.table}</div>
                                                    {asset.semanticAnalysis && (
                                                        <div className="text-[10px] text-pink-500 truncate">{asset.semanticAnalysis.chineseName}</div>
                                                    )}
                                                </div>
                                                {asset.semanticAnalysis ? (
                                                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {Object.keys(groupedAssets).length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <Search size={24} className="mx-auto mb-2 opacity-30" />
                                暂无资产
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Physical Table Columns */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50 flex items-center justify-between">
                        <div className="font-bold text-sm text-blue-800 flex items-center gap-2">
                            <Database size={16} />
                            物理表结构
                        </div>
                        {selectedTable && (
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isAnalyzing
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-pink-500 text-white hover:bg-pink-600 shadow-sm'
                                    }`}
                            >
                                {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Cpu size={12} />}
                                {isAnalyzing ? '分析中...' : 'AI 语义分析'}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {selectedTable ? (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr className="text-left text-slate-500">
                                        <th className="px-4 py-3 font-medium">字段名</th>
                                        <th className="px-4 py-3 font-medium">类型</th>
                                        <th className="px-4 py-3 font-medium">说明</th>
                                        <th className="px-4 py-3 font-medium w-20 text-center">核心</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedTable.fields?.map((field: any, idx: number) => {
                                        const isCore = semanticProfile.coreFields.some(cf => cf.field === field.name);
                                        return (
                                            <tr key={idx} className={`hover:bg-slate-50 ${isCore ? 'bg-pink-50/50' : ''}`}>
                                                <td className="px-4 py-3 font-mono text-slate-700">{field.name}</td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{field.type || 'varchar'}</td>
                                                <td className="px-4 py-3 text-slate-600">{field.suggestion || field.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => toggleCoreField(field.name, field.suggestion || field.name)}
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isCore
                                                            ? 'bg-pink-500 text-white'
                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {isCore ? <CheckCircle size={12} /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Database size={48} className="mb-4 opacity-20" />
                                <p className="text-sm">请从左侧选择一个物理表</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: AI Semantic Results */}
                <div className="w-80 bg-gradient-to-br from-white to-pink-50 rounded-xl border border-pink-100 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="px-4 py-3 border-b border-pink-100 bg-pink-50/50 flex items-center justify-between">
                        <div className="font-bold text-sm text-pink-800 flex items-center gap-2">
                            <Cpu size={16} />
                            语义理解结果
                        </div>
                        {semanticProfile.businessName && !editMode && (
                            <button onClick={() => setEditMode(true)} className="text-xs text-pink-600 underline">
                                编辑
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {semanticProfile.businessName || editMode ? (
                            <>
                                {/* Business Name */}
                                <div>
                                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">业务名称</label>
                                    {editMode ? (
                                        <input
                                            value={semanticProfile.businessName}
                                            onChange={(e) => setSemanticProfile(prev => ({ ...prev, businessName: e.target.value }))}
                                            className="w-full mt-1 px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-slate-800 font-bold"
                                            placeholder="输入业务名称..."
                                        />
                                    ) : (
                                        <div className="text-xl font-bold text-slate-800 mt-1">{semanticProfile.businessName}</div>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">业务描述</label>
                                    {editMode ? (
                                        <textarea
                                            value={semanticProfile.description}
                                            onChange={(e) => setSemanticProfile(prev => ({ ...prev, description: e.target.value }))}
                                            rows={3}
                                            className="w-full mt-1 px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-slate-600"
                                            placeholder="输入业务描述..."
                                        />
                                    ) : (
                                        <p className="text-sm text-slate-600 mt-1 leading-relaxed bg-white/50 p-3 rounded-lg border border-pink-100">
                                            {semanticProfile.description}
                                        </p>
                                    )}
                                </div>

                                {/* Scenarios */}
                                <div>
                                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">适用场景</label>
                                    {editMode ? (
                                        <input
                                            value={semanticProfile.scenarios.join(', ')}
                                            onChange={(e) => setSemanticProfile(prev => ({
                                                ...prev,
                                                scenarios: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                            }))}
                                            className="w-full mt-1 px-3 py-2 border border-pink-200 rounded-lg text-xs"
                                            placeholder="场景1, 场景2, ..."
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {semanticProfile.scenarios.map(s => (
                                                <span key={s} className="px-2.5 py-1 bg-white border border-pink-200 text-pink-700 text-xs rounded-full shadow-sm">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Core Fields */}
                                <div className="bg-pink-50/50 rounded-lg p-3 border border-pink-100">
                                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                                        核心字段 ({semanticProfile.coreFields.length})
                                    </label>
                                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                        {semanticProfile.coreFields.length > 0 ? (
                                            semanticProfile.coreFields.map(cf => (
                                                <div key={cf.field} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-pink-100">
                                                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-mono font-bold text-slate-700">{cf.field}</div>
                                                        <div className="text-[10px] text-slate-400 truncate">{cf.reason}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-slate-400 text-center py-2">
                                                点击中间表格的核心列标记字段
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Cpu size={48} className="mb-4 opacity-20" />
                                <p className="text-sm text-center">选择表后点击<br />"AI 语义分析"开始</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {editMode && semanticProfile.businessName && (
                        <div className="p-4 border-t border-pink-100 space-y-2">
                            <button
                                onClick={handleSaveToMetadata}
                                className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} />
                                保存到元数据
                            </button>
                            <button
                                onClick={() => setEditMode(false)}
                                className="w-full py-2 bg-white border border-pink-200 text-pink-600 rounded-lg text-sm font-medium hover:bg-pink-50 transition-colors"
                            >
                                取消
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ------------------------------------------------------------------
// 视图 6: 候选生成 (BU-04) - Enhanced
// ------------------------------------------------------------------
const CandidateGenerationView = ({ scanResults, setScanResults, onAddBusinessObject }: { scanResults: any[], setScanResults: any, onAddBusinessObject: (bo: any) => void }) => {
    const [confidenceFilter, setConfidenceFilter] = useState(80);
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conflictModal, setConflictModal] = useState<any>(null);

    // Object type configuration
    const objectTypes: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
        'entity': { label: '实体对象', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Layout },
        'event': { label: '事件对象', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Activity },
        'master': { label: '主数据', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Database },
        'transaction': { label: '交易对象', color: 'text-emerald-600', bgColor: 'bg-emerald-100', icon: ArrowRight }
    };

    // Detect object type based on table name patterns
    const detectObjectType = (tableName: string): string => {
        if (tableName.includes('_log') || tableName.includes('_event') || tableName.includes('_record')) return 'event';
        if (tableName.includes('_master') || tableName.includes('_base') || tableName.includes('_info')) return 'master';
        if (tableName.includes('_order') || tableName.includes('_trans') || tableName.includes('_pay')) return 'transaction';
        return 'entity';
    };

    // Filter candidates
    const candidates = scanResults.filter(r => r.status !== 'mapped' && (r.confidence || 0) >= confidenceFilter);

    // Detect conflicts: group candidates by suggested BO name
    const candidatesByBO: Record<string, any[]> = {};
    candidates.forEach(c => {
        const boName = c.aiSuggestion?.split(': ')[1] || c.table;
        if (!candidatesByBO[boName]) candidatesByBO[boName] = [];
        candidatesByBO[boName].push(c);
    });
    const conflicts = Object.entries(candidatesByBO).filter(([_, items]) => items.length > 1);

    const handleToggleSelect = (tableName: string) => {
        setSelectedCandidates(prev =>
            prev.includes(tableName) ? prev.filter(c => c !== tableName) : [...prev, tableName]
        );
    };

    const handleSelectAll = () => {
        setSelectedCandidates(prev =>
            prev.length === candidates.length ? [] : candidates.map(c => c.table)
        );
    };

    const handleResolveConflict = (primaryTable: string, conflictItems: any[]) => {
        // Mark the primary as selected, others as resolved/excluded
        const otherTables = conflictItems.filter(c => c.table !== primaryTable).map(c => c.table);
        setScanResults((prev: any[]) => prev.map((r: any) =>
            otherTables.includes(r.table) ? { ...r, status: 'excluded', excludeReason: `已合并到 ${primaryTable}` } : r
        ));
        setConflictModal(null);
    };

    const handleBatchGenerate = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const newBOs = candidates.filter(c => selectedCandidates.includes(c.table)).map(c => ({
                id: `BO_${Date.now()}_${c.table}`,
                name: c.aiSuggestion?.split(': ')[1] || c.table,
                code: `BO_${c.table.toUpperCase().replace('T_', '')}`,
                domain: '自动生成',
                owner: '系统',
                status: 'draft',
                objectType: detectObjectType(c.table),
                description: `基于 ${c.table} 自动生成的业务对象`,
                fields: c.fields?.map((f: any) => ({
                    name: f.suggestion || f.name,
                    type: 'String',
                    required: false
                })) || []
            }));

            newBOs.forEach(bo => onAddBusinessObject(bo));
            setScanResults((prev: any[]) => prev.map((r: any) =>
                selectedCandidates.includes(r.table) ? { ...r, status: 'mapped' } : r
            ));

            setIsProcessing(false);
            setSelectedCandidates([]);
        }, 1500);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">候选对象生成</h2>
                    <p className="text-slate-500 mt-1">基于AI分析，从物理表自动识别并生成业务对象候选</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500">置信度阈值</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={confidenceFilter}
                        onChange={(e) => setConfidenceFilter(parseInt(e.target.value))}
                        className="w-32 accent-blue-600"
                    />
                    <span className="font-mono text-sm font-bold text-blue-600 w-10 text-right">{confidenceFilter}%</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{candidates.length}</div>
                        <div className="text-xs text-slate-500">候选总数</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{candidates.filter(c => c.confidence > 90).length}</div>
                        <div className="text-xs text-slate-500">高置信度</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{conflicts.length}</div>
                        <div className="text-xs text-slate-500">待解决冲突</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{selectedCandidates.length}</div>
                        <div className="text-xs text-slate-500">已选中</div>
                    </div>
                </div>
            </div>

            {/* Conflict Alert */}
            {conflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h4 className="font-medium text-amber-800">检测到 {conflicts.length} 个多表冲突</h4>
                            <p className="text-sm text-amber-700 mt-1">以下业务对象有多张表可作为数据来源，请选择主表:</p>
                            <div className="mt-3 space-y-2">
                                {conflicts.map(([boName, items], idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                                        <div>
                                            <span className="font-medium text-slate-700">{boName}</span>
                                            <span className="text-sm text-slate-500 ml-2">
                                                ({items.length} 张候选表: {items.map(i => i.table).join(', ')})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setConflictModal({ boName, items })}
                                            className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600"
                                        >
                                            解决冲突
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            {candidates.length > 0 && (
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                            onChange={handleSelectAll}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-slate-700">全选 {candidates.length} 个候选</span>
                    </div>
                    <button
                        onClick={handleBatchGenerate}
                        disabled={selectedCandidates.length === 0 || isProcessing}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 ${selectedCandidates.length > 0 ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                        {isProcessing ? '生成中...' : `生成 ${selectedCandidates.length} 个对象`}
                    </button>
                </div>
            )}

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.length > 0 ? candidates.map((candidate, idx) => {
                    const objType = detectObjectType(candidate.table);
                    const typeInfo = objectTypes[objType];
                    const TypeIcon = typeInfo.icon;
                    const hasConflict = conflicts.some(([_, items]) => items.some(i => i.table === candidate.table));

                    return (
                        <div
                            key={idx}
                            className={`bg-white rounded-xl border-2 transition-all overflow-hidden cursor-pointer relative group ${selectedCandidates.includes(candidate.table)
                                ? 'border-blue-500 shadow-md'
                                : hasConflict
                                    ? 'border-amber-300 hover:border-amber-400'
                                    : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'
                                }`}
                            onClick={() => handleToggleSelect(candidate.table)}
                        >
                            {/* Selection Checkbox */}
                            <div className="absolute top-4 right-4 z-10">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCandidates.includes(candidate.table) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                                    }`}>
                                    {selectedCandidates.includes(candidate.table) && <CheckCircle size={14} className="text-white" />}
                                </div>
                            </div>

                            {/* Conflict Badge */}
                            {hasConflict && (
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded flex items-center gap-1">
                                        <AlertTriangle size={10} /> 冲突
                                    </span>
                                </div>
                            )}

                            <div className="p-5 border-b border-slate-50">
                                {/* Object Type Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 ${typeInfo.bgColor} ${typeInfo.color}`}>
                                        <TypeIcon size={12} />
                                        {typeInfo.label}
                                    </span>
                                    <span className="text-xs text-slate-400 uppercase">{candidate.status === 'scanned' ? '待生成' : candidate.status}</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">{candidate.aiSuggestion?.split(': ')[1] || candidate.table}</h3>
                                <p className="text-xs text-slate-400 font-mono">{candidate.table}</p>
                            </div>

                            <div className="p-5 bg-slate-50/50 space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-500 font-medium">置信度</span>
                                        <span className="text-blue-600 font-bold">{candidate.confidence}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${candidate.confidence > 90 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${candidate.confidence}%` }} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                                    <span>{candidate.fields?.length || 0} 个字段</span>
                                    <span>{candidate.rowCount?.toLocaleString()} 行数据</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <Search size={32} />
                        </div>
                        <p className="text-lg font-medium text-slate-600">未找到候选对象</p>
                        <p className="text-sm">请调整置信度阈值或在数据发现中执行新的扫描</p>
                    </div>
                )}
            </div>

            {/* Conflict Resolution Modal */}
            {conflictModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConflictModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 bg-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">解决多表冲突</h3>
                                    <p className="text-sm text-slate-500">业务对象: {conflictModal.boName}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                检测到 {conflictModal.items.length} 张表都可作为「{conflictModal.boName}」的数据来源。
                                请选择<strong>主表</strong>作为主要数据源，其他表将被标记为已合并。
                            </p>
                            <div className="space-y-3">
                                {conflictModal.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Database size={16} className="text-slate-400" />
                                            <div>
                                                <div className="font-medium text-slate-700">{item.table}</div>
                                                <div className="text-xs text-slate-400">{item.fields?.length || 0} 字段 · {item.rowCount?.toLocaleString()} 行 · 置信度 {item.confidence}%</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleResolveConflict(item.table, conflictModal.items)}
                                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                                        >
                                            选为主表
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                            <button onClick={() => setConflictModal(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800">
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 冲突检测 (SG-02)
// ------------------------------------------------------------------
const ConflictDetectionView = () => {
    const [conflicts, setConflicts] = useState(mockConflicts);
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConflict, setSelectedConflict] = useState<any>(null);

    // Severity configuration
    const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
        critical: { label: '严重', color: 'text-red-600', bgColor: 'bg-red-100' },
        warning: { label: '警告', color: 'text-amber-600', bgColor: 'bg-amber-100' },
        info: { label: '提示', color: 'text-blue-600', bgColor: 'bg-blue-100' }
    };

    // Type configuration
    const typeConfig: Record<string, { label: string; icon: any }> = {
        type_mismatch: { label: '类型不匹配', icon: AlertTriangle },
        semantic_duplicate: { label: '语义重复', icon: GitMerge },
        orphan_mapping: { label: '孤儿映射', icon: Link },
        naming_conflict: { label: '命名冲突', icon: FileText }
    };

    // Filter logic
    const filteredConflicts = conflicts.filter(c => {
        const matchSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
        const matchStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchSearch = searchTerm === '' ||
            c.boName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.boField.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.tableName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSeverity && matchStatus && matchSearch;
    });

    // Statistics
    const stats = {
        total: conflicts.length,
        critical: conflicts.filter(c => c.severity === 'critical' && c.status === 'open').length,
        warning: conflicts.filter(c => c.severity === 'warning' && c.status === 'open').length,
        resolved: conflicts.filter(c => c.status === 'resolved').length
    };

    // Resolve action
    const handleResolve = (id: string) => {
        setConflicts((prev: any[]) => prev.map((c: any) =>
            c.id === id ? { ...c, status: 'resolved', resolvedAt: new Date().toISOString(), resolvedBy: 'Current User' } : c
        ));
        setSelectedConflict(null);
    };

    // Ignore action
    const handleIgnore = (id: string) => {
        setConflicts((prev: any[]) => prev.filter((c: any) => c.id !== id));
        setSelectedConflict(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">冲突检测</h2>
                    <p className="text-slate-500 mt-1">识别并解决业务对象与物理表之间的语义冲突</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    <RefreshCw size={16} />
                    <span>重新扫描</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                            <div className="text-xs text-slate-500">总冲突数</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                            <div className="text-xs text-slate-500">严重冲突</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-amber-600">{stats.warning}</div>
                            <div className="text-xs text-slate-500">警告冲突</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-600">{stats.resolved}</div>
                            <div className="text-xs text-slate-500">已解决</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜索业务对象、字段或表名..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">全部严重程度</option>
                    <option value="critical">严重</option>
                    <option value="warning">警告</option>
                    <option value="info">提示</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="all">全部状态</option>
                    <option value="open">待处理</option>
                    <option value="resolved">已解决</option>
                </select>
                <div className="text-sm text-slate-500">
                    {filteredConflicts.length} / {conflicts.length} 项
                </div>
            </div>

            {/* Conflict List */}
            <div className="space-y-4">
                {filteredConflicts.length > 0 ? filteredConflicts.map(conflict => {
                    const severity = severityConfig[conflict.severity];
                    const typeInfo = typeConfig[conflict.type];
                    const TypeIcon = typeInfo?.icon || AlertCircle;

                    return (
                        <div
                            key={conflict.id}
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md cursor-pointer ${conflict.status === 'resolved' ? 'border-slate-200 opacity-60' : 'border-l-4 border-l-' + (conflict.severity === 'critical' ? 'red' : conflict.severity === 'warning' ? 'amber' : 'blue') + '-500'
                                }`}
                            onClick={() => setSelectedConflict(conflict)}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${severity.bgColor} ${severity.color}`}>
                                            <TypeIcon size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severity.bgColor} ${severity.color}`}>
                                                    {severity.label}
                                                </span>
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                    {typeInfo?.label}
                                                </span>
                                                {conflict.status === 'resolved' && (
                                                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <CheckCircle size={12} /> 已解决
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-medium text-slate-800 mt-1">
                                                {conflict.boName} → {conflict.boField}
                                            </h4>
                                            <p className="text-sm text-slate-500 mt-1">{conflict.description}</p>
                                        </div>
                                    </div>
                                    {conflict.status === 'open' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResolve(conflict.id); }}
                                                className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                解决
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleIgnore(conflict.id); }}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                忽略
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Database size={12} />
                                        {conflict.tableName}.{conflict.tableColumn}
                                    </span>
                                    <span>BO: {conflict.boFieldType} → 物理: {conflict.tableColumnType}</span>
                                    <span className="ml-auto">{conflict.createdAt}</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                            <CheckCircle size={32} />
                        </div>
                        <p className="text-lg font-medium text-slate-600">没有发现冲突</p>
                        <p className="text-sm">当前筛选条件下没有冲突记录</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedConflict && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedConflict(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityConfig[selectedConflict.severity].bgColor} ${severityConfig[selectedConflict.severity].color}`}>
                                        {severityConfig[selectedConflict.severity].label}
                                    </span>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                        {typeConfig[selectedConflict.type]?.label}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedConflict.boName}</h3>
                                <p className="text-slate-500">{selectedConflict.boField}</p>
                            </div>
                            <button onClick={() => setSelectedConflict(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">业务对象字段</h4>
                                    <p className="text-lg font-bold text-blue-900">{selectedConflict.boField}</p>
                                    <p className="text-sm text-blue-700">类型: {selectedConflict.boFieldType}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <h4 className="text-sm font-medium text-slate-600 mb-2">物理表列</h4>
                                    <p className="text-lg font-bold text-slate-800">{selectedConflict.tableColumn}</p>
                                    <p className="text-sm text-slate-600">类型: {selectedConflict.tableColumnType}</p>
                                    <p className="text-xs text-slate-500 mt-1">{selectedConflict.tableName}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <h4 className="text-sm font-medium text-amber-800 mb-2">问题描述</h4>
                                <p className="text-sm text-amber-900">{selectedConflict.description}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <h4 className="text-sm font-medium text-emerald-800 mb-2">建议解决方案</h4>
                                <p className="text-sm text-emerald-900">{selectedConflict.suggestion}</p>
                            </div>
                            {selectedConflict.status === 'resolved' && (
                                <div className="p-4 bg-slate-100 rounded-lg">
                                    <h4 className="text-sm font-medium text-slate-600 mb-2">解决信息</h4>
                                    <p className="text-sm text-slate-700">由 {selectedConflict.resolvedBy} 于 {selectedConflict.resolvedAt} 标记为已解决</p>
                                </div>
                            )}
                        </div>
                        {selectedConflict.status === 'open' && (
                            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                                <button
                                    onClick={() => handleIgnore(selectedConflict.id)}
                                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    忽略此冲突
                                </button>
                                <button
                                    onClick={() => handleResolve(selectedConflict.id)}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                                >
                                    标记为已解决
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 智能数据中心 (SG-04) - 整合找数与问数功能
// ------------------------------------------------------------------
const SmartDataHubView = () => {
    // 模式切换: 找数 / 问数
    const [mode, setMode] = useState<'find' | 'analyze'>('find');

    // 找数模式状态
    const [catalogItems] = useState(mockCatalogItems);
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [selectedAssets, setSelectedAssets] = useState<any[]>([]);

    // 问数模式状态
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; data?: any }[]>([
        { role: 'assistant', content: '你好！我是智能数据助手。你可以：\n1. 查询业务对象和物理表信息\n2. 生成统计图表\n3. 分析数据分布\n\n请输入你的问题...' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // 类型配置
    const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
        business_object: { label: '业务对象', icon: Layout, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        physical_table: { label: '物理表', icon: Database, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
        mapping: { label: '映射关系', icon: GitMerge, color: 'text-purple-600', bgColor: 'bg-purple-100' }
    };

    // 筛选逻辑
    const filteredItems = catalogItems.filter(item => {
        const matchType = selectedType === 'all' || item.type === selectedType;
        const matchSearch = searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });

    // 统计
    const stats = {
        total: catalogItems.length,
        businessObjects: catalogItems.filter(i => i.type === 'business_object').length,
        physicalTables: catalogItems.filter(i => i.type === 'physical_table').length,
        mappings: catalogItems.filter(i => i.type === 'mapping').length
    };

    // 问数 Mock 响应
    const mockQueryResults: Record<string, { text: string; data?: any }> = {
        '订单': {
            text: '找到了 2 张与订单相关的表：',
            data: {
                type: 'table_list', items: [
                    { name: 't_order_main', chinese: '订单主表', fields: 12, domain: '订单管理' },
                    { name: 't_order_item', chinese: '订单明细表', fields: 6, domain: '订单管理' }
                ]
            }
        },
        '新生儿': {
            text: '"新生儿"业务对象包含以下字段：',
            data: {
                type: 'field_list', boName: '新生儿 (Newborn)', fields: [
                    { name: '姓名', type: 'String', required: true, mapped: true },
                    { name: '身份证号', type: 'String', required: true, mapped: true },
                    { name: '出生时间', type: 'DateTime', required: true, mapped: true },
                    { name: '血型', type: 'String', required: false, mapped: false },
                    { name: '出生体重', type: 'Decimal', required: false, mapped: true }
                ]
            }
        },
        '统计': {
            text: '各业务领域对象分布统计：',
            data: {
                type: 'bar_chart', items: [
                    { label: '人口管理', value: 5, color: '#3B82F6' },
                    { label: '订单管理', value: 3, color: '#10B981' },
                    { label: '客户管理', value: 4, color: '#8B5CF6' },
                    { label: '基础数据', value: 2, color: '#F59E0B' }
                ]
            }
        },
        '映射': {
            text: '当前映射状态概览：',
            data: {
                type: 'stats', items: [
                    { label: '已映射对象', value: 8, total: 12 },
                    { label: '映射覆盖率', value: '67%' },
                    { label: '待处理冲突', value: 3 }
                ]
            }
        },
        '图表': {
            text: '数据资产类型分布：',
            data: {
                type: 'pie_chart', items: [
                    { label: '业务对象', value: stats.businessObjects, color: '#3B82F6' },
                    { label: '物理表', value: stats.physicalTables, color: '#10B981' },
                    { label: '映射关系', value: stats.mappings, color: '#8B5CF6' }
                ]
            }
        }
    };

    // 发送问数请求
    const handleSend = () => {
        if (!query.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setQuery('');
        setIsLoading(true);

        setTimeout(() => {
            let response: { text: string; data?: any } = { text: '抱歉，我暂时无法理解这个问题。试试询问关于"订单"、"新生儿"、"统计"或"映射"的问题吧。' };
            for (const [keyword, result] of Object.entries(mockQueryResults)) {
                if (query.includes(keyword)) {
                    response = result;
                    break;
                }
            }
            setMessages(prev => [...prev, { role: 'assistant', content: response.text, data: response.data }]);
            setIsLoading(false);
        }, 800);
    };

    // 渲染问数数据
    const renderData = (data: any) => {
        if (!data) return null;

        if (data.type === 'table_list') {
            return (
                <div className="mt-3 space-y-2">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200 hover:border-purple-300 cursor-pointer transition-colors">
                            <Database size={16} className="text-emerald-600" />
                            <div className="flex-1">
                                <div className="font-mono text-sm text-slate-700">{item.name}</div>
                                <div className="text-xs text-slate-400">{item.chinese} · {item.fields} 字段 · {item.domain}</div>
                            </div>
                            <ChevronRight size={14} className="text-slate-400" />
                        </div>
                    ))}
                </div>
            );
        }

        if (data.type === 'field_list') {
            return (
                <div className="mt-3">
                    <div className="text-xs text-purple-600 font-medium mb-2">{data.boName}</div>
                    <div className="grid grid-cols-2 gap-2">
                        {data.fields.map((field: any, idx: number) => (
                            <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${field.mapped ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${field.mapped ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className="text-sm text-slate-700">{field.name}</span>
                                <span className="text-xs text-slate-400 ml-auto">{field.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (data.type === 'bar_chart') {
            const max = Math.max(...data.items.map((i: any) => i.value));
            return (
                <div className="mt-3 space-y-2">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 w-20 truncate">{item.label}</span>
                            <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                                <div className="h-full rounded-lg flex items-center px-2" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}>
                                    <span className="text-xs text-white font-medium">{item.value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (data.type === 'pie_chart') {
            const total = data.items.reduce((sum: number, i: any) => sum + i.value, 0);
            return (
                <div className="mt-3 flex items-center gap-4">
                    <div className="relative w-24 h-24">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {data.items.reduce((acc: any[], item: any, idx: number) => {
                                const offset = acc.length > 0 ? acc[acc.length - 1].end : 0;
                                const percent = (item.value / total) * 100;
                                acc.push({ ...item, start: offset, end: offset + percent, strokeDasharray: `${percent} ${100 - percent}`, strokeDashoffset: -offset });
                                return acc;
                            }, []).map((item: any, idx: number) => (
                                <circle key={idx} cx="50" cy="50" r="40" fill="none" strokeWidth="20" stroke={item.color}
                                    strokeDasharray={`${item.end - item.start} ${100 - (item.end - item.start)}`}
                                    strokeDashoffset={`${-item.start}`} className="transition-all" />
                            ))}
                        </svg>
                    </div>
                    <div className="flex-1 space-y-1">
                        {data.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-slate-600">{item.label}</span>
                                <span className="text-xs font-bold text-slate-800 ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (data.type === 'stats') {
            return (
                <div className="mt-3 grid grid-cols-3 gap-3">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                            <div className="text-lg font-bold text-purple-600">{item.value}{item.total ? `/${item.total}` : ''}</div>
                            <div className="text-xs text-slate-500">{item.label}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    // 切换资产选中
    const toggleAssetSelect = (asset: any) => {
        setSelectedAssets(prev =>
            prev.find(a => a.id === asset.id)
                ? prev.filter(a => a.id !== asset.id)
                : [...prev, asset]
        );
    };

    // 将选中资产加入问数上下文
    const addToAnalysis = () => {
        if (selectedAssets.length === 0) return;
        const assetNames = selectedAssets.map(a => a.name).join('、');
        setMessages(prev => [...prev, { role: 'user', content: `分析这些资产：${assetNames}` }]);
        setMode('analyze');

        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `已将 ${selectedAssets.length} 个资产加入分析上下文。\n\n选中的资产包括：\n${selectedAssets.map(a => `• ${a.name} (${typeConfig[a.type]?.label || a.type})`).join('\n')}\n\n你可以问我关于这些资产的问题，比如"统计这些资产的字段数量"或"查看映射状态"。`,
                data: {
                    type: 'stats', items: [
                        { label: '业务对象', value: selectedAssets.filter(a => a.type === 'business_object').length },
                        { label: '物理表', value: selectedAssets.filter(a => a.type === 'physical_table').length },
                        { label: '映射关系', value: selectedAssets.filter(a => a.type === 'mapping').length }
                    ]
                }
            }]);
        }, 500);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Cpu className="text-purple-600" size={24} />
                        智能数据中心
                    </h2>
                    <p className="text-slate-500 mt-1">发现数据资产，智能分析处理</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setMode('find')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'find' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Search size={14} className="inline mr-1.5" />
                            找数
                        </button>
                        <button
                            onClick={() => setMode('analyze')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'analyze' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MessageCircle size={14} className="inline mr-1.5" />
                            问数
                        </button>
                    </div>
                    {selectedAssets.length > 0 && mode === 'find' && (
                        <button
                            onClick={addToAnalysis}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <TrendingUp size={14} />
                            分析选中 ({selectedAssets.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {mode === 'find' ? (
                    /* 找数模式 */
                    <>
                        {/* 左侧搜索和筛选 */}
                        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                            {/* 搜索框 */}
                            <div className="p-4 border-b border-slate-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="搜索业务对象、表、映射..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    />
                                </div>
                            </div>

                            {/* 类型筛选 */}
                            <div className="p-3 border-b border-slate-100">
                                <div className="flex flex-wrap gap-2">
                                    {[{ id: 'all', label: '全部', count: stats.total },
                                    { id: 'business_object', label: '业务对象', count: stats.businessObjects },
                                    { id: 'physical_table', label: '物理表', count: stats.physicalTables },
                                    { id: 'mapping', label: '映射', count: stats.mappings }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedType(tab.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === tab.id
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {tab.label} <span className="opacity-70">({tab.count})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 资产列表 */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {filteredItems.map(item => {
                                    const config = typeConfig[item.type];
                                    const isSelected = selectedAssets.find(a => a.id === item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200'
                                                : 'bg-white border-slate-200 hover:border-purple-300'
                                                } ${selectedAsset?.id === item.id ? 'ring-2 ring-purple-400' : ''}`}
                                            onClick={() => setSelectedAsset(item)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={(e) => { e.stopPropagation(); toggleAssetSelect(item); }}
                                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config?.bgColor || 'bg-slate-100'}`}>
                                                    {(() => { const IconComp = config?.icon; return IconComp ? <IconComp size={16} className={config?.color} /> : null; })()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-700 truncate">{item.name}</div>
                                                    <div className="text-xs text-slate-400 truncate">{item.code}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 右侧详情 */}
                        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            {selectedAsset ? (
                                <>
                                    <div className="p-6 border-b border-slate-100">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig[selectedAsset.type]?.bgColor}`}>
                                                {(() => {
                                                    const IconComp = typeConfig[selectedAsset.type]?.icon;
                                                    return IconComp ? <IconComp size={24} className={typeConfig[selectedAsset.type]?.color} /> : null;
                                                })()}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-800">{selectedAsset.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig[selectedAsset.type]?.bgColor} ${typeConfig[selectedAsset.type]?.color}`}>
                                                        {typeConfig[selectedAsset.type]?.label}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono">{selectedAsset.code}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedAssets([selectedAsset]); addToAnalysis(); }}
                                                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors flex items-center gap-1"
                                            >
                                                <TrendingUp size={12} />
                                                深度分析
                                            </button>
                                        </div>
                                        <p className="mt-4 text-sm text-slate-600">{selectedAsset.description}</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-slate-800">{selectedAsset.fieldCount || 0}</div>
                                                <div className="text-xs text-slate-500">字段数</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-slate-800">{selectedAsset.mappingCount || 0}</div>
                                                <div className="text-xs text-slate-500">映射数</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                                <div className="text-2xl font-bold text-emerald-600">{selectedAsset.status}</div>
                                                <div className="text-xs text-slate-500">状态</div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-700 mb-2">标签</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedAsset.tags?.map((tag: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-700 mb-2">基本信息</h4>
                                                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                                                    <div className="flex justify-between"><span className="text-slate-500">负责人</span><span className="text-slate-700">{selectedAsset.owner}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-500">更新时间</span><span className="text-slate-700">{selectedAsset.lastUpdated}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-500">创建时间</span><span className="text-slate-700">{selectedAsset.createdAt}</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-center p-8">
                                    <div>
                                        <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-700">选择资产查看详情</h3>
                                        <p className="text-sm text-slate-500 mt-1">从左侧列表选择一个资产，或使用搜索功能</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* 问数模式 */
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        <div className="whitespace-pre-line text-sm">{msg.content}</div>
                                        {msg.data && renderData(msg.data)}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-slate-200 p-4">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="输入问题，如：统计各业务领域的对象数量..."
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!query.trim() || isLoading}
                                    className={`px-5 py-3 rounded-xl text-white transition-all flex items-center gap-2 ${query.trim() && !isLoading
                                        ? 'bg-purple-600 hover:bg-purple-700 shadow-sm'
                                        : 'bg-slate-300 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <div className="mt-3 flex gap-2 flex-wrap">
                                {['查看订单相关的表', '新生儿有哪些字段', '统计业务领域分布', '生成资产类型图表'].map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setQuery(suggestion)}
                                        className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 问数 (SG-05) - Natural Language Query Interface (保留，但不在菜单中显示)
// ------------------------------------------------------------------
const AskDataView = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; data?: any }[]>([
        { role: 'assistant', content: '你好！我是问数助手，可以帮你：\n1. 查找业务对象和物理表\n2. 分析数据分布和统计\n3. 查询字段映射关系\n\n请用自然语言描述你的需求，例如：\n- "有哪些和订单相关的表？"\n- "新生儿对象有哪些字段？"\n- "统计各业务领域的对象数量"' }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock data for queries
    const mockQueryResults: Record<string, { text: string; data?: any }> = {
        '订单': {
            text: '我找到了 2 张与订单相关的表：',
            data: {
                type: 'table_list',
                items: [
                    { name: 't_order_main', chinese: '订单主表', fields: 12, domain: '订单管理' },
                    { name: 't_order_item', chinese: '订单明细表', fields: 6, domain: '订单管理' }
                ]
            }
        },
        '新生儿': {
            text: '"新生儿"业务对象包含以下字段：',
            data: {
                type: 'field_list',
                boName: '新生儿 (Newborn)',
                fields: [
                    { name: '姓名', type: 'String', required: true, mapped: true },
                    { name: '身份证号', type: 'String', required: true, mapped: true },
                    { name: '出生时间', type: 'DateTime', required: true, mapped: true },
                    { name: '血型', type: 'String', required: false, mapped: false },
                    { name: '出生体重', type: 'Decimal', required: false, mapped: true }
                ]
            }
        },
        '统计': {
            text: '以下是各业务领域的对象分布统计：',
            data: {
                type: 'chart',
                items: [
                    { domain: '人口管理', count: 5, color: 'bg-blue-500' },
                    { domain: '订单管理', count: 3, color: 'bg-emerald-500' },
                    { domain: '客户管理', count: 4, color: 'bg-purple-500' },
                    { domain: '基础数据', count: 2, color: 'bg-orange-500' }
                ]
            }
        },
        '映射': {
            text: '当前映射状态概览：',
            data: {
                type: 'stats',
                items: [
                    { label: '已映射对象', value: 8, total: 12 },
                    { label: '映射覆盖率', value: '67%' },
                    { label: '待处理冲突', value: 3 }
                ]
            }
        }
    };

    const handleSend = () => {
        if (!query.trim()) return;

        const userMessage = { role: 'user' as const, content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        setTimeout(() => {
            let response: { text: string; data?: any } = { text: '抱歉，我暂时无法理解这个问题。请尝试询问关于业务对象、物理表或映射关系的问题。' };

            // Simple keyword matching
            for (const [keyword, result] of Object.entries(mockQueryResults)) {
                if (query.includes(keyword)) {
                    response = result;
                    break;
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response.text, data: response.data }]);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderData = (data: any) => {
        if (!data) return null;

        if (data.type === 'table_list') {
            return (
                <div className="mt-3 space-y-2">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                            <Database size={16} className="text-emerald-600" />
                            <div className="flex-1">
                                <div className="font-mono text-sm text-slate-700">{item.name}</div>
                                <div className="text-xs text-slate-400">{item.chinese} · {item.fields} 字段 · {item.domain}</div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (data.type === 'field_list') {
            return (
                <div className="mt-3">
                    <div className="text-xs text-purple-600 font-medium mb-2">{data.boName}</div>
                    <div className="grid grid-cols-2 gap-2">
                        {data.fields.map((field: any, idx: number) => (
                            <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${field.mapped ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${field.mapped ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                <span className="text-sm text-slate-700">{field.name}</span>
                                <span className="text-xs text-slate-400 ml-auto">{field.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (data.type === 'chart') {
            const total = data.items.reduce((sum: number, i: any) => sum + i.count, 0);
            return (
                <div className="mt-3 space-y-2">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs text-slate-600 w-20">{item.domain}</span>
                            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / total) * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700 w-8">{item.count}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (data.type === 'stats') {
            return (
                <div className="mt-3 grid grid-cols-3 gap-3">
                    {data.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 text-center">
                            <div className="text-lg font-bold text-purple-600">{item.value}{item.total ? `/${item.total}` : ''}</div>
                            <div className="text-xs text-slate-500">{item.label}</div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageCircle className="text-purple-600" size={24} />
                    问数
                </h2>
                <p className="text-slate-500 mt-1">用自然语言查询资产、统计数据、分析映射关系</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                                }`}>
                                <div className="whitespace-pre-line text-sm">{msg.content}</div>
                                {msg.data && renderData(msg.data)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-200 p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="输入你的问题，如：有哪些和订单相关的表？"
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!query.trim() || isLoading}
                            className={`px-5 py-3 rounded-xl text-white transition-all flex items-center gap-2 ${query.trim() && !isLoading
                                ? 'bg-purple-600 hover:bg-purple-700 shadow-sm'
                                : 'bg-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                        {['有哪些订单相关的表？', '新生儿有哪些字段？', '统计业务领域分布', '查看映射状态'].map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => setQuery(suggestion)}
                                className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 统一元数据目录 (SG-04)
// ------------------------------------------------------------------
const UnifiedMetadataCatalogView = () => {
    const [catalogItems] = useState(mockCatalogItems);
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    // Type configuration
    const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
        business_object: { label: '业务对象', icon: Layout, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        physical_table: { label: '物理表', icon: Database, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
        mapping: { label: '映射关系', icon: GitMerge, color: 'text-purple-600', bgColor: 'bg-purple-100' }
    };

    // Filter logic
    const filteredItems = catalogItems.filter(item => {
        const matchType = selectedType === 'all' || item.type === selectedType;
        const matchSearch = searchTerm === '' ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });

    // Statistics
    const stats = {
        total: catalogItems.length,
        businessObjects: catalogItems.filter(i => i.type === 'business_object').length,
        physicalTables: catalogItems.filter(i => i.type === 'physical_table').length,
        mappings: catalogItems.filter(i => i.type === 'mapping').length
    };

    const tabs = [
        { id: 'all', label: '全部', count: stats.total },
        { id: 'business_object', label: '业务对象', count: stats.businessObjects },
        { id: 'physical_table', label: '物理表', count: stats.physicalTables },
        { id: 'mapping', label: '映射关系', count: stats.mappings }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">统一元数据目录</h2>
                    <p className="text-slate-500 mt-1">浏览和管理所有语义资产的元数据信息</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                        <RefreshCw size={16} />
                        <span>同步</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        <Plus size={16} />
                        <span>新增资产</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Layers size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                            <div className="text-xs text-slate-500">总资产数</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Layout size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{stats.businessObjects}</div>
                            <div className="text-xs text-slate-500">业务对象</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                            <Database size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-600">{stats.physicalTables}</div>
                            <div className="text-xs text-slate-500">物理表</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                            <GitMerge size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-600">{stats.mappings}</div>
                            <div className="text-xs text-slate-500">映射关系</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-4">
                    <div className="flex">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedType(tab.id)}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedType === tab.id
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${selectedType === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="relative py-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索资产名称、代码或描述..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-72"
                        />
                    </div>
                </div>

                {/* Asset Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.length > 0 ? filteredItems.map(item => {
                        const typeInfo = typeConfig[item.type];
                        const TypeIcon = typeInfo?.icon || Layers;

                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedAsset(item)}
                                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md hover:border-purple-300 ${selectedAsset?.id === item.id ? 'ring-2 ring-purple-500 border-purple-500' : 'border-slate-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo?.bgColor} ${typeInfo?.color}`}>
                                        <TypeIcon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-slate-800 truncate">{item.name}</h4>
                                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${item.status === 'published' || item.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {item.status === 'published' ? '已发布' : item.status === 'active' ? '活跃' : '草稿'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.code}</p>
                                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{item.description}</p>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                            <span>{item.fieldCount} 字段</span>
                                            {item.mappingCount !== undefined && <span>{item.mappingCount} 映射</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags?.slice(0, 3).map((tag: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <Search size={32} />
                            </div>
                            <p className="text-lg font-medium text-slate-600">未找到资产</p>
                            <p className="text-sm">尝试调整筛选条件或搜索关键词</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {selectedAsset && (
                <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                        <div className="flex items-start gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig[selectedAsset.type]?.bgColor} ${typeConfig[selectedAsset.type]?.color}`}>
                                {(() => { const Icon = typeConfig[selectedAsset.type]?.icon || Layers; return <Icon size={24} />; })()}
                            </div>
                            <div>
                                <span className={`px-2 py-0.5 text-xs rounded ${typeConfig[selectedAsset.type]?.bgColor} ${typeConfig[selectedAsset.type]?.color}`}>
                                    {typeConfig[selectedAsset.type]?.label}
                                </span>
                                <h3 className="text-lg font-bold text-slate-800 mt-1">{selectedAsset.name}</h3>
                                <p className="text-sm text-slate-500 font-mono">{selectedAsset.code}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">基本信息</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-400">负责人</span>
                                    <p className="text-slate-700 font-medium">{selectedAsset.owner}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">状态</span>
                                    <p className={`font-medium ${selectedAsset.status === 'published' || selectedAsset.status === 'active' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {selectedAsset.status === 'published' ? '已发布' : selectedAsset.status === 'active' ? '活跃' : '草稿'}
                                    </p>
                                </div>
                                {selectedAsset.domain && (
                                    <div>
                                        <span className="text-slate-400">业务域</span>
                                        <p className="text-slate-700 font-medium">{selectedAsset.domain}</p>
                                    </div>
                                )}
                                {selectedAsset.source && (
                                    <div>
                                        <span className="text-slate-400">数据源</span>
                                        <p className="text-slate-700 font-medium">{selectedAsset.source}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-slate-400">创建时间</span>
                                    <p className="text-slate-700">{selectedAsset.createdAt}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">最后更新</span>
                                    <p className="text-slate-700">{selectedAsset.lastUpdated}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">描述</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">{selectedAsset.description}</p>
                        </div>

                        {/* Stats */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">统计信息</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="text-2xl font-bold text-slate-800">{selectedAsset.fieldCount}</div>
                                    <div className="text-xs text-slate-500">字段数量</div>
                                </div>
                                {selectedAsset.mappingCount !== undefined && (
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-800">{selectedAsset.mappingCount}</div>
                                        <div className="text-xs text-slate-500">映射关系</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">标签</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedAsset.tags?.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Mapping Info for mappings */}
                        {selectedAsset.type === 'mapping' && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-3">映射信息</h4>
                                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                            <Layout size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400">源对象</span>
                                            <p className="text-sm font-medium text-slate-700">{selectedAsset.source}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRight size={16} className="text-slate-400" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center text-emerald-600">
                                            <Database size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-400">目标表</span>
                                            <p className="text-sm font-medium text-slate-700">{selectedAsset.target}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                        <button className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
                            编辑
                        </button>
                        <button className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                            查看详情
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: API 网关 (EE-05) - Generate APIs from Business Objects
// ------------------------------------------------------------------
const ApiGatewayView = ({ businessObjects }: { businessObjects: any[] }) => {
    const [generatedApis, setGeneratedApis] = useState<any[]>([]);
    const [selectedBO, setSelectedBO] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedApi, setSelectedApi] = useState<any>(null);
    const [apiTemplate, setApiTemplate] = useState({
        prefix: '/api/v1',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        auth: 'jwt'
    });

    // Initialize with some mock generated APIs
    useEffect(() => {
        const mockApis = businessObjects.filter(bo => bo.status === 'published').map(bo => ({
            id: `API_${bo.id}`,
            boId: bo.id,
            boName: bo.name,
            boCode: bo.code,
            basePath: `/api/v1/${bo.code}`,
            status: 'online',
            version: 'v1.0',
            createdAt: '2024-05-20',
            endpoints: [
                { method: 'GET', path: `/${bo.code}`, name: `查询${bo.name}列表`, qps: Math.floor(Math.random() * 500), latency: `${Math.floor(Math.random() * 50) + 10}ms` },
                { method: 'GET', path: `/${bo.code}/:id`, name: `获取${bo.name}详情`, qps: Math.floor(Math.random() * 300), latency: `${Math.floor(Math.random() * 30) + 5}ms` },
                { method: 'POST', path: `/${bo.code}`, name: `创建${bo.name}`, qps: Math.floor(Math.random() * 100), latency: `${Math.floor(Math.random() * 100) + 50}ms` },
                { method: 'PUT', path: `/${bo.code}/:id`, name: `更新${bo.name}`, qps: Math.floor(Math.random() * 80), latency: `${Math.floor(Math.random() * 80) + 30}ms` },
                { method: 'DELETE', path: `/${bo.code}/:id`, name: `删除${bo.name}`, qps: Math.floor(Math.random() * 20), latency: `${Math.floor(Math.random() * 40) + 20}ms` },
            ]
        }));
        setGeneratedApis(mockApis);
    }, [businessObjects]);

    // Generate API from selected BO
    const handleGenerateApi = () => {
        if (!selectedBO) return;

        // Check if already exists
        if (generatedApis.find(api => api.boId === selectedBO.id)) {
            alert('该业务对象已生成API！');
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            const newApi = {
                id: `API_${Date.now()}`,
                boId: selectedBO.id,
                boName: selectedBO.name,
                boCode: selectedBO.code,
                basePath: `${apiTemplate.prefix}/${selectedBO.code}`,
                status: 'draft',
                version: 'v1.0',
                createdAt: new Date().toLocaleDateString('zh-CN'),
                endpoints: apiTemplate.methods.map(method => ({
                    method,
                    path: method === 'GET' || method === 'DELETE' || method === 'PUT'
                        ? `/${selectedBO.code}/:id`
                        : `/${selectedBO.code}`,
                    name: method === 'GET' ? `查询${selectedBO.name}`
                        : method === 'POST' ? `创建${selectedBO.name}`
                            : method === 'PUT' ? `更新${selectedBO.name}`
                                : `删除${selectedBO.name}`,
                    qps: 0,
                    latency: '-'
                }))
            };
            setGeneratedApis(prev => [newApi, ...prev]);
            setSelectedBO(null);
            setIsGenerating(false);
        }, 1500);
    };

    // Publish API
    const handlePublishApi = (apiId: string) => {
        setGeneratedApis(prev => prev.map(api =>
            api.id === apiId ? { ...api, status: 'online' } : api
        ));
    };

    // Method colors
    const methodColors: Record<string, string> = {
        GET: 'bg-blue-100 text-blue-700',
        POST: 'bg-emerald-100 text-emerald-700',
        PUT: 'bg-amber-100 text-amber-700',
        DELETE: 'bg-red-100 text-red-700'
    };

    // Stats
    const onlineCount = generatedApis.filter(a => a.status === 'online').length;
    const totalEndpoints = generatedApis.reduce((acc, api) => acc + (api.endpoints?.length || 0), 0);

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Server className="text-orange-500" size={24} />
                        API 网关
                    </h2>
                    <p className="text-slate-500 mt-1">基于业务对象自动生成RESTful API接口</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">{onlineCount} 已上线</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">{totalEndpoints} 个端点</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left: Business Object Selection */}
                <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Layers size={16} className="text-blue-500" />
                            选择业务对象
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">选择要生成API的业务对象</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {businessObjects.map(bo => {
                            const hasApi = generatedApis.find(api => api.boId === bo.id);
                            return (
                                <div
                                    key={bo.id}
                                    onClick={() => !hasApi && setSelectedBO(bo)}
                                    className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedBO?.id === bo.id
                                            ? 'border-orange-500 bg-orange-50'
                                            : hasApi
                                                ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                                                : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-slate-800">{bo.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{bo.code}</div>
                                        </div>
                                        {hasApi ? (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs rounded-full">已生成</span>
                                        ) : (
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {bo.status === 'published' ? '已发布' : '草稿'}
                                            </span>
                                        )}
                                    </div>
                                    {bo.fields && (
                                        <div className="mt-2 text-xs text-slate-400">{bo.fields.length} 个字段</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* API Generation Config */}
                    {selectedBO && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">API 前缀</label>
                                <input
                                    value={apiTemplate.prefix}
                                    onChange={(e) => setApiTemplate(prev => ({ ...prev, prefix: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">HTTP Methods</label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {['GET', 'POST', 'PUT', 'DELETE'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setApiTemplate(prev => ({
                                                ...prev,
                                                methods: prev.methods.includes(method)
                                                    ? prev.methods.filter(m => m !== method)
                                                    : [...prev.methods, method]
                                            }))}
                                            className={`px-2 py-1 text-xs rounded font-bold ${apiTemplate.methods.includes(method)
                                                    ? methodColors[method]
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateApi}
                                disabled={isGenerating}
                                className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${isGenerating
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                    }`}
                            >
                                {isGenerating ? (
                                    <><RefreshCw size={14} className="animate-spin" /> 生成中...</>
                                ) : (
                                    <><Cpu size={14} /> 生成 API</>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Generated APIs List */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-slate-50">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2">
                            <Server size={16} />
                            已生成的 API 服务
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {generatedApis.length > 0 ? generatedApis.map(api => (
                            <div
                                key={api.id}
                                className={`bg-white border rounded-xl overflow-hidden transition-all ${selectedApi?.id === api.id ? 'border-orange-500 shadow-md' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setSelectedApi(selectedApi?.id === api.id ? null : api)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${api.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                <Server size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{api.boName}</div>
                                                <div className="text-xs text-slate-400 font-mono">{api.basePath}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${api.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {api.status === 'online' ? '已上线' : '草稿'}
                                            </span>
                                            {api.status !== 'online' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePublishApi(api.id); }}
                                                    className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600"
                                                >
                                                    发布上线
                                                </button>
                                            )}
                                            <ChevronRight
                                                size={16}
                                                className={`text-slate-400 transition-transform ${selectedApi?.id === api.id ? 'rotate-90' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Endpoints */}
                                {selectedApi?.id === api.id && (
                                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-3">API 端点列表</div>
                                        <div className="space-y-2">
                                            {api.endpoints.map((endpoint: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${methodColors[endpoint.method]}`}>
                                                            {endpoint.method}
                                                        </span>
                                                        <span className="font-mono text-sm text-slate-600">{endpoint.path}</span>
                                                        <span className="text-sm text-slate-400">- {endpoint.name}</span>
                                                    </div>
                                                    {api.status === 'online' && (
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <div className="text-center">
                                                                <div className="text-slate-400">QPS</div>
                                                                <div className="font-bold text-slate-700">{endpoint.qps}</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-slate-400">延迟</div>
                                                                <div className="font-bold text-slate-700">{endpoint.latency}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Code Sample */}
                                        <div className="mt-4 bg-slate-800 rounded-lg p-4 text-sm font-mono text-slate-300">
                                            <div className="text-slate-500 mb-2">// 调用示例</div>
                                            <div><span className="text-blue-400">curl</span> -X GET \</div>
                                            <div className="pl-4"><span className="text-emerald-400">"http://api.example.com{api.basePath}"</span> \</div>
                                            <div className="pl-4">-H <span className="text-amber-400">"Authorization: Bearer {'<token>'}"</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Server size={48} className="mb-4 opacity-20" />
                                <p className="text-sm text-center">暂无已生成的 API<br />请从左侧选择业务对象生成</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// 视图: 缓存策略 (EE-06)
// ------------------------------------------------------------------
const CacheStrategyView = () => {
    const [policies] = useState([
        { id: 'CP_001', name: '高频代码表缓存', target: 'Dictionaries', type: 'Local', ttl: '24h', eviction: 'LFU', status: 'Active' },
        { id: 'CP_002', name: '新生儿实时查询', target: 'Newborn (Single)', type: 'Redis', ttl: '5m', eviction: 'LRU', status: 'Active' },
        { id: 'CP_003', name: '统计报表预计算', target: 'Reports', type: 'Redis Cluster', ttl: '1h', eviction: 'FIFO', status: 'Inactive' },
    ]);

    const [cacheKeys] = useState([
        { key: 'bo:newborn:nb_123456', size: '2.4KB', created: '10:00:05', expires: '10:05:05', hits: 145 },
        { key: 'dict:hosp_level', size: '15KB', created: '08:00:00', expires: 'Tomorrow', hits: 5200 },
        { key: 'api:query:birth_cert:list', size: '450KB', created: '10:02:30', expires: '10:03:30', hits: 12 },
    ]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCw className="text-purple-500" size={24} />
                    缓存策略配置
                </h2>
                <p className="text-slate-500 mt-1">配置语义层数据的缓存加速策略</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policies */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Settings size={18} /> 策略定义
                    </h3>
                    {policies.map(cp => (
                        <div key={cp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-bold text-slate-700">{cp.name}</div>
                                <div className={`w-2 h-2 rounded-full ${cp.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <div>Target: <span className="text-slate-700">{cp.target}</span></div>
                                <div>Type: <span className="text-slate-700">{cp.type}</span></div>
                                <div>TTL: <span className="text-slate-700">{cp.ttl}</span></div>
                                <div>Eviction: <span className="text-slate-700">{cp.eviction}</span></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cache Keys */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={18} /> 热门缓存 Key
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-2">Key Pattern</th>
                                    <th className="px-4 py-2">Size</th>
                                    <th className="px-4 py-2">Hits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cacheKeys.map((k, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 font-mono text-slate-600 truncate max-w-[150px]" title={k.key}>{k.key}</td>
                                        <td className="px-4 py-2 text-slate-500">{k.size}</td>
                                        <td className="px-4 py-2 text-slate-700 font-medium">{k.hits}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};