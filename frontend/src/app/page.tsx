"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { UploadZone } from '@/components/features/UploadZone';
import { DemoLibrary } from '@/components/features/DemoLibrary';
import { ArrowRight, Database, ShieldCheck, Zap, Loader2, Download, CheckCircle2, Search, SlidersHorizontal, BarChart3, FileJson, SplitSquareHorizontal, Activity, ShieldAlert, BrainCircuit } from 'lucide-react';
import { FieldMapper, MappingConfig } from '@/components/features/FieldMapper';
import DashboardView from './dashboard/page';

export default function LandingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [config, setConfig] = useState<MappingConfig | null>(null);
  const [serverHealth, setServerHealth] = useState({ cpu: 0, mem: 0 });
  const router = useRouter();

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (validating) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('http://localhost:8001/api/health');
          setServerHealth({ cpu: res.data.cpu_percent, mem: res.data.memory_percent });
        } catch (e) {
          // ignore
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [validating]);

  const handleValidation = async (config: MappingConfig) => {
    if (!selectedFile) return;
    setValidating(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('config', JSON.stringify(config));

    try {
      const response = await axios.post('http://localhost:8001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setConfig(config);
      setValidationData(response.data);
      setValidating(false);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Validation failed. Please check the backend.");
      setValidating(false);
    }
  };

  if (validationData && selectedFile && config) {
    if (validationData.is_chunked) {
      return (
        <div className="min-h-screen bg-slate-50 py-12 px-8 flex flex-col items-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Large Dataset Chunked Successfully</h2>
            <p className="text-lg text-slate-600 mb-8">{validationData.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {validationData.chunks.map((chunk: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-indigo-600 font-bold mb-1">Chunk {chunk.chunk_index}</span>
                  <span className="text-xs text-slate-500">{chunk.row_count.toLocaleString()} rows</span>
                  <span className="text-xs text-slate-500">{(chunk.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                  <button className="mt-3 text-xs bg-white border border-slate-300 rounded px-3 py-1 hover:bg-slate-50 flex items-center gap-1">
                    <Download className="w-3 h-3" /> Get CSV
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                setValidationData(null);
                setSelectedFile(null);
                setConfig(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center mx-auto"
            >
              <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Start Over
            </button>
          </div>
        </div>
      );
    }

    return (
      <DashboardView 
        data={validationData} 
        file={selectedFile} 
        config={config} 
        onReset={() => {
          setValidationData(null);
          setSelectedFile(null);
          setConfig(null);
        }} 
      />
    );
  }

  if (selectedFile) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-8 flex flex-col items-center">
        <div className="w-full max-w-6xl flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-slate-900">
            <Database className="w-8 h-8 text-indigo-600" />
            TransactIQ Mapping
          </div>
          <button onClick={() => setSelectedFile(null)} className="text-sm font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>
        
        {validating ? (
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center mt-20 text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Dataset...</h2>
            <p className="text-slate-500 mb-8">Applying AI algorithms and validating records against your rules.</p>
            
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Server Telemetry</h3>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">CPU Load</span>
                  <span className={serverHealth.cpu > 80 ? 'text-rose-600 font-bold' : 'text-slate-600'}>{serverHealth.cpu}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${serverHealth.cpu > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${serverHealth.cpu}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">Memory Usage</span>
                  <span className={serverHealth.mem > 80 ? 'text-amber-600 font-bold' : 'text-slate-600'}>{serverHealth.mem}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${serverHealth.mem > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${serverHealth.mem}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <FieldMapper 
            file={selectedFile} 
            onConfirm={handleValidation} 
            onCancel={() => setSelectedFile(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-slate-900">
          <Database className="w-8 h-8 text-indigo-600" />
          TransactIQ
        </div>
        <nav className="flex gap-6 items-center">
          <Link href="#demo" className="text-sm font-medium text-slate-600 hover:text-slate-900">Demo Library</Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
          <Link href="#upload" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md">Get Started</Link>
        </nav>
      </header>

      <main className="w-full max-w-7xl px-8 py-24 flex flex-col items-center">
        <section className="text-center max-w-3xl mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 border border-indigo-100">
            <Zap className="w-4 h-4" /> Enterprise Validation Engine v1.0
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Transform Raw Transaction Data Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Business-Ready Insights</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">
            Validate, clean, correct, analyze, and export transaction datasets with enterprise-grade accuracy in seconds.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="#upload" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg px-8 h-14 flex items-center rounded-md">
              Upload CSV <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="#demo" className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-lg px-8 h-14 flex items-center rounded-md">
              Try Demo Dataset
            </Link>
          </div>
        </section>

        <section id="upload" className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Smart Upload Experience</h2>
            <p className="text-slate-500">Drag and drop your transaction CSV to begin validation</p>
          </div>
          <UploadZone onFileSelected={setSelectedFile} />
        </section>

        <section id="demo" className="w-full max-w-5xl mb-24">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            <h2 className="text-3xl font-bold text-slate-900">Demo Data Library</h2>
          </div>
          <p className="text-slate-600 mb-8 text-lg">
            Don't have a file ready? Choose one of our pre-configured datasets to see the platform in action.
          </p>
          <DemoLibrary onFileSelected={setSelectedFile} />
        </section>

        {/* --- FEATURES SECTION FOR STAKEHOLDERS / HR --- */}
        <section className="w-full max-w-6xl mb-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise-Grade Capabilities</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Everything your team needs to guarantee data integrity before transactions hit your database.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dynamic Load Balancing</h3>
              <p className="text-slate-600">Monitors real-time server CPU and RAM. Automatically shifts heavy processes into smart-chunking mode to prevent enterprise server crashes.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">PII Security & Compliance</h3>
              <p className="text-slate-600">Natively infers Personally Identifiable Information (Names, Phones) and offers 1-click anonymization on export for GDPR compliance.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Statistical ML Outliers</h3>
              <p className="text-slate-600">Deploys mathematical algorithms (Z-scores/Standard Deviations) to flag statistical anomalies in transaction amounts automatically.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Visual Field Mapping</h3>
              <p className="text-slate-600">Easily map your raw CSV columns to standardized system fields without writing code, and toggle specific validation rules.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Interactive Visualization</h3>
              <p className="text-slate-600">Transforms raw data into executive-level Recharts analytics, providing an immediate visual distribution of origin and payment modes.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <SplitSquareHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Massive Scale Chunking</h3>
              <p className="text-slate-600">Process files with hundreds of thousands of rows seamlessly. The system auto-chunks large files into manageable pieces to prevent timeouts.</p>
            </div>
          </div>
        </section>
        {/* --- END FEATURES SECTION --- */}
      </main>
    </div>
  );
}
