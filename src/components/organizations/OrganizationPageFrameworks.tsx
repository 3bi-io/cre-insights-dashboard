import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Code2,
  Layout,
  Palette,
  Globe,
  Smartphone,
  Monitor,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  FileText,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PageFramework {
  id: string;
  name: string;
  type: 'template' | 'framework' | 'layout';
  category: 'application' | 'landing' | 'dashboard' | 'form';
  framework: 'react' | 'vue' | 'angular' | 'html' | 'custom';
  description: string;
  isActive: boolean;
  isDefault: boolean;
  responsive: boolean;
  customCSS?: string;
  configuration: {
    theme?: string;
    primaryColor?: string;
    layout?: 'sidebar' | 'header' | 'minimal' | 'full';
    components?: string[];
  };
  preview?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: {
    pageFrameworks?: PageFramework[];
    defaultFramework?: string;
  };
}

interface OrganizationPageFrameworksProps {
  organization: Organization;
  onUpdate: (organizationId: string, settings: any) => void;
}

const DEFAULT_FRAMEWORKS: Omit<PageFramework, 'id'>[] = [
  {
    name: 'Modern Application Form',
    type: 'template',
    category: 'application',
    framework: 'react',
    description: 'Clean, responsive application form with multi-step wizard',
    isActive: true,
    isDefault: true,
    responsive: true,
    configuration: {
      theme: 'light',
      primaryColor: '#3B82F6',
      layout: 'minimal',
      components: ['stepper', 'validation', 'autosave']
    }
  },
  {
    name: 'Corporate Landing Page',
    type: 'template',
    category: 'landing',
    framework: 'react',
    description: 'Professional landing page with hero section and job listings',
    isActive: true,
    isDefault: false,
    responsive: true,
    configuration: {
      theme: 'light',
      primaryColor: '#1F2937',
      layout: 'header',
      components: ['hero', 'features', 'testimonials', 'cta']
    }
  },
  {
    name: 'Admin Dashboard',
    type: 'framework',
    category: 'dashboard',
    framework: 'react',
    description: 'Full-featured admin dashboard with sidebar navigation',
    isActive: true,
    isDefault: false,
    responsive: true,
    configuration: {
      theme: 'dark',
      primaryColor: '#7C3AED',
      layout: 'sidebar',
      components: ['sidebar', 'charts', 'tables', 'notifications']
    }
  },
  {
    name: 'Mobile-First Application',
    type: 'template',
    category: 'application',
    framework: 'vue',
    description: 'Mobile-optimized application form with touch-friendly UI',
    isActive: false,
    isDefault: false,
    responsive: true,
    configuration: {
      theme: 'light',
      primaryColor: '#10B981',
      layout: 'minimal',
      components: ['mobile-nav', 'touch-inputs', 'camera-upload']
    }
  }
];

