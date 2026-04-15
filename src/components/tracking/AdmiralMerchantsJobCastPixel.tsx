/**
 * CDL JobCast conversion pixel for Admiral Merchants.
 * Renders only when the applicant belongs to Admiral Merchants (by client ID).
 */

const ADMIRAL_MERCHANTS_CLIENT_ID = '53d7dd20-d743-4d34-93e9-eb7175c39da1';

interface AdmiralMerchantsJobCastPixelProps {
  clientId?: string | null;
}

const AdmiralMerchantsJobCastPixel: React.FC<AdmiralMerchantsJobCastPixelProps> = ({
  clientId,
}) => {
  if (clientId !== ADMIRAL_MERCHANTS_CLIENT_ID) return null;

  return (
    <img
      src="https://cdljobcast.com/jobform?job_id=y5eVQj5dEP"
      width="1"
      height="1"
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px' }}
    />
  );
};

export default AdmiralMerchantsJobCastPixel;
