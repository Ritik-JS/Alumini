import { useState, useEffect } from 'react';
import { mockLeaderboardService } from '@/services/mockLeaderboardService';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [timePeriod, roleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const [leaderboardRes, myScoreRes, badgesRes, myBadgesRes] = await Promise.all([
        mockLeaderboardService.getLeaderboard({ role: roleFilter }),
        mockLeaderboardService.getMyScore(currentUser.id),
        mockLeaderboardService.getAllBadges(),
        mockLeaderboardService.getUserBadges(currentUser.id)
      ]);

      if (leaderboardRes.success) setLeaderboard(leaderboardRes.data);
      if (myScoreRes.success) setMyScore(myScoreRes.data);
      if (badgesRes.success) setAllBadges(badgesRes.data);
      if (myBadgesRes.success) setMyBadges(myBadgesRes.data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="h-8 w-8 text-yellow-500" />;
      case 2: return <Medal className="h-8 w-8 text-gray-400" />;
      case 3: return <Medal className="h-8 w-8 text-orange-600" />;
      default: return <span className="text-2xl font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getBadgeRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-7xl" data-testid="leaderboard-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Engagement Leaderboard
          </h1>
          <p className="text-gray-600 text-lg">
            See where you stand and celebrate top contributors in our community.
          </p>
        </div>

        {/* My Score Card */}
        {myScore && myScore.rank && (
          <Card className="mb-8 border-2 border-blue-500" data-testid="my-score-card">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-between">
                <span>Your Score</span>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Rank #{myScore.rank}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-blue-600">{myScore.total_score}</p>
                    <p className="text-gray-600 mt-1">Total Points</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This Week: {myScore.this_week_points}</span>
                      <span>This Month: {myScore.this_month_points}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Score Breakdown</h3>
                  {Object.entries(myScore.score_breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                      <Progress value={(value / 1000) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="leaderboard" data-testid="leaderboard-tab">Leaderboard</TabsTrigger>
            <TabsTrigger value="badges" data-testid="badges-tab">Badges</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <div className="space-x-2">
                    <span className="text-sm font-medium">Time Period:</span>
                    <Badge
                      variant={timePeriod === 'week' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setTimePeriod('week')}
                    >
                      This Week
                    </Badge>
                    <Badge
                      variant={timePeriod === 'month' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setTimePeriod('month')}
                    >
                      This Month
                    </Badge>
                    <Badge
                      variant={timePeriod === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setTimePeriod('all')}
                    >
                      All Time
                    </Badge>
                  </div>
                  <div className="space-x-2">
                    <span className="text-sm font-medium">Role:</span>
                    <Badge
                      variant={roleFilter === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setRoleFilter('all')}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={roleFilter === 'alumni' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setRoleFilter('alumni')}
                    >
                      Alumni
                    </Badge>
                    <Badge
                      variant={roleFilter === 'student' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setRoleFilter('student')}
                    >
                      Students
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Table */}
            {loading ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-4 text-gray-600">Loading leaderboard...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3" data-testid="leaderboard-list">
                {leaderboard.map((entry, idx) => (
                  <Card
                    key={entry.user_id}
                    className={`transition-all hover:shadow-md ${
                      entry.rank <= 3 ? 'border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : ''
                    }`}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-16 text-center">
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* Avatar & Info */}
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={entry.photo_url} />
                          <AvatarFallback>{entry.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg truncate">{entry.name}</h3>
                            <Badge variant="outline" className="text-xs capitalize">
                              {entry.role}
                            </Badge>
                            {getTrendIcon(entry.trend)}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {entry.badges.slice(0, 3).map(badge => (
                              <Badge key={badge} variant="secondary" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-600">{entry.total_score}</p>
                          <p className="text-xs text-gray-600">points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="space-y-6">
              {/* My Badges */}
              {myBadges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Badges ({myBadges.length})</CardTitle>
                    <CardDescription>Badges you've earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {myBadges.map(badge => (
                        <div
                          key={badge.id}
                          className={`p-6 rounded-lg text-white ${getBadgeRarityColor(badge.rarity)}`}
                          data-testid={`my-badge-${badge.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Award className="h-8 w-8" />
                            <Badge className="bg-white/20 text-white capitalize">
                              {badge.rarity}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                          <p className="text-sm opacity-90">{badge.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>All Badges</CardTitle>
                  <CardDescription>Complete challenges to unlock these badges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {allBadges.map(badge => {
                      const isUnlocked = myBadges.some(b => b.id === badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`p-6 rounded-lg relative ${
                            isUnlocked
                              ? `${getBadgeRarityColor(badge.rarity)} text-white`
                              : 'bg-gray-100 text-gray-400'
                          }`}
                          data-testid={`badge-${badge.id}`}
                        >
                          {!isUnlocked && (
                            <div className="absolute top-3 right-3">
                              <Lock className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-3">
                            <Award className="h-8 w-8" />
                            <Badge className={isUnlocked ? 'bg-white/20 text-white' : 'bg-gray-300'} >
                              {badge.rarity}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                          <p className="text-sm mb-3 opacity-90">{badge.description}</p>
                          <p className="text-xs opacity-75">
                            Requirement: {badge.requirement}
                          </p>
                          <p className="text-xs mt-2 opacity-75">
                            Unlocked by {badge.unlocked_by} alumni
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
