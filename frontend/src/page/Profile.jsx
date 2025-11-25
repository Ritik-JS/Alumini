import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mockProfileService } from '@/services/mockProfileService';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Edit,
  Save,
  X,
  Building,
  Award,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    try {
      if (!user?.id) return;
      
      // Try to get from localStorage first (for real-time updates)
      const storedProfiles = localStorage.getItem('alumni_profiles');
      let profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      
      let alumniProfile = profiles.find(p => p.user_id === user.id);
      
      if (!alumniProfile) {
        // Create default profile structure for students
        alumniProfile = {
          id: `profile-${user.id}-${Date.now()}`,
          user_id: user.id,
          name: user.email?.split('@')[0] || 'Student',
          email: user.email,
          photo_url: '',
          bio: '',
          headline: '',
          current_company: '',
          current_role: '',
          location: '',
          batch_year: new Date().getFullYear(),
          experience_timeline: [],
          education_details: [],
          skills: [],
          achievements: [],
          social_links: {},
          profile_completion_percentage: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Save new profile to localStorage
        profiles.push(alumniProfile);
        localStorage.setItem('alumni_profiles', JSON.stringify(profiles));
      }
      
      setProfileData(alumniProfile);
      setOriginalData(JSON.parse(JSON.stringify(alumniProfile)));
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = (data) => {
    let completion = 0;
    if (data.name) completion += 10;
    if (data.photo_url) completion += 10;
    if (data.bio && data.bio.length > 20) completion += 15;
    if (data.headline) completion += 10;
    if (data.location) completion += 10;
    if (data.current_role) completion += 10;
    if (data.current_company) completion += 10;
    if (data.batch_year) completion += 5;
    if (data.skills && data.skills.length >= 3) completion += 10;
    if (data.education_details && data.education_details.length > 0) completion += 10;
    return Math.min(completion, 100);
  };

  const handleSave = async () => {
    try {
      // Calculate profile completion
      const completion = calculateCompletion(profileData);
      const updatedData = {
        ...profileData,
        profile_completion_percentage: completion,
        updated_at: new Date().toISOString()
      };

      // Update in localStorage
      const storedProfiles = localStorage.getItem('alumni_profiles');
      let profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      const index = profiles.findIndex(p => p.user_id === user.id);
      
      if (index !== -1) {
        profiles[index] = updatedData;
      } else {
        profiles.push(updatedData);
      }
      
      localStorage.setItem('alumni_profiles', JSON.stringify(profiles));
      
      setProfileData(updatedData);
      setOriginalData(JSON.parse(JSON.stringify(updatedData)));
      setIsEditing(false);
      toast.success('Profile updated successfully! Changes will be reflected in real-time when backend is connected.');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleCancel = () => {
    setProfileData(JSON.parse(JSON.stringify(originalData)));
    setIsEditing(false);
  };

  const updateField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    const skill = prompt('Enter skill name:');
    if (skill && skill.trim()) {
      setProfileData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill.trim()]
      }));
    }
  };

  const removeSkill = (index) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    const achievement = prompt('Enter achievement:');
    if (achievement && achievement.trim()) {
      setProfileData(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), achievement.trim()]
      }));
    }
  };

  const removeAchievement = (index) => {
    setProfileData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    const institution = prompt('Enter institution name:');
    const degree = prompt('Enter degree:');
    const field = prompt('Enter field of study:');
    const startYear = prompt('Enter start year:');
    const endYear = prompt('Enter end year:');
    
    if (institution && degree) {
      setProfileData(prev => ({
        ...prev,
        education_details: [...(prev.education_details || []), {
          institution,
          degree,
          field: field || '',
          start_year: parseInt(startYear) || new Date().getFullYear() - 4,
          end_year: parseInt(endYear) || new Date().getFullYear(),
          achievements: ''
        }]
      }));
    }
  };

  const removeEducation = (index) => {
    setProfileData(prev => ({
      ...prev,
      education_details: prev.education_details.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    const company = prompt('Enter company name:');
    const role = prompt('Enter role/position:');
    const startDate = prompt('Enter start date (YYYY-MM):');
    const endDate = prompt('Enter end date (YYYY-MM) or leave empty if current:');
    const description = prompt('Enter description:');
    
    if (company && role) {
      setProfileData(prev => ({
        ...prev,
        experience_timeline: [...(prev.experience_timeline || []), {
          company,
          role,
          start_date: startDate || new Date().toISOString().slice(0, 7),
          end_date: endDate || null,
          description: description || ''
        }]
      }));
    }
  };

  const removeExperience = (index) => {
    setProfileData(prev => ({
      ...prev,
      experience_timeline: prev.experience_timeline.filter((_, i) => i !== index)
    }));
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  };

  if (loading || !profileData) {
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
                    {isEditing ? (
                      <div className="space-y-2">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={profileData.photo_url} alt={profileData.name} />
                          <AvatarFallback className="bg-blue-600 text-white text-2xl">
                            {getInitials(profileData.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <Label htmlFor="photo" className="text-xs">Photo URL</Label>
                          <Input
                            id="photo"
                            value={profileData.photo_url || ''}
                            onChange={(e) => updateField('photo_url', e.target.value)}
                            placeholder="https://..."
                            className="w-64 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profileData.photo_url} alt={profileData.name} />
                        <AvatarFallback className="bg-blue-600 text-white text-2xl">
                          {getInitials(profileData.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="space-y-1">
                      {isEditing ? (
                        <Input
                          value={profileData.name || ''}
                          onChange={(e) => updateField('name', e.target.value)}
                          className="text-3xl font-bold h-auto py-1"
                          placeholder="Your Name"
                          data-testid="input-name"
                        />
                      ) : (
                        <h1 className="text-3xl font-bold" data-testid="profile-name">
                          {profileData.name}
                        </h1>
                      )}
                      {profileData.headline && !isEditing && (
                        <p className="text-lg text-gray-600">{profileData.headline}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {profileData.current_role && profileData.current_company && !isEditing && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{profileData.current_role} at {profileData.current_company}</span>
                          </div>
                        )}
                        {profileData.location && !isEditing && (
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
                          <Textarea
                            id="bio"
                            rows={6}
                            className="w-full"
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
                            placeholder="e.g., Computer Science Student | Aspiring Developer"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {profileData.bio ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
                        ) : (
                          <p className="text-gray-400 italic">No bio added yet. Click Edit Profile to add one.</p>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Work Experience</CardTitle>
                        <CardDescription>Your professional experience</CardDescription>
                      </div>
                      {isEditing && (
                        <Button size="sm" onClick={addExperience}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Experience
                        </Button>
                      )}
                    </div>
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
                              placeholder="e.g., Intern, Part-time Developer"
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
                          <p className="text-gray-400 italic">No experience added yet. Click Edit Profile to add one.</p>
                        )}
                        
                        {/* Past Experience */}
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
                                {isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeExperience(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                )}
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
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Education</CardTitle>
                        <CardDescription>Your educational background</CardDescription>
                      </div>
                      {isEditing && (
                        <Button size="sm" onClick={addEducation}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Education
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing && (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="batchYear">Batch Year</Label>
                          <Input
                            id="batchYear"
                            type="number"
                            value={profileData.batch_year || ''}
                            onChange={(e) => updateField('batch_year', parseInt(e.target.value))}
                            data-testid="input-batch-year"
                            placeholder="e.g., 2024"
                          />
                        </div>
                      </div>
                    )}
                    
                    {profileData.education_details && Array.isArray(profileData.education_details) && 
                     profileData.education_details.length > 0 ? (
                      <div className="space-y-4">
                        {profileData.education_details.map((edu, index) => (
                          <div key={index} className="flex gap-4 p-4 border rounded-lg">
                            <GraduationCap className="w-12 h-12 text-green-600 bg-green-50 rounded-lg p-2 flex-shrink-0" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                              <p className="text-gray-600">{edu.institution}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {edu.start_year} - {edu.end_year}
                              </p>
                              {edu.achievements && (
                                <p className="text-sm text-gray-700 mt-2">{edu.achievements}</p>
                              )}
                            </div>
                            {isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEducation(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No education details added yet. Click Edit Profile to add one.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Skills & Achievements</CardTitle>
                        <CardDescription>Showcase your expertise</CardDescription>
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={addSkill}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Skill
                          </Button>
                          <Button size="sm" variant="outline" onClick={addAchievement}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Achievement
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Skills</h3>
                      {profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                              {skill}
                              {isEditing && (
                                <button
                                  onClick={() => removeSkill(index)}
                                  className="hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No skills added yet. Click Edit Profile to add skills.</p>
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
                              <span className="text-gray-700 flex-1">{achievement}</span>
                              {isEditing && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeAchievement(index)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400 italic">No achievements added yet. Click Edit Profile to add achievements.</p>
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
