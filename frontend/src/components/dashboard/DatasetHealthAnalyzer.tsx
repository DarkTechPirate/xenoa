import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileDigit, Globe, Target, AlertTriangle } from 'lucide-react';

export function DatasetHealthAnalyzer({ health, schema }: { health: any, schema: any }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-slate-800">Dataset Health Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`col-span-1 md:col-span-2 lg:col-span-1 border-2 ${getScoreBg(health.quality_score)} shadow-sm`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Overall Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-5xl font-extrabold ${getScoreColor(health.quality_score)}`}>
              {health.quality_score}%
            </div>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              {health.quality_score >= 90 ? 'Excellent' : health.quality_score >= 70 ? 'Needs Attention' : 'Critical Issues'}
            </p>
          </CardContent>
        </Card>

        <MetricCard title="Total Records" value={health.total_records.toLocaleString()} icon={Database} />
        <MetricCard title="Columns Detected" value={health.columns.toString()} icon={FileDigit} />
        
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-500">Missing / Duplicates</CardTitle>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {health.missing_values_count} / {health.duplicate_count}
            </div>
            <p className="text-xs text-slate-500 mt-1">Records affected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Schema & Regions Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {health.countries_detected.map((country: str) => (
              <span key={country} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded border border-indigo-100">
                {country}
              </span>
            ))}
            {health.countries_detected.length === 0 && <span className="text-sm text-slate-500">No countries detected.</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(schema).slice(0, 8).map(([col, type]: [string, any]) => (
              <div key={col} className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                <span className="font-medium text-slate-700 truncate mr-2" title={col}>{col}</span>
                <span className="text-slate-400 font-mono">{type}</span>
              </div>
            ))}
            {Object.keys(schema).length > 8 && (
              <div className="flex items-center p-2 text-xs text-slate-500">
                + {Object.keys(schema).length - 8} more columns
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="w-4 h-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}
