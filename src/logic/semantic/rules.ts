import { SemanticGateResult, TableSemanticProfile, FieldSemanticProfile, SemanticRole } from '../../types/semantic';

/**
 * Gatekeeper Rules (Hard Rules)
 */

export const checkGatekeeper = (tableName: string, fields: any[]): SemanticGateResult => {
    const result: SemanticGateResult = {
        result: 'PASS',
        details: {
            primaryKey: false,
            lifecycle: false,
            tableType: true
        },
        reasons: []
    };

    // T-04: Table Type Exclusion (graylist + hard reject)
    const hardRejectPatterns = [/tmp/i, /temp/i, /bak/i, /_rel$/i];
    const graylistPatterns = [/log/i, /trace/i, /history/i, /detail$/i];
    const isHardReject = hardRejectPatterns.some(p => p.test(tableName));
    const isGraylist = graylistPatterns.some(p => p.test(tableName));

    if (isHardReject) {
        result.details.tableType = false;
        result.reasons.push('当前表命中强排规则 (临时表/备份表/关联表)，建议直接排除。');
    } else if (isGraylist) {
        result.reasons.push('当前表疑似日志/明细表，建议进入人工复核。');
    }

    // T-02: Primary Key Check
    // Check for 'id' field, or field ending in '_id', or primary key definition (mocked here as we just check field names)
    const hasPrimaryKey = fields.some(f => f.primaryKey || f.name.toLowerCase() === 'id' || f.name.toLowerCase().endsWith('_id'));
    if (hasPrimaryKey) {
        result.details.primaryKey = true;
    } else {
        result.reasons.push('未找到主键字段。');
    }

    // T-03: Lifecycle Field Check
    const lifecyclePatterns = [/create_time/i, /update_time/i, /created_at/i, /updated_at/i, /valid_from/i];
    const hasLifecycle = fields.some(f => lifecyclePatterns.some(p => p.test(f.name)));
    if (hasLifecycle) {
        result.details.lifecycle = true;
    } else {
        result.reasons.push('未找到生命周期字段 (如: create_time, update_time)。');
    }

    // Determine final Gate Result
    if (!result.details.tableType) {
        result.result = 'REJECT';
    } else if (isGraylist || !result.details.primaryKey || !result.details.lifecycle) {
        result.result = 'REVIEW';
    }

    return result;
};

/**
 * Field Semantic Analysis (Column Level)
 */
export const analyzeField = (field: any): FieldSemanticProfile => {
    const name = field.name.toLowerCase();

    let role: SemanticRole = 'BusAttr';
    let sensitivity: 'L1' | 'L2' | 'L3' | 'L4' = 'L1';
    let quality: 'A' | 'B' | 'C' | 'D' = 'B';
    let ruleHit = '';

    // D-04 Sensitivity
    if (/password|secret|pwd/.test(name)) sensitivity = 'L4';
    else if (/mobile|phone|id_card|bank_card/.test(name)) sensitivity = 'L3';
    else if (/name|email|address/.test(name)) sensitivity = 'L2';

    // D-01 Semantic Role

    // C-03 Audit
    if (/create_by|update_by|is_deleted|version|tenant_id/.test(name) || /_time$|_at$/.test(name) && /create|update/.test(name)) {
        role = 'Audit';
        ruleHit = 'C-03';
    }
    // C-01 Identifier
    else if (field.primaryKey || /^id$/.test(name) || /_id$/.test(name)) {
        role = 'Identifier';
        ruleHit = 'C-01';
    }
    // C-04 Status
    else if (/status|state|phase|stage|flag/.test(name)) {
        role = 'Status';
        ruleHit = 'C-04';
    }
    // C-05 Event Hint
    else if (/_time$|_date$|_at$/.test(name)) {
        role = 'EventHint';
        ruleHit = 'C-05';
    }
    // C-02 Foreign Key (Simple Heuristic for now)
    else if (/_id$/.test(name) && !field.primaryKey) {
        role = 'ForeignKey';
        ruleHit = 'C-02';
    } else {
        ruleHit = 'C-06';
    }

    // Role Confidence - Simple mock logic
    const roleConfidence = ruleHit === 'C-06' ? 0.6 : 0.9;

    return {
        fieldName: field.name,
        dataType: field.type,
        role,
        roleConfidence,
        sensitivity,
        quality,
        ruleHit
    };
};
