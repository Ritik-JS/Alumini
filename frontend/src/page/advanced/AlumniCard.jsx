import { useState, useEffect } from 'react';
import { alumniCardService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Share2, Printer, CheckCircle, QrCode, Search, Camera, Shield, AlertCircle, Clock, TrendingUp, Linkedin, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRScanner from '@/components/advanced/QRScanner';
import VerificationHistory from '@/components/advanced/VerificationHistory';

const AlumniCard = () => {
  const [cardData, setCardData] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
      const res = await alumniCardService.getMyCard(user.id);

      if (res.success) {
        setCardData(res.data);
      } else {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error('Failed to load alumni card');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (cardNumber = null) => {
    const identifier = cardNumber || verifyInput;
    
    if (!identifier.trim()) {
      toast.error('Please enter a card number or scan QR code');
      return;
    }

    try {
      setVerifying(true);
      const res = await alumniCardService.verifyCard(identifier);

      // Always set result to show AI validation checks
      setVerificationResult(res.data);
      
      if (res.success) {
        toast.success('Card verified successfully!');
      } else {
        toast.error(res.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
      setVerificationResult({ 
        verified: false, 
        error: 'System error occurred',
        aiValidation: {
          duplicate_check: 'unknown',
          signature_check: 'unknown',
          expiry_check: 'unknown',
          confidence_score: 0,
          validation_status: 'error'
        }
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleQRScan = (scannedData) => {
    setVerifyInput(scannedData);
    setShowScanner(false);
    handleVerify(scannedData);
  };

  const getConfidenceBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">High Confidence ({score}%)</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence ({score}%)</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Confidence ({score}%)</Badge>;
  };

  const handleDownload = async () => {
    try {
      const response = await alumniCardService.downloadCard(cardData.id);
      
      if (response.success && response.data) {
        // If response.data is base64 string
        if (typeof response.data === 'string') {
          // Decode base64 and create blob
          const byteCharacters = atob(response.data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `alumni_card_${cardData.card_number}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          // Handle binary data
          const blob = new Blob([response.data], { type: 'image/png' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `alumni_card_${cardData.card_number}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
        
        toast.success('Card downloaded successfully!');
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Alumni Card',
        text: `Check out my alumni card: ${cardData.card_number}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(cardData.card_number);
      toast.success('Card number copied to clipboard');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-5xl" data-testid="alumni-card-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <CreditCard className="h-10 w-10 text-blue-600" />
            Digital Alumni ID Card
          </h1>
          <p className="text-gray-600 text-lg">
            Your official digital alumni identification card.
          </p>
        </div>

        <Tabs defaultValue="card" className="space-y-6">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="card" data-testid="my-card-tab">My Card</TabsTrigger>
            <TabsTrigger value="verify" data-testid="verify-tab">Verify Card</TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">Verification History</TabsTrigger>
          </TabsList>

          {/* My Card Tab */}
          <TabsContent value="card">
            {loading ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading your card...</p>
                </CardContent>
              </Card>
            ) : !cardData ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Card Found</h3>
                  <p className="text-gray-600">Please contact the admin to issue your alumni card.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Alumni Card */}
                <Card className="max-w-2xl mx-auto mb-6 overflow-hidden print-card" data-testid="alumni-card">
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">AlumUnity</h2>
                        <p className="text-blue-200 text-sm">Official Alumni ID Card</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {cardData.profile?.is_verified && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {cardData.ai_validation_status && (
                          <Badge className="bg-purple-500 text-white">
                            <Shield className="h-4 w-4 mr-1" />
                            AI Validated
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex gap-6">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-lg bg-white/20 backdrop-blur-sm overflow-hidden border-2 border-white/30">
                          {cardData.profile?.photo_url ? (
                            <img
                              src={cardData.profile.photo_url}
                              alt={cardData.profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                              {cardData.profile?.name?.substring(0, 2)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Name</p>
                          <p className="text-2xl font-bold">{cardData.profile?.name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Batch Year</p>
                            <p className="text-lg font-semibold">{cardData.profile?.batch_year || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Card Number</p>
                            <p className="text-lg font-semibold font-mono">{cardData.card_number}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Valid Until</p>
                          <p className="text-sm font-semibold">
                            {new Date(cardData.expiry_date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        {/* LinkedIn Link */}
                        {cardData.profile?.social_links?.linkedin && (
                          <div>
                            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">LinkedIn</p>
                            <a 
                              href={cardData.profile.social_links.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold hover:underline flex items-center gap-1"
                            >
                              <Linkedin className="h-3 w-3" />
                              View Profile
                            </a>
                          </div>
                        )}
                      </div>

                      {/* QR Code */}
                      <div className="flex-shrink-0">
                        <div className="w-28 h-28 bg-white rounded-lg p-2 flex items-center justify-center">
                          {cardData.qr_code_data ? (
                            <QRCodeSVG 
                              value={cardData.qr_code_data}
                              size={104}
                              level="M"
                              includeMargin={false}
                            />
                          ) : (
                            <QrCode className="h-full w-full text-gray-800" />
                          )}
                        </div>
                        <p className="text-xs text-blue-200 text-center mt-2">
                          {cardData.profile?.social_links?.linkedin ? 'Scan for LinkedIn' : 'Scan to verify'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* AI Validation Status */}
                {cardData.ai_validation_status && (
                  <Card className="max-w-2xl mx-auto mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        AI Validation Status
                      </CardTitle>
                      <CardDescription>
                        Your card has been validated using advanced AI security checks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Validation Status:</span>
                          <Badge className={
                            cardData.ai_validation_status === 'verified' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {cardData.ai_validation_status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">AI Confidence:</span>
                          {getConfidenceBadge(cardData.ai_confidence_score)}
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Duplicate Check:</span>
                          <Badge className={
                            cardData.duplicate_check_passed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {cardData.duplicate_check_passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Signature Verified:</span>
                          <Badge className={
                            cardData.signature_verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }>
                            {cardData.signature_verified ? 'Valid' : 'Invalid'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Total Verifications:</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {cardData.verification_count || 0}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Last Verified:</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {cardData.last_verified 
                              ? new Date(cardData.last_verified).toLocaleDateString() 
                              : 'Never'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <Card className="max-w-2xl mx-auto mb-6">
                  <CardHeader>
                    <CardTitle>Card Actions</CardTitle>
                    <CardDescription>Download, share, or print your alumni card</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleDownload} variant="default" data-testid="download-card-button">
                        <Download className="mr-2 h-4 w-4" />
                        Download as Image
                      </Button>
                      <Button onClick={handleShare} variant="outline" data-testid="share-card-button">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      <Button onClick={handlePrint} variant="outline" data-testid="print-card-button">
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Verify Card Tab */}
          <TabsContent value="verify">
            <Card>
              <CardHeader>
                <CardTitle>Verify Alumni Card</CardTitle>
                <CardDescription>
                  Enter card number or scan QR code to verify authenticity with AI validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter card number (e.g., ALM-2019-00287)"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      data-testid="verify-input"
                    />
                  </div>
                  <Button onClick={() => handleVerify()} disabled={verifying} data-testid="verify-button">
                    <Search className="mr-2 h-4 w-4" />
                    {verifying ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button 
                    onClick={() => setShowScanner(true)} 
                    variant="outline"
                    data-testid="scan-qr-button"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Scan QR
                  </Button>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <Card className={verificationResult.verified ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <CardContent className="pt-6 space-y-4">
                      {verificationResult.verified ? (
                        <>
                          <div className="flex items-center gap-3 text-green-700">
                            <CheckCircle className="h-8 w-8" />
                            <div>
                              <h3 className="text-xl font-bold">Card Verified!</h3>
                              <p className="text-sm">This is a valid alumni card</p>
                            </div>
                          </div>
                          <div className="bg-white p-4 rounded-lg space-y-2">
                            <p><span className="font-semibold">Name:</span> {verificationResult.profile?.name}</p>
                            <p><span className="font-semibold">Card Number:</span> {verificationResult.card?.card_number}</p>
                            <p><span className="font-semibold">Batch Year:</span> {verificationResult.profile?.batch_year}</p>
                            <p><span className="font-semibold">Valid Until:</span> {new Date(verificationResult.card?.expiry_date).toLocaleDateString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 text-red-700">
                          <AlertCircle className="h-8 w-8" />
                          <div>
                            <h3 className="text-xl font-bold">Verification Failed</h3>
                            <p className="text-sm">{verificationResult.error}</p>
                          </div>
                        </div>
                      )}

                      {/* AI Validation Checks */}
                      {verificationResult.aiValidation && (
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            AI Validation Checks
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">Duplicate Check:</span>
                              <Badge className={
                                verificationResult.aiValidation.duplicate_check === 'passed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }>
                                {verificationResult.aiValidation.duplicate_check}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">Signature:</span>
                              <Badge className={
                                verificationResult.aiValidation.signature_check === 'valid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }>
                                {verificationResult.aiValidation.signature_check}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">Expiry Status:</span>
                              <Badge className={
                                verificationResult.aiValidation.expiry_check === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }>
                                {verificationResult.aiValidation.expiry_check}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-700">AI Confidence:</span>
                              {getConfidenceBadge(verificationResult.aiValidation.confidence_score)}
                            </div>
                          </div>

                          {/* Verification Timestamp & History */}
                          {verificationResult.aiValidation.verification_timestamp && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                              <p className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Verified at: {new Date(verificationResult.aiValidation.verification_timestamp).toLocaleString()}
                              </p>
                            </div>
                          )}

                          {verificationResult.verificationHistory && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p>Total verifications: <strong>{verificationResult.verificationHistory.total_verifications}</strong></p>
                              {verificationResult.verificationHistory.last_verified && (
                                <p>Last verified: {new Date(verificationResult.verificationHistory.last_verified).toLocaleDateString()}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification History Tab */}
          <TabsContent value="history">
            <VerificationHistory 
              cardId={cardData?.id} 
              isAdmin={currentUser?.role === 'admin'}
            />
          </TabsContent>
        </Tabs>

        {/* QR Scanner Modal */}
        {showScanner && (
          <QRScanner 
            onScan={handleQRScan} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-card, .print-card * {
            visibility: visible;
          }
          .print-card {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default AlumniCard;
