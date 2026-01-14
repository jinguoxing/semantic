import { useState, useEffect } from 'react';
import {
    Layout, Database, GitMerge, Server, Layers,
    Search, AlertCircle, CheckCircle, ArrowRight,
    FileText, Settings, Activity, Cpu, Link,
    Code, RefreshCw, ChevronRight, PieChart, Shield,
    Plus, Upload, FileCheck, TrendingUp, MoreHorizontal, X, AlertTriangle, Users, Clock, MessageCircle, Send
} from 'lucide-react';

// ==========================================
// 导入模块化组件
// ==========================================
import {
    mockBusinessGoals,
    mockBusinessObjects,
    mockPhysicalTables,
    mockMappings,
    mockDataSources,
    mockBOTableMappings,
    mockConflicts,
    mockCatalogItems,
    mockScanResults
} from './data/mockData';


import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StatCard from './components/common/StatCard';
import StepItem from './components/common/StepItem';
import BookIcon from './components/common/BookIcon';
import DashboardView from './views/DashboardView';
import MappingStudioView from './views/MappingStudioView';
import BOMappingStudioView from './views/BOMappingStudioView';
import BusinessGoalsView from './views/BusinessGoalsView';
import BusinessModelingView from './views/BusinessModelingView';
import TechDiscoveryView from './views/TechDiscoveryView';
import ScenarioOrchestrationView from './views/ScenarioOrchestrationView';
import DataSemanticUnderstandingView from './views/DataSemanticUnderstandingView';
import CandidateGenerationView from './views/CandidateGenerationView';
import ConflictDetectionView from './views/ConflictDetectionView';
import SmartDataHubView from './views/SmartDataHubView';
import ApiGatewayView from './views/ApiGatewayView';
import CacheStrategyView from './views/CacheStrategyView';
import DataSourceManagementView from './views/DataSourceManagementView';
import AssetScanningView from './views/AssetScanningView';

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
    // Lifted State: Scan Results (Shared between BU-02 and BU-04)
    // Initialized with mock data to show logic view immediately
    const [scanResults, setScanResults] = useState<any[]>(mockScanResults || []);

    const handleAddBusinessObject = (newBO: any) => {
        setBusinessObjects([...businessObjects, newBO]);
    };

    const handleNavigateToMapping = (bo: any) => {
        setSelectedBO(bo);
        setActiveModule('bo_mapping');
    };

    // 渲染主内容区域
    const renderContent = () => {
        switch (activeModule) {
            case 'dashboard': return <DashboardView setActiveModule={setActiveModule} />;
            case 'td_goals': return <BusinessGoalsView />; // 新增路由
            case 'mapping': return <MappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} businessObjects={businessObjects} />;
            case 'bo_mapping': return <BOMappingStudioView selectedBO={selectedBO} showRuleEditor={showRuleEditor} setShowRuleEditor={setShowRuleEditor} businessObjects={businessObjects} />;
            case 'td_modeling': return <BusinessModelingView businessObjects={businessObjects} setBusinessObjects={setBusinessObjects} onNavigateToMapping={handleNavigateToMapping} />;
            case 'td_scenario': return <ScenarioOrchestrationView />;
            case 'bu_connect': return <DataSourceManagementView />;
            case 'bu_scan': return <AssetScanningView onNavigate={setActiveModule} onAddScanResults={(results) => setScanResults(prev => [...prev, ...results])} />;
            case 'bu_discovery': return <TechDiscoveryView onAddBusinessObject={handleAddBusinessObject} scanResults={scanResults} setScanResults={setScanResults} />;
            case 'bu_semantic': return <DataSemanticUnderstandingView scanResults={scanResults} setScanResults={setScanResults} />;
            case 'bu_candidates': return <CandidateGenerationView scanResults={scanResults} setScanResults={setScanResults} onAddBusinessObject={handleAddBusinessObject} />;
            case 'governance': return <ConflictDetectionView />;
            case 'smart_data': return <SmartDataHubView businessObjects={businessObjects} />;
            case 'data_supermarket': return <SmartDataHubView businessObjects={businessObjects} />;
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




