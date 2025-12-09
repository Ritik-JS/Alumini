import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { alumniCardService } from '@/services';
import { CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Monitor, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const VerificationHistory = ({ cardId = null, isAdmin = false }) => {
  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', method: 'all', suspicious: false });

  useEffect(() => {
    loadVerifications();
  }, [cardId, filter]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      
      let res;
      if (cardId) {
        // Get history for specific card
        res = await alumniCardService.getCardVerificationHistory(cardId);
        setVerifications(res.data);
      } else if (isAdmin) {
        // Get all verifications (admin view)
        const filterParams = {};
        if (filter.status !== 'all') filterParams.status = filter.status;
        if (filter.method !== 'all') filterParams.method = filter.method;
        if (filter.suspicious) filterParams.suspicious = true;
        
        res = await alumniCardService.getVerificationHistory(filterParams);
        setVerifications(res.data.verifications);
        setStats(res.data.stats);
      }
    } catch (error) {
      toast.error('Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      valid: 'bg-green-100 text-green-800',
      invalid: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getConfidenceBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">High ({score}%)</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium ({score}%)</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low ({score}%)</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Chart data
  const statusChartData = stats ? [
    { name: 'Valid', value: stats.valid, fill: '#22c55e' },
    { name: 'Invalid', value: stats.invalid, fill: '#ef4444' },
    { name: 'Suspicious', value: stats.suspicious, fill: '#f59e0b' }
  ] : [];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading verification history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="verification-history">
      {/* Stats Cards (Admin only) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Verifications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                <p className="text-sm text-gray-600">Valid</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
                <p className="text-sm text-gray-600">Invalid</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts (Admin only) */}
      {isAdmin && stats && stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Valid', count: stats.valid },
                  { name: 'Invalid', count: stats.invalid },
                  { name: 'Suspicious', count: stats.suspicious }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filter.status} onValueChange={(val) => setFilter({ ...filter, status: val })}>
                  <SelectTrigger data-testid="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="invalid">Invalid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Method</label>
                <Select value={filter.method} onValueChange={(val) => setFilter({ ...filter, method: val })}>
                  <SelectTrigger data-testid="method-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="qr_scan">QR Scan</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={filter.suspicious ? 'default' : 'outline'}
                  onClick={() => setFilter({ ...filter, suspicious: !filter.suspicious })}
                  data-testid="suspicious-filter"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Suspicious Only
                </Button>
              </div>

              <div className="flex items-end ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setFilter({ status: 'all', method: 'all', suspicious: false })}
                  data-testid="clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification List */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Records</CardTitle>
          <CardDescription>
            {verifications.length} verification{verifications.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No verification records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <Card key={verification.id} className={verification.suspicious ? 'border-red-300 bg-red-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(verification.verification_status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-lg">{verification.card_number}</p>
                            {getStatusBadge(verification.verification_status)}
                            {verification.suspicious && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Suspicious
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(verification.verification_timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {verification.verification_method === 'qr_scan' ? 'QR Scan' : 'Manual'}
                        </Badge>
                        <p className="text-xs text-gray-500">By: {verification.verified_by}</p>
                      </div>
                    </div>

                    {/* AI Validation Checks */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold mb-3">AI Validation Checks:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Duplicate Check:</span>
                          <Badge className={verification.duplicate_check === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {verification.duplicate_check}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Signature:</span>
                          <Badge className={verification.signature_check === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {verification.signature_check}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Expiry Status:</span>
                          <Badge className={verification.expiry_check === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {verification.expiry_check}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">AI Confidence:</span>
                          {getConfidenceBadge(verification.ai_confidence)}
                        </div>
                      </div>
                    </div>

                    {/* Location & Device Info */}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {verification.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4" />
                        {verification.device_info}
                      </div>
                    </div>

                    {/* Reason for failure */}
                    {verification.reason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Reason:</strong> {verification.reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationHistory;
