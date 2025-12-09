import { useState, useEffect } from 'react';
import { careerPredictionService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Sparkles, BookOpen, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import PredictionCard from '@/components/career/PredictionCard';
import CareerTimeline from '@/components/career/CareerTimeline';
import PredictionDetailsModal from '@/components/career/PredictionDetailsModal';

const CareerInsights = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      // Get current user from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast.error('Please login to view career insights');
        return;
      }

      const user = JSON.parse(userData);
      const res = await careerPredictionService.getUserPrediction(user.id);

      if (res.success) {
        setPrediction(res.data);
      } else {
        toast.info('No career predictions available yet. Check back soon!');
      }
    } catch (error) {
      toast.error('Failed to load career insights');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictionClick = (pred) => {
    setSelectedPrediction(pred);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 max-w-7xl">
          <Card>
            <CardContent className="py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Loading your career insights...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!prediction) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6 max-w-7xl">
          <Card>
            <CardContent className="py-20 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Career Predictions Coming Soon</h3>
              <p className="text-gray-600">
                AI-powered career predictions are not yet available for your profile.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Complete your profile and update your skills to get personalized career insights.
              </p>
              <Button className="mt-6" onClick={() => window.location.href = '/profile'}>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Top 3 predictions for recommended actions
  const topPredictions = prediction.predicted_roles
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="career-insights-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Sparkles className="h-10 w-10 text-blue-600" />
            Your Career Insights
          </h1>
          <p className="text-gray-600 text-lg">
            AI-powered predictions and personalized career guidance based on your profile and skills.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Current Career Status */}
          <Card className="lg:col-span-1" data-testid="current-status-card">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Current Position
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Role</p>
                <p className="font-semibold text-lg">{prediction.current_role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Experience Level</p>
                <Badge variant="secondary" className="capitalize">{prediction.experience_level}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Skills</p>
                <div className="flex flex-wrap gap-1">
                  {prediction.current_skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Career Timeline */}
          <div className="lg:col-span-2">
            <CareerTimeline 
              currentRole={prediction.current_role}
              predictions={prediction.predicted_roles}
            />
          </div>
        </div>

        {/* Predicted Career Paths */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Predicted Career Paths
              </h2>
              <p className="text-gray-600 mt-1">
                Top {prediction.predicted_roles.length} career paths tailored for you
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="predictions-grid">
            {prediction.predicted_roles.map((pred, idx) => (
              <PredictionCard
                key={idx}
                prediction={pred}
                onClick={() => handlePredictionClick(pred)}
              />
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <Card data-testid="recommended-actions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Recommended Actions
            </CardTitle>
            <CardDescription>
              Next steps to accelerate your career growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top Skills to Learn */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Priority Skills to Learn
                </h3>
                <div className="space-y-2">
                  {topPredictions[0]?.skills_gap.slice(0, 3).map((skill, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="font-medium text-sm">{skill}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {topPredictions[0].skill_importance[skill] || 'high'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-3" 
                  variant="outline"
                  onClick={() => handlePredictionClick(topPredictions[0])}
                >
                  View Full Learning Path
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Alumni to Connect With */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Connect with Alumni
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  {topPredictions[0]?.similar_alumni_count} alumni have successfully transitioned to {topPredictions[0]?.role_name}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/directory'}
                >
                  Browse Alumni Directory
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Career Resources */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  Explore Career Resources
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Learn from knowledge capsules and career guides shared by alumni
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.location.href = '/knowledge'}
                >
                  Browse Knowledge Capsules
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(prediction.last_updated).toLocaleDateString()}
          {' • '}
          Next update: {new Date(prediction.next_update).toLocaleDateString()}
        </div>

        {/* Prediction Details Modal */}
        <PredictionDetailsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          prediction={selectedPrediction}
          userId={prediction.user_id}
        />
      </div>
    </MainLayout>
  );
};

export default CareerInsights;
