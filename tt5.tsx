import React, { useState, useEffect } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X,
    Trash2, Edit, Play, Filter, Box, Table, Share2, Save,
    GitCommit, Zap, MousePointer, Move, ZoomIn, ZoomOut,
    HardDrive, Wifi, Lock, Eye, Sparkles, Scan, FileJson, ArrowUpRight,
    Sliders, CheckSquare, XCircle, AlertTriangle, FileWarning, Hammer,
    Book, Tag, User, Clock, Star, Terminal, Globe, Copy,
    Thermometer, Timer, BarChart3, Eraser, GitBranch, Network,
    BrainCircuit, Gauge, FileDigit, List
} from 'lucide-react';

// ==========================================
// 1. 模拟数据 (Mock Data)
// ==========================================

// TD: 业务梳理数据
const mockBusinessGoals = [
    {
        id: 'G_001',
        title: '出生一件事高效办成',
        type: '改革事项',
        priority: 'High',
        status: 'modeling',
        progress: 65,
        owner: '卫健委 / 数局',
        lastUpdate: '2024-05-20',
        description: '整合出生医学证明、户口登记、医保参保等多个事项，实现“一表申请、一网通办”。',
        relatedObjects: ['新生儿', '出生医学证明', '户籍信息'],
        stages: { policy: true, object: true, scenario: false }
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
        relatedObjects: [],
        stages: { policy: true, object: false, scenario: false }
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
        relatedObjects: ['数据目录', '归集任务'],
        stages: { policy: true, object: true, scenario: true }
    }
];

// TD: 业务对象
const mockBusinessObjects = [
    {
        id: 'BO_NEWBORN',
        name: '新生儿 (Newborn)',
        code: 'biz_newborn',
        domain: '出生一件事',
        owner: '卫健委业务处',
        status: 'published',
        version: 'v1.2',
        description: '自然人出生登记的核心业务对象，记录新生儿基础身份信息。',
        // 关联的源表（模拟数据）
        sourceTables: ['t_pop_base_info'],
        fields: [
            { id: 'f1', name: '姓名', code: 'name', type: 'String', length: '50', required: true, desc: '新生儿正式登记姓名' },
            { id: 'f2', name: '身份证号', code: 'id_card', type: 'String', length: '18', required: true, desc: '全区统一身份标识' },
            { id: 'f3', name: '出生时间', code: 'birth_date', type: 'DateTime', length: '-', required: true, desc: '精确到分' },
            { id: 'f4', name: '血型', code: 'blood_type', type: 'Enum', length: '2', required: false, desc: 'ABO血型标准' },
            { id: 'f5', name: '出生体重', code: 'weight', type: 'Decimal', length: '4,2', required: false, desc: '单位：kg' },
        ]
    },
    {
        id: 'BO_CERT',
        name: '出生医学证明',
        code: 'biz_birth_cert',
        domain: '出生一件事',
        owner: '医院管理处',
        status: 'draft',
        version: 'v0.9',
        description: '证明婴儿出生状态、血亲关系以及申报国籍、户籍取得公民身份的法定医学证明。',
        sourceTables: ['t_med_birth_cert'],
        fields: [
            { id: 'f1', name: '证明编号', code: 'cert_no', type: 'String', length: '20', required: true, desc: '全局唯一流水号' },
            { id: 'f2', name: '签发机构', code: 'issue_org', type: 'String', length: '100', required: true, desc: '助产机构名称' },
            { id: 'f3', name: '签发日期', code: 'issue_date', type: 'Date', length: '-', required: true, desc: '-' },
        ]
    }
];

