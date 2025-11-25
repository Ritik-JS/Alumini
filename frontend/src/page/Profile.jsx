import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainNavbar from '@/components/layout/MainNavbar';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Link as LinkIcon, 
  Calendar,
  Edit,
  Save,
  X,
  Building,
  Award,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import mockdata from '@/mockdata.json';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Load profile data from mockdata
    if (user?.id) {
      const alumniProfile = mockdata.alumni_profiles?.find(p => p.user_id === user.id);
      if (alumniProfile) {
        setProfileData(alumniProfile);
      } else {
        // Create default profile structure if not found
        setProfileData({
          user_id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          bio: '',
          headline: '',
          current_company: '',
          current_role: '',
          location: '',
          batch_year: new Date().getFullYear(),
          skills: [],
          achievements: [],
          social_links: {},
          profile_completion_percentage: 20
        });
      }
    }
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  };

  const handleSave = () => {
    // TODO: Save to backend when available
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload profile data
    if (user?.id) {
      const alumniProfile = mockdata.alumni_profiles?.find(p => p.user_id === user.id);
      if (alumniProfile) {
        setProfileData(alumniProfile);
      }
    }
  };

  const updateField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!profileData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading profile...</p>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData.photo_url} alt={profileData.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-2xl">
                        {getInitials(profileData.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <h1 className="text-3xl font-bold" data-testid="profile-name">
                        {profileData.name}
                      </h1>
                      {profileData.headline && (
                        <p className="text-lg text-gray-600">{profileData.headline}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {profileData.current_role && profileData.current_company && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{profileData.current_role} at {profileData.current_company}</span>
                          </div>
                        )}
                        {profileData.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{profileData.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">
                          {user?.role}
                        </Badge>
                        {profileData.batch_year && (
                          <Badge variant="outline">Batch {profileData.batch_year}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} data-testid="edit-profile-btn">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleSave} data-testid="save-profile-btn">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancel} data-testid="cancel-edit-btn">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Completion */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-medium text-blue-600">
                      {profileData.profile_completion_percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${profileData.profile_completion_percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Content Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about" data-testid="tab-about">
                  <User className="w-4 h-4 mr-2" />
                  About
                </TabsTrigger>
                <TabsTrigger value="experience" data-testid="tab-experience">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Experience
                </TabsTrigger>
                <TabsTrigger value="education" data-testid="tab-education">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Education
                </TabsTrigger>
                <TabsTrigger value="skills" data-testid="tab-skills">
                  <Award className="w-4 h-4 mr-2" />
                  Skills
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                    <CardDescription>Tell others about yourself</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <textarea
                            id="bio"
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={profileData.bio || ''}
                            onChange={(e) => updateField('bio', e.target.value)}
                            data-testid="input-bio"
                            placeholder="Write a brief introduction about yourself..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="headline">Professional Headline</Label>
                          <Input
                            id="headline"
                            value={profileData.headline || ''}
                            onChange={(e) => updateField('headline', e.target.value)}
                            data-testid="input-headline"
                            placeholder="e.g., Senior Software Engineer | Tech Lead"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {profileData.bio ? (
                          <p className="text-gray-700">{profileData.bio}</p>
                        ) : (
                          <p className="text-gray-400 italic">No bio added yet</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={user?.email || ''}
                              disabled
                              data-testid="input-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={profileData.location || ''}
                              onChange={(e) => updateField('location', e.target.value)}
                              data-testid="input-location"
                              placeholder="City, Country"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium">{user?.email}</p>
                            </div>
                          </div>
                          {profileData.location && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="font-medium">{profileData.location}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience Tab */}
              <TabsContent value="experience" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                    <CardDescription>Your professional experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Position */}
                    {isEditing ? (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <h3 className="font-semibold">Current Position</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentRole">Role</Label>
                            <Input
                              id="currentRole"
                              value={profileData.current_role || ''}
                              onChange={(e) => updateField('current_role', e.target.value)}
                              data-testid="input-current-role"
                              placeholder="e.g., Senior Developer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currentCompany">Company</Label>
                            <Input
                              id="currentCompany"
                              value={profileData.current_company || ''}
                              onChange={(e) => updateField('current_company', e.target.value)}
                              data-testid="input-current-company"
                              placeholder="e.g., Tech Corp"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {profileData.current_role || profileData.current_company ? (
                          <div className="flex gap-4 p-4 border rounded-lg">
                            <Building className="w-12 h-12 text-blue-600 bg-blue-50 rounded-lg p-2 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{profileData.current_role}</h3>
                              <p className="text-gray-600">{profileData.current_company}</p>
                              <p className="text-sm text-gray-500 mt-1">Present</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No experience added yet</p>
                        )}
                        
                        {/* Past Experience from experience_timeline */}
                        {profileData.experience_timeline && Array.isArray(profileData.experience_timeline) && 
                         profileData.experience_timeline.length > 0 && (
                          <div className="space-y-4">
                            {profileData.experience_timeline.map((exp, index) => (
                              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                                <Building className="w-12 h-12 text-gray-400 bg-gray-50 rounded-lg p-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{exp.role}</h3>
                                  <p className="text-gray-600">{exp.company}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {exp.start_date} - {exp.end_date || 'Present'}
                                  </p>
                                  {exp.description && (
                                    <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Your educational background</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="batchYear">Batch Year</Label>
                          <Input
                            id="batchYear"
                            type="number"
                            value={profileData.batch_year || ''}
                            onChange={(e) => updateField('batch_year', parseInt(e.target.value))}
                            data-testid="input-batch-year"
                            placeholder="e.g., 2020"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {profileData.education_details && Array.isArray(profileData.education_details) && 
                         profileData.education_details.length > 0 ? (
                          <div className="space-y-4">
                            {profileData.education_details.map((edu, index) => (
                              <div key={index} className="flex gap-4 p-4 border rounded-lg">
                                <GraduationCap className="w-12 h-12 text-green-600 bg-green-50 rounded-lg p-2 flex-shrink-0" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{edu.degree} in {edu.field}</h3>
                                  <p className="text-gray-600">{edu.institution}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {edu.start_year} - {edu.end_year}
                                  </p>
                                  {edu.achievements && (
                                    <p className="text-sm text-gray-700 mt-2">{edu.achievements}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No education details added yet</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Achievements</CardTitle>
                    <CardDescription>Showcase your expertise</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Skills</h3>
                      {profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No skills added yet</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Achievements</h3>
                      {profileData.achievements && Array.isArray(profileData.achievements) && 
                       profileData.achievements.length > 0 ? (
                        <ul className="space-y-2">
                          {profileData.achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400 italic">No achievements added yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
