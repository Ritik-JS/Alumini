import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Check, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from navigation state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
    
    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem('pendingVerificationEmail', emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // If no email found, redirect to register
      toast.error('No email found for verification');
      navigate('/register');
    }
  }, [location, navigate]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpCode(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error('Please paste only numbers');
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpCode(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    if (lastInput) lastInput.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyEmail(email, code);

      if (result.success) {
        setSuccess(true);
        localStorage.removeItem('pendingVerificationEmail');
        toast.success('Email verified successfully! Logging you in...');
        
        // Redirect to dashboard after 1.5 seconds (user is now auto-logged in)
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Invalid or expired verification code');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email not found');
      return;
    }

    setResending(true);
    setError('');

    try {
      const result = await resendVerification(email);

      if (result.success) {
        toast.success('Verification code resent! Check your email.');
        setOtpCode(['', '', '', '', '', '']); // Clear OTP fields
        const firstInput = document.getElementById('otp-0');
        if (firstInput) firstInput.focus();
      } else {
        setError(result.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md" data-testid="verify-email-card">
        <CardHeader className="space-y-1">
          {/* Back Button */}
          <div className="flex items-center mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              data-testid="back-to-register-button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Register
            </Button>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Mail className="text-white w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {success ? 'Email Verified!' : 'Verify Your Email'}
          </CardTitle>
          <CardDescription className="text-center">
            {success
              ? 'Your account has been verified successfully'
              : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" data-testid="error-alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-center block">Verification Code</Label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {otpCode.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-semibold"
                      data-testid={`otp-input-${index}`}
                      disabled={loading}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Enter the code from your email or paste it
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otpCode.join('').length !== 6}
                data-testid="verify-button"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full"
                  data-testid="resend-button"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Verification Complete!
                </h3>
                <p className="text-sm text-gray-600">
                  Your email has been verified successfully.
                </p>
                <p className="text-sm text-gray-600">
                  Redirecting you to your dashboard...
                </p>
              </div>

              <Button onClick={() => navigate('/dashboard')} className="w-full" data-testid="go-to-dashboard-button">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
