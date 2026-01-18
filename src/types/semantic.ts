
// P0: Actionable Governance Recommendations
export interface ActionItem {
    type: 'sql' | 'workflow' | 'manual';
    title: string;
    description: string;
    sqlTemplate?: string;
    priority: 'high' | 'medium' | 'low';
}

export interface SemanticGateResult {
    result: 'PASS' | 'REJECT' | 'REVIEW';
    details: {
        primaryKey: boolean; // T-02
        lifecycle: boolean; // T-03
        tableType: boolean; // T-04
    };
    reasons: string[];
    actionItems?: ActionItem[]; // P0: Specific remediation steps
}

export interface TableRuleScore {
    naming: number; // T-01
    behavior: number; // T-05
    comment: number; // T-06
    total: number;
}

export type GovernanceStatus = 'S0' | 'S1' | 'S2' | 'S3';

export interface ReviewStats {
    pendingReviewFields: number;
    gateFailedItems: number;
    riskItems: number;
}

export interface RunSummary {
    runId: string;
    status: 'queued' | 'running' | 'success' | 'failed';
    startedAt?: string;
    finishedAt?: string;
    sampleRows?: number;
    ruleVersion?: string;
    modelVersion?: string;
    queueInfo?: string;
    estimateTime?: string;
}

export type SemanticRole = 'Identifier' | 'BusAttr' | 'ForeignKey' | 'Status' | 'EventHint' | 'Audit';

// V2 Beta: Object Type Classification
export type ObjectType = 'entity' | 'event' | 'state' | 'rule' | 'attribute';

// V2 Beta: Business Domain Options
export const BUSINESS_DOMAINS = [
    '交易域', '用户域', '商品域', '营销域', '供应链域',
    '财务域', '客服域', '风控域', '数据域',
    '组织人事域', '薪酬福利域', '考勤工时域', '人才发展域',
    '其他'
] as const;
export type BusinessDomain = typeof BUSINESS_DOMAINS[number];

// V2 Beta: Data Layer Options
export const DATA_LAYERS = ['ODS', 'DWD', 'DWS', 'ADS', 'DIM', '其他'] as const;
export type DataLayer = typeof DATA_LAYERS[number];

// V2 Beta: Update Strategy Options
export const UPDATE_STRATEGIES = ['增量追加', '全量覆盖', '缓慢变化维'] as const;
export type UpdateStrategy = typeof UPDATE_STRATEGIES[number];

export interface FieldSemanticProfile {
    fieldName: string;
    dataType: string;
    role: SemanticRole;
    roleConfidence: number;
    sensitivity: 'L1' | 'L2' | 'L3' | 'L4';
    quality: 'A' | 'B' | 'C' | 'D';
    aiSuggestion?: string;
    ruleHit?: string;
    // V2 Beta: Field-level enhancements
    businessTerm?: string;
    businessDefinition?: string;
    logicalType?: string;
    unit?: string;
    governanceStatus?: GovernanceStatus;
}

export interface TableSemanticProfile {
    tableName: string;
    gateResult: SemanticGateResult;
    ruleScore: TableRuleScore;
    aiScore: number;
    fieldScore: number; // New: aggregate score from fields
    finalScore: number; // 0.55*AI + 0.45*Rule
    scoreBreakdown?: { rule: number; ai: number; field: number };

    businessName: string;
    description: string;
    tags: string[];

    fields: FieldSemanticProfile[];

    // Dual-dimension specific
    aiEvidence: string[];
    ruleEvidence: string[];
    aiEvidenceItems?: { field: string; reason: string; weight: number }[];

    // V2 Beta: Business Identity Dimension
    objectType?: ObjectType;
    objectTypeReason?: string;
    businessDomain?: BusinessDomain;
    dataGrain?: string;

    // V2 Beta: Lifecycle Dimension
    dataLayer?: DataLayer;
    updateStrategy?: UpdateStrategy;
    retentionPeriod?: string;

    // V2 Beta: Quality & Security Dimension
    securityLevel?: 'L1' | 'L2' | 'L3' | 'L4';
    dataOwner?: string;

    // Extra for UI
    relationships?: { targetTable: string; type: string; key: string; description: string }[];
    qualityScore?: number;
    analysisStep?: 'idle' | 'analyzing' | 'done';
    governanceStatus?: GovernanceStatus;
    reviewStats?: ReviewStats;
    lastRun?: RunSummary;
    confirmedBy?: string;
    confirmedAt?: string;
    confirmScope?: string;
}

export interface PreviewField {
    col: string;
    type: string;
    attr: string;
    conf: 'High' | 'Medium' | 'Low';
}

export interface AICandidate {
    id: string;
    sourceTable: string;
    suggestedName: string;
    confidence: number;
    reason: string;
    scores: {
        nameMatch: number;
        fieldMatch: number;
        dataSample: number;
    };
    mappedFields: number;
    status: 'pending' | 'accepted' | 'ignored';
    previewFields: PreviewField[];
}

export interface BusinessObject {
    id: string;
    name: string;
    code: string;
    domain: string;
    owner: string;
    status: 'draft' | 'published' | 'archived'; // Adjusted to match likely usage
    version?: string;
    description?: string;
    sourceTables?: string[];
    fields?: any[]; // Simplified for now
}
// Logs and History
export interface AuditLogEntry {
    id: string;
    tableId: string;
    field?: string;
    action: 'accept' | 'override' | 'pending' | 'confirm';
    source?: string;
    reason?: string;
    timestamp: string;
}

export interface UpgradeHistoryEntry {
    id: string;
    tableId: string;
    tableName: string;
    beforeState: any;
    afterState: any;
    timestamp: string;
    rolledBack: boolean;
}
