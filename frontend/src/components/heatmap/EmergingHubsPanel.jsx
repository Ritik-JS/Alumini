import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MapPin, Users, ArrowUpRight } from 'lucide-react';

const EmergingHubsPanel = ({ emergingHubs, onViewCluster }) => {
  const getGrowthBadgeColor = (growthLabel) => {
    switch (growthLabel) {
      case 'Rapid':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Moderate':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getGrowthIcon = (growthRate) => {
    return (
      <div className="flex items-center gap-1 text-green-600 font-semibold">
        <ArrowUpRight className="h-4 w-4" />
        <span>{growthRate}%</span>
      </div>
    );
  };

  return (
    <Card data-testid="emerging-hubs-panel">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Emerging Hubs
        </CardTitle>
        <CardDescription>
          Fastest-growing locations in the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {emergingHubs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No emerging hubs data available</p>
        ) : (
          <div className="space-y-4">
            {emergingHubs.map((hub, idx) => (
              <div
                key={hub.id}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                data-testid={`emerging-hub-${hub.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                      <h3 className="font-bold text-lg">{hub.cluster_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{hub.center_location.city}</span>
                    </div>
                  </div>
                  <Badge className={getGrowthBadgeColor(hub.growth_label)}>
                    {hub.growth_label} Growth
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Growth Rate</p>
                    {getGrowthIcon(hub.growth_rate)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Alumni</p>
                    <div className="flex items-center gap-1 font-semibold">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span>{hub.alumni_count}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Jobs</p>
                    <p className="font-semibold text-green-600">{hub.job_opportunities}</p>
                  </div>
                </div>

                {/* Top Industry */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Dominant Industry</p>
                  <Badge variant="outline">
                    {hub.dominant_industries[0].name} ({hub.dominant_industries[0].percentage}%)
                  </Badge>
                </div>

                {/* Comparison bar */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Growth Comparison</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((hub.growth_rate / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onViewCluster(hub)}
                  data-testid={`view-hub-details-${hub.id}`}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergingHubsPanel;
