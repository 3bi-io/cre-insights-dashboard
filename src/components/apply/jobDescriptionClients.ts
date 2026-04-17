/**
 * Allow-list of client IDs for which the short application page (/apply)
 * should render the full job description above the form.
 *
 * Reason: Indeed compliance — these carriers were flagged for missing
 * job description content on the apply page.
 */
export const JOB_DESCRIPTION_CLIENT_IDS = new Set<string>([
  '53d7dd20-d743-4d34-93e9-eb7175c39da1', // Admiral Merchants
  '1d54e463-4d7f-4a05-8189-3e33d0586dea', // Danny Herman Trucking
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03', // Pemberton Truck Lines Inc
]);

export const shouldShowJobDescription = (clientId: string | null | undefined): boolean => {
  if (!clientId) return false;
  return JOB_DESCRIPTION_CLIENT_IDS.has(clientId);
};
