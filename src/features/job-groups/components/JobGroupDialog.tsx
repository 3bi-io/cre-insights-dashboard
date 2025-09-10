import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { CreateJobGroupData, UpdateJobGroupData, JobGroup } from '../services/JobGroupsService';
import { useAuth } from '@/hooks/useAuth';

interface JobGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateJobGroupData | UpdateJobGroupData) => void;
  jobGroup?: JobGroup;
  campaignId: string;
  isLoading?: boolean;
}

export function JobGroupDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  jobGroup, 
  campaignId,
  isLoading = false 
}: JobGroupDialogProps) {
  const { user } = useAuth();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateJobGroupData>({
    defaultValues: {
      name: jobGroup?.name || '',
      description: jobGroup?.description || '',
      publisher_name: jobGroup?.publisher_name || '',
      publisher_endpoint: jobGroup?.publisher_endpoint || '',
      status: jobGroup?.status || 'active',
      campaign_id: campaignId,
      user_id: user?.id || '',
    }
  });

  React.useEffect(() => {
    if (jobGroup) {
      setValue('name', jobGroup.name);
      setValue('description', jobGroup.description || '');
      setValue('publisher_name', jobGroup.publisher_name);
      setValue('publisher_endpoint', jobGroup.publisher_endpoint || '');
      setValue('status', jobGroup.status || 'active');
    } else if (user?.id) {
      setValue('user_id', user.id);
      setValue('campaign_id', campaignId);
    }
  }, [jobGroup, setValue, user?.id, campaignId]);

  const handleFormSubmit = (data: CreateJobGroupData) => {
    onSubmit(data);
    if (!jobGroup) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {jobGroup ? 'Edit Job Group' : 'Create Job Group'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter job group name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter job group description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher_name">Publisher Name</Label>
            <Input
              id="publisher_name"
              {...register('publisher_name', { required: 'Publisher name is required' })}
              placeholder="e.g., Indeed, ZipRecruiter, LinkedIn"
            />
            {errors.publisher_name && (
              <p className="text-sm text-destructive">{errors.publisher_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher_endpoint">Publisher Endpoint (Optional)</Label>
            <Input
              id="publisher_endpoint"
              {...register('publisher_endpoint')}
              placeholder="https://publisher-api.com/jobs"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={watch('status')} 
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'paused')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : jobGroup ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}