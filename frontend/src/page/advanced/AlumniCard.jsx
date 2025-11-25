import { useState, useEffect } from 'react';
import { mockAlumniCardService } from '@/services/mockAlumniCardService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Share2, Printer, CheckCircle, QrCode, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AlumniCard = () => {
  const [cardData, setCardData] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await mockAlumniCardService.getMyCard(currentUser.id);

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

  const handleVerify = async () => {
    if (!verifyInput.trim()) {
      toast.error('Please enter a card number or scan QR code');
      return;
    }

    try {
      setVerifying(true);
      const res = await mockAlumniCardService.verifyCard(verifyInput);

      if (res.success) {
        setVerificationResult(res.data);
        toast.success('Card verified successfully!');
      } else {
        setVerificationResult({ verified: false, error: res.error });
        toast.error(res.error);
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = async () => {
    try {
      await mockAlumniCardService.downloadCard(cardData.id);
      toast.success('Card download started');
    } catch (error) {
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
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="card" data-testid="my-card-tab">My Card</TabsTrigger>
            <TabsTrigger value="verify" data-testid="verify-tab">Verify Card</TabsTrigger>
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
                        <h2 className="text-2xl font-bold mb-1">Alumni Portal</h2>
                        <p className="text-blue-200 text-sm">Official Alumni ID Card</p>
                      </div>
                      {cardData.profile?.is_verified && (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verified
                        </Badge>
                      )}
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
                      </div>

                      {/* QR Code */}
                      <div className="flex-shrink-0">
                        <div className="w-28 h-28 bg-white rounded-lg p-2 flex items-center justify-center">
                          <QrCode className="h-full w-full text-gray-800" />
                        </div>
                        <p className="text-xs text-blue-200 text-center mt-2">Scan to verify</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <Card>
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
                  Enter card number or scan QR code to verify authenticity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Enter card number (e.g., ALM-2019-00287)"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      data-testid="verify-input"
                    />
                  </div>
                  <Button onClick={handleVerify} disabled={verifying} data-testid="verify-button">
                    <Search className="mr-2 h-4 w-4" />
                    {verifying ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                {/* Verification Result */}
                {verificationResult && (
                  <Card className={verificationResult.verified ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    <CardContent className="pt-6">
                      {verificationResult.verified ? (
                        <div className="space-y-4">
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
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-red-700">
                          <div className="h-8 w-8 rounded-full border-2 border-red-700 flex items-center justify-center">
                            <span className="text-xl">✕</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Verification Failed</h3>
                            <p className="text-sm">{verificationResult.error}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
