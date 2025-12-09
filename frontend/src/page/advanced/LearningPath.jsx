import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { knowledgeService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Search, Clock, CheckCircle2, Circle, Award, 
  Target, Lightbulb, TrendingUp, ArrowRight, Star 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LearningPath = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathIdFromUrl = searchParams.get('path');

  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customGoal, setCustomGoal] = useState('');
  const [pathProgress, setPathProgress] = useState({});
  const [showGenerator, setShowGenerator] = useState(!pathIdFromUrl);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadPaths();
  }, []);

  useEffect(() => {
    if (pathIdFromUrl && paths.length > 0) {
      loadSpecificPath(pathIdFromUrl);
    }
  }, [pathIdFromUrl, paths]);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const res = await knowledgeService.getLearningPaths();
      if (res.success) {
        setPaths(res.data);
      }
    } catch (error) {
      toast.error('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecificPath = async (pathId) => {
    try {
      const res = await knowledgeService.getLearningPath(pathId);
      if (res.success) {
        setSelectedPath(res.data);
        setShowGenerator(false);
        await loadProgress(pathId);
      }
    } catch (error) {
      toast.error('Failed to load learning path');
    }
  };

  const loadProgress = async (pathId) => {
    if (!currentUser.id) return;
    
    try {
      const res = await knowledgeService.getPathProgress(currentUser.id, pathId);
      if (res.success) {
        setPathProgress(res.data);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const handleGeneratePath = async () => {
    if (!customGoal.trim()) {
      toast.error('Please enter a career goal or role');
      return;
    }

    try {
      setGenerating(true);
      const res = await knowledgeService.generateLearningPath(customGoal, []);
      if (res.success) {
        setSelectedPath(res.data);
        setShowGenerator(false);
        toast.success(res.message || 'Learning path generated!');
      }
    } catch (error) {
      toast.error('Failed to generate learning path');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectPath = async (pathId) => {
    await loadSpecificPath(pathId);
  };

  const handleToggleCapsuleComplete = async (capsuleId) => {
    if (!currentUser.id || !selectedPath) return;

    const isCompleted = pathProgress.completed_capsules?.includes(capsuleId);
    
    try {
      const res = await knowledgeService.updatePathProgress(
        currentUser.id,
        selectedPath.id,
        capsuleId,
        !isCompleted
      );
      
      if (res.success) {
        setPathProgress(res.data);
        toast.success(isCompleted ? 'Marked as incomplete' : 'Marked as complete!');
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const calculateProgress = () => {
    if (!selectedPath || !pathProgress.completed_capsules) return 0;
    const total = selectedPath.capsules?.length || 0;
    const completed = pathProgress.completed_capsules.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': 'bg-green-500',
      'Intermediate': 'bg-yellow-500',
      'Advanced': 'bg-red-500',
      'Mixed': 'bg-blue-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Paths</h1>
          <p className="text-gray-600">
            Follow curated learning paths or generate a custom path for your career goals
          </p>
        </div>

        {/* View: Path Generator or Path Details */}
        {showGenerator ? (
          <div className="space-y-6">
            {/* Custom Path Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Generate Custom Learning Path
                </CardTitle>
                <CardDescription>
                  Enter your target role or career goal and we'll create a personalized learning path for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePath()}
                    className="flex-1"
                  />
                  <Button onClick={handleGeneratePath} disabled={generating}>
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Generate Path
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pre-defined Paths */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Popular Learning Paths</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paths.map((path) => (
                  <Card 
                    key={path.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSelectPath(path.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{path.title}</CardTitle>
                          <CardDescription>{path.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {path.target_role}
                        </Badge>
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {path.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {path.estimated_duration}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {path.total_capsules} Capsules
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Skills Covered:</div>
                          <div className="flex flex-wrap gap-1">
                            {path.skills_covered.slice(0, 5).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {path.skills_covered.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{path.skills_covered.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button className="w-full mt-2" variant="outline">
                          Start Learning Path
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : selectedPath ? (
          <div className="space-y-6">
            {/* Back Button */}
            <Button variant="outline" onClick={() => setShowGenerator(true)}>
              ← Back to All Paths
            </Button>

            {/* Path Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {selectedPath.title}
                      {selectedPath.is_custom && (
                        <Badge className="ml-2" variant="secondary">Custom</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {selectedPath.description}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {selectedPath.target_role}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedPath.difficulty)}>
                        {selectedPath.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {selectedPath.estimated_duration}
                      </Badge>
                      <Badge variant="secondary">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {selectedPath.total_capsules} Capsules
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                {currentUser.id && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Your Progress</span>
                      <span className="text-sm text-gray-600">
                        {pathProgress.completed_capsules?.length || 0} / {selectedPath.capsules?.length || 0} completed
                      </span>
                    </div>
                    <Progress value={calculateProgress()} className="h-2" />
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Skills Covered</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedPath.skills_covered?.length || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Career Outcomes</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedPath.career_outcomes?.length || 0}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Prerequisites</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedPath.prerequisites?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Prerequisites */}
                {selectedPath.prerequisites && selectedPath.prerequisites.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Prerequisites
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedPath.prerequisites.map((prereq, idx) => (
                        <li key={idx}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills Covered */}
                <div>
                  <h3 className="font-semibold mb-2">Skills You'll Learn</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPath.skills_covered?.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Career Outcomes */}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Possible Career Outcomes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPath.career_outcomes?.map((outcome, idx) => (
                      <Badge key={idx} className="bg-green-500">
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Capsules List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Learning Capsules</h2>
              <div className="space-y-4">
                {selectedPath.capsules?.map((pathCapsule, idx) => {
                  const isCompleted = pathProgress.completed_capsules?.includes(pathCapsule.capsule_id);
                  const capsule = pathCapsule.capsule_details;
                  
                  return (
                    <Card 
                      key={pathCapsule.capsule_id}
                      className={cn(
                        "transition-all",
                        isCompleted && "bg-green-50 border-green-200"
                      )}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Order Number */}
                          <div className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold",
                            isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              pathCapsule.order
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                  {capsule?.title || `Capsule ${pathCapsule.order}`}
                                </h3>
                                {capsule && (
                                  <p className="text-gray-600 text-sm line-clamp-2">
                                    {capsule.content?.substring(0, 150)}...
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {pathCapsule.estimated_time}
                              </Badge>
                              {pathCapsule.is_required && (
                                <Badge className="bg-red-500">Required</Badge>
                              )}
                              {pathCapsule.completion_badge && (
                                <Badge className="bg-purple-500">
                                  <Award className="h-3 w-3 mr-1" />
                                  {pathCapsule.completion_badge}
                                </Badge>
                              )}
                              {capsule?.category && (
                                <Badge variant="secondary">{capsule.category}</Badge>
                              )}
                            </div>

                            {/* Tags */}
                            {capsule?.tags && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {capsule.tags.map((tag, tagIdx) => (
                                  <Badge key={tagIdx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              {capsule && (
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/knowledge/${capsule.id}`)}
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Read Capsule
                                </Button>
                              )}
                              {currentUser.id && (
                                <Button
                                  size="sm"
                                  variant={isCompleted ? "outline" : "secondary"}
                                  onClick={() => handleToggleCapsuleComplete(pathCapsule.capsule_id)}
                                >
                                  {isCompleted ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Completed
                                    </>
                                  ) : (
                                    <>
                                      <Circle className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default LearningPath;
