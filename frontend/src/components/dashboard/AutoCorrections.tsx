import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wand2, Check, X, ArrowRight, Activity, CheckCheck, XCircle } from 'lucide-react';

export function AutoCorrections({ corrections }: { corrections: any[] }) {
  const [resolved, setResolved] = useState<Set<number>>(new Set());

  const handleAction = (idx: number) => setResolved(prev => new Set(prev).add(idx));

  const handleAcceptAll = () => setResolved(new Set(corrections.map((_, i) => i)));
  const handleRejectAll = () => setResolved(new Set(corrections.map((_, i) => i)));

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-amber-500';
    return 'text-red-500';
  };

  const getConfidenceBarColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-400';
    if (score >= 0.7) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const activeCorrections = corrections.filter((_, idx) => !resolved.has(idx));

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-5 border-b border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              Auto-Correction Engine
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">Intelligently suggested fixes — review each one before accepting</CardDescription>
          </div>
          <Badge className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
            {activeCorrections.length} Suggestions
          </Badge>
        </div>

        {activeCorrections.length > 1 && (
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={handleRejectAll}
              className="h-8 border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
              <XCircle className="w-4 h-4 mr-1.5" /> Reject All
            </Button>
            <Button size="sm" onClick={handleAcceptAll}
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
              <CheckCheck className="w-4 h-4 mr-1.5" /> Accept All
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-0">
        {activeCorrections.length === 0 ? (
          <div className="text-center py-12 bg-slate-50">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-slate-700 font-medium">All caught up!</p>
            <p className="text-slate-500 text-sm mt-1">No pending auto-corrections to review.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {corrections.map((corr, idx) => {
              if (resolved.has(idx)) return null;
              return (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Row + column label */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs bg-white text-slate-600 font-mono shrink-0">Row {corr.row_index + 1}</Badge>
                        <span className="text-sm font-medium text-slate-700">{corr.column}</span>
                      </div>

                      {/* Before → After */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded text-red-700 font-mono text-sm line-through opacity-70 max-w-[180px] truncate">
                          {String(corr.original_value)}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded text-green-700 font-mono text-sm font-medium shadow-sm max-w-[180px] truncate">
                          {String(corr.suggested_value)}
                        </div>
                      </div>

                      {/* Reason */}
                      {corr.reason && (
                        <p className="text-xs text-slate-500 mb-3 flex items-start gap-1.5">
                          <Activity className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
                          {corr.reason}
                        </p>
                      )}

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Confidence</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getConfidenceBarColor(corr.confidence_score)}`}
                            style={{ width: `${corr.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${getConfidenceColor(corr.confidence_score)}`}>
                          {(corr.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                      <Button size="sm" variant="outline" onClick={() => handleAction(idx)}
                        className="h-8 border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleAction(idx)}
                        className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
