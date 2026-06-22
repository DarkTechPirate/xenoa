"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatasetHealthAnalyzer } from '@/components/dashboard/DatasetHealthAnalyzer';
import { ErrorExplorer } from '@/components/dashboard/ErrorExplorer';
import { AutoCorrections } from '@/components/dashboard/AutoCorrections';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Loader2, Download, ArrowLeft, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface DashboardProps {
  data: any;
  file: File;
  config: any;
  onReset: () => void;
}

export default function DashboardPage({ data, file, config, onReset }: DashboardProps) {
  const [exporting, setExporting] = useState(false);
  const [anonymize, setAnonymize] = useState(false);

  if (!data) return null;

  const hasPII = data?.analytics?.pii_columns && data.analytics.pii_columns.length > 0;

  const handleExport = async () => {
    setExporting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));
    formData.append('corrections', JSON.stringify(data.corrections));
    formData.append('anonymize', anonymize ? 'true' : 'false');

    try {
      const response = await axios.post('http://localhost:8001/api/export', formData, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cleaned_dataset.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export dataset.");
    }
    setExporting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onReset} className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Upload
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Validation Dashboard</h1>
          <p className="text-slate-500 mt-1">Review the health and data quality of your transaction dataset.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium px-6 py-3 rounded-lg flex items-center shadow-md transition-colors"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Download Cleaned CSV
          </button>
          
          {hasPII && (
            <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              <input 
                type="checkbox" 
                checked={anonymize} 
                onChange={(e) => setAnonymize(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Anonymize PII Data on Export
            </label>
          )}
        </div>
      </div>

      <DatasetHealthAnalyzer health={data.health} schema={data.schema_detected} />

      <AnalyticsCharts analytics={data.analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <section id="errors">
            <ErrorExplorer errors={data.errors} corrections={data.corrections} />
          </section>
          
          <section id="corrections">
            <AutoCorrections corrections={data.corrections} />
          </section>
        </div>
        <div className="space-y-10">
          <AIInsights insights={data.insights} qualityScore={data.health.quality_score} errors={data.errors} />
        </div>
      </div>
    </div>
  );
}