export const OrganizationPageFrameworks = ({ organization, onUpdate }: OrganizationPageFrameworksProps) => {
  const [frameworks, setFrameworks] = useState<PageFramework[]>(() => {
    const orgFrameworks = organization.settings?.pageFrameworks || [];
    if (orgFrameworks.length === 0) {
      return DEFAULT_FRAMEWORKS.map((framework, index) => ({
        ...framework,
        id: `framework-${index + 1}`
      }));
    }
    return orgFrameworks;
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<PageFramework | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const [newFramework, setNewFramework] = useState<Partial<PageFramework>>({
    name: '',
    type: 'template',
    category: 'application',
    framework: 'react',
    description: '',
    isActive: true,
    isDefault: false,
    responsive: true,
    configuration: {
      theme: 'light',
      primaryColor: '#3B82F6',
      layout: 'minimal',
      components: []
    }
  });

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const updatedSettings = {
        ...organization.settings,
        pageFrameworks: frameworks,
        defaultFramework: frameworks.find(f => f.isDefault)?.id
      };
      
      await onUpdate(organization.id, updatedSettings);
      
      toast({
        title: "Frameworks Updated",
        description: `Successfully updated page frameworks for ${organization.name}`,
      });
      
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update page frameworks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrameworkToggle = (frameworkId: string, isActive: boolean) => {
    setFrameworks(prev => prev.map(f => 
      f.id === frameworkId ? { ...f, isActive } : f
    ));
  };

  const handleSetDefault = (frameworkId: string) => {
    setFrameworks(prev => prev.map(f => ({
      ...f,
      isDefault: f.id === frameworkId
    })));
  };

  const handleCreateFramework = () => {
    if (!newFramework.name || !newFramework.description) {
      toast({
        title: "Validation Error",
        description: "Name and description are required.",
        variant: "destructive",
      });
      return;
    }

    const framework: PageFramework = {
      ...newFramework as PageFramework,
      id: `custom-${Date.now()}`
    };

    setFrameworks(prev => [...prev, framework]);
    setNewFramework({
      name: '',
      type: 'template',
      category: 'application',
      framework: 'react',
      description: '',
      isActive: true,
      isDefault: false,
      responsive: true,
      configuration: {
        theme: 'light',
        primaryColor: '#3B82F6',
        layout: 'minimal',
        components: []
      }
    });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Framework Created",
      description: `Successfully created ${framework.name}`,
    });
  };

  const handleDeleteFramework = (frameworkId: string) => {
    setFrameworks(prev => prev.filter(f => f.id !== frameworkId));
    toast({
      title: "Framework Deleted",
      description: "Framework has been removed from your organization",
    });
  };

  const getCategoryColor = (category: PageFramework['category']) => {
    switch (category) {
      case 'application': return 'bg-blue-100 text-blue-800';
      case 'landing': return 'bg-green-100 text-green-800';
      case 'dashboard': return 'bg-purple-100 text-purple-800';
      case 'form': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrameworkIcon = (framework: PageFramework['framework']) => {
    switch (framework) {
      case 'react': return '⚛️';
      case 'vue': return '🚀';
      case 'angular': return '🅰️';
      case 'html': return '🌐';
      case 'custom': return '⚡';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                App Page Frameworks
              </CardTitle>
              <CardDescription>
                Manage application templates, page layouts, and UI frameworks for your organization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Framework
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Framework</DialogTitle>
                    <DialogDescription>
                      Add a custom page framework or template to your organization
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Framework Name</Label>
                        <Input
                          id="name"
                          value={newFramework.name}
                          onChange={(e) => setNewFramework(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Custom Landing Page"
                        />
                      </div>
                      <div>
                        <Label htmlFor="framework">Technology</Label>
                        <select
                          id="framework"
                          value={newFramework.framework}
                          onChange={(e) => setNewFramework(prev => ({ ...prev, framework: e.target.value as any }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="react">React</option>
                          <option value="vue">Vue.js</option>
                          <option value="angular">Angular</option>
                          <option value="html">HTML/CSS</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <select
                          id="type"
                          value={newFramework.type}
                          onChange={(e) => setNewFramework(prev => ({ ...prev, type: e.target.value as any }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="template">Template</option>
                          <option value="framework">Framework</option>
                          <option value="layout">Layout</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={newFramework.category}
                          onChange={(e) => setNewFramework(prev => ({ ...prev, category: e.target.value as any }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="application">Application Form</option>
                          <option value="landing">Landing Page</option>
                          <option value="dashboard">Dashboard</option>
                          <option value="form">Generic Form</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newFramework.description}
                        onChange={(e) => setNewFramework(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the framework's purpose and features"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <select
                          id="theme"
                          value={newFramework.configuration?.theme}
                          onChange={(e) => setNewFramework(prev => ({ 
                            ...prev, 
                            configuration: { ...prev.configuration, theme: e.target.value }
                          }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={newFramework.configuration?.primaryColor}
                          onChange={(e) => setNewFramework(prev => ({ 
                            ...prev, 
                            configuration: { ...prev.configuration, primaryColor: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="responsive"
                        checked={newFramework.responsive}
                        onCheckedChange={(checked) => setNewFramework(prev => ({ ...prev, responsive: checked }))}
                      />
                      <Label htmlFor="responsive">Responsive Design</Label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFramework}>
                      Create Framework
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id} className={`transition-all ${framework.isActive ? 'border-primary/20 bg-primary/5' : 'border-muted'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getFrameworkIcon(framework.framework)}</span>
                          <h3 className="text-lg font-semibold">{framework.name}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getCategoryColor(framework.category)}>
                            {framework.category}
                          </Badge>
                          <Badge variant="secondary">
                            {framework.type}
                          </Badge>
                          {framework.isDefault && (
                            <Badge variant="default">Default</Badge>
                          )}
                          {framework.responsive && (
                            <Badge variant="outline">
                              <Smartphone className="w-3 h-3 mr-1" />
                              Responsive
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{framework.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Layout className="w-4 h-4" />
                          Layout: {framework.configuration.layout}
                        </div>
                        <div className="flex items-center gap-1">
                          <Palette className="w-4 h-4" />
                          Theme: {framework.configuration.theme}
                        </div>
                        {framework.configuration.components && (
                          <div className="flex items-center gap-1">
                            <Layers className="w-4 h-4" />
                            {framework.configuration.components.length} components
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={framework.isActive}
                          onCheckedChange={(checked) => handleFrameworkToggle(framework.id, checked)}
                        />
                        <Label className="text-sm">Active</Label>
                      </div>
                      
                      {framework.isActive && !framework.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(framework.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteFramework(framework.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {frameworks.length === 0 && (
              <div className="text-center py-12">
                <Code2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No frameworks configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first page framework to get started with custom application templates.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Framework Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Layout className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Frameworks</p>
                <p className="text-2xl font-bold">{frameworks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Frameworks</p>
                <p className="text-2xl font-bold">{frameworks.filter(f => f.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responsive</p>
                <p className="text-2xl font-bold">{frameworks.filter(f => f.responsive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};