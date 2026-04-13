/**
 * ZipRecruiter conversion pixel for Church Transportation & Logistics.
 * Renders only when the applicant belongs to Church Transportation
 * AND the traffic source is ZipRecruiter.
 */

const CHURCH_TRANSPORTATION_ORG_ID = 'dffb0ef4-07a0-494f-9790-ef9868e143c7';

interface ChurchZipRecruiterPixelProps {
  organizationId?: string | null;
  source?: string | null;
}

const ChurchZipRecruiterPixel: React.FC<ChurchZipRecruiterPixelProps> = ({
  organizationId,
  source,
}) => {
  const isChurch = organizationId === CHURCH_TRANSPORTATION_ORG_ID;
  const isZipRecruiter = source?.toLowerCase().includes('ziprecruiter') ?? false;

  if (!isChurch || !isZipRecruiter) return null;

  return (
    <img
      src="https://track.ziprecruiter.com/conversion?enc_account_id=4987c3a9"
      width="1"
      height="1"
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px' }}
    />
  );
};

export default ChurchZipRecruiterPixel;
