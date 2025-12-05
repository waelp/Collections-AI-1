import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { ColumnMapping as MappingType } from '@/types/data';

interface ColumnMappingProps {
  data?: any[];
  onMappingComplete?: (data: any[]) => void;
}

export function ColumnMapping({ data, onMappingComplete }: ColumnMappingProps) {
  const { columns, mapping, updateMapping, processData, rawData, mappedData } = useData();
  const [localMapping, setLocalMapping] = useState<MappingType>(mapping);

  // Update local mapping when context mapping changes
  useEffect(() => {
    setLocalMapping(mapping);
  }, [mapping]);

  const handleMappingChange = (key: keyof MappingType, value: string) => {
    setLocalMapping(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateMapping(localMapping);
    processData();
    // We need to wait for processData to complete and update mappedData in context
    // Since processData is synchronous in our implementation, we can call onMappingComplete immediately
    // but ideally we should pass the result directly.
    // For now, we'll rely on the parent component to handle the flow or use a timeout
    if (onMappingComplete) {
      setTimeout(() => {
        onMappingComplete(mappedData);
      }, 100);
    }
  };

  const mappingFields: { key: keyof MappingType; label: string; required: boolean }[] = [
    { key: 'invoiceNumber', label: 'Invoice Number', required: true },
    { key: 'customerName', label: 'Customer Name', required: true },
    { key: 'paymentTerms', label: 'PT', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'invoiceDate', label: 'Invoice Date', required: true },
    { key: 'dueDate', label: 'Due Date', required: false },
    { key: 'expectedDate', label: 'Expected Date', required: false },
    { key: 'businessCase', label: 'Business Case#', required: false },
    { key: 'collectorName', label: 'Collector Name', required: false },
    { key: 'paymentDate', label: 'Payment Date', required: false },
    { key: 'customerType', label: 'Customer Type', required: false },
    { key: 'totalAmount', label: 'Total Amount', required: true },
    { key: 'amountCollected', label: 'Amount Collected', required: false },
    { key: 'totalBalance', label: 'Total Balance', required: false },
    { key: 'creditNote', label: 'Credit Note-T', required: false },
    { key: 'openingBalance', label: 'Opening Balance', required: false },
    { key: 'salesperson', label: 'Salesperson', required: false },
  ];

  // Preview data based on current mapping
  const displayData = data || rawData;
  const previewData = displayData.slice(0, 5).map((row, idx) => {
    const mappedRow: Record<string, any> = {};
    mappingFields.forEach(field => {
      const columnKey = localMapping[field.key];
      if (columnKey) {
        mappedRow[field.label] = row[columnKey as keyof typeof row];
      }
    });
    return mappedRow;
  });

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            Map Columns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mappingFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <Select
                  value={localMapping[field.key]}
                  onValueChange={(val) => handleMappingChange(field.key, val)}
                >
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white" style={{color: '#f5f0f0'}}>
                    <SelectValue placeholder="Select Column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
              Process Data
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {previewData.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Data Preview (First 5 Rows)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  {mappingFields.map(field => (
                    localMapping[field.key] && (
                      <TableHead key={field.key} className="text-slate-400 whitespace-nowrap">
                        {field.label}
                      </TableHead>
                    )
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, i) => (
                  <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                    {mappingFields.map(field => (
                      localMapping[field.key] && (
                        <TableCell key={field.key} className="text-slate-300 whitespace-nowrap">
                          {String(row[field.label] || '')}
                        </TableCell>
                      )
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ColumnMapping;
