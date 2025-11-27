import { AlertTriangle, Download, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ValidationReport = ({ report, onDownloadReport }) => {
  const { validationErrors = [], dataQualityScore, validRows, errorRows, totalRows } = report;

  // Prepare data for pie chart
  const errorTypeCount = validationErrors.reduce((acc, error) => {
    acc[error.error] = (acc[error.error] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(errorTypeCount).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Data Quality Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dataQualityScore?.toFixed(1) || 0}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              dataQualityScore >= 95 ? 'bg-green-100' : dataQualityScore >= 85 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <CheckCircle className={`h-8 w-8 ${
                dataQualityScore >= 95 ? 'text-green-600' : dataQualityScore >= 85 ? 'text-yellow-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  dataQualityScore >= 95 ? 'bg-green-600' : dataQualityScore >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${dataQualityScore}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {((validRows / totalRows) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Valid Rows</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {validRows?.toLocaleString()} / {totalRows?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {validationErrors.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Error Rows</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {errorRows?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Type Breakdown */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Error Types Breakdown</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Validation Errors Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Validation Errors</h3>
            <Badge variant="destructive">{validationErrors.length}</Badge>
          </div>
          {validationErrors.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadReport}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Report (CSV)</span>
            </Button>
          )}
        </div>

        {validationErrors.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">No validation errors!</p>
            <p className="text-sm text-gray-500 mt-1">All data passed validation successfully.</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationErrors.slice(0, 10).map((error, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{error.row}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{error.field}</code>
                    </TableCell>
                    <TableCell className="text-red-600">{error.error}</TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {error.value || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {validationErrors.length > 10 && (
              <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-500">
                Showing 10 of {validationErrors.length} errors. Download full report for details.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ValidationReport;
