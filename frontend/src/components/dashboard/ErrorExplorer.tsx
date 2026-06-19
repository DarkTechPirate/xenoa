import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ErrorExplorer({ errors }: { errors: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredErrors = errors.filter(err => 
    err.column.toLowerCase().includes(searchTerm.toLowerCase()) || 
    err.error_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    err.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
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
            <CardDescription className="mt-1">Detailed view of validation failures</CardDescription>
          </div>
          <Badge variant="outline" className="bg-slate-50">{errors.length} Total Issues</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Search by column or error type..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredErrors.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No errors found!</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Row</th>
                    <th className="px-4 py-3 font-medium">Column</th>
                    <th className="px-4 py-3 font-medium">Issue</th>
                    <th className="px-4 py-3 font-medium">Value</th>
                    <th className="px-4 py-3 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredErrors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">{err.row_index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{err.column}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5">{getSeverityIcon(err.severity)}</span>
                          <div>
                            <div className="font-medium text-slate-700">{err.error_type}</div>
                            <div className="text-xs text-slate-500">{err.message}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 bg-red-50 text-red-700 rounded border border-red-100 font-mono text-xs max-w-[150px] truncate" title={err.value}>
                          {err.value === null || err.value === '' ? 'NULL' : String(err.value)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getSeverityBadge(err.severity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock CheckCircle since I forgot to import it at the top
import { CheckCircle } from 'lucide-react';
