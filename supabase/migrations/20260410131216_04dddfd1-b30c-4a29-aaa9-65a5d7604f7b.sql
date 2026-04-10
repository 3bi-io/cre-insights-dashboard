CREATE POLICY "Client users can view callbacks for their assigned clients"
  ON public.scheduled_callbacks FOR SELECT
  TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM public.applications a
      JOIN public.job_listings jl ON a.job_listing_id = jl.id
      JOIN public.user_client_assignments uca ON uca.client_id = jl.client_id
      WHERE uca.user_id = auth.uid()
    )
  );