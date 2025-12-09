import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  Building2, 
  DollarSign,
  Home,
  Download,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { heatmapService } from '@/services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ClusterDetailsModal = ({ isOpen, onClose, cluster }) => {
  if (!cluster) return null;

  const handleExportData = async () => {
    try {
      const res = await heatmapService.exportClusterData(cluster.id);
      if (res.success) {
        // In real implementation, this would download a file
        // For mock, we'll show a success message
        toast.success('Cluster data exported successfully');
        
        // Simulate download
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cluster.cluster_name.replace(/\s+/g, '_')}_data.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to export cluster data');
    }
  };

  // Prepare data for charts
  const industryChartData = cluster.dominant_industries.map(ind => ({
    name: ind.name,
    value: ind.percentage
  }));

  const skillsChartData = cluster.top_skills.slice(0, 7).map((skill, idx) => ({
    name: skill,
    count: Math.floor(cluster.alumni_count * (0.7 - idx * 0.08)) // Mock distribution
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="cluster-details-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{cluster.cluster_name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                {cluster.center_location.city}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Alumni Count</p>
                    <p className="text-2xl font-bold">{cluster.alumni_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Job Openings</p>
                    <p className="text-2xl font-bold">{cluster.job_opportunities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-2xl font-bold">{cluster.growth_rate}%</p>
                    <p className="text-xs text-gray-500">{cluster.growth_period}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Radius</p>
                    <p className="text-2xl font-bold">{cluster.radius_km} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Top Skills Chart */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Skills Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Dominant Industries Pie Chart */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dominant Industries
              </h3>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={industryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {industryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Companies */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top Companies
              </h3>
              <div className="flex flex-wrap gap-2">
                {cluster.top_companies.map(company => (
                  <Badge key={company} className="text-sm px-3 py-1">
                    {company}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Avg Salary Range</h3>
                </div>
                <p className="text-2xl font-bold text-green-600">{cluster.avg_salary_range}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Home className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold">Cost of Living Index</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600">{cluster.cost_of_living_index}</p>
                <p className="text-xs text-gray-500">(Base: 100)</p>
              </CardContent>
            </Card>
          </div>

          {/* Alumni Profiles */}
          {cluster.alumni_profiles && cluster.alumni_profiles.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Featured Alumni
                </h3>
                <div className="space-y-2">
                  {cluster.alumni_profiles.map(alumni => (
                    <div key={alumni.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{alumni.name}</p>
                        <p className="text-sm text-gray-600">{alumni.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleExportData} data-testid="export-cluster-data-btn">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClusterDetailsModal;
