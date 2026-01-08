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
