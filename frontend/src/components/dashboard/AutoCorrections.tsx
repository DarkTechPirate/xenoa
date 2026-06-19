import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wand2, Check, X, ArrowRight, Activity } from 'lucide-react';

export function AutoCorrections({ corrections }: { corrections: any[] }) {
  const [resolved, setResolved] = useState<Set<number>>(new Set());

  const handleAction = (idx: number) => {
    setResolved(new Set(resolved).add(idx));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-amber-500';
    return 'text-red-600';
  };

  const activeCorrections = corrections.filter((_, idx) => !resolved.has(idx));

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-5 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              Auto-Correction Engine
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">Intelligently suggested fixes based on heuristics</CardDescription>
          </div>
          <Badge className="bg-indigo-600 hover:bg-indigo-700">
            {activeCorrections.length} Suggestions
          </Badge>
        </div>
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
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs bg-white text-slate-600 font-mono">Row {corr.row_index + 1}</Badge>
                      <span className="text-sm font-medium text-slate-700">{corr.column}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="px-3 py-1.5 bg-red-50 border border-red-100 rounded text-red-700 font-mono text-sm line-through opacity-70">
                        {String(corr.original_value)}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded text-green-700 font-mono text-sm font-medium shadow-sm">
                        {String(corr.suggested_value)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Activity className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500">Confidence:</span>
                      <span className={getConfidenceColor(corr.confidence_score)}>
                        {(corr.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAction(idx)} className="h-8 border-slate-300 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleAction(idx)} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
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
