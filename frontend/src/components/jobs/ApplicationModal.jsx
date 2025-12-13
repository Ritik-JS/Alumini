import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { jobService } from '@/services';

const ApplicationModal = ({ isOpen, onClose, job, userId }) => {
  const [loading, setLoading] = useState(false);
  const [useProfile, setUseProfile] = useState('profile');
  const [coverLetter, setCoverLetter] = useState('');
  const [customCV, setCustomCV] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setCustomCV(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter');
      return;
    }

    if (useProfile === 'custom' && !customCV) {
      toast.error('Please upload your CV');
      return;
    }

    setLoading(true);
    try {
      const applicationData = {
        job_id: job.id,
        applicant_id: userId,
        cv_url: useProfile === 'profile' 
          ? `https://storage.example.com/cvs/${userId}-profile-cv.pdf`
          : `https://storage.example.com/cvs/${customCV.name}`,
        cover_letter: coverLetter,
      };

      const result = await jobService.submitApplication(applicationData);
      
      if (result.success) {
        // Clear application cache so hasUserApplied will fetch fresh data
        jobService.clearApplicationCache(userId);
        toast.success(result.message);
        onClose(true); // Pass true to indicate successful submission
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCoverLetter('');
      setCustomCV(null);
      setUseProfile('profile');
      onClose(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="application-modal">
        <DialogHeader>
          <DialogTitle>Apply for {job?.title}</DialogTitle>
          <DialogDescription>
            at {job?.company}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Resume/CV</Label>
            <RadioGroup value={useProfile} onValueChange={setUseProfile}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="profile" id="profile" />
                <Label htmlFor="profile" className="font-normal cursor-pointer">
                  Use CV from my profile
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Upload a different CV
                </Label>
              </div>
            </RadioGroup>

            {useProfile === 'custom' && (
              <div className="mt-2">
                <Label
                  htmlFor="cv-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    {customCV ? (
                      <>
                        <FileText className="w-8 h-8 text-green-600" />
                        <span className="text-sm font-medium">{customCV.name}</span>
                        <span className="text-xs text-gray-500">
                          {(customCV.size / 1024).toFixed(2)} KB
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Click to upload CV</span>
                        <span className="text-xs text-gray-500">PDF, DOC, DOCX (Max 5MB)</span>
                      </>
                    )}
                  </div>
                  <input
                    id="cv-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    data-testid="cv-upload-input"
                  />
                </Label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-letter">Cover Letter *</Label>
            <Textarea
              id="cover-letter"
              placeholder="Why are you interested in this position? What makes you a great fit?"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className="resize-none"
              data-testid="cover-letter-textarea"
            />
            <p className="text-xs text-gray-500">
              {coverLetter.length} / 1000 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              data-testid="cancel-application-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-application-btn"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationModal;
