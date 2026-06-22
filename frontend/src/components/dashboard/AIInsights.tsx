import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Sparkles, AlertCircle, AlertTriangle, Info, Shield, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CATEGORY_LABELS: Record<string, string> = {
  date_format: 'Date Format',
  phone_format: 'Phone Format',
  duplicate: 'Duplicates',
  missing_value: 'Missing Values',
  statistical_anomaly: 'Anomalies',
  data_quality: 'Data Quality',
  data_type: 'Type Errors',
};

interface AIInsightsProps {
  insights: string[];
  qualityScore: number;
  errors?: any[];
}

export function AIInsights({ insights, qualityScore, errors = [] }: AIInsightsProps) {
  const highCount = errors.filter(e => e.severity === 'high').length;
  const mediumCount = errors.filter(e => e.severity === 'medium').length;
  const lowCount = errors.filter(e => e.severity === 'low').length;

  const categoryBreakdown: Record<string, number> = {};
  errors.forEach(e => {
    if (e.category) categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
  });

  const projectedScore = Math.min(100, qualityScore + (100 - qualityScore) * 0.8);

  const getDynamicImpact = () => {
    const impacts: string[] = [];
    if (categoryBreakdown['date_format']) impacts.push('date errors will break API and CRM sync');
    if (categoryBreakdown['phone_format']) impacts.push('phone issues block international contact routing');
    if (categoryBreakdown['duplicate']) impacts.push('duplicates are inflating revenue metrics');
    if (categoryBreakdown['statistical_anomaly']) impacts.push('anomalous amounts require fraud review');
    if (categoryBreakdown['data_quality']) impacts.push('data quality issues affect financial calculations');
    if (categoryBreakdown['data_type']) impacts.push('type errors cause pipeline failures');
    if (impacts.length === 0) return 'Your dataset looks clean. No critical business impact detected.';
    return `Priority issues: ${impacts.join('; ')}. Apply the suggested auto-corrections to prevent downstream integration failures.`;
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-gradient-to-b from-white to-slate-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <Sparkles className="w-5 h-5 text-amber-500" />
          AI Insights Panel
        </CardTitle>
        <CardDescription>Automated analysis of your dataset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Projected quality score */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-700">Projected Quality Post-Correction</span>
            <span className="text-lg font-bold text-green-600">{projectedScore.toFixed(1)}%</span>
          </div>
          <Progress value={projectedScore} className="h-2 bg-slate-200" />
          <p className="text-xs text-slate-500 mt-2 text-right">Accepting all suggestions will improve score significantly.</p>
        </div>

        {/* Severity breakdown */}
        {errors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Error Severity Breakdown
            </h4>
            <div className="space-y-2">
              {highCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-xs w-14 text-red-600 font-medium">High</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(highCount / errors.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-5 text-right">{highCount}</span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs w-14 text-amber-600 font-medium">Medium</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(mediumCount / errors.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-5 text-right">{mediumCount}</span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-xs w-14 text-blue-600 font-medium">Low</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${(lowCount / errors.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-5 text-right">{lowCount}</span>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            {Object.keys(categoryBreakdown).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(categoryBreakdown).map(([cat, count]) => (
                  <span key={cat} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                    {CATEGORY_LABELS[cat] || cat}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Key findings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Key Findings
          </h4>
          {insights.length === 0 ? (
            <div className="p-3 bg-slate-100 rounded border border-slate-200 text-sm text-slate-600">
              Dataset looks highly consistent. No major anomalies detected.
            </div>
          ) : (
            insights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
              </div>
            ))
          )}
        </div>

        {/* Business impact */}
        <div className="pt-5 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            Business Impact Summary
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">{getDynamicImpact()}</p>
        </div>

      </CardContent>
    </Card>
  );
}
