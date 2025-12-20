import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCandidateProfile } from '../hooks/useUpdateCandidateProfile';
import { PageHeader } from '../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle2,
  Circle,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  desired_job_title: z.string().optional(),
  desired_salary_min: z.number().nullable().optional(),
  desired_salary_max: z.number().nullable().optional(),
  summary: z.string().max(1000).optional(),
  years_experience: z.number().nullable().optional(),
  cdl_class: z.string().optional(),
  open_to_opportunities: z.boolean().optional(),
  profile_visibility: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { candidateProfile, user } = useAuth();
  const { updateProfile, isUpdating } = useUpdateCandidateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      zip: '',
      desired_job_title: '',
      desired_salary_min: null,
      desired_salary_max: null,
      summary: '',
      years_experience: null,
      cdl_class: '',
      open_to_opportunities: true,
      profile_visibility: 'public',
    },
  });

  useEffect(() => {
    if (candidateProfile) {
      const profile = candidateProfile as any;
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        zip: profile.zip || '',
        desired_job_title: profile.desired_job_title || '',
        desired_salary_min: profile.desired_salary_min || null,
        desired_salary_max: profile.desired_salary_max || null,
        summary: profile.summary || '',
        years_experience: profile.years_experience || null,
        cdl_class: profile.cdl_class || '',
        open_to_opportunities: profile.open_to_opportunities ?? true,
        profile_visibility: profile.profile_visibility || 'public',
      });
    }
  }, [candidateProfile, user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    if (!candidateProfile?.id) return;
    updateProfile({ profileId: candidateProfile.id, data });
  };

  const completionPercentage = candidateProfile?.profile_completion_percentage || 20;

  const completionSteps = [
    { label: 'Basic profile created', completed: true },
    { label: 'Add your name', completed: !!candidateProfile?.first_name },
    { label: 'Add contact info', completed: !!candidateProfile?.phone },
    { label: 'Add location', completed: !!candidateProfile?.city },
    { label: 'Set job preferences', completed: !!candidateProfile?.desired_job_title },
    { label: 'Write a summary', completed: !!candidateProfile?.summary },
  ];

  const getUserInitials = () => {
    if (candidateProfile?.first_name && candidateProfile?.last_name) {
      return `${candidateProfile.first_name[0]}${candidateProfile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <PageHeader
        title="My Profile"
        description="Manage your profile information to get better job matches"
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Strength</CardTitle>
                  <CardDescription>{completionPercentage}% Complete</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">
                      {candidateProfile?.first_name || 'Complete'} {candidateProfile?.last_name || 'your profile'}
                    </p>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                  <div className="space-y-2">
                    {completionSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {step.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={step.completed ? '' : 'text-muted-foreground'}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="open_to_opportunities"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Open to opportunities</FormLabel>
                          <FormDescription className="text-xs">
                            Let recruiters know you're looking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profile_visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="connections">Connections Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="john@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="(555) 123-4567" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Phoenix" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="AZ" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="85001" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Work Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="desired_job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="CDL-A Driver" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="desired_salary_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="50000"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="desired_salary_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="80000"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="years_experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cdl_class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CDL Class</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select CDL class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No CDL</SelectItem>
                              <SelectItem value="A">Class A</SelectItem>
                              <SelectItem value="B">Class B</SelectItem>
                              <SelectItem value="C">Class C</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell employers about your experience and what you're looking for..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief summary helps employers understand your background
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfilePage;
