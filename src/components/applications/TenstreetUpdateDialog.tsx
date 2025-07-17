import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2 } from 'lucide-react';

const updateSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseState: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface TenstreetUpdateDialogProps {
  application: any;
  trigger?: React.ReactNode;
}

const TenstreetUpdateDialog: React.FC<TenstreetUpdateDialogProps> = ({ 
  application, 
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: application.status || 'pending',
      notes: application.notes || '',
      phoneNumber: application.phone || '',
      email: application.applicant_email || '',
      address: '',
      city: application.city || '',
      state: application.state || '',
      zipCode: application.zip || '',
      driverLicenseNumber: '',
      driverLicenseState: '',
    },
  });

  const onSubmit = async (data: UpdateFormData) => {
    setIsLoading(true);
    
    try {
      // Prepare the payload for Tenstreet integration
      const payload = {
        action: 'send_application',
        applicationData: {
          id: application.id,
          applicant_id: application.id,
          first_name: application.first_name,
          last_name: application.last_name,
          full_name: application.full_name,
          email: data.email || application.applicant_email,
          phone: data.phoneNumber || application.phone,
          status: data.status,
          notes: data.notes,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zipCode,
          driver_license_number: data.driverLicenseNumber,
          driver_license_state: data.driverLicenseState,
          cdl: application.cdl,
          exp: application.exp,
          drug: application.drug,
          age: application.age,
          veteran: application.veteran,
          consent: application.consent,
          privacy: application.privacy,
          job_id: application.job_id,
          applied_at: application.applied_at,
          updated_at: new Date().toISOString(),
        },
        config: {
          client_code: 'DEFAULT_CLIENT',
          source: 'Application Update',
          send_to_tenstreet: true
        }
      };

      const response = await fetch('/functions/v1/tenstreet-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send update to Tenstreet');
      }

      toast({
        title: "Update Sent",
        description: "Application update has been sent to Tenstreet successfully.",
      });

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error sending update to Tenstreet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send update to Tenstreet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicantName = (app: any) => {
    if (app.full_name) return app.full_name;
    if (app.first_name && app.last_name) return `${app.first_name} ${app.last_name}`;
    if (app.first_name) return app.first_name;
    if (app.last_name) return app.last_name;
    return 'Anonymous Applicant';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Send to Tenstreet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Update to Tenstreet</DialogTitle>
          <DialogDescription>
            Update application information for {getApplicantName(application)} in Tenstreet system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="applicant@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverLicenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="License number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverLicenseState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver License State</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Los Angeles" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="CA" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes or updates..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Send to Tenstreet
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TenstreetUpdateDialog;