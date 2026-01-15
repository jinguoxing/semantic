import React, { useState } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { TableSemanticProfile } from '../../types/semantic';
import { DimensionSummary } from './DimensionSummary';
import { ScoringBreakdownPanel } from './ScoringBreakdownPanel';
import { UpgradeSuggestionCard, generateUpgradeSuggestion } from './UpgradeSuggestionCard';

interface SemanticAnalysisCardProps {
    profile: TableSemanticProfile;
    fields: any[]; // Physical table fields for deep analysis
    onProfileChange?: (updates: Partial<TableSemanticProfile>) => void;
    onUpgradeAccepted?: (beforeState: TableSemanticProfile, afterState: any) => void;
}

export const SemanticAnalysisCard: React.FC<SemanticAnalysisCardProps> = ({
    profile,
    fields,
    onProfileChange,
    onUpgradeAccepted,
}) => {
    // V2.3F P5: Upgrade suggestion handlers
    const upgradeSuggestion = generateUpgradeSuggestion(profile);

    const handleUpgradeAccept = () => {
        if (!upgradeSuggestion) return;
        console.log('Upgrade accepted:', upgradeSuggestion);
        // Apply upgrade changes to profile
        if (onProfileChange) {
            const beforeState = { ...profile };
            onProfileChange(upgradeSuggestion.afterState);
            onUpgradeAccepted?.(beforeState, upgradeSuggestion.afterState);
        }
    };

    const handleUpgradeReject = (reason: string) => {
        console.log('Upgrade rejected. Reason:', reason);
        // Log rejection feedback for model optimization
    };

    const handleUpgradeLater = () => {
        console.log('Upgrade postponed');
        // Can implement a reminder system here
    };

    // Gate Result Logic for Display
    const isGateFailed = profile.gateResult.result !== 'PASS';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={18} />
                    <h2 className="font-bold text-slate-800">语义理解引擎</h2>
                </div>
                {isGateFailed && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">
                        规则拦截
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* V2.1: Compressed Dimension Summary */}
                <DimensionSummary profile={profile} />

                {/* V2.3F P6: Scoring Breakdown Panel */}
                <ScoringBreakdownPanel profile={profile} fields={fields} />

                {/* V2.3F P5: Upgrade Suggestion (conditional) */}
                {upgradeSuggestion && (
                    <UpgradeSuggestionCard
                        suggestion={upgradeSuggestion}
                        onAccept={handleUpgradeAccept}
                        onReject={handleUpgradeReject}
                        onLater={handleUpgradeLater}
                    />
                )}
            </div>
        </div>
    );
};