// TD: 场景编排数据
const mockScenarios = [
    {
        id: 'SC_001',
        name: '出生医学证明申领流程',
        status: 'active',
        description: '新生儿出生后，由医院发起信息登记，监护人确认申领，最终系统自动签发电子证照。',
        nodes: [
            { id: 'n1', type: 'start', label: '出生登记', objectId: 'BO_NEWBORN', status: 'done' },
            { id: 'n2', type: 'action', label: '监护人申领', objectId: null, status: 'done' },
            { id: 'n3', type: 'object', label: '生成证明', objectId: 'BO_CERT', status: 'process' },
            { id: 'n4', type: 'end', label: '归档完成', objectId: null, status: 'pending' },
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
        nodes: [
            { id: 'n1', type: 'start', label: '获取证明', objectId: 'BO_CERT', status: 'pending' },
            { id: 'n2', type: 'object', label: '户籍登记', objectId: null, status: 'pending' }
        ],
        edges: [
            { from: 'n1', to: 'n2', label: '作为依据' }
        ]
    }
];

// BU: 数据源（扩展：包含关联表）
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

// BU: 扫描到的资产列表
const mockScanAssets = [
    {
        id: 'TBL_001',
        name: 't_pop_base_info',
        comment: '人口基础信息表',
        rows: '1.2M',
        updateTime: '2024-05-20 10:00',
        status: 'normal',
        columns: [
            { name: 'id', type: 'bigint', comment: '主键' },
            { name: 'name', type: 'varchar(50)', comment: '姓名' },
            { name: 'id_card', type: 'varchar(18)', comment: '身份证号' },
            { name: 'dob', type: 'datetime', comment: '出生日期' }
        ]
    },
    {
        id: 'TBL_002',
        name: 't_med_birth_cert',
        comment: '出生证明记录',
        rows: '450K',
        updateTime: '2024-05-19 15:30',
        status: 'new',
        columns: [
            { name: 'cert_id', type: 'varchar(32)', comment: '证明编号' },
            { name: 'baby_name', type: 'varchar(50)', comment: '新生儿姓名' },
            { name: 'issue_date', type: 'datetime', comment: '签发日期' }
        ]
    },
    {
        id: 'TBL_003',
        name: 't_hosp_dict',
        comment: '医院字典表',
        rows: '200',
        updateTime: '2024-01-01 00:00',
        status: 'normal',
        columns: [
            { name: 'hosp_code', type: 'varchar(20)', comment: '医院编码' },
            { name: 'hosp_name', type: 'varchar(100)', comment: '医院名称' }
        ]
    },
    {
        id: 'TBL_004',
        name: 't_vac_record',
        comment: '疫苗接种记录',
        rows: '3.5M',
        updateTime: '2024-05-20 09:45',
        status: 'changed',
        columns: [
            { name: 'record_id', type: 'bigint', comment: '记录ID' },
            { name: 'vac_code', type: 'varchar(20)', comment: '疫苗编码' },
            { name: 'inject_time', type: 'datetime', comment: '接种时间' }
        ]
    },
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

// SG: 映射关系
const mockMappings = [
    { boField: '姓名', tblField: 'p_name', rule: 'Direct Copy' },
    { boField: '身份证号', tblField: 'id_card_num', rule: 'Direct Copy' },
    { boField: '出生时间', tblField: 'birth_ts', rule: 'Format: YYYY-MM-DD HH:mm:ss' },
    { boField: '出生体重', tblField: 'weight_kg', rule: 'Direct Copy' },
];

// BU: AI 候选推荐
const mockAICandidates = [
    {
        id: 'AI_001',
        sourceTable: 't_med_birth_cert',
        suggestedName: '出生医学证明记录',
        confidence: 0.92,
        reason: '表名包含 "birth_cert"，字段包含 "cert_no", "issue_date"，高度匹配业务语义。',
        scores: { nameMatch: 95, fieldMatch: 88, dataSample: 92 },
        mappedFields: 4,
        status: 'pending',
        previewFields: [
            { col: 'cert_id', type: 'varchar(32)', attr: '证明编号', conf: 'High' },
            { col: 'issue_time', type: 'datetime', attr: '签发时间', conf: 'Medium' },
            { col: 'baby_name', type: 'varchar(50)', attr: '新生儿姓名', conf: 'High' },
            { col: 'hosp_code', type: 'varchar(20)', attr: '机构编码', conf: 'Low' }
        ]
    },
    {
        id: 'AI_002',
        sourceTable: 't_vac_record',
        suggestedName: '疫苗接种明细',
        confidence: 0.85,
        reason: '表名 "vac" 缩写匹配 Vaccine，数据量级较大，判定为明细事实表。',
        scores: { nameMatch: 80, fieldMatch: 90, dataSample: 82 },
        mappedFields: 3,
        status: 'pending',
        previewFields: [
            { col: 'vac_code', type: 'varchar(20)', attr: '疫苗编码', conf: 'High' },
            { col: 'inject_date', type: 'datetime', attr: '接种时间', conf: 'High' },
            { col: 'dose_no', type: 'int', attr: '剂次', conf: 'High' }
        ]
    },
    {
        id: 'AI_004',
        sourceTable: 't_newborn_archive_2023',
        suggestedName: '新生儿 (Newborn)',
        confidence: 0.78,
        reason: '历史归档表，结构与主表一致。建议作为历史分区或独立快照对象。',
        scores: { nameMatch: 70, fieldMatch: 95, dataSample: 60 },
        mappedFields: 5,
        status: 'pending',
        previewFields: []
    },
    {
        id: 'AI_003',
        sourceTable: 'sys_log_2024',
        suggestedName: '系统日志',
        confidence: 0.45,
        reason: '技术属性字段较多，业务语义不明显，建议忽略。',
        scores: { nameMatch: 40, fieldMatch: 30, dataSample: 50 },
        mappedFields: 0,
        status: 'ignored',
        previewFields: []
    }
];

// SG: 冲突检测数据
const mockConflicts = [
    {
        id: 'CF_001',
        severity: 'High',
        type: 'Mapping Missing',
        title: "属性 '血型' 缺失映射",
        desc: "业务对象 '新生儿' 定义了必填属性 '血型'，但在绑定的物理表 't_pop_base_info' 中未找到对应的映射字段。",
        objectName: '新生儿 (Newborn)',
        assetName: 't_pop_base_info',
        detectedAt: '2024-05-20 10:05',
        status: 'Open'
    },
    {
        id: 'CF_002',
        severity: 'Medium',
        type: 'Type Mismatch',
        title: "属性 '出生体重' 类型不兼容",
        desc: "业务定义为 'Decimal(4,2)'，物理字段 'weight_kg' 为 'String'。可能导致数值计算错误。",
        objectName: '新生儿 (Newborn)',
        assetName: 't_pop_base_info',
        detectedAt: '2024-05-19 16:30',
        status: 'Open'
    },
    {
        id: 'CF_003',
        severity: 'Low',
        type: 'Schema Drift',
        title: "物理表新增字段未映射",
        desc: "物理表 't_pop_base_info' 新增了字段 'is_twins' (是否双胞胎)，建议补充到业务对象定义中。",
        objectName: '新生儿 (Newborn)',
        assetName: 't_pop_base_info',
        detectedAt: '2024-05-21 09:00',
        status: 'Open'
    }
];

// SG: 统一元数据 (Catalog)
const mockCatalogAssets = [
    { id: 'AS_001', name: '新生儿 (Newborn)', type: 'Business Object', code: 'biz_newborn', owner: '卫健委业务处', quality: 98, status: 'Active', tags: ['核心', '人口', 'L1'], lastUpdate: '2024-05-20' },
    { id: 'AS_002', name: '出生医学证明', type: 'Business Object', code: 'biz_birth_cert', owner: '医院管理处', quality: 85, status: 'Draft', tags: ['证照', 'L1'], lastUpdate: '2024-05-18' },
    { id: 'AS_003', name: 't_pop_base_info', type: 'Physical Table', code: 'hosp_db.t_pop_base', owner: 'DBA Team', quality: 100, status: 'Active', tags: ['MySQL', 'Raw'], lastUpdate: '2024-05-21' },
    { id: 'AS_004', name: 't_med_birth_cert', type: 'Physical Table', code: 'hosp_db.t_cert', owner: 'DBA Team', quality: 92, status: 'Active', tags: ['MySQL', 'Raw'], lastUpdate: '2024-05-21' },
];

// EE: API 网关
const mockApiServices = [
    {
        id: 'API_001',
        name: '查询新生儿详情',
        method: 'GET',
        path: '/api/v1/newborn/{id}',
        objectName: '新生儿 (Newborn)',
        status: 'Online',
        qps: 120,
        latency: '45ms',
        errorRate: '0.02%'
    },
    {
        id: 'API_002',
        name: '创建出生证明申领',
        method: 'POST',
        path: '/api/v1/birth-cert/apply',
        objectName: '出生医学证明',
        status: 'Online',
        qps: 45,
        latency: '120ms',
        errorRate: '0.15%'
    },
    {
        id: 'API_003',
        name: '人口基础信息同步',
        method: 'POST',
        path: '/api/v1/sync/population',
        objectName: '新生儿 (Newborn)',
        status: 'Offline',
        qps: 0,
        latency: '-',
        errorRate: '-'
    },
];

// EE: 缓存策略
const mockCachePolicies = [
    { id: 'CP_001', name: '高频代码表缓存', target: 'Dictionaries', type: 'Local', ttl: '24h', eviction: 'LFU', status: 'Active' },
    { id: 'CP_002', name: '新生儿实时查询', target: 'Newborn (Single)', type: 'Redis', ttl: '5m', eviction: 'LRU', status: 'Active' },
    { id: 'CP_003', name: '统计报表预计算', target: 'Reports', type: 'Redis Cluster', ttl: '1h', eviction: 'FIFO', status: 'Inactive' },
];

const mockCacheKeys = [
    { key: 'bo:newborn:nb_123456', size: '2.4KB', created: '10:00:05', expires: '10:05:05', hits: 145 },
    { key: 'dict:hosp_level', size: '15KB', created: '08:00:00', expires: 'Tomorrow', hits: 5200 },
    { key: 'api:query:birth_cert:list', size: '450KB', created: '10:02:30', expires: '10:03:30', hits: 12 },
];

// SG: 血缘数据
const mockLineage = {
    nodes: [
        { id: 'DS_001', label: '卫健委_前置库 (MySQL)', type: 'source' },
        { id: 'TBL_001', label: 't_pop_base_info', type: 'table' },
        { id: 'BO_NEWBORN', label: '新生儿 (Newborn)', type: 'object' },
        { id: 'API_001', label: '查询新生儿详情 (API)', type: 'api' },
        { id: 'API_003', label: '人口基础信息同步 (API)', type: 'api' }
    ],
    edges: [
        { from: 'DS_001', to: 'TBL_001' },
        { from: 'TBL_001', to: 'BO_NEWBORN' },
        { from: 'BO_NEWBORN', to: 'API_001' },
        { from: 'BO_NEWBORN', to: 'API_003' }
    ]
};

// ==========================================
// 2. 辅助小组件 (Utility Components)
// ==========================================

const StatCard = ({ label, value, trend, icon: Icon, color }) => {
    const colorMap = {
        blue: "text-blue-600 bg-blue-50 border-blue-200",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
        purple: "text-purple-600 bg-purple-50 border-purple-200",
        orange: "text-orange-600 bg-orange-50 border-orange-200",
        red: "text-red-600 bg-red-50 border-red-200",
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.blue}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                {trend && (
                    <span className={`${trend === 'Healthy' || trend.includes('+') ? 'text-emerald-600' : 'text-slate-500'} font-bold bg-slate-50 px-1.5 py-0.5 rounded mr-2`}>
                        {trend}
                    </span>
                )}
                <span className="text-slate-400">vs last check</span>
            </div>
        </div>
    );
};

const StepItem = ({ status, text }) => (
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

const BookIcon = ({ size, className }) => (
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

const ScoreBar = ({ label, score }) => (
    <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 w-24 text-right">{label}</span>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-orange-400' : 'bg-red-400'}`} style={{ width: `${score}%` }}></div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 w-8">{score}</span>
    </div>
);

// --- 数据源树组件 (Data Source Tree) ---
const DataSourceTree = ({ dataSources, selectedDataSourceId, onSelectDataSource, selectedTableId, onSelectTable }) => {
    const [expandedTypes, setExpandedTypes] = useState(['MySQL', 'Oracle', 'PostgreSQL']);
    const [searchTerm, setSearchTerm] = useState('');

    // 按数据库类型分组
    const groupedSources = dataSources.reduce((acc, ds) => {
        if (!acc[ds.type]) acc[ds.type] = [];
        acc[ds.type].push(ds);
        return acc;
    }, {});

    // 数据库类型图标和颜色映射
    const typeConfig = {
        MySQL: { color: 'text-blue-600 bg-blue-50', shortName: 'My' },
        Oracle: { color: 'text-orange-600 bg-orange-50', shortName: 'Or' },
        PostgreSQL: { color: 'text-emerald-600 bg-emerald-50', shortName: 'Pg' }
    };

    const toggleType = (type) => {
        setExpandedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const filteredGroupedSources = Object.entries(groupedSources).reduce((acc, [type, sources]) => {
        const filtered = sources.filter(ds =>
            ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ds.dbName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) acc[type] = filtered;
        return acc;
    }, {});

    const selectedDataSource = dataSources.find(ds => ds.id === selectedDataSourceId);

    return (
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
                                            onClick={() => onSelectDataSource(ds.id)}
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
                                                {ds.tables.map(table => (
                                                    <button
                                                        key={table.id}
                                                        onClick={() => onSelectTable(table.id)}
                                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${selectedTableId === table.id
                                                            ? 'bg-purple-50 text-purple-700 font-medium'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <Table size={12} className={selectedTableId === table.id ? 'text-purple-500' : 'text-slate-400'} />
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
    );
};

// ==========================================
// 3. 布局组件 (Layout Components)
// ==========================================

const Sidebar = ({ activeModule, setActiveModule }) => {
    const menus = [
        { title: '概览', items: [{ id: 'dashboard', label: '控制台 Dashboard', icon: Activity }] },
        {
            title: '业务建模',
            color: 'text-blue-400',
            items: [
                { id: 'td_goals', label: '业务梳理 (TD-01)', icon: FileText },
                { id: 'td_modeling', label: '业务对象建模 (TD-03)', icon: Box },
                { id: 'td_scenario', label: '场景编排 (TD-04)', icon: Layers },
            ]
        },
        {
            title: '数据发现',
            color: 'text-emerald-400',
            items: [
                { id: 'bu_connect', label: '数据源管理 (BU-01)', icon: Database },
                { id: 'bu_discovery', label: '资产扫描 (BU-02)', icon: Scan },
                { id: 'bu_candidates', label: '候选生成 (BU-04)', icon: Sparkles },
            ]
        },
        {
            title: 'SG 语义治理中心',
            color: 'text-purple-400',
            items: [
                { id: 'mapping', label: '映射工作台 (SG-01)', icon: GitMerge },
                { id: 'governance', label: '冲突检测 (SG-02)', icon: Shield },
                { id: 'catalog', label: '统一元数据 (SG-04)', icon: BookIcon },
                { id: 'lineage', label: '全链路血缘 (SG-05)', icon: GitBranch },
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
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <Link className="text-white" size={18} />
                </div>
                <div>
                    <h1 className="font-bold text-white tracking-tight">SemanticLink</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Enterprise Edition</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                {menus.map((group, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${group.color || 'text-slate-500'}`}>
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveModule(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${activeModule === item.id
                                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                                        : 'hover:bg-slate-800/50 hover:text-white'
                                        }`}
                                >
                                    <item.icon size={16} strokeWidth={1.5} />
                                    <span>{item.label}</span>
                                    {activeModule === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                        JD
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-white">John Doe</div>
                        <div className="text-xs text-slate-500">Chief Data Architect</div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const Header = ({ activeModule }) => {
    const getTitle = (id) => {
        switch (id) {
            case 'td_goals': return '业务梳理';
            case 'td_modeling': return '业务对象建模';
            case 'td_scenario': return '场景编排';
            case 'bu_connect': return '数据源管理';
            case 'bu_discovery': return '资产扫描';
            case 'bu_candidates': return '候选生成';
            case 'mapping': return '映射工作台';
            case 'governance': return '冲突检测与治理';
            case 'catalog': return '统一元数据目录';
            case 'ee_api': return 'API 服务网关';
            case 'ee_cache': return '缓存策略配置';
            case 'lineage': return '全链路血缘分析';
            default: return id.replace('_', ' ');
        }
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center text-sm breadcrumbs text-slate-500">
                <span>Platform</span>
                <ChevronRight size={14} className="mx-2" />
                <span className="font-medium text-slate-800 capitalize">{getTitle(activeModule)}</span>
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
};

// ==========================================
// 4. 功能视图组件 (Feature Views)
// ==========================================

// --- 视图 1: 仪表盘 Dashboard ---
const DashboardView = ({ setActiveModule }) => (
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

// --- 视图: 业务梳理 (TD-01) ---
const BusinessGoalsView = ({ setActiveModule }) => {
    const [goals, setGoals] = useState(mockBusinessGoals);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [newGoal, setNewGoal] = useState({
        title: '',
        type: '改革事项',
        priority: 'Medium',
        owner: '',
        description: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filterTabs = [
        { id: 'all', label: '全部' },
        { id: 'planning', label: '规划中' },
        { id: 'modeling', label: '建模中' },
        { id: 'implemented', label: '已落地' },
    ];

    const handleSave = () => {
        if (!newGoal.title) return;

        if (editMode && currentId) {
            setGoals(goals.map(g => g.id === currentId ? {
                ...g,
                ...newGoal,
                lastUpdate: new Date().toISOString().split('T')[0]
            } : g));
        } else {
            const goalData = {
                id: `G_${Date.now()}`,
                ...newGoal,
                status: 'planning',
                progress: 0,
                lastUpdate: new Date().toISOString().split('T')[0],
                relatedObjects: [],
                stages: { policy: false, object: false, scenario: false }
            };
            setGoals([goalData, ...goals]);
        }

        setIsModalOpen(false);
        setNewGoal({ title: '', type: '改革事项', priority: 'Medium', owner: '', description: '' });
        setEditMode(false);
        setCurrentId(null);
    };

    const handleCreateOpen = () => {
        setEditMode(false);
        setCurrentId(null);
        setNewGoal({ title: '', type: '改革事项', priority: 'Medium', owner: '', description: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (goal) => {
        setEditMode(true);
        setCurrentId(goal.id);
        setNewGoal({
            title: goal.title,
            type: goal.type,
            priority: goal.priority,
            owner: goal.owner,
            description: goal.description
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('确定要删除此梳理事项吗？')) {
            setGoals(goals.filter(g => g.id !== id));
        }
    };

    const handleContinue = () => {
        setActiveModule('td_modeling');
    }

    const filteredGoals = goals.filter(goal => {
        const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            goal.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatCard label="梳理事项总数" value={goals.length} trend="+12%" icon={List} color="blue" />
                <StatCard label="本周新增" value={2} trend="Active" icon={Plus} color="emerald" />
                <StatCard label="建模完成率" value="65%" trend="+5%" icon={CheckCircle} color="purple" />
                <StatCard label="涉及部门" value="5" trend="" icon={User} color="orange" />
            </div>

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
                        onClick={handleCreateOpen}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    >
                        <Plus size={16} /> 新建梳理事项
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <h3 className="font-bold text-slate-800 shrink-0">梳理清单</h3>
                        <div className="flex items-center bg-slate-200 rounded-lg p-1 gap-1">
                            {filterTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filterStatus === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索事项名称或部门..."
                                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 w-64 shadow-sm"
                            />
                        </div>
                        <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded border border-slate-200 bg-white">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 flex-1">
                    {filteredGoals.length > 0 ? (
                        filteredGoals.map((goal) => (
                            <div key={goal.id} className="p-6 hover:bg-slate-50 transition-colors group relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${goal.priority === 'High' ? 'bg-red-500 shadow-red-200 shadow-sm' :
                                            goal.priority === 'Medium' ? 'bg-orange-500 shadow-orange-200 shadow-sm' : 'bg-blue-500 shadow-blue-200 shadow-sm'
                                            }`}></span>
                                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                                            {goal.title}
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -ml-1" />
                                        </h4>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200 text-slate-500 bg-white uppercase tracking-wide">
                                            {goal.type}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={handleContinue}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                        >
                                            <Play size={12} fill="currentColor" /> 继续梳理
                                        </button>
                                        <button
                                            onClick={() => handleEdit(goal)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(goal.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-slate-500 text-sm mb-5 max-w-3xl leading-relaxed pl-5 border-l-2 border-transparent group-hover:border-slate-200 transition-colors">
                                    {goal.description}
                                </p>

                                <div className="flex items-center justify-between pl-5">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 mr-1 font-medium">当前阶段:</span>

                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${goal.stages?.policy ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                                                <FileText size={12} />
                                                <span className="text-xs">政策拆解</span>
                                            </div>
                                            <ArrowRight size={12} className="text-slate-300" />

                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${goal.stages?.object ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                                                <Layout size={12} />
                                                <span className="text-xs">对象定义</span>
                                            </div>
                                            <ArrowRight size={12} className="text-slate-300" />

                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${goal.stages?.scenario ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}>
                                                <Layers size={12} />
                                                <span className="text-xs">场景编排</span>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                                            <span className="text-slate-300">|</span>
                                            <span className="text-slate-400">牵头部门:</span>
                                            <span>{goal.owner || '待定'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-32">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${goal.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono font-medium text-slate-400 w-8 text-right">
                                            {goal.progress}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Search size={48} className="mb-4 text-slate-200" />
                            <p>未找到匹配的梳理事项</p>
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="mt-2 text-sm text-blue-500 hover:underline"
                            >
                                清除筛选条件
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editMode ? '编辑梳理事项' : '新建业务梳理事项'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
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
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="例如：残疾人服务一件事"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                                    <select
                                        value={newGoal.type}
                                        onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
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
                                        value={newGoal.priority}
                                        onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
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
                                    value={newGoal.owner}
                                    onChange={(e) => setNewGoal({ ...newGoal, owner: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="例如：民政局"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                                <textarea
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm h-24 resize-none"
                                    placeholder="请输入事项的详细背景或目标..."
                                />
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
                                onClick={handleSave}
                                disabled={!newGoal.title}
                                className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newGoal.title ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                            >
                                {editMode ? '保存修改' : '创建事项'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 视图: 业务对象建模 (TD-03) ---
const BusinessModelingView = ({ businessObjects, setBusinessObjects }) => {
    const [selectedId, setSelectedId] = useState(businessObjects[0]?.id);
    const [activeTab, setActiveTab] = useState('structure');

    const activeObject = businessObjects.find(bo => bo.id === selectedId) || businessObjects[0];

    const handleDeleteField = (fieldId) => {
        if (!confirm('确定删除该属性吗？')) return;
        const updatedBO = {
            ...activeObject,
            fields: activeObject.fields.filter(f => f.id !== fieldId)
        };
        setBusinessObjects(businessObjects.map(bo => bo.id === activeObject.id ? updatedBO : bo));
    };

    const handleAddField = () => {
        const newField = {
            id: `f_${Date.now()}`,
            name: '新属性',
            code: 'new_field',
            type: 'String',
            length: '50',
            required: false,
            desc: '描述...'
        };
        const updatedBO = {
            ...activeObject,
            fields: [...activeObject.fields, newField]
        };
        setBusinessObjects(businessObjects.map(bo => bo.id === activeObject.id ? updatedBO : bo));
    };

    return (
        <div className="flex h-full flex-col gap-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                <StatCard label="业务对象总数" value={businessObjects.length} trend="+2" icon={Box} color="blue" />
                <StatCard label="已发布" value={businessObjects.filter(b => b.status === 'published').length} trend="Active" icon={CheckCircle} color="emerald" />
                <StatCard label="草稿中" value={businessObjects.filter(b => b.status === 'draft').length} trend="Pending" icon={Edit} color="orange" />
                <StatCard label="平均属性数" value="4.5" trend="" icon={List} color="purple" />
            </div>

            <div className="flex h-full gap-6 overflow-hidden">
                {/* Left: List */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">业务对象列表</h3>
                        <button className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input type="text" placeholder="搜索对象..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {businessObjects.map(bo => (
                            <div
                                key={bo.id}
                                onClick={() => setSelectedId(bo.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedId === bo.id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm ${selectedId === bo.id ? 'text-blue-800' : 'text-slate-700'}`}>{bo.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${bo.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>{bo.status === 'published' ? '已发布' : '草稿'}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-mono mb-1">{bo.code}</div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="bg-slate-100 px-1 rounded">{bo.version}</span>
                                    <span>{bo.fields.length} 属性</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Modeling Canvas */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-bold text-slate-800">{activeObject.name}</h2>
                                <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {activeObject.code}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 max-w-2xl">{activeObject.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">
                                <Share2 size={14} /> 关系图谱
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm shadow-blue-200">
                                <Save size={14} /> 保存模型
                            </button>
                        </div>
                    </div>

                    <div className="px-6 border-b border-slate-200 flex gap-6">
                        <button
                            onClick={() => setActiveTab('structure')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'structure' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            数据结构 (Fields)
                        </button>
                        <button
                            onClick={() => setActiveTab('relation')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'relation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            关系图谱 (Relations)
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            数据预览 (Preview)
                        </button>
                    </div>

                    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
                        {activeTab === 'structure' && (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                                    <h4 className="font-bold text-slate-700 text-sm">属性列表</h4>
                                    <button
                                        onClick={handleAddField}
                                        className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:bg-blue-50 px-2 py-1 rounded"
                                    >
                                        <Plus size={14} /> 添加属性
                                    </button>
                                </div>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 w-12 text-center">#</th>
                                            <th className="px-4 py-3">属性名称</th>
                                            <th className="px-4 py-3">编码 (Code)</th>
                                            <th className="px-4 py-3">数据类型</th>
                                            <th className="px-4 py-3">长度</th>
                                            <th className="px-4 py-3 text-center">必填</th>
                                            <th className="px-4 py-3">业务描述</th>
                                            <th className="px-4 py-3 text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeObject.fields.map((field, idx) => (
                                            <tr key={field.id} className="hover:bg-blue-50/30 group">
                                                <td className="px-4 py-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                    {field.name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-500 text-xs">{field.code}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                                                        {field.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs">{field.length}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {field.required ? (
                                                        <div className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                                                            <CheckCircle size={10} />
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{field.desc}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="text-slate-400 hover:text-blue-600">
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteField(field.id)}
                                                            className="text-slate-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'relation' && (
                            <div className="flex flex-col items-center justify-center h-full bg-white border border-slate-200 rounded-lg shadow-inner p-8">
                                <div className="relative w-full max-w-2xl h-64 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center">
                                    <div className="absolute left-1/4 top-1/2 -translate-y-1/2 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-sm font-bold z-10">
                                        {activeObject.name}
                                    </div>
                                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-32 h-0.5 bg-slate-300"></div>
                                    <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400">1 : N</div>
                                    <div className="absolute right-1/4 top-1/2 -translate-y-1/2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded-lg shadow-sm border-dashed">
                                        关联对象...
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-500">可视化关系编辑器 (开发中)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 视图: 场景编排 (TD-04) ---
const ScenarioOrchestrationView = ({ businessObjects }) => {
    const [activeScenarioId, setActiveScenarioId] = useState(mockScenarios[0].id);
    const activeScenario = mockScenarios.find(s => s.id === activeScenarioId) || mockScenarios[0];

    return (
        <div className="flex h-full flex-col gap-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                <StatCard label="场景总数" value={mockScenarios.length} trend="+1" icon={Layers} color="purple" />
                <StatCard label="生效场景" value={mockScenarios.filter(s => s.status === 'active').length} trend="Online" icon={Play} color="emerald" />
                <StatCard label="平均节点数" value="3.5" trend="" icon={Share2} color="blue" />
                <StatCard label="覆盖对象" value="8" trend="High" icon={Box} color="orange" />
            </div>

            <div className="flex h-full gap-6 overflow-hidden">
                <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">业务场景列表</h3>
                        <button className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input type="text" placeholder="搜索场景..." className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {mockScenarios.map(sc => (
                            <div
                                key={sc.id}
                                onClick={() => setActiveScenarioId(sc.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${activeScenarioId === sc.id
                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm truncate ${activeScenarioId === sc.id ? 'text-purple-800' : 'text-slate-700'}`}>{sc.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>{sc.status === 'active' ? '生效' : '草稿'}</span>
                                </div>
                                <div className="text-xs text-slate-400 line-clamp-2">{sc.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl shadow-inner flex flex-col overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="选择模式"><MousePointer size={18} /></button>
                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="移动画布"><Move size={18} /></button>
                        <div className="h-px bg-slate-200 my-1"></div>
                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="放大"><ZoomIn size={18} /></button>
                        <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="缩小"><ZoomOut size={18} /></button>
                    </div>

                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg shadow-sm hover:bg-slate-50">
                            <Play size={14} className="text-emerald-500" /> 模拟运行
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg shadow-sm hover:bg-purple-700 shadow-purple-200">
                            <Save size={14} /> 保存场景
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto flex items-center justify-center p-10">
                        <div className="flex items-center gap-8">
                            {activeScenario.nodes.map((node, idx) => {
                                const matchedBO = businessObjects.find(bo => bo.id === node.objectId);
                                const isLast = idx === activeScenario.nodes.length - 1;
                                const edge = activeScenario.edges.find(e => e.from === node.id);

                                return (
                                    <React.Fragment key={node.id}>
                                        <div className={`relative w-48 bg-white rounded-xl shadow-lg border-2 transition-transform hover:-translate-y-1 ${node.type === 'start' ? 'border-blue-400' :
                                            node.type === 'end' ? 'border-slate-400' :
                                                node.type === 'object' ? 'border-purple-400' : 'border-orange-400'
                                            }`}>
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

                                        {!isLast && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm relative top-3 z-10">
                                                    {edge?.label || 'next'}
                                                </div>
                                                <div className="w-16 h-0.5 bg-slate-300 relative">
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 cursor-pointer transition-colors bg-white/50">
                                <Plus size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-60 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Box size={16} className="text-purple-500" />
                            业务对象库
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">拖拽对象至画布以建立关联</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {businessObjects.map(bo => (
                            <div key={bo.id} className="p-3 bg-white border border-slate-200 rounded shadow-sm cursor-grab hover:border-purple-300 hover:shadow-md transition-all group active:cursor-grabbing">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-slate-700">{bo.name}</span>
                                    <Link size={12} className="text-slate-300 group-hover:text-purple-500" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{bo.code}</div>
                            </div>
                        ))}
                        <div className="p-2 border-t border-slate-100 mt-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">流程节点组件</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-blue-400 cursor-pointer">开始</div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-orange-400 cursor-pointer">动作</div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-slate-400 cursor-pointer">结束</div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-green-400 cursor-pointer">判断</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 视图: 数据源管理 (BU-01) ---
const DataSourceManagementView = ({ dataSources, setDataSources }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [testingId, setTestingId] = useState(null);

    const [newDS, setNewDS] = useState({ name: '', type: 'MySQL', host: '', port: '', user: '', password: '', dbName: '' });

    const handleCreate = () => {
        if (!newDS.name) return;
        if (editMode && currentId) {
            setDataSources(dataSources.map(ds => ds.id === currentId ? { ...ds, ...newDS } : ds));
        } else {
            setDataSources([...dataSources, { id: `DS_${Date.now()}`, ...newDS, status: 'connected', lastScan: 'Never', tableCount: 0 }]);
        }
        setIsModalOpen(false);
        setEditMode(false);
    };

    const handleEdit = (ds) => {
        setNewDS({ name: ds.name, type: ds.type, host: ds.host, port: ds.port, user: '', password: '', dbName: ds.dbName || '' });
        setEditMode(true);
        setCurrentId(ds.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('确定要移除该数据源连接吗？')) {
            setDataSources(dataSources.filter(d => d.id !== id));
        }
    };

    const handleTestConnection = (id) => {
        setTestingId(id);
        setTimeout(() => {
            setTestingId(null);
            alert('连接测试成功！');
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <StatCard label="连接总数" value={dataSources.length} trend="+1" icon={Database} color="blue" />
                <StatCard label="正常运行" value={dataSources.filter(d => d.status === 'connected').length} trend="Healthy" icon={CheckCircle} color="emerald" />
                <StatCard label="总数据表" value={dataSources.reduce((a, b) => a + (b.tableCount || 0), 0)} trend="" icon={Table} color="purple" />
                <StatCard label="平均延迟" value="12ms" trend="" icon={Zap} color="orange" />
            </div>

            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">数据源管理</h2><button onClick={() => { setEditMode(false); setNewDS({ name: '', type: 'MySQL', host: '', port: '', user: '', password: '', dbName: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /> 新建连接</button></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dataSources.map(ds => (
                    <div key={ds.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">{ds.type.substring(0, 2)}</div><div><div className="font-bold text-slate-800">{ds.name}</div><div className="text-xs text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>{ds.status}</div></div></div>
                        <div className="space-y-2 text-sm text-slate-500"><div className="flex justify-between"><span>Host:</span><span>{ds.host}:{ds.port}</span></div><div className="flex justify-between"><span>Tables:</span><span>{ds.tableCount}</span></div></div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <button onClick={() => handleTestConnection(ds.id)} className="text-xs font-bold text-blue-600 flex items-center gap-1">{testingId === ds.id ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />} 测试连接</button>
                            <div className="flex gap-3">
                                <button onClick={() => handleEdit(ds)} className="text-slate-400 hover:text-slate-600"><Edit size={14} /></button>
                                <button onClick={() => handleDelete(ds.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4">
                        <h3 className="font-bold text-lg">{editMode ? '编辑连接' : '新建连接'}</h3>
                        <input type="text" placeholder="连接名称" value={newDS.name} className="w-full border p-2 rounded" onChange={e => setNewDS({ ...newDS, name: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Host" value={newDS.host} className="w-full border p-2 rounded" onChange={e => setNewDS({ ...newDS, host: e.target.value })} />
                            <input type="text" placeholder="Port" value={newDS.port} className="w-full border p-2 rounded" onChange={e => setNewDS({ ...newDS, port: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2">取消</button><button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">保存</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 视图: 资产扫描 (BU-02) ---
const AssetScanningView = ({ setActiveModule, candidates }) => {
    const [selectedTables, setSelectedTables] = useState([]);
    const [viewingTable, setViewingTable] = useState(null); // For details modal

    // Function to check if a table is mapped to any business object
    const getPipelineStatus = (tableName) => {
        // 1. Check if analyzed (in candidates)
        const isCandidate = candidates.some(c => c.sourceTable === tableName);
        if (isCandidate) return { status: 'pending', label: '待审核', color: 'text-orange-600 bg-orange-50' };

        // 2. Check if published (This would normally check against businessObjects mappings)
        // For mock purposes, let's assume 't_pop_base_info' is published
        if (tableName === 't_pop_base_info') return { status: 'published', label: '已发布', color: 'text-emerald-600 bg-emerald-50' };

        return { status: 'unmapped', label: '未接入', color: 'text-slate-500 bg-slate-100' };
    };

    const handleGenerateCandidates = () => {
        if (selectedTables.length === 0) {
            alert("请先选择至少一个物理表进行分析。");
            return;
        }
        alert(`正在对 ${selectedTables.length} 个表进行 AI 语义分析...`);
        setActiveModule('bu_candidates');
    };

    return (
        <div className="space-y-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard label="已扫描资产" value="1,204" trend="+4" icon={Database} color="emerald" />
                <StatCard label="新增物理表" value="23" trend="+5" icon={Plus} color="blue" />
                <StatCard label="结构变更" value="12" trend="Warning" icon={GitMerge} color="orange" />
                <StatCard label="接入率" value="45%" trend="Low" icon={PieChart} color="purple" />
            </div>

            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">资产扫描中心</h2><button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Scan size={16} /> 开始扫描</button></div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">{selectedTables.length > 0 && <button onClick={handleGenerateCandidates} className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded flex items-center gap-1 animate-pulse"><Sparkles size={12} /> 为 {selectedTables.length} 个表生成候选</button>}</div>
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3 w-10"><input type="checkbox" /></th><th className="px-6 py-3">物理表名</th><th className="px-6 py-3">中文注释</th><th className="px-6 py-3">数据量</th><th className="px-6 py-3">流水线状态</th><th className="px-6 py-3">扫描状态</th><th className="px-6 py-3 text-right">操作</th></tr></thead>
                    <tbody>{mockScanAssets.map(a => {
                        const pipeline = getPipelineStatus(a.name);
                        return (
                            <tr key={a.id} className="border-b hover:bg-slate-50">
                                <td className="px-6 py-4"><input type="checkbox" checked={selectedTables.includes(a.name)} onChange={() => setSelectedTables(prev => prev.includes(a.name) ? prev.filter(n => n !== a.name) : [...prev, a.name])} /></td>
                                <td className="px-6 py-4 font-mono font-medium text-slate-700">{a.name}</td>
                                <td className="px-6 py-4 text-slate-600">{a.comment}</td>
                                <td className="px-6 py-4 text-slate-500 font-mono">{a.rows}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${pipeline.color}`}>{pipeline.label}</span></td>
                                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs ${a.status === 'new' ? 'bg-blue-100 text-blue-700' : a.status === 'changed' ? 'bg-orange-100 text-orange-700' : 'text-slate-500'}`}>{a.status === 'new' ? 'New' : a.status === 'changed' ? 'Changed' : 'Synced'}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        {pipeline.status === 'unmapped' && (
                                            <button className="text-purple-600 hover:text-purple-800 text-xs font-medium flex items-center gap-1" onClick={() => { setSelectedTables([a.name]); handleGenerateCandidates(); }}>
                                                <Sparkles size={12} /> 生成
                                            </button>
                                        )}
                                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium" onClick={() => setViewingTable(a)}>详情</button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}</tbody>
                </table>
            </div>

            {/* Table Details Modal (Drawer) */}
            {viewingTable && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-[500px] h-full bg-white shadow-2xl animate-slide-in-right flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">{viewingTable.name}</h3>
                                <p className="text-sm text-slate-500">{viewingTable.comment}</p>
                            </div>
                            <button onClick={() => setViewingTable(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Table size={16} /> 字段结构</h4>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">字段名</th><th className="px-3 py-2">类型</th><th className="px-3 py-2">注释</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {viewingTable.columns?.map((col, i) => (
                                                <tr key={i}><td className="px-3 py-2 font-mono text-slate-700">{col.name}</td><td className="px-3 py-2 text-slate-500">{col.type}</td><td className="px-3 py-2 text-slate-600">{col.comment}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Activity size={16} /> 基本信息</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 bg-slate-50 rounded border border-slate-100"><div className="text-slate-400 mb-1">行数</div><div className="font-mono text-lg text-slate-800">{viewingTable.rows}</div></div>
                                    <div className="p-3 bg-slate-50 rounded border border-slate-100"><div className="text-slate-400 mb-1">更新时间</div><div className="text-slate-800">{viewingTable.updateTime}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 视图: 候选生成 (BU-04) ---
const CandidateGenerationView = ({ businessObjects, setBusinessObjects, candidates, setCandidates }) => {
    const [viewingCandidate, setViewingCandidate] = useState(null);
    const [editName, setEditName] = useState('');
    const [nameError, setNameError] = useState('');

    // Calculate stats for distribution bar
    const total = candidates.length || 1;
    const highCount = candidates.filter(c => c.confidence > 0.8).length;
    const medCount = candidates.filter(c => c.confidence > 0.5 && c.confidence <= 0.8).length;
    const lowCount = candidates.filter(c => c.confidence <= 0.5).length;
    const highConfPercentage = (highCount / total) * 100;
    const medConfPercentage = (medCount / total) * 100;
    const lowConfPercentage = (lowCount / total) * 100;

    const [minConfidence, setMinConfidence] = useState(50);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRunAI = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            alert('AI 分析完成，发现 2 个新候选！');
        }, 1500);
    };

    const checkNameConflict = (name) => businessObjects.some(bo => bo.name === name);
    const openCandidateDetail = (candidate) => { setViewingCandidate(candidate); setEditName(candidate.suggestedName); setNameError(checkNameConflict(candidate.suggestedName) ? '名称已存在，请修改' : ''); };
    const handleNameChange = (newName) => { setEditName(newName); setNameError(checkNameConflict(newName) ? '名称已存在' : ''); };

    const handleConfirmAccept = () => {
        if (!viewingCandidate || nameError) return;
        const newBO = { id: `BO_${Date.now()}`, name: editName, code: `biz_${viewingCandidate.sourceTable.replace('t_', '')}`, domain: 'AI', owner: '待认领', status: 'draft', version: 'v0.1', description: 'AI生成', fields: viewingCandidate.previewFields.map((f, i) => ({ id: `f_${i}`, name: f.attr, code: f.col, type: 'String', length: '-', required: false, desc: 'AI 自动映射' })) };
        setBusinessObjects([...businessObjects, newBO]);
        setCandidates(candidates.filter(c => c.id !== viewingCandidate.id));
        setViewingCandidate(null);
        alert(`成功创建业务对象：${newBO.name}`);
    };
    const handleReject = (id) => { setCandidates(candidates.filter(c => c.id !== id)); setViewingCandidate(null); };

    const handleBatchAccept = () => {
        const highConfCandidates = candidates.filter(c => c.confidence * 100 >= 80);
        // Filter out conflicts from batch
        const validCandidates = highConfCandidates.filter(c => !checkNameConflict(c.suggestedName));
        const conflicts = highConfCandidates.filter(c => checkNameConflict(c.suggestedName));

        if (validCandidates.length === 0 && conflicts.length === 0) {
            alert('没有置信度 > 80% 的候选对象');
            return;
        }

        if (conflicts.length > 0) {
            alert(`检测到 ${conflicts.length} 个高置信度候选存在命名冲突，无法自动批量采纳。请手动处理。`);
            if (validCandidates.length === 0) return;
        }

        if (confirm(`确定批量采纳 ${validCandidates.length} 个无冲突的候选吗？`)) {
            const newBOs = validCandidates.map(c => ({
                id: `BO_${Date.now()}_${c.id}`,
                name: c.suggestedName,
                code: `biz_${c.sourceTable}`,
                domain: '批量导入',
                owner: '系统',
                status: 'draft',
                version: 'v0.1',
                description: '批量采纳',
                fields: []
            }));

            setBusinessObjects([...businessObjects, ...newBOs]);
            setCandidates(candidates.filter(c => !validCandidates.find(vc => vc.id === c.id)));
            alert('批量处理完成');
        }
    };

    const filteredCandidates = candidates.filter(c => (c.confidence * 100) >= minConfidence);

    return (
        <div className="space-y-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="待处理候选" value={candidates.length} trend="+2" icon={Sparkles} color="purple" />
                <StatCard label="高置信度" value={candidates.filter(c => c.confidence > 0.8).length} trend="High" icon={CheckCircle} color="emerald" />
                <StatCard label="已忽略" value={3} trend="" icon={XCircle} color="red" />
                <StatCard label="AI 模型" value="v2.1" trend="Stable" icon={Cpu} color="blue" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-purple-500" /> 智能候选生成
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleBatchAccept}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <CheckSquare size={16} /> 批量采纳高置信度
                    </button>
                    <button
                        onClick={handleRunAI}
                        disabled={isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Cpu size={16} />}
                        {isProcessing ? 'AI 分析中...' : '运行 AI 识别'}
                    </button>
                </div>
            </div>

            {/* Visual Confidence Distribution Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Sliders size={16} />
                            <span className="font-medium">置信度分布与过滤:</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            当前过滤: {minConfidence}%+ (显示 {filteredCandidates.length} / {candidates.length} 个)
                        </div>
                    </div>

                    {/* Distribution Bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex mb-4">
                        <div style={{ width: `${highConfPercentage}%` }} className="h-full bg-emerald-500" title="High (>80%)"></div>
                        <div style={{ width: `${medConfPercentage}%` }} className="h-full bg-orange-400" title="Medium (50-80%)"></div>
                        <div style={{ width: `${lowConfPercentage}%` }} className="h-full bg-red-400" title="Low (<50%)"></div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="text-sm font-bold text-purple-700 min-w-[3rem] text-right">{minConfidence}%</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">{filteredCandidates.map(c => {
                const isConflict = checkNameConflict(c.suggestedName);
                return (
                    <div key={c.id} className={`bg-white p-5 rounded-xl border shadow-sm ${isConflict ? 'border-orange-300' : 'border-purple-100'}`}>
                        <div className="flex justify-between mb-2"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{c.sourceTable}</span><span className="text-emerald-600 font-bold text-xs">{c.confidence * 100}%</span></div>
                        <h3 className="font-bold text-lg mb-2 truncate" title={c.suggestedName}>{c.suggestedName}</h3>
                        {isConflict && <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mb-2 flex items-center gap-1"><AlertTriangle size={12} /> 名称冲突，需人工介入</div>}
                        <p className="text-xs text-slate-500 mb-4 h-10 overflow-hidden">{c.reason}</p>
                        <div className="flex gap-2">
                            <button onClick={() => openCandidateDetail(c)} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm">审核</button>
                            {!isConflict && <button onClick={() => { setViewingCandidate(c); setEditName(c.suggestedName); handleConfirmAccept(); }} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm">采纳</button>}
                        </div>
                    </div>
                )
            })}</div>
            {viewingCandidate && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-3xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg text-slate-800">候选详情审核</h3><button onClick={() => setViewingCandidate(null)}><X size={20} /></button></div>
                        <div className="p-6 overflow-y-auto flex-1 flex gap-6">

                            {/* Left Column: Form & Table */}
                            <div className="flex-1 space-y-6">
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">物理源表</label>
                                        <div className="p-2 bg-slate-50 border rounded text-sm font-mono text-slate-600">{viewingCandidate.sourceTable}</div>
                                    </div>
                                    <ArrowRight className="mb-2 text-purple-300" />
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-purple-600 uppercase mb-1">建议业务对象名称</label>
                                        <input type="text" value={editName} onChange={(e) => handleNameChange(e.target.value)} className={`w-full border p-2 rounded text-sm font-bold text-slate-800 ${nameError ? 'border-red-500 bg-red-50' : 'border-purple-300'}`} />
                                        {nameError && <div className="text-red-500 text-xs mt-1">{nameError}</div>}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm text-slate-700 mb-2">字段映射预览</h4>
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase">
                                                <tr><th className="px-3 py-2">物理字段</th><th className="px-3 py-2">推测属性</th><th className="px-3 py-2">置信度</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {viewingCandidate.previewFields.map((f, i) => (
                                                    <tr key={i}><td className="px-3 py-2 font-mono text-slate-600">{f.col}</td><td className="px-3 py-2 font-medium">{f.attr}</td><td className="px-3 py-2 text-xs">{f.conf}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: AI Analysis Report */}
                            <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200 h-fit">
                                <h4 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500" /> AI 置信度分析报告</h4>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">综合置信度</span><span className="font-bold text-emerald-600">{(viewingCandidate.confidence * 100).toFixed(0)}%</span></div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div style={{ width: `${viewingCandidate.confidence * 100}%` }} className="h-full bg-emerald-500"></div></div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 space-y-3">
                                        <ScoreBar label="表名语义匹配" score={viewingCandidate.scores?.nameMatch || 0} />
                                        <ScoreBar label="字段重合度" score={viewingCandidate.scores?.fieldMatch || 0} />
                                        <ScoreBar label="数据内容采样" score={viewingCandidate.scores?.dataSample || 0} />
                                    </div>

                                    <div className="bg-white p-3 rounded border border-slate-200 text-xs text-slate-500 leading-relaxed">
                                        <strong>AI 建议：</strong><br />
                                        {viewingCandidate.reason}
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <button onClick={() => handleReject(viewingCandidate.id)} className="text-red-600 text-sm hover:underline">拒绝并忽略</button>
                            <div className="flex gap-2">
                                <button onClick={() => setViewingCandidate(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">取消</button>
                                <button onClick={handleConfirmAccept} disabled={!!nameError} className={`px-4 py-2 text-white rounded flex items-center gap-2 ${nameError ? 'bg-purple-300' : 'bg-purple-600'}`}><CheckCircle size={16} /> 确认创建</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 视图: 冲突检测 ---
const ConflictDetectionView = ({ setActiveModule }) => {
    const [conflicts, setConflicts] = useState(mockConflicts);
    return (
        <div className="space-y-6">
            {/* 补充统计卡片 (已有，保持) */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard label="待解决冲突" value={conflicts.length.toString()} trend="Critical" icon={AlertTriangle} color="red" />
                <StatCard label="高风险项" value={conflicts.filter(c => c.severity === 'High').length} trend="" icon={FileWarning} color="orange" />
                <StatCard label="已忽略" value={15} trend="" icon={XCircle} color="purple" />
                <StatCard label="健康度" value="88%" trend="Good" icon={CheckCircle} color="emerald" />
            </div>
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">冲突检测与治理</h2><button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center gap-2"><RefreshCw size={16} /> 重新检测</button></div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {conflicts.map(c => (
                    <div key={c.id} className="p-6 border-b border-slate-100 flex justify-between">
                        <div><div className="flex items-center gap-2 mb-1"><span className="text-red-600 font-bold text-xs border border-red-200 px-1 rounded">{c.severity}</span><h4 className="font-bold text-sm">{c.title}</h4></div><p className="text-sm text-slate-600">{c.desc}</p></div>
                        <button onClick={() => setActiveModule('mapping')} className="text-purple-600 text-sm font-bold hover:underline">去修复</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 视图: 映射工作台 ---
const MappingStudioView = ({ selectedBO, dataSources }) => {
    const [selectedDataSourceId, setSelectedDataSourceId] = useState(dataSources[0]?.id || null);
    const [selectedTableId, setSelectedTableId] = useState(null);

    // 获取选中的数据源
    const selectedDataSource = dataSources.find(ds => ds.id === selectedDataSourceId);

    // 获取选中的表
    const selectedTable = selectedDataSource?.tables?.find(t => t.id === selectedTableId);

    // 当选择数据源时，自动选择第一个表
    const handleSelectDataSource = (dsId) => {
        setSelectedDataSourceId(dsId);
        const ds = dataSources.find(d => d.id === dsId);
        if (ds?.tables?.length > 0) {
            setSelectedTableId(ds.tables[0].id);
        } else {
            setSelectedTableId(null);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-4 gap-6 shrink-0">
                <StatCard label="总字段" value={selectedBO?.fields.length || 0} trend="" icon={List} color="blue" />
                <StatCard label="已映射" value={mockMappings.length} trend="Good" icon={Link} color="emerald" />
                <StatCard label="未映射" value={(selectedBO?.fields.length || 0) - mockMappings.length} trend="Warning" icon={AlertCircle} color="orange" />
                <StatCard label="映射覆盖率" value={`${Math.round((mockMappings.length / (selectedBO?.fields.length || 1)) * 100)}%`} trend="" icon={PieChart} color="purple" />
            </div>

            <div className="bg-white border-b p-4 rounded-t-xl border border-slate-200 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">语义映射工作台</h2>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1">
                        <RefreshCw size={14} /> 同步
                    </button>
                    <button className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-1">
                        <Save size={14} /> 保存映射
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* 左侧：数据源树 */}
                <DataSourceTree
                    dataSources={dataSources}
                    selectedDataSourceId={selectedDataSourceId}
                    onSelectDataSource={handleSelectDataSource}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                />

                {/* 中间工作区 */}
                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 flex gap-4 overflow-hidden">
                    {/* 业务对象字段 */}
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-blue-50">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <Box size={16} className="text-blue-500" />
                                {selectedBO?.name || '选择业务对象'}
                            </h3>
                            <p className="text-xs text-blue-600 mt-1">{selectedBO?.fields.length || 0} 个属性</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedBO?.fields.map(f => (
                                <div key={f.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors group">
                                    <div>
                                        <div className="font-medium text-sm text-slate-700">{f.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{f.code}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{f.type}</span>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full opacity-60 group-hover:opacity-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 映射关系 */}
                    <div className="w-48 flex flex-col items-center justify-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">映射关系</div>
                        <div className="space-y-2 w-full">
                            {mockMappings.map((m, i) => (
                                <div key={i} className="flex items-center justify-center gap-2 p-2 bg-white border border-slate-200 rounded text-xs shadow-sm">
                                    <span className="text-blue-600 font-medium truncate max-w-[60px]">{m.boField}</span>
                                    <Link size={10} className="text-purple-400" />
                                    <span className="text-emerald-600 font-mono truncate max-w-[60px]">{m.tblField}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                            <Plus size={12} /> 添加映射
                        </button>
                    </div>

                    {/* 物理表字段 */}
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-emerald-50">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <Table size={16} className="text-emerald-500" />
                                {selectedTable?.name || '选择物理表'}
                            </h3>
                            <p className="text-xs text-emerald-600 mt-1">
                                {selectedTable ? `${selectedTable.columns?.length || 0} 个字段 · ${selectedTable.rows} 行` : '请在左侧选择数据源和表'}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedTable?.columns?.map((col, i) => (
                                <div key={i} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-colors group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full opacity-60 group-hover:opacity-100" />
                                        <div>
                                            <div className="font-mono text-sm text-slate-700">{col.name}</div>
                                            <div className="text-xs text-slate-400">{col.comment}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">{col.type}</span>
                                </div>
                            )) || (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Table size={32} className="mb-2 opacity-50" />
                                        <p className="text-xs">请选择一个物理表</p>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 视图: 统一元数据 (Catalog) ---
const DataCatalogView = () => {
    return (
        <div className="space-y-6">
            {/* 补充统计卡片 */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard label="资产总数" value={mockCatalogAssets.length} trend="+4" icon={Book} color="blue" />
                <StatCard label="业务对象" value={mockCatalogAssets.filter(a => a.type === 'Business Object').length} trend="" icon={Box} color="purple" />
                <StatCard label="物理表" value={mockCatalogAssets.filter(a => a.type === 'Physical Table').length} trend="" icon={Table} color="emerald" />
                <StatCard label="平均质量分" value="94" trend="High" icon={Star} color="orange" />
            </div>

            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">统一元数据目录</h2><button className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /> 注册资产</button></div>
            <div className="grid grid-cols-2 gap-6">{mockCatalogAssets.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between mb-4"><div className="flex items-center gap-3"><div className={`p-3 rounded-lg ${a.type === 'Business Object' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>{a.type === 'Business Object' ? <Box size={24} /> : <Database size={24} />}</div><div><h3 className="font-bold text-lg">{a.name}</h3><p className="text-xs text-slate-400">{a.code}</p></div></div><span className="text-xs font-bold border px-2 py-1 rounded">QS: {a.quality}</span></div>
                    <div className="space-y-2 text-sm text-slate-600"><div>负责人: {a.owner}</div><div className="flex gap-1">{a.tags.map(t => <span key={t} className="bg-slate-100 px-1.5 rounded text-xs">{t}</span>)}</div></div>
                </div>
            ))}</div>
        </div>
    );
};

// --- 视图: API 网关 ---
const ApiGatewayView = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">API 服务网关</h2><button className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /> 发布服务</button></div>
        <div className="grid grid-cols-4 gap-6"><StatCard label="在线 API" value={mockApiServices.length.toString()} trend="+1" icon={Globe} color="blue" /></div>
        <div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3">服务名称</th><th className="px-6 py-3">Method</th><th className="px-6 py-3">路径</th><th className="px-6 py-3">状态</th></tr></thead><tbody>{mockApiServices.map(api => <tr key={api.id} className="border-b"><td className="px-6 py-4 font-bold">{api.name}</td><td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2 rounded text-xs">{api.method}</span></td><td className="px-6 py-4 font-mono">{api.path}</td><td className="px-6 py-4"><span className="text-emerald-600 font-bold text-xs">{api.status}</span></td></tr>)}</tbody></table></div>
    </div>
);

// --- 视图: 缓存策略 ---
const CacheStrategyView = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">缓存策略管理</h2><button className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /> 新增策略</button></div>
        <div className="grid grid-cols-4 gap-6"><StatCard label="缓存命中率" value="94.5%" trend="+2%" icon={Zap} color="emerald" /></div>
        <div className="bg-white border rounded-xl overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="px-6 py-3">策略名称</th><th className="px-6 py-3">对象</th><th className="px-6 py-3">TTL</th><th className="px-6 py-3">状态</th></tr></thead><tbody>{mockCachePolicies.map(p => <tr key={p.id} className="border-b"><td className="px-6 py-4 font-bold">{p.name}</td><td className="px-6 py-4 font-mono">{p.target}</td><td className="px-6 py-4">{p.ttl}</td><td className="px-6 py-4"><span className="text-emerald-600 text-xs font-bold">{p.status}</span></td></tr>)}</tbody></table></div>
    </div>
);

// --- 视图: 全链路血缘 ---
const DataLineageView = () => (
    <div className="h-full flex flex-col gap-6">
        {/* 补充统计卡片 */}
        <div className="grid grid-cols-4 gap-6 shrink-0">
            <StatCard label="总节点数" value="5" trend="" icon={Network} color="blue" />
            <StatCard label="引用深度" value="4" trend="" icon={Layers} color="purple" />
            <StatCard label="孤立节点" value="0" trend="Healthy" icon={XCircle} color="emerald" />
            <StatCard label="引用热度" value="High" trend="" icon={Activity} color="orange" />
        </div>

        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><GitBranch className="text-purple-500" /> 全链路血缘分析</h2><button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"><Network size={16} /> 影响分析</button></div>
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-inner flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
            <div className="flex gap-16 items-center">
                <div className="w-48 p-4 bg-slate-50 border-2 border-slate-300 rounded-lg shadow-sm flex flex-col gap-2 relative"><div className="text-xs text-slate-400 font-bold uppercase">Data Source</div><div className="font-bold text-slate-800 flex items-center gap-2"><Database size={16} className="text-blue-500" /> 卫健委_前置库</div><ArrowRight size={16} className="absolute -right-[40px] top-1/2 -translate-y-1/2 text-slate-300" /></div>
                <div className="w-48 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg shadow-sm flex flex-col gap-2 relative"><div className="text-xs text-emerald-600 font-bold uppercase">Physical Table</div><div className="font-bold text-emerald-900 flex items-center gap-2"><Table size={16} /> t_pop_base_info</div><ArrowRight size={16} className="absolute -right-[40px] top-1/2 -translate-y-1/2 text-slate-300" /></div>
                <div className="w-48 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm flex flex-col gap-2 relative"><div className="text-xs text-blue-600 font-bold uppercase">Business Object</div><div className="font-bold text-blue-900 flex items-center gap-2"><Box size={16} /> 新生儿</div><ArrowRight size={16} className="absolute -right-[40px] top-1/2 -translate-y-1/2 text-slate-300" /></div>
                <div className="w-56 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg shadow-sm flex flex-col gap-2"><div className="text-xs text-purple-600 font-bold uppercase">API Service</div><div className="font-bold text-purple-900 flex items-center gap-2 text-sm"><Server size={14} /> 查询新生儿详情</div></div>
            </div>
        </div>
    </div>
);

const TechDiscoveryView = () => (<div className="flex flex-col items-center justify-center h-full text-slate-400"><Database size={64} className="mb-4" /><p>数据发现中心 (BU-02)</p></div>);

// ==========================================
// 4. 主应用程序
// ==========================================

export default function SemanticLayerApp() {
    const [activeModule, setActiveModule] = useState('dashboard');
    const [businessObjects, setBusinessObjects] = useState(mockBusinessObjects);
    const [dataSources, setDataSources] = useState(mockDataSources);
    const [selectedBO, setSelectedBO] = useState(mockBusinessObjects[0]);
    const [showRuleEditor, setShowRuleEditor] = useState(null);
    const [candidates, setCandidates] = useState(mockAICandidates);

    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardView setActiveModule={setActiveModule} />;
            case 'td_goals': return <BusinessGoalsView setActiveModule={setActiveModule} />;
            case 'td_modeling': return <BusinessModelingView businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} />;
            case 'td_scenario': return <ScenarioOrchestrationView businessObjects={businessObjects} />;
            case 'bu_connect': return <DataSourceManagementView dataSources={dataSources} setDataSources={setDataSources} />;
            case 'bu_discovery': return <AssetScanningView setActiveModule={setActiveModule} candidates={candidates} />;
            case 'bu_candidates': return <CandidateGenerationView businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} candidates={candidates} setCandidates={setCandidates} />;
            case 'mapping': return <MappingStudioView selectedBO={selectedBO} dataSources={dataSources} />;
            case 'governance': return <ConflictDetectionView setActiveModule={setActiveModule} />;
            case 'catalog': return <DataCatalogView />;
            case 'ee_api': return <ApiGatewayView />;
            case 'ee_cache': return <CacheStrategyView />;
            case 'lineage': return <DataLineageView />;
            default: return <DashboardView setActiveModule={setActiveModule} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
            <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header activeModule={activeModule} />
                <main className="flex-1 overflow-auto p-6 relative">{renderContent()}</main>
            </div>
        </div>
    );
}