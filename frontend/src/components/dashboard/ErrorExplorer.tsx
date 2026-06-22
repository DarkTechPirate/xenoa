import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, AlertTriangle, Info, CheckCircle, ChevronDown, ChevronUp, ArrowRight, Lightbulb, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  date_format: 'Date Issues',
  phone_format: 'Phone Issues',
  duplicate: 'Duplicates',
  missing_value: 'Missing Values',
  statistical_anomaly: 'Anomalies',
  data_quality: 'Data Quality',
  data_type: 'Type Errors',
};

export function ErrorExplorer({ errors, corrections = [] }: { errors: any[], corrections?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Build a correction lookup by row+column
  const correctionMap = new Map<string, any>();
  corrections.forEach(c => correctionMap.set(`${c.row_index}-${c.column}`, c));

  const categories = ['all', ...Array.from(new Set(errors.map(e => e.category || 'other').filter(Boolean)))];

  const filteredErrors = errors.filter(err => {
    const matchesSearch = !searchTerm ||
      err.column.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || err.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const highCount = errors.filter(e => e.severity === 'high').length;
  const mediumCount = errors.filter(e => e.severity === 'medium').length;
  const lowCount = errors.filter(e => e.severity === 'low').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Medium</Badge>;
      default: return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Low</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Error Explorer
            </CardTitle>
            <CardDescription className="mt-1">Detailed view of validation failures — click any row to see why it matters and how to fix it</CardDescription>
          </div>
          <Badge variant="outline" className="bg-slate-50">{errors.length} Total Issues</Badge>
        </div>

        {/* Severity summary pills */}
        {errors.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {highCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" /> {highCount} High
              </span>
            )}
            {mediumCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> {mediumCount} Medium
              </span>
            )}
            {lowCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                <Info className="w-3 h-3" /> {lowCount} Low
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by column or error type..."
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category filter tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
                {cat !== 'all' && (
                  <span className="ml-1 opacity-70">({errors.filter(e => e.category === cat).length})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredErrors.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No errors found!</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Row</th>
                    <th className="px-4 py-3 font-medium">Column</th>
                    <th className="px-4 py-3 font-medium">Issue</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                    <th className="px-4 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredErrors.map((err, idx) => {
                    const correction = correctionMap.get(`${err.row_index}-${err.column}`);
                    const isExpanded = expandedRow === idx;
                    return (
                      <React.Fragment key={idx}>
                        <tr
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/40' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                        >
                          <td className="px-4 py-3 text-slate-500 font-mono">{err.row_index + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{err.column}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5">{getSeverityIcon(err.severity)}</span>
                              <div>
                                <div className="font-medium text-slate-700">{err.error_type}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{err.message}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-red-50 text-red-700 rounded border border-red-100 font-mono text-xs max-w-[150px] truncate" title={err.value}>
                              {err.value === null || err.value === '' ? 'NULL' : String(err.value)}
                            </span>
                            {correction && (
                              <div className="flex items-center gap-1 mt-1">
                                <ArrowRight className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-xs text-green-700 font-mono bg-green-50 border border-green-100 px-1.5 py-0.5 rounded max-w-[130px] truncate" title={correction.suggested_value}>
                                  {String(correction.suggested_value)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">{getSeverityBadge(err.severity)}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </td>
                        </tr>

                        {/* Expanded explanation row */}
                        {isExpanded && (err.explanation || err.fix_hint) && (
                          <tr className="bg-indigo-50/30">
                            <td colSpan={6} className="px-5 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {err.explanation && (
                                  <div className="flex gap-2.5">
                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Why this matters</p>
                                      <p className="text-sm text-slate-700 leading-relaxed">{err.explanation}</p>
                                    </div>
                                  </div>
                                )}
                                {err.fix_hint && (
                                  <div className="flex gap-2.5">
                                    <Wrench className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">How to fix it</p>
                                      <p className="text-sm text-slate-700 leading-relaxed">{err.fix_hint}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
