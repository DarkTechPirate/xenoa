"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Settings2, ShieldCheck, Database, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MappingConfig {
  mappings: Record<string, string>;
  rules: Record<string, boolean>;
  chunkConfig: {
    enableChunking: boolean;
    thresholdRows: number;
    chunkSize: number;
  };
}

interface FieldMapperProps {
  file: File;
  onConfirm: (config: MappingConfig) => void;
  onCancel: () => void;
}

const REQUIRED_FIELDS = [
  { id: 'order_id', label: 'Order ID', description: 'Unique transaction identifier', section: 'order' },
  { id: 'transaction_date', label: 'Order Date', description: 'Date the order was placed', section: 'order' },
  { id: 'amount', label: 'Total Amount', description: 'Final transaction value', section: 'order' },
  { id: 'payment_mode', label: 'Payment Mode', description: 'UPI, Card, Cash, etc.', section: 'order' },
  { id: 'customer_name', label: 'Customer Name', description: 'Full name of the customer', section: 'customer' },
  { id: 'phone_number', label: 'Phone Number', description: 'Mobile number for validation', section: 'customer' },
  { id: 'country', label: 'Country Code', description: 'ISO code (e.g., USA, UK, India)', section: 'customer' },
];

const BUILT_IN_CHECKS = [
  { id: 'required_fields', label: 'Required Fields', description: 'Flag empty mandatory columns' },
  { id: 'duplicate_ids', label: 'Duplicate IDs', description: 'Detect repeated order IDs' },
  { id: 'phone_numbers', label: 'Phone Numbers', description: 'Auto-correct missing country codes based on location' },
  { id: 'date_time', label: 'Date & Time', description: 'Multi-format + ISO standardization' }
];

export function FieldMapper({ file, onConfirm, onCancel }: FieldMapperProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [rules, setRules] = useState<Record<string, boolean>>({
    required_fields: true,
    duplicate_ids: true,
    phone_numbers: true,
    date_time: true
  });
  const [chunkConfig, setChunkConfig] = useState({
    enableChunking: false,
    thresholdRows: 100000,
    chunkSize: 50000,
  });

  useEffect(() => {
    // Read CSV headers natively
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split('\n')[0];
      if (firstLine) {
        const cols = firstLine.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        setHeaders(cols);
        
        // Auto-map where possible
        const initialMap: Record<string, string> = {};
        REQUIRED_FIELDS.forEach(field => {
          const match = cols.find(c => c.toLowerCase() === field.id.toLowerCase() || c.toLowerCase().includes(field.label.toLowerCase().split(' ')[0]));
          if (match) initialMap[field.id] = match;
        });
        setMappings(initialMap);
      }
    };
    reader.readAsText(file.slice(0, 1024)); // Only read first 1KB for headers
  }, [file]);

  const toggleRule = (id: string) => {
    setRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (fieldId: string, header: string) => {
    setMappings(prev => ({ ...prev, [fieldId]: header }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full max-w-6xl mx-auto flex flex-col md:flex-row">
      {/* Left side: Mappings */}
      <div className="w-full md:w-2/3 p-6 md:p-8 border-r border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Map Your Fields
          </h2>
          <span className="bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-sm font-semibold">
            {Object.keys(mappings).length} / {REQUIRED_FIELDS.length} mapped
          </span>
        </div>

        {['order', 'customer'].map(section => (
          <div key={section} className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              {section === 'order' ? 'Order Fields' : 'Customer Fields'}
            </h3>
            <div className="space-y-3">
              {REQUIRED_FIELDS.filter(f => f.section === section).map(field => (
                <div key={field.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{field.label}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-indigo-600 px-2 py-0.5 rounded">Required</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                  </div>
                  
                  <div className="w-1/3 ml-4 flex items-center gap-3">
                    <select 
                      className="w-full text-sm border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none border"
                      value={mappings[field.id] || ""}
                      onChange={(e) => handleSelect(field.id, e.target.value)}
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    {mappings[field.id] ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right side: Rules */}
      <div className="w-full md:w-1/3 p-6 md:p-8 bg-white flex flex-col">
        <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          Built-in Checks
        </h2>

        <div className="space-y-4 flex-1">
          {BUILT_IN_CHECKS.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-800">{rule.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] leading-relaxed">{rule.description}</p>
              </div>
              <button 
                onClick={() => toggleRule(rule.id)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${rules[rule.id] ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rules[rule.id] ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Chunking Configuration */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-indigo-600" />
            Large File Processing
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Enable Auto-Chunking</p>
                <p className="text-xs text-slate-500">Split large files to prevent timeouts</p>
              </div>
              <button 
                onClick={() => setChunkConfig(prev => ({ ...prev, enableChunking: !prev.enableChunking }))}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${chunkConfig.enableChunking ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${chunkConfig.enableChunking ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {chunkConfig.enableChunking && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="text-xs font-medium text-slate-700">Threshold (Trigger chunking if rows \u003e)</label>
                  <select 
                    className="mt-1 w-full text-sm border-slate-300 rounded-md py-1.5 px-2 border focus:border-indigo-500 outline-none"
                    value={chunkConfig.thresholdRows}
                    onChange={(e) => setChunkConfig(prev => ({ ...prev, thresholdRows: Number(e.target.value) }))}
                  >
                    <option value={10000}>10,000 Rows</option>
                    <option value={50000}>50,000 Rows</option>
                    <option value={100000}>100,000 Rows</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Chunk Size (Rows per split)</label>
                  <select 
                    className="mt-1 w-full text-sm border-slate-300 rounded-md py-1.5 px-2 border focus:border-indigo-500 outline-none"
                    value={chunkConfig.chunkSize}
                    onChange={(e) => setChunkConfig(prev => ({ ...prev, chunkSize: Number(e.target.value) }))}
                  >
                    <option value={5000}>5,000 Rows</option>
                    <option value={10000}>10,000 Rows</option>
                    <option value={25000}>25,000 Rows</option>
                    <option value={50000}>50,000 Rows</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-3 pt-6 border-t border-slate-100">
          <Button 
            className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
            onClick={() => onConfirm({ mappings, rules, chunkConfig })}
          >
            Confirm & Run Validation
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-slate-500 hover:text-slate-700"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
