import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import VerificationHistory from '@/components/advanced/VerificationHistory';

const AdminCardVerifications = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6" data-testid="admin-card-verifications-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Shield className="h-10 w-10 text-purple-600" />
            Card Verification Management
          </h1>
          <p className="text-gray-600 text-lg">
            Monitor and analyze AI-powered alumni card verification activities
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">AI-Powered Verification System</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Our advanced AI system validates alumni cards through multiple security checks including 
                  duplicate detection, signature verification, and expiry status validation with high confidence scores.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span><strong>Real-time</strong> validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span><strong>Multi-layer</strong> security checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span><strong>Fraud</strong> detection alerts</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification History Component */}
        <VerificationHistory isAdmin={true} />
      </div>
    </MainLayout>
  );
};

export default AdminCardVerifications;
