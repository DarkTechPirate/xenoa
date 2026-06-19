"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface UploadZoneProps {
  onFileSelected?: (file: File) => void;
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = () => {
    if (!file) return;
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
          isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex justify-center mb-4">
          <UploadCloud className={`w-16 h-16 ${isDragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
        </div>
        
        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-slate-800 font-medium text-lg">
              <FileType className="w-6 h-6 text-indigo-600" />
              {file.name}
            </div>
            <p className="text-sm text-slate-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB • Auto-schema detection ready
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-medium text-slate-700 mb-2">
              {isDragActive ? "Drop the file here..." : "Drag & drop your CSV here"}
            </p>
            <p className="text-slate-500">or click to browse from your computer</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {file && (
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleUpload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg px-10 py-3 rounded-lg flex items-center shadow-md transition-colors"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Validate Dataset
          </button>
        </div>
      )}
    </div>
  );
}
