import { ObjectType, BusinessDomain } from '../types/semantic';

/**
 * V2 Beta: 模拟 AI 语义分析服务
 * 在实际应用中，这里会调用 LLM API (GPT-4 / Claude / 通义千问)
 */

// 对象类型推断规则
const inferObjectType = (tableName: string, fields: any[]): { type: ObjectType; reason: string } => {
    const name = tableName.toLowerCase();

    // 行为对象: 日志、历史、流水
    if (/log|trace|history|flow|record|event/.test(name)) {
        return { type: 'event', reason: '表名包含日志/流水关键词' };
    }

    // 规则对象: 字典、配置、枚举
    if (/dict|config|enum|setting|param/.test(name)) {
        return { type: 'rule', reason: '表名包含字典/配置关键词' };
    }

    // 状态对象: 状态、快照
    if (/status|state|snapshot/.test(name)) {
        return { type: 'state', reason: '表名包含状态关键词' };
    }

    // 属性对象: 标签、汇总、宽表
    if (/tag|label|summary|wide|agg|stat/.test(name)) {
        return { type: 'attribute', reason: '表名包含标签/汇总关键词' };
    }

    // 默认: 主体对象 (含 base/info/main 或普通表)
    if (/base|info|main|master|profile/.test(name) || fields.some(f => /^id$|_id$/.test(f.name))) {
        return { type: 'entity', reason: '表名包含实体关键词或含主键字段' };
    }

    return { type: 'entity', reason: '默认判断为主体对象' };
};

// 业务域推断
const inferBusinessDomain = (tableName: string): BusinessDomain => {
    const name = tableName.toLowerCase();

    if (/order|pay|trade|transaction/.test(name)) return '交易域';
    if (/user|member|account|profile/.test(name)) return '用户域';
    if (/product|goods|sku|item/.test(name)) return '商品域';
    if (/coupon|promotion|campaign|marketing/.test(name)) return '营销域';
    if (/stock|warehouse|supply|logistics/.test(name)) return '供应链域';
    if (/finance|bill|invoice|cost/.test(name)) return '财务域';
    if (/ticket|service|customer/.test(name)) return '客服域';

    return '其他';
};

// 数据粒度推断
const inferDataGrain = (tableName: string, fields: any[]): string => {
    const name = tableName.toLowerCase();

    if (/detail|item|line/.test(name)) return '明细粒度';
    if (/summary|agg|stat|wide/.test(name)) return '汇总粒度';
    if (/snapshot|daily|monthly/.test(name)) return '快照粒度';

    // 如果有聚合字段，判断为汇总粒度
    if (fields.some(f => /total|sum|count|avg/.test(f.name.toLowerCase()))) {
        return '汇总粒度';
    }

    return '明细粒度';
};

// 字段级建议生成
interface FieldSuggestion {
    name: string;
    suggestedRole: string;
    description: string;
    sensitivity: 'L1' | 'L2' | 'L3' | 'L4';
}

const generateFieldSuggestions = (fields: any[]): FieldSuggestion[] => {
    return fields.map(field => {
        const name = field.name.toLowerCase();
        let role = '业务属性';
        let description = field.comment || '待补充业务描述';
        let sensitivity: 'L1' | 'L2' | 'L3' | 'L4' = 'L1';

        // 识别主键
        if (name === 'id' || name.endsWith('_id')) {
            role = '标识符';
            description = description || `${field.name.replace('_id', '')} 的唯一标识`;
        }

        // 识别时间字段
        if (/(create|update|modify)_(time|at|date)/.test(name)) {
            role = '时间标记';
            description = description || `记录${name.includes('create') ? '创建' : '更新'}时间`;
        }

        // 识别状态字段
        if (/status|state|flag|type/.test(name)) {
            role = '状态';
            description = description || '业务状态标识';
        }

        // 敏感字段识别
        if (/phone|mobile|tel/.test(name)) {
            sensitivity = 'L3';
            description = description || '手机号码 (个人隐私)';
        }
        if (/id_card|passport|cert/.test(name)) {
            sensitivity = 'L3';
            description = description || '证件号码 (个人隐私)';
        }
        if (/password|secret|token/.test(name)) {
            sensitivity = 'L4';
            description = description || '敏感凭证 (严格加密)';
        }
        if (/name|address|email/.test(name)) {
            sensitivity = 'L2';
            description = description || '个人信息';
        }

        return {
            name: field.name,
            suggestedRole: role,
            description,
            sensitivity
        };
    });
};

