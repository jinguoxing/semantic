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
    if (/risk|fraud|audit/.test(name)) return '风控域';

    return '其他';
};

// 数据粒度推断
const inferDataGrain = (tableName: string, objectType: ObjectType): string => {
    const name = tableName.toLowerCase().replace(/^t_|^tbl_/, '');

    switch (objectType) {
        case 'entity':
            if (/user|member/.test(name)) return '单个自然人用户';
            if (/order/.test(name)) return '单笔订单';
            if (/product|goods/.test(name)) return '单个商品SKU';
            return '单条业务记录';
        case 'event':
            if (/login/.test(name)) return '单次登录行为';
            if (/click|view/.test(name)) return '单次点击/浏览行为';
            if (/pay/.test(name)) return '单次支付行为';
            return '单次业务事件';
        case 'state':
            return '某时刻的状态快照';
        case 'rule':
            return '单条配置/规则项';
        case 'attribute':
            return '单个派生/汇总值';
        default:
            return '单条记录';
    }
};

// 业务名称映射
const nameMapping: Record<string, string> = {
    'user': '用户', 'profile': '画像', 'order': '订单', 'product': '产品',
    'customer': '客户', 'account': '账户', 'payment': '支付', 'transaction': '交易',
    'employee': '员工', 'department': '部门', 'main': '主', 'base': '基础',
    'info': '信息', 'detail': '明细', 'log': '日志', 'history': '历史',
    'config': '配置', 'dict': '字典', 'item': '商品', 'goods': '商品',
    'sku': 'SKU', 'stock': '库存', 'coupon': '优惠券', 'citizen': '公民',
    'license': '证照', 'ods': '原始'
};

export interface AIAnalysisResult {
    aiScore: number;
    businessName: string;
    description: string;
    evidence: string[];
    tags: string[];
    // V2 Beta: New fields
    objectType: ObjectType;
    objectTypeReason: string;
    businessDomain: BusinessDomain;
    dataGrain: string;
    // Field-level suggestions
    fieldSuggestions?: {
        fieldName: string;
        businessTerm: string;
        businessDefinition: string;
        logicalType?: string;
        unit?: string;
    }[];
}

export const analyzeTableWithMockAI = async (
    tableName: string,
    fields: any[],
    comment?: string
): Promise<AIAnalysisResult> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isLogTable = /log|trace|history/i.test(tableName);
    const { type: objectType, reason: objectTypeReason } = inferObjectType(tableName, fields);
    const businessDomain = inferBusinessDomain(tableName);
    const dataGrain = inferDataGrain(tableName, objectType);

    if (isLogTable) {
        return {
            aiScore: 0.25,
            businessName: tableName,
            description: '系统自动生成的日志表。',
            evidence: ['表名暗示日志记录', '时间戳字段密度高'],
            tags: ['技术表', '日志'],
            objectType: 'event',
            objectTypeReason: '表名包含日志关键词',
            businessDomain: '数据域',
            dataGrain: '单条日志记录'
        };
    }

    // 基于表名生成业务名称
    const parts = tableName.replace(/^t_|^tbl_|^ods_|^dwd_|^dws_|^ads_/, '').split('_');
    const readableName = parts
        .map(w => nameMapping[w.toLowerCase()] || (w.charAt(0).toUpperCase() + w.slice(1)))
        .join('');

    // 生成字段级建议
    const fieldSuggestions = fields.slice(0, 10).map(f => {
        const fname = f.name.toLowerCase();
        let businessTerm = f.name;
        let businessDefinition = '';
        let logicalType = '';
        let unit: string | undefined;

        if (/^id$|_id$/.test(fname)) {
            businessTerm = fname.replace(/_id$/, '') + 'ID';
            businessDefinition = '唯一标识符';
            logicalType = '标识符';
        } else if (/amount|price|cost|fee|money/.test(fname)) {
            businessTerm = '金额';
            businessDefinition = '金额数值';
            logicalType = '金额';
            unit = '元';
        } else if (/time$|_at$|date/.test(fname)) {
            businessTerm = fname.includes('create') ? '创建时间' : fname.includes('update') ? '更新时间' : '时间';
            businessDefinition = '时间戳记录';
            logicalType = '时间';
        } else if (/status|state/.test(fname)) {
            businessTerm = '状态';
            businessDefinition = '业务状态枚举值';
            logicalType = '枚举';
        } else if (/name/.test(fname)) {
            businessTerm = '名称';
            businessDefinition = '名称文本';
            logicalType = '文本';
        } else if (/phone|mobile/.test(fname)) {
            businessTerm = '手机号';
            businessDefinition = '手机号码';
            logicalType = '手机号';
        } else if (/email/.test(fname)) {
            businessTerm = '邮箱';
            businessDefinition = '电子邮箱地址';
            logicalType = '邮箱';
        } else if (/card|idcard/.test(fname)) {
            businessTerm = '身份证号';
            businessDefinition = '身份证号码';
            logicalType = '身份证';
        }

        return { fieldName: f.name, businessTerm, businessDefinition, logicalType, unit };
    });

    return {
        aiScore: 0.88 + (Math.random() * 0.1),
        businessName: readableName + '表',
        description: `核心业务实体，代表${readableName}信息。包含关键标识符和状态信息。`,
        evidence: [
            `表名 "${tableName}" 对应已知业务概念 "${readableName}"`,
            `包含有效的主键和生命周期字段`,
            `字段分布符合实体模式 (业务属性 > 系统字段)`
        ],
        tags: ['业务实体', '核心数据'],
        objectType,
        objectTypeReason,
        businessDomain,
        dataGrain,
        fieldSuggestions
    };
};
