// ==========================================
// 模拟数据 (Mock Data)
// ==========================================

// TD: 业务梳理数据 (原业务目标)
export const mockBusinessGoals = [
    {
        id: 'G_001',
        title: '出生一件事高效办成',
        type: '改革事项',
        priority: 'High',
        status: 'modeling', // planning, modeling, implemented
        progress: 65,
        owner: '卫健委 / 数局',
        lastUpdate: '2024-05-20',
        description: '整合出生医学证明、户口登记、医保参保等多个事项，实现"一表申请、一网通办"。',
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
export const mockBusinessObjects = [
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
export const mockPhysicalTables = [
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
export const mockMappings = [
    { boField: '姓名', tblField: 'p_name', rule: 'Direct Copy' },
    { boField: '身份证号', tblField: 'id_card_num', rule: 'Direct Copy' },
    { boField: '出生时间', tblField: 'birth_ts', rule: 'Format: YYYY-MM-DD HH:mm:ss' },
    { boField: '出生体重', tblField: 'weight_kg', rule: 'Direct Copy' },
];

// BU: 数据源（包含关联表）
export const mockDataSources = [
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
export const mockBOTableMappings: Record<string, { tableId: string; tableName: string; source: string; mappings: { boField: string; tblField: string; rule: string }[]; fields: { name: string; type: string; key?: string }[] }> = {
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
export const mockConflicts = [
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
export const mockCatalogItems = [
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

// BU-02: 扫描结果 (模拟)
export const mockScanResults = [
    {
        table: 't_user_profile',
        sourceId: 'DS_001',
        sourceName: '卫健委_前置库_01',
        sourceType: 'MySQL',
        rows: '2.5M',
        updateTime: '2024-05-20 10:00:00',
        status: 'analyzed',
        comment: '用户画像基础表',
        confidence: 95,
        aiSuggestion: 'User: 用户主体',
        semanticAnalysis: {
            chineseName: '用户画像表',
            description: '记录核心用户基础画像信息，包含用户ID、姓名、联系方式等属性。',
            scenarios: ['客户管理', '画像分析'],
            coreFields: [{ field: 'user_id', reason: '用户唯一标识' }],
            qualityScore: 92,
            privacyLevel: 'L3'
        },
        fields: [
            { name: 'user_id', type: 'bigint', comment: '用户ID', suggestion: 'id' },
            { name: 'name', type: 'varchar(50)', comment: '姓名', suggestion: 'name' },
            { name: 'mobile', type: 'varchar(20)', comment: '手机号', suggestion: 'phone' }
        ]
    },
    {
        table: 't_order_main',
        sourceId: 'DS_004',
        sourceName: '政务云_数据湖',
        sourceType: 'MySQL',
        rows: '15.2M',
        updateTime: '2024-05-21 02:00:00',
        status: 'analyzed',
        comment: '订单交易主表',
        confidence: 88,
        aiSuggestion: 'Order: 订单',
        semanticAnalysis: {
            chineseName: '订单主表',
            description: '存储订单核心交易信息。',
            scenarios: ['交易分析'],
            coreFields: [{ field: 'order_id', reason: '订单主键' }],
            qualityScore: 85,
            privacyLevel: 'L2',
            relationships: [
                { targetTable: 't_user_profile', type: 'Many-to-One', key: 'user_id' },
                { targetTable: 't_order_item', type: 'One-to-Many', key: 'order_id' },
                { targetTable: 't_pay_flow', type: 'One-to-One', key: 'pay_id' }
            ]
        },
        fields: [
            { name: 'order_id', type: 'varchar(32)', comment: '订单号' },
            { name: 'user_id', type: 'bigint', comment: '用户ID' },
            { name: 'total_amt', type: 'decimal(18,2)', comment: '总金额' },
            { name: 'order_status', type: 'tinyint', comment: '订单状态: 1待支付 2已支付 3已发货 4已完成 5已取消' },
            { name: 'pay_status', type: 'varchar(20)', comment: '支付状态: pending/paid/refunded' },
            { name: 'delivery_phase', type: 'varchar(20)', comment: '配送阶段' },
            { name: 'create_time', type: 'datetime', comment: '下单时间' },
            { name: 'pay_time', type: 'datetime', comment: '支付时间' },
            { name: 'approve_time', type: 'datetime', comment: '审核通过时间' },
            { name: 'confirm_time', type: 'datetime', comment: '确认收货时间' },
            { name: 'cancel_time', type: 'datetime', comment: '取消时间' },
            { name: 'update_time', type: 'datetime', comment: '更新时间' }
        ]
    },
    {
        table: 'V_CITIZEN_INFO',
        sourceId: 'DS_002',
        sourceName: '市人口库_主库',
        sourceType: 'Oracle',
        rows: '8.2M',
        updateTime: '2024-05-21 08:30:00',
        status: 'scanned',
        comment: '公民基本信息视图',
        confidence: 75,
        aiSuggestion: 'Person: 自然人',
        fields: [
            { name: 'CITIZEN_ID', type: 'VARCHAR2(18)', comment: '身份证' },
            { name: 'FULL_NAME', type: 'VARCHAR2(50)', comment: '姓名' }
        ]
    },
    {
        table: 'ods_license',
        sourceId: 'DS_004',
        sourceName: '政务云_数据湖',
        sourceType: 'MySQL',
        rows: '180K',
        updateTime: '2024-05-20 18:00:00',
        status: 'scanned',
        comment: '电子证照许可表',
        confidence: 60,
        fields: [
            { name: 'license_no', type: 'varchar(50)', comment: '证照编号' },
            { name: 'valid_date', type: 'date', comment: '有效期' }
        ]
    },
    {
        table: 'sys_log_2024',
        sourceId: 'DS_003',
        sourceName: '日志归档库',
        sourceType: 'PostgreSQL',
        rows: '50M+',
        updateTime: '2024-05-22 09:15:00',
        status: 'scanned',
        comment: '系统操作日志',
        confidence: 40,
        fields: [
            { name: 'log_id', type: 'uuid' },
            { name: 'action', type: 'text' }
        ]
    },
    // 大表：120个字段，用于测试批量操作和性能
    {
        table: 't_enterprise_profile',
        sourceId: 'DS_004',
        sourceName: '政务云_数据湖',
        sourceType: 'MySQL',
        rows: '3.5M',
        updateTime: '2024-05-22 06:00:00',
        status: 'analyzed',
        comment: '企业综合档案表（120字段）',
        confidence: 92,
        aiSuggestion: 'Enterprise: 企业',
        semanticAnalysis: {
            chineseName: '企业综合档案',
            description: '存储企业全生命周期信息，包含基础信息、经营信息、资质信息等120个字段。',
            scenarios: ['企业画像', '信用评估', '监管分析'],
            coreFields: [{ field: 'enterprise_id', reason: '企业唯一标识' }],
            qualityScore: 78,
            privacyLevel: 'L2'
        },
        fields: [
            // 基础标识 (1-10)
            { name: 'enterprise_id', type: 'varchar(32)', comment: '企业ID' },
            { name: 'unified_code', type: 'varchar(18)', comment: '统一社会信用代码' },
            { name: 'reg_no', type: 'varchar(20)', comment: '注册号' },
            { name: 'org_code', type: 'varchar(15)', comment: '组织机构代码' },
            { name: 'tax_no', type: 'varchar(20)', comment: '税务登记号' },
            { name: 'company_name', type: 'varchar(200)', comment: '企业名称', suggestion: 'name' },
            { name: 'company_name_en', type: 'varchar(200)', comment: '英文名称' },
            { name: 'short_name', type: 'varchar(50)', comment: '简称' },
            { name: 'former_name', type: 'varchar(200)', comment: '曾用名' },
            { name: 'brand_name', type: 'varchar(100)', comment: '品牌名' },
            // 注册信息 (11-25)
            { name: 'legal_person', type: 'varchar(50)', comment: '法定代表人', suggestion: 'contact' },
            { name: 'legal_person_id', type: 'varchar(18)', comment: '法人身份证', suggestion: 'id_card' },
            { name: 'legal_person_phone', type: 'varchar(20)', comment: '法人电话', suggestion: 'phone' },
            { name: 'reg_capital', type: 'decimal(18,2)', comment: '注册资本' },
            { name: 'paid_capital', type: 'decimal(18,2)', comment: '实缴资本' },
            { name: 'currency_type', type: 'varchar(10)', comment: '币种' },
            { name: 'reg_date', type: 'date', comment: '成立日期' },
            { name: 'approval_date', type: 'date', comment: '核准日期' },
            { name: 'open_date', type: 'date', comment: '开业日期' },
            { name: 'company_type', type: 'varchar(50)', comment: '企业类型' },
            { name: 'industry_code', type: 'varchar(10)', comment: '行业代码' },
            { name: 'industry_name', type: 'varchar(100)', comment: '行业名称' },
            { name: 'business_scope', type: 'text', comment: '经营范围' },
            { name: 'reg_authority', type: 'varchar(100)', comment: '登记机关' },
            { name: 'reg_status', type: 'varchar(20)', comment: '登记状态', suggestion: 'status' },
            // 地址信息 (26-40)
            { name: 'province_code', type: 'varchar(6)', comment: '省份代码' },
            { name: 'city_code', type: 'varchar(6)', comment: '城市代码' },
            { name: 'district_code', type: 'varchar(6)', comment: '区县代码' },
            { name: 'address', type: 'varchar(300)', comment: '注册地址', suggestion: 'location' },
            { name: 'business_address', type: 'varchar(300)', comment: '经营地址' },
            { name: 'postal_code', type: 'varchar(10)', comment: '邮政编码' },
            { name: 'longitude', type: 'decimal(10,7)', comment: '经度' },
            { name: 'latitude', type: 'decimal(10,7)', comment: '纬度' },
            { name: 'contact_person', type: 'varchar(50)', comment: '联系人' },
            { name: 'contact_phone', type: 'varchar(20)', comment: '联系电话', suggestion: 'phone' },
            { name: 'contact_email', type: 'varchar(100)', comment: '联系邮箱', suggestion: 'email' },
            { name: 'website', type: 'varchar(200)', comment: '官方网站' },
            { name: 'fax', type: 'varchar(20)', comment: '传真' },
            { name: 'wechat_public', type: 'varchar(50)', comment: '微信公众号' },
            { name: 'weibo_account', type: 'varchar(50)', comment: '微博账号' },
            // 经营信息 (41-60)
            { name: 'employee_count', type: 'int', comment: '员工人数' },
            { name: 'insured_count', type: 'int', comment: '参保人数' },
            { name: 'annual_revenue', type: 'decimal(18,2)', comment: '年营收' },
            { name: 'total_assets', type: 'decimal(18,2)', comment: '总资产' },
            { name: 'net_assets', type: 'decimal(18,2)', comment: '净资产' },
            { name: 'profit', type: 'decimal(18,2)', comment: '利润总额' },
            { name: 'tax_amount', type: 'decimal(18,2)', comment: '纳税总额' },
            { name: 'export_amount', type: 'decimal(18,2)', comment: '出口额' },
            { name: 'import_amount', type: 'decimal(18,2)', comment: '进口额' },
            { name: 'listing_status', type: 'varchar(20)', comment: '上市状态', suggestion: 'status' },
            { name: 'stock_code', type: 'varchar(10)', comment: '股票代码' },
            { name: 'stock_exchange', type: 'varchar(50)', comment: '交易所' },
            { name: 'financing_round', type: 'varchar(20)', comment: '融资轮次' },
            { name: 'financing_amount', type: 'decimal(18,2)', comment: '融资金额' },
            { name: 'valuation', type: 'decimal(18,2)', comment: '估值' },
            { name: 'parent_company_id', type: 'varchar(32)', comment: '母公司ID' },
            { name: 'group_name', type: 'varchar(100)', comment: '集团名称' },
            { name: 'is_branch', type: 'tinyint', comment: '是否分支机构' },
            { name: 'branch_count', type: 'int', comment: '分支机构数' },
            { name: 'subsidiary_count', type: 'int', comment: '子公司数' },
            // 资质信息 (61-80)
            { name: 'credit_score', type: 'int', comment: '信用评分' },
            { name: 'credit_level', type: 'varchar(5)', comment: '信用等级', suggestion: 'level' },
            { name: 'high_tech_cert', type: 'tinyint', comment: '高新技术企业' },
            { name: 'iso_cert', type: 'tinyint', comment: 'ISO认证' },
            { name: 'cmmi_level', type: 'int', comment: 'CMMI等级' },
            { name: 'patent_count', type: 'int', comment: '专利数量' },
            { name: 'trademark_count', type: 'int', comment: '商标数量' },
            { name: 'copyright_count', type: 'int', comment: '著作权数量' },
            { name: 'cert_count', type: 'int', comment: '资质证书数' },
            { name: 'award_count', type: 'int', comment: '获奖数量' },
            { name: 'risk_level', type: 'varchar(10)', comment: '风险等级', suggestion: 'level' },
            { name: 'risk_score', type: 'int', comment: '风险评分' },
            { name: 'lawsuit_count', type: 'int', comment: '诉讼案件数' },
            { name: 'penalty_count', type: 'int', comment: '行政处罚数' },
            { name: 'abnormal_count', type: 'int', comment: '经营异常数' },
            { name: 'dishonest_flag', type: 'tinyint', comment: '失信被执行人' },
            { name: 'tax_violation_flag', type: 'tinyint', comment: '税务违法' },
            { name: 'env_violation_flag', type: 'tinyint', comment: '环保违法' },
            { name: 'safety_violation_flag', type: 'tinyint', comment: '安全违法' },
            { name: 'blacklist_flag', type: 'tinyint', comment: '黑名单标记' },
            // 股东信息 (81-90)
            { name: 'shareholder_1_name', type: 'varchar(100)', comment: '第一股东' },
            { name: 'shareholder_1_ratio', type: 'decimal(5,2)', comment: '持股比例' },
            { name: 'shareholder_2_name', type: 'varchar(100)', comment: '第二股东' },
            { name: 'shareholder_2_ratio', type: 'decimal(5,2)', comment: '持股比例' },
            { name: 'shareholder_3_name', type: 'varchar(100)', comment: '第三股东' },
            { name: 'shareholder_3_ratio', type: 'decimal(5,2)', comment: '持股比例' },
            { name: 'actual_controller', type: 'varchar(100)', comment: '实际控制人' },
            { name: 'beneficial_owner', type: 'varchar(100)', comment: '受益所有人' },
            { name: 'foreign_investment', type: 'tinyint', comment: '是否外资' },
            { name: 'state_owned', type: 'tinyint', comment: '是否国有' },
            // 高管信息 (91-100)
            { name: 'chairman', type: 'varchar(50)', comment: '董事长' },
            { name: 'ceo', type: 'varchar(50)', comment: '总经理' },
            { name: 'cfo', type: 'varchar(50)', comment: '财务总监' },
            { name: 'cto', type: 'varchar(50)', comment: '技术总监' },
            { name: 'secretary', type: 'varchar(50)', comment: '董秘' },
            { name: 'supervisor', type: 'varchar(50)', comment: '监事会主席' },
            { name: 'director_count', type: 'int', comment: '董事人数' },
            { name: 'supervisor_count', type: 'int', comment: '监事人数' },
            { name: 'senior_mgmt_count', type: 'int', comment: '高管人数' },
            { name: 'board_meeting_count', type: 'int', comment: '董事会次数' },
            // 系统字段 (101-120)
            { name: 'data_source', type: 'varchar(50)', comment: '数据来源' },
            { name: 'data_version', type: 'int', comment: '数据版本' },
            { name: 'sync_time', type: 'datetime', comment: '同步时间' },
            { name: 'etl_batch_id', type: 'varchar(32)', comment: 'ETL批次' },
            { name: 'quality_score', type: 'int', comment: '质量评分' },
            { name: 'completeness', type: 'decimal(5,2)', comment: '完整度' },
            { name: 'accuracy_score', type: 'int', comment: '准确度' },
            { name: 'create_time', type: 'datetime', comment: '创建时间' },
            { name: 'create_by', type: 'varchar(50)', comment: '创建人' },
            { name: 'update_time', type: 'datetime', comment: '更新时间' },
            { name: 'update_by', type: 'varchar(50)', comment: '更新人' },
            { name: 'is_deleted', type: 'tinyint', comment: '删除标记' },
            { name: 'delete_time', type: 'datetime', comment: '删除时间' },
            { name: 'delete_by', type: 'varchar(50)', comment: '删除人' },
            { name: 'tenant_id', type: 'varchar(32)', comment: '租户ID' },
            { name: 'org_id', type: 'varchar(32)', comment: '组织ID' },
            { name: 'remark', type: 'text', comment: '备注' },
            { name: 'ext_json', type: 'json', comment: '扩展字段' },
            { name: 'audit_status', type: 'varchar(20)', comment: '审核状态', suggestion: 'status' },
            { name: 'publish_status', type: 'varchar(20)', comment: '发布状态', suggestion: 'status' }
        ]
    },
    // SQLServer 数据源
    {
        table: 'dbo.T_HOSPITAL_VISIT',
        sourceId: 'DS_005',
        sourceName: '医院HIS系统',
        sourceType: 'SQLServer',
        rows: '12.8M',
        updateTime: '2024-05-22 11:30:00',
        status: 'analyzed',
        comment: '患者就诊记录表',
        confidence: 87,
        aiSuggestion: 'Visit: 就诊记录',
        semanticAnalysis: {
            chineseName: '就诊记录表',
            description: '存储患者门诊/住院就诊信息',
            scenarios: ['医疗分析', '病历管理'],
            coreFields: [{ field: 'visit_id', reason: '就诊唯一标识' }],
            qualityScore: 85,
            privacyLevel: 'L4'
        },
        fields: [
            { name: 'visit_id', type: 'bigint', comment: '就诊ID' },
            { name: 'patient_id', type: 'varchar(20)', comment: '患者ID' },
            { name: 'dept_code', type: 'varchar(10)', comment: '科室编码' },
            { name: 'doctor_id', type: 'varchar(20)', comment: '医生ID' },
            { name: 'visit_date', type: 'datetime', comment: '就诊日期' },
            { name: 'diagnosis', type: 'nvarchar(500)', comment: '诊断结果' }
        ]
    },
    // MongoDB 数据源
    {
        table: 'user_behaviors',
        sourceId: 'DS_006',
        sourceName: '行为日志库',
        sourceType: 'MongoDB',
        rows: '156M',
        updateTime: '2024-05-23 00:15:00',
        status: 'scanned',
        comment: '用户行为事件集合',
        confidence: 72,
        aiSuggestion: 'Event: 行为事件',
        fields: [
            { name: '_id', type: 'ObjectId', comment: '文档ID' },
            { name: 'user_id', type: 'String', comment: '用户ID' },
            { name: 'event_type', type: 'String', comment: '事件类型' },
            { name: 'event_data', type: 'Object', comment: '事件数据' },
            { name: 'timestamp', type: 'Date', comment: '时间戳' }
        ]
    },
    // ClickHouse 数据源
    {
        table: 'analytics.page_views',
        sourceId: 'DS_007',
        sourceName: '数据分析平台',
        sourceType: 'ClickHouse',
        rows: '2.3B',
        updateTime: '2024-05-23 06:00:00',
        status: 'analyzed',
        comment: '页面访问统计表',
        confidence: 95,
        aiSuggestion: 'Metric: 统计指标',
        semanticAnalysis: {
            chineseName: '页面访问统计',
            description: '存储用户页面访问行为的聚合统计数据',
            scenarios: ['流量分析', '用户洞察'],
            coreFields: [{ field: 'page_id', reason: '页面标识' }],
            qualityScore: 92,
            privacyLevel: 'L1'
        },
        fields: [
            { name: 'page_id', type: 'String', comment: '页面ID' },
            { name: 'pv', type: 'UInt64', comment: '页面浏览量' },
            { name: 'uv', type: 'UInt64', comment: '独立访客数' },
            { name: 'avg_duration', type: 'Float64', comment: '平均停留时长' },
            { name: 'stat_date', type: 'Date', comment: '统计日期' }
        ]
    },
    // Redis 数据源
    {
        table: 'session:*',
        sourceId: 'DS_008',
        sourceName: '会话缓存',
        sourceType: 'Redis',
        rows: '580K',
        updateTime: '2024-05-23 08:00:00',
        status: 'scanned',
        comment: '用户会话缓存',
        confidence: 55,
        fields: [
            { name: 'session_id', type: 'String', comment: '会话ID' },
            { name: 'user_id', type: 'String', comment: '用户ID' },
            { name: 'login_time', type: 'Number', comment: '登录时间戳' },
            { name: 'expire_at', type: 'Number', comment: '过期时间' }
        ]
    },
    // Elasticsearch 数据源
    {
        table: 'logs-*',
        sourceId: 'DS_009',
        sourceName: '日志检索中心',
        sourceType: 'Elasticsearch',
        rows: '890M',
        updateTime: '2024-05-23 09:00:00',
        status: 'scanned',
        comment: '应用日志索引',
        confidence: 68,
        fields: [
            { name: '@timestamp', type: 'date', comment: '时间戳' },
            { name: 'level', type: 'keyword', comment: '日志级别' },
            { name: 'message', type: 'text', comment: '日志内容' },
            { name: 'service', type: 'keyword', comment: '服务名称' },
            { name: 'trace_id', type: 'keyword', comment: '追踪ID' }
        ]
    },
    // TiDB 数据源
    {
        table: 't_financial_transaction',
        sourceId: 'DS_010',
        sourceName: '金融交易系统',
        sourceType: 'TiDB',
        rows: '45.6M',
        updateTime: '2024-05-23 10:00:00',
        status: 'analyzed',
        comment: '金融交易流水表',
        confidence: 91,
        aiSuggestion: 'Transaction: 交易流水',
        semanticAnalysis: {
            chineseName: '金融交易流水',
            description: '存储金融交易的详细流水记录',
            scenarios: ['交易分析', '风控审计'],
            coreFields: [{ field: 'trans_id', reason: '交易流水号' }],
            qualityScore: 94,
            privacyLevel: 'L4'
        },
        fields: [
            { name: 'trans_id', type: 'varchar(32)', comment: '交易流水号' },
            { name: 'account_id', type: 'varchar(20)', comment: '账户ID' },
            { name: 'trans_type', type: 'varchar(10)', comment: '交易类型' },
            { name: 'amount', type: 'decimal(18,2)', comment: '交易金额' },
            { name: 'balance', type: 'decimal(18,2)', comment: '账户余额' },
            { name: 'trans_time', type: 'datetime', comment: '交易时间' }
        ]
    },
    // 达梦 数据源
    {
        table: 'GOV_APPROVAL_RECORD',
        sourceId: 'DS_011',
        sourceName: '政务审批中心',
        sourceType: '达梦',
        rows: '2.1M',
        updateTime: '2024-05-23 11:00:00',
        status: 'analyzed',
        comment: '政务审批记录表',
        confidence: 88,
        aiSuggestion: 'Approval: 审批记录',
        semanticAnalysis: {
            chineseName: '政务审批记录',
            description: '存储政务服务审批的全流程记录',
            scenarios: ['政务服务', '效能监察'],
            coreFields: [{ field: 'approval_id', reason: '审批编号' }],
            qualityScore: 86,
            privacyLevel: 'L2'
        },
        fields: [
            { name: 'approval_id', type: 'VARCHAR(32)', comment: '审批编号' },
            { name: 'matter_code', type: 'VARCHAR(20)', comment: '事项编码' },
            { name: 'applicant_id', type: 'VARCHAR(18)', comment: '申请人ID' },
            { name: 'status', type: 'VARCHAR(10)', comment: '审批状态' },
            { name: 'submit_time', type: 'TIMESTAMP', comment: '提交时间' },
            { name: 'finish_time', type: 'TIMESTAMP', comment: '办结时间' }
        ]
    },
    // 人大金仓 数据源
    {
        table: 'tax_invoice_record',
        sourceId: 'DS_012',
        sourceName: '税务发票库',
        sourceType: '人大金仓',
        rows: '18.5M',
        updateTime: '2024-05-23 12:00:00',
        status: 'scanned',
        comment: '税务发票记录表',
        confidence: 78,
        aiSuggestion: 'Invoice: 发票',
        fields: [
            { name: 'invoice_no', type: 'VARCHAR(20)', comment: '发票号码' },
            { name: 'invoice_code', type: 'VARCHAR(12)', comment: '发票代码' },
            { name: 'seller_tax_no', type: 'VARCHAR(20)', comment: '销方税号' },
            { name: 'buyer_tax_no', type: 'VARCHAR(20)', comment: '购方税号' },
            { name: 'amount', type: 'NUMERIC(18,2)', comment: '金额' },
            { name: 'tax_amount', type: 'NUMERIC(18,2)', comment: '税额' },
            { name: 'invoice_date', type: 'DATE', comment: '开票日期' }
        ]
    },
    // OceanBase 数据源
    {
        table: 'trade_order_detail',
        sourceId: 'DS_013',
        sourceName: '电商交易中心',
        sourceType: 'OceanBase',
        rows: '120M',
        updateTime: '2024-05-23 13:00:00',
        status: 'analyzed',
        comment: '交易订单明细表',
        confidence: 93,
        aiSuggestion: 'OrderDetail: 订单明细',
        semanticAnalysis: {
            chineseName: '交易订单明细',
            description: '存储电商交易订单的商品明细信息',
            scenarios: ['交易分析', '商品运营'],
            coreFields: [{ field: 'detail_id', reason: '明细ID' }],
            qualityScore: 91,
            privacyLevel: 'L2'
        },
        fields: [
            { name: 'detail_id', type: 'bigint', comment: '明细ID' },
            { name: 'order_id', type: 'varchar(32)', comment: '订单ID' },
            { name: 'product_id', type: 'varchar(20)', comment: '商品ID' },
            { name: 'sku_id', type: 'varchar(20)', comment: 'SKU编码' },
            { name: 'quantity', type: 'int', comment: '数量' },
            { name: 'unit_price', type: 'decimal(10,2)', comment: '单价' },
            { name: 'subtotal', type: 'decimal(10,2)', comment: '小计' }
        ]
    },
    // GaussDB 数据源
    {
        table: 'iot_device_telemetry',
        sourceId: 'DS_014',
        sourceName: '物联网数据中心',
        sourceType: 'GaussDB',
        rows: '560M',
        updateTime: '2024-05-23 14:00:00',
        status: 'scanned',
        comment: '物联网设备遥测数据',
        confidence: 70,
        aiSuggestion: 'Telemetry: 遥测数据',
        fields: [
            { name: 'device_id', type: 'VARCHAR(32)', comment: '设备ID' },
            { name: 'metric_name', type: 'VARCHAR(50)', comment: '指标名称' },
            { name: 'metric_value', type: 'DOUBLE', comment: '指标值' },
            { name: 'collect_time', type: 'TIMESTAMP', comment: '采集时间' },
            { name: 'location', type: 'VARCHAR(100)', comment: '设备位置' }
        ]
    },
    // 更多 MySQL 数据源
    {
        table: 't_product_catalog',
        sourceId: 'DS_015',
        sourceName: '商品中心',
        sourceType: 'MySQL',
        rows: '850K',
        updateTime: '2024-05-23 15:00:00',
        status: 'analyzed',
        comment: '商品目录表',
        confidence: 89,
        aiSuggestion: 'Product: 商品',
        semanticAnalysis: {
            chineseName: '商品目录',
            description: '存储商品基础信息和分类属性',
            scenarios: ['商品管理', '搜索推荐'],
            coreFields: [{ field: 'product_id', reason: '商品ID' }],
            qualityScore: 88,
            privacyLevel: 'L1'
        },
        fields: [
            { name: 'product_id', type: 'varchar(20)', comment: '商品ID' },
            { name: 'product_name', type: 'varchar(200)', comment: '商品名称' },
            { name: 'category_id', type: 'int', comment: '类目ID' },
            { name: 'brand_id', type: 'int', comment: '品牌ID' },
            { name: 'price', type: 'decimal(10,2)', comment: '价格' },
            { name: 'status', type: 'tinyint', comment: '上架状态' }
        ]
    },
    // 更多 Oracle 数据源
    {
        table: 'HR_EMPLOYEE_INFO',
        sourceId: 'DS_016',
        sourceName: '人力资源系统',
        sourceType: 'Oracle',
        rows: '125K',
        updateTime: '2024-05-23 16:00:00',
        status: 'scanned',
        comment: '员工信息表',
        confidence: 82,
        aiSuggestion: 'Employee: 员工',
        fields: [
            { name: 'EMP_ID', type: 'VARCHAR2(20)', comment: '员工ID' },
            { name: 'EMP_NAME', type: 'VARCHAR2(50)', comment: '员工姓名' },
            { name: 'DEPT_ID', type: 'VARCHAR2(10)', comment: '部门ID' },
            { name: 'POSITION', type: 'VARCHAR2(50)', comment: '职位' },
            { name: 'HIRE_DATE', type: 'DATE', comment: '入职日期' },
            { name: 'SALARY', type: 'NUMBER(10,2)', comment: '薪资' }
        ]
    }
];