// AI 分析入口
export const analyzeTableWithMockAI = async (
    tableName: string,
    fields: any[],
    comment?: string
): Promise<{
    aiScore: number;
    businessName: string;
    description: string;
    scenarios: string[];
    evidence: string[];
    tags: string[];
    objectType: ObjectType;
    objectTypeReason: string;
    businessDomain: BusinessDomain;
    dataGrain: string;
    fieldSuggestions: FieldSuggestion[];
}> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isLogTable = /log|trace|history/i.test(tableName);

    if (isLogTable) {
        return {
            aiScore: 0.25,
            businessName: tableName,
            description: '可能是日志或历史记录表，建议人工确认业务含义',
            scenarios: [],
            evidence: ['表名包含日志关键词', '可能需要补充业务定义'],
            tags: ['待确认'],
            objectType: 'event',
            objectTypeReason: '表名包含日志/流水关键词',
            businessDomain: '其他',
            dataGrain: '明细粒度',
            fieldSuggestions: generateFieldSuggestions(fields)
        };
    }

    const { type, reason } = inferObjectType(tableName, fields);

    // Mock a high score for demonstration
    const aiScore = 0.75 + Math.random() * 0.2;
    const domain = inferBusinessDomain(tableName);
    const grain = inferDataGrain(tableName, fields);

    const businessName = tableName
        .replace(/^t_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return {
        aiScore,
        businessName,
        description: comment || `${businessName} 相关的业务数据表`,
        scenarios: ['数据查询', '数据分析', '业务决策支持'],
        evidence: [
            `AI 推断这是一个${type === 'entity' ? '主体对象' : type === 'event' ? '行为对象' : '其他对象'}`,
            reason,
            `业务域: ${domain}`,
            `数据粒度: ${grain}`
        ],
        tags: [domain, grain, type === 'entity' ? '核心实体' : '业务对象'],
        objectType: type,
        objectTypeReason: reason,
        businessDomain: domain,
        dataGrain: grain,
        fieldSuggestions: generateFieldSuggestions(fields)
    };
};

/**
 * V2.3: 生成置信度提升任务（游戏化）
 */
export interface BoostingTask {
    factor: string;
    status: 'LOW' | 'MEDIUM' | 'OK';
    statusText: string;
    action: string;
    actionType: 'BATCH_GENERATE' | 'SPECIFY_PK' | 'IDENTIFY_JSON' | 'NONE';
    scoreImpact: number;
    description?: string;
}

export const generateBoostingTasks = (
    fields: any[],
    aiScore: number,
    profile?: any
): BoostingTask[] => {
    const tasks: BoostingTask[] = [];

    // Task 1: 字段注释覆盖率
    const commentedFields = fields.filter(f => f.comment && f.comment.trim()).length;
    const commentCoverage = fields.length > 0 ? commentedFields / fields.length : 0;

    tasks.push({
        factor: '字段注释',
        status: commentCoverage < 0.3 ? 'LOW' : commentCoverage < 0.7 ? 'MEDIUM' : 'OK',
        statusText: commentCoverage < 0.3 ? `覆盖率低 (${Math.round(commentCoverage * 100)}%)` :
            commentCoverage < 0.7 ? `覆盖率一般 (${Math.round(commentCoverage * 100)}%)` :
                '覆盖率良好',
        action: commentCoverage < 0.7 ? '批量生成注释建议' : '(已完成)',
        actionType: commentCoverage < 0.7 ? 'BATCH_GENERATE' : 'NONE',
        scoreImpact: commentCoverage < 0.3 ? 0.15 : commentCoverage < 0.7 ? 0.08 : 0,
        description: 'AI 基于字段名生成业务注释，需人工确认'
    });

    // Task 2: 语义主键识别
    const hasPrimaryKey = fields.some(f => f.name.toLowerCase().endsWith('_id') || f.name.toLowerCase() === 'id');
    tasks.push({
        factor: '主键语义',
        status: hasPrimaryKey ? 'OK' : 'LOW',
        statusText: hasPrimaryKey ? '已识别主键' : '未识别到语义主键',
        action: hasPrimaryKey ? '(已完成)' : '指定语义主键',
        actionType: hasPrimaryKey ? 'NONE' : 'SPECIFY_PK',
        scoreImpact: hasPrimaryKey ? 0 : 0.10,
        description: '跳转至详情页勾选唯一标识符'
    });

    // Task 3: 特殊字段识别
    const unknownFields = fields.filter(f =>
        /ext_|extra_|json|clob|text/.test(f.name.toLowerCase()) ||
        f.type?.toLowerCase().includes('json') ||
        f.type?.toLowerCase().includes('text')
    );

    if (unknownFields.length > 0) {
        tasks.push({
            factor: '特殊字段',
            status: 'MEDIUM',
            statusText: `存在 ${unknownFields.length} 个未知类型`,
            action: '识别 JSON 结构',
            actionType: 'IDENTIFY_JSON',
            scoreImpact: 0.05,
            description: `如: ${unknownFields[0].name}`
        });
    }

    // Task 4: 生命周期字段
    const hasTimeFields = fields.some(f =>
        /(create|update|modify)_(time|at|date)/.test(f.name.toLowerCase())
    );
    tasks.push({
        factor: '时间维度',
        status: hasTimeFields ? 'OK' : 'MEDIUM',
        statusText: hasTimeFields ? '生命周期完整' : '缺少时间字段',
        action: hasTimeFields ? '(已检测到创建/更新时间)' : '建议添加时间字段',
        actionType: 'NONE',
        scoreImpact: 0
    });

    return tasks;
};
