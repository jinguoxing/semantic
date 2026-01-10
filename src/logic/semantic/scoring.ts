import { TableRuleScore, FieldSemanticProfile } from '../../types/semantic';


export const calculateTableRuleScore = (tableName: string, fields: any[], comment?: string): { score: TableRuleScore, evidence: string[] } => {
    const score: TableRuleScore = {
        naming: 0,
        behavior: 0,
        comment: 0,
        total: 0
    };
    const evidence: string[] = [];

    // T-01: Table Name Naming (Noun)
    // Hard to detect noun in English/Chinese without NLP, simplified heuristic:
    // Short names or specific endings might indicate objects.
    // Here we just give a default good score if not too long and not snake_case_mess.
    if (tableName.length > 3) {
        score.naming = 0.8;
        evidence.push('Table name length is reasonable');
    }

    // T-05: Behavior Density
    // If many fields are time/operator, it's a behavior table.
    const behaviorFields = fields.filter(f => /time|date|operator|action/.test(f.name.toLowerCase()));
    const behaviorRatio = behaviorFields.length / fields.length;
    if (behaviorRatio < 0.4) {
        score.behavior = 0.9; // Good, not too many behavior fields
        evidence.push(`Behavior field ratio is low (${(behaviorRatio * 100).toFixed(0)}%), indicating an Entity.`);
    } else {
        score.behavior = 0.4;
        evidence.push(`High behavior field ratio (${(behaviorRatio * 100).toFixed(0)}%).`);
    }

    // T-06: Comment
    if (comment && comment.length > 2) {
        score.comment = 1.0;
        evidence.push('Table has meaningful comment');
    } else {
        score.comment = 0.5;
    }

    score.total = (score.naming * 0.3) + (score.behavior * 0.3) + (score.comment * 0.4);
    return { score, evidence };
};

export const calculateFusionScore = (tableScore: number, fieldScore: number, aiScore: number): number => {
    // 0.55 * AI + 0.45 * Rule
    // Rule is combination of tableScore and fieldScore?
    // Let's assume Rule Score passed here is already combined
    const ruleScore = (tableScore + fieldScore) / 2;
    return parseFloat((0.55 * aiScore + 0.45 * ruleScore).toFixed(2));
};
