import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function AIInsights({ insights, qualityScore }: { insights: string[], qualityScore: number }) {
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
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-700">Projected Quality Post-Correction</span>
            <span className="text-lg font-bold text-green-600">
              {Math.min(100, (qualityScore + (100 - qualityScore) * 0.8)).toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(100, qualityScore + (100 - qualityScore) * 0.8)} className="h-2 bg-slate-200" />
          <p className="text-xs text-slate-500 mt-2 text-right">Accepting all suggestions will improve score significantly.</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
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

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Business Impact Summary</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Formatting errors in phone numbers and dates may cause CRM sync failures. We recommend applying the auto-corrections to prevent downstream integration issues.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}
