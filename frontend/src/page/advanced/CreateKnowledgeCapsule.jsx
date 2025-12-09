import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { knowledgeService } from '@/services';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, X, ArrowLeft, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CreateKnowledgeCapsule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    duration_minutes: '',
    featured_image: '',
    tags: []
  });
  const [currentTag, setCurrentTag] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const categories = [
    { value: 'technical', label: 'Technical' },
    { value: 'career', label: 'Career Development' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'design', label: 'Design' },
    { value: 'business', label: 'Business' }
  ];

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleImageChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, featured_image: url });
    setImagePreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.duration_minutes || formData.duration_minutes < 1) {
      toast.error('Please enter a valid reading duration');
      return;
    }
    if (formData.tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }

    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const capsuleData = {
        ...formData,
        author_id: currentUser.id,
        duration_minutes: parseInt(formData.duration_minutes)
      };

      const res = await knowledgeService.createCapsule(capsuleData);
      
      if (res.success) {
        toast.success('Knowledge capsule created successfully!');
        navigate('/knowledge');
      } else {
        toast.error(res.error || 'Failed to create capsule');
      }
    } catch (error) {
      toast.error('Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-4xl" data-testid="create-capsule-page">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/knowledge')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Capsules
          </Button>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="h-10 w-10 text-blue-600" />
            Create Knowledge Capsule
          </h1>
          <p className="text-gray-600">
            Share your knowledge and experiences with the alumni community
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Capsule Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title for your capsule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                  data-testid="title-input"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1" data-testid="category-select">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your knowledge capsule content here... (Markdown supported)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="mt-1 min-h-[300px] font-mono"
                  data-testid="content-textarea"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Use Markdown formatting (## for headings, ** for bold, etc.)
                </p>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Estimated Reading Time (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="mt-1"
                  data-testid="duration-input"
                />
              </div>

              {/* Featured Image */}
              <div>
                <Label htmlFor="image">Featured Image URL (optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.featured_image}
                    onChange={handleImageChange}
                    data-testid="image-input"
                  />
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={() => {
                        toast.error('Invalid image URL');
                        setImagePreview('');
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags * (Press Enter to add)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="tags"
                    placeholder="e.g., React, JavaScript, Web Development"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    data-testid="tag-input"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    data-testid="add-tag-button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                        data-testid={`tag-${tag}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Add relevant tags to help others discover your capsule
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                  data-testid="publish-button"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Publish Capsule
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/knowledge')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateKnowledgeCapsule;
