/**
 * ZipRecruiter conversion pixels for specific clients.
 * Renders only when clientId matches AND source is ZipRecruiter.
 */

const CLIENT_ZIPRECRUITER_MAP: Record<string, string> = {
  '1d54e463-4d7f-4a05-8189-3e33d0586dea': 'd1e4d672',  // Danny Herman Trucking
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03': '8e21fb39',  // Pemberton Truck Lines
  'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52': 'd21c34cc',  // James Burg Trucking
};

interface ClientZipRecruiterPixelsProps {
  clientId?: string | null;
  source?: string | null;
}

const ClientZipRecruiterPixels: React.FC<ClientZipRecruiterPixelsProps> = ({
  clientId,
  source,
}) => {
  if (!clientId || !source) return null;
  if (!source.toLowerCase().includes('ziprecruiter')) return null;

  const accountId = CLIENT_ZIPRECRUITER_MAP[clientId];
  if (!accountId) return null;

  return (
    <img
      src={`https://track.ziprecruiter.com/conversion?enc_account_id=${accountId}`}
      width="1"
      height="1"
      alt=""
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px' }}
    />
  );
};

export default ClientZipRecruiterPixels;
