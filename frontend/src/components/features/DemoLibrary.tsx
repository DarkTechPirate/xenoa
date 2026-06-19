"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader2, CheckCircle, AlertTriangle, CalendarX, Globe, Copy, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DEMO_DATASETS = [
  {
    id: 'perfect',
    name: 'Perfect Dataset',
    description: '100% valid records. Demonstrates successful validation.',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    rows: 10,
    tags: ['Clean', 'Standard']
  },
  {
    id: 'phone_error',
    name: 'Phone Validation Error',
    description: 'Contains invalid country-specific phone numbers and missing digits.',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    rows: 10,
    tags: ['Phone', 'Format']
  },
  {
    id: 'date_error',
    name: 'Date Validation Error',
    description: 'Features invalid timestamps, incorrect formats, and missing values.',
    icon: CalendarX,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    rows: 10,
    tags: ['Date', 'Missing']
  },
  {
    id: 'mixed_country',
    name: 'Mixed Country Dataset',
    description: 'Data from India, Singapore, USA, and UK. Multi-region scenarios.',
    icon: Globe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    rows: 10,
    tags: ['Global', 'Validation']
  },
  {
    id: 'duplicate',
    name: 'Duplicate Orders',
    description: 'Includes duplicate order IDs and duplicate transactions.',
    icon: Copy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    rows: 13,
    tags: ['Duplicates', 'Integrity']
  },
  {
    id: 'large_scale',
    name: 'Large Scale Dataset',
    description: '100,000+ rows to demonstrate chunking and performance.',
    icon: Database,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    rows: 100000,
    tags: ['Performance', 'Chunking']
  }
];

interface DemoLibraryProps {
  onFileSelected?: (file: File) => void;
}

export function DemoLibrary({ onFileSelected }: DemoLibraryProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleLoadDemo = async (id: string) => {
    setLoadingId(id);
    try {
      // 1. Fetch the demo CSV
      const demoRes = await axios.get(`http://localhost:8001/api/demo/${id}`);
      const csvData = demoRes.data;

      // 2. Convert to File object
      const file = new File([csvData], `${id}_dataset.csv`, { type: 'text/csv' });
      
      // 3. Upload for validation
      if (onFileSelected) {
        onFileSelected(file);
        setLoadingId(null);
      }
    } catch (err) {
      console.error("Failed to load demo dataset", err);
      setLoadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {DEMO_DATASETS.map((dataset) => {
        const Icon = dataset.icon;
        return (
          <Card key={dataset.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-3 rounded-lg ${dataset.bgColor}`}>
                  <Icon className={`w-6 h-6 ${dataset.color}`} />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                  {dataset.rows.toLocaleString()} rows
                </Badge>
              </div>
              <CardTitle className="text-xl">{dataset.name}</CardTitle>
              <CardDescription className="text-sm mt-1">{dataset.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {dataset.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs text-slate-500 border-slate-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={dataset.id === 'perfect' ? 'default' : 'outline'}
                onClick={() => handleLoadDemo(dataset.id)}
                disabled={loadingId !== null}
              >
                {loadingId === dataset.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Load Dataset'
                )}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
