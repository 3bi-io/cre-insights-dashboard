import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, DollarSign, Briefcase, Search, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceJobApplication from '@/components/VoiceJobApplication';
import PublicLayout from '@/components/PublicLayout';

const PublicJobs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch active job listings
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['public-jobs', searchTerm, locationFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          job_categories(name),
          clients(name)
        `)
        .eq('status', 'active');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,job_summary.ilike.%${searchTerm}%`);
      }

      if (locationFilter) {
        query = query.or(`location.ilike.%${locationFilter}%,city.ilike.%${locationFilter}%,state.ilike.%${locationFilter}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch job categories for filter
  const { data: categories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return 'Salary not specified';
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)} ${type || 'per year'}`;
    }
    
    if (min) {
      return `From ${formatAmount(min)} ${type || 'per year'}`;
    }
    
    if (max) {
      return `Up to ${formatAmount(max)} ${type || 'per year'}`;
    }
    
    return 'Salary not specified';
  };

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setIsVoiceDialogOpen(true);
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading jobs...</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Next Career Opportunity</h1>
            <p className="text-xl opacity-90 mb-8">Discover amazing job opportunities and join our team of transportation professionals</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                Browse All Jobs
              </Button>
              <Button size="lg" variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Learn About Benefits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Location (city, state...)"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Job Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {jobs?.length || 0} Job{jobs?.length !== 1 ? 's' : ''} Available
            </h2>
          </div>

          {jobs?.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria to find more opportunities.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {jobs?.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {job.title || job.job_title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          {(job.clients?.name || job.client) && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.clients?.name || job.client}
                            </span>
                          )}
                          {(job.location || job.city || job.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}`}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {job.job_categories?.name && (
                          <Badge variant="secondary">{job.job_categories.name}</Badge>
                        )}
                         {job.job_type && (
                           <Badge variant="outline">{job.job_type}</Badge>
                         )}
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       {job.job_summary && (
                         <p className="text-muted-foreground line-clamp-3">
                           {job.job_summary}
                         </p>
                       )}
                       
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span className="flex items-center gap-1">
                           <DollarSign className="h-4 w-4" />
                           {formatSalary(job.salary_min, job.salary_max, job.salary_type)}
                         </span>
                         {job.experience_level && (
                           <span>Experience: {job.experience_level}</span>
                         )}
                         {job.remote_type && (
                           <Badge variant="outline">{job.remote_type}</Badge>
                         )}
                       </div>
                       
                       <div className="flex justify-between items-center pt-4">
                         <span className="text-sm text-muted-foreground">
                           Posted {new Date(job.created_at).toLocaleDateString()}
                         </span>
                         <Button onClick={() => handleApply(job)}>
                           Apply Now
                         </Button>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
         </div>

         {/* Voice Application Dialog */}
         {selectedJob && (
           <VoiceJobApplication
             job={selectedJob}
             isOpen={isVoiceDialogOpen}
             onClose={() => {
               setIsVoiceDialogOpen(false);
               setSelectedJob(null);
             }}
           />
         )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicJobs;