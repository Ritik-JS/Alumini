import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, DollarSign, Clock, Users, Briefcase, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';
import SkillGapIndicator from './SkillGapIndicator';
import LearningPathStepper from './LearningPathStepper';
import { useState, useEffect } from 'react';
import { mockCareerPredictionService } from '@/services/mockCareerPredictionService';
import { toast } from 'sonner';

const PredictionDetailsModal = ({ open, onClose, prediction, userId }) => {
  const [similarAlumni, setSimilarAlumni] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && prediction) {
      loadSimilarAlumni();
    }
  }, [open, prediction]);

  const loadSimilarAlumni = async () => {
    try {
      setLoading(true);
      const res = await mockCareerPredictionService.getSimilarAlumni(prediction.role_name);
      if (res.success) {
        setSimilarAlumni(res.data);
      }
    } catch (error) {
      toast.error('Failed to load alumni data');
    } finally {
      setLoading(false);
    }
  };

  if (!prediction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="prediction-details-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            {prediction.role_name}
          </DialogTitle>
          <DialogDescription>
            Career prediction with {prediction.probability}% match probability
          </DialogDescription>
        </DialogHeader>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-xs text-gray-600">Salary Range</p>
              <p className="text-sm font-bold mt-1">{prediction.salary_range}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-gray-600">Timeframe</p>
              <p className="text-sm font-bold mt-1">{prediction.timeframe}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-xs text-gray-600">Alumni</p>
              <p className="text-sm font-bold mt-1">{prediction.similar_alumni_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-xs text-gray-600">Success Rate</p>
              <p className="text-sm font-bold mt-1">{prediction.transition_success_rate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="learning">Learning Path</TabsTrigger>
            <TabsTrigger value="alumni">Alumni</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Role Overview
                </h3>
                <p className="text-sm text-gray-700">{prediction.industry_insights}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Transition Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Transition Success Rate</span>
                    <Badge variant="secondary">{prediction.transition_success_rate}%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Average Transition Duration</span>
                    <Badge variant="secondary">{prediction.avg_transition_duration}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm">Alumni Who Made This Transition</span>
                    <Badge variant="secondary">{prediction.similar_alumni_count} alumni</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                  <Lightbulb className="h-4 w-4" />
                  AI-Generated Career Advice
                </h3>
                <p className="text-sm text-blue-900">{prediction.ai_advice}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <SkillGapIndicator 
              skillsMatch={prediction.skills_match}
              skillsGap={prediction.skills_gap}
              skillImportance={prediction.skill_importance}
            />
          </TabsContent>

          {/* Learning Path Tab */}
          <TabsContent value="learning">
            <LearningPathStepper learningPath={prediction.learning_path} />
          </TabsContent>

          {/* Alumni Tab */}
          <TabsContent value="alumni" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Alumni Who Made This Transition
                </h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-2 text-sm text-gray-600">Loading alumni profiles...</p>
                  </div>
                ) : similarAlumni.length > 0 ? (
                  <div className="space-y-3">
                    {similarAlumni.map((alumni, idx) => (
                      <div key={alumni.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <Avatar>
                          <AvatarImage src={alumni.photo_url} />
                          <AvatarFallback>{alumni.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{alumni.name}</h4>
                          <p className="text-sm text-gray-600">{alumni.current_role} at {alumni.current_company}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {alumni.skills?.slice(0, 3).map((skill, sidx) => (
                              <Badge key={sidx} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No alumni profiles available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button className="flex-1" onClick={onClose}>
            Start Learning Path
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PredictionDetailsModal;
