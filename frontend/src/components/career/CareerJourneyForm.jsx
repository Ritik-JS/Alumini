import { useState } from 'react';
import { PlusCircle, Briefcase, Calendar, Star, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import apiCareerDataService from '@/services/apiCareerDataService';

const CareerJourneyForm = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    from_role: '',
    to_role: '',
    from_company: '',
    to_company: '',
    transition_date: '',
    skills_acquired: '',
    success_rating: 3,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.from_role || !formData.to_role || !formData.transition_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Parse skills from comma-separated string
      const skillsArray = formData.skills_acquired
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const data = {
        from_role: formData.from_role,
        to_role: formData.to_role,
        from_company: formData.from_company || null,
        to_company: formData.to_company || null,
        transition_date: formData.transition_date,
        skills_acquired: skillsArray,
        success_rating: parseInt(formData.success_rating),
      };

      await apiCareerDataService.addCareerTransition(data);
      
      toast.success('Career transition added successfully! 🎉');
      
      // Reset form
      setFormData({
        from_role: '',
        to_role: '',
        from_company: '',
        to_company: '',
        transition_date: '',
        skills_acquired: '',
        success_rating: 3,
      });
      
      setIsOpen(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add career transition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Award className="h-5 w-5 mr-2 text-blue-600" />
              Help Build Our AI Career Advisor 🤖
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Share your career journey to enable ML-powered career predictions.
              Your experience can guide 100+ future alumni!
            </p>
            <div className="flex items-center text-xs text-gray-600 mb-4">
              <Star className="h-4 w-4 mr-1 text-yellow-500" />
              <span>Takes only 5 minutes • Earn "Career Storyteller" badge</span>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto"
          data-testid="add-career-journey-btn"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Share My Career Journey
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6" data-testid="career-journey-form">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Add Career Transition
        </h3>
        <p className="text-sm text-gray-600">
          Help us train our AI by sharing your career progression
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Previous Role */}
        <div>
          <Label htmlFor="from-role" className="text-sm font-medium">
            Previous Role <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="from-role"
              type="text"
              placeholder="e.g., Software Engineer"
              value={formData.from_role}
              onChange={(e) => handleChange('from_role', e.target.value)}
              className="pl-10"
              required
              data-testid="from-role-input"
            />
          </div>
        </div>

        {/* Previous Company */}
        <div>
          <Label htmlFor="from-company" className="text-sm font-medium">
            Previous Company (Optional)
          </Label>
          <Input
            id="from-company"
            type="text"
            placeholder="e.g., Microsoft"
            value={formData.from_company}
            onChange={(e) => handleChange('from_company', e.target.value)}
            className="mt-1"
            data-testid="from-company-input"
          />
        </div>

        {/* Current/New Role */}
        <div>
          <Label htmlFor="to-role" className="text-sm font-medium">
            Current/New Role <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="to-role"
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={formData.to_role}
              onChange={(e) => handleChange('to_role', e.target.value)}
              className="pl-10"
              required
              data-testid="to-role-input"
            />
          </div>
        </div>

        {/* Current Company */}
        <div>
          <Label htmlFor="to-company" className="text-sm font-medium">
            Current Company (Optional)
          </Label>
          <Input
            id="to-company"
            type="text"
            placeholder="e.g., Google"
            value={formData.to_company}
            onChange={(e) => handleChange('to_company', e.target.value)}
            className="mt-1"
            data-testid="to-company-input"
          />
        </div>

        {/* Transition Date */}
        <div>
          <Label htmlFor="transition-date" className="text-sm font-medium">
            When did you transition? <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="transition-date"
              type="date"
              value={formData.transition_date}
              onChange={(e) => handleChange('transition_date', e.target.value)}
              className="pl-10"
              required
              max={new Date().toISOString().split('T')[0]}
              data-testid="transition-date-input"
            />
          </div>
        </div>

        {/* Skills Acquired */}
        <div>
          <Label htmlFor="skills-acquired" className="text-sm font-medium">
            Key Skills You Developed
          </Label>
          <Textarea
            id="skills-acquired"
            placeholder="e.g., System Design, Leadership, Kubernetes (separate with commas)"
            value={formData.skills_acquired}
            onChange={(e) => handleChange('skills_acquired', e.target.value)}
            className="mt-1"
            rows={3}
            data-testid="skills-acquired-input"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate skills with commas
          </p>
        </div>

        {/* Success Rating */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            How successful was this transition? <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleChange('success_rating', rating)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  formData.success_rating >= rating
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-yellow-300'
                }`}
                data-testid={`rating-${rating}`}
              >
                <Star
                  className={`h-6 w-6 mx-auto ${
                    formData.success_rating >= rating ? 'fill-current' : ''
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            1 = Difficult, 5 = Smooth
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
            data-testid="cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            data-testid="submit-career-transition-btn"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Transition
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CareerJourneyForm;
