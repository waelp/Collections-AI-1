import React, { useCallback, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDataLoaded?: () => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const { setFile, fileName } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processFile = async (file: File) => {
    setProcessing(true);
    setError(null);

    try {
      await setFile(file);
      if (onDataLoaded) {
        onDataLoaded();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out text-center group cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          processing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "p-4 rounded-full bg-muted transition-colors duration-200",
            isDragging ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:text-primary"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              {fileName ? `File Loaded: ${fileName}` : "Upload Financial Data"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {fileName ? "Drag and drop to replace, or click to browse" : "Drag and drop your Excel or CSV file here, or click to browse"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> .xlsx
            </span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> .csv
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
