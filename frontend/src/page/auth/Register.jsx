import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/schemas/authSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, Lock, Check, UserCircle, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      agreeToTerms: false,
    },
  });

  const watchedFields = watch();
  const progress = (step / 3) * 100;

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (step === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword'];
    } else if (step === 2) {
      fieldsToValidate = ['role', 'agreeToTerms'];
    }

    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (step < 3) {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data) => {
    if (step !== 2) {
      nextStep();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (result.success) {
        setRegistrationComplete(true);
        setStep(3);
        toast.success('Registration successful!');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    if (strength <= 25) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 50) return { strength, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 75) return { strength, label: 'Good', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(watchedFields.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          {/* Back Button */}
          <div className="flex items-center mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              data-testid="back-to-home-button"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {registrationComplete ? 'Registration Successful!' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {registrationComplete
              ? 'Check your email to verify your account'
              : 'Join the AlumUnity community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!registrationComplete ? (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>
                    Account Info
                  </span>
                  <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>
                    Profile Type
                  </span>
                  <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>
                    Verification
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Step 1: Account Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@alumni.edu"
                          className="pl-10"
                          {...register('email')}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a strong password"
                          className="pl-10"
                          {...register('password')}
                        />
                      </div>
                      {watchedFields.password && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Password strength:</span>
                            <span className={`font-medium ${
                              passwordStrength.strength <= 25 ? 'text-red-500' :
                              passwordStrength.strength <= 50 ? 'text-orange-500' :
                              passwordStrength.strength <= 75 ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>{passwordStrength.label}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${passwordStrength.color}`}
                              style={{ width: `${passwordStrength.strength}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Re-enter your password"
                          className="pl-10"
                          {...register('confirmPassword')}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button type="button" onClick={nextStep} className="w-full">
                      Continue
                    </Button>
                  </div>
                )}

                {/* Step 2: Profile Type Selection */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>I am a...</Label>
                      <RadioGroup
                        value={watchedFields.role}
                        onValueChange={(value) => setValue('role', value)}
                      >
                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="font-medium">Student</div>
                              <div className="text-xs text-gray-500">Currently enrolled student</div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="alumni" id="alumni" />
                          <Label htmlFor="alumni" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <UserCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="font-medium">Alumni</div>
                              <div className="text-xs text-gray-500">Graduate of the institution</div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="recruiter" id="recruiter" />
                          <Label htmlFor="recruiter" className="flex items-center space-x-3 cursor-pointer flex-1">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            <div>
                              <div className="font-medium">Recruiter</div>
                              <div className="text-xs text-gray-500">Hiring for a company</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                      {errors.role && (
                        <p className="text-sm text-red-500">{errors.role.message}</p>
                      )}
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeToTerms"
                        checked={watchedFields.agreeToTerms}
                        onCheckedChange={(checked) => setValue('agreeToTerms', checked)}
                      />
                      <Label htmlFor="agreeToTerms" className="text-sm cursor-pointer leading-tight">
                        I agree to the{' '}
                        <Link to="/terms" className="text-blue-600 hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                    )}

                    <div className="flex space-x-3">
                      <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* Step 3: Email Verification Success */
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Verification Email Sent!
                </h3>
                <p className="text-sm text-gray-600">
                  We've sent a verification email to <strong>{watchedFields.email}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Please check your inbox and click the verification link to activate your account.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Go to Login
                </Button>
                <p className="text-xs text-gray-500">
                  Didn't receive the email?{' '}
                  <button className="text-blue-600 hover:underline">
                    Resend verification email
                  </button>
                </p>
              </div>
            </div>
          )}

          {!registrationComplete && (
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
