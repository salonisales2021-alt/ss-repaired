
const env = (import.meta as any).env || {};
const getApiKey = () => env.VITE_GST_API_KEY || '';
const getApiUrl = () => env.VITE_GST_API_URL || 'https://api.gst-provider.com/verify'; 

export interface GSTDetails {
  gstin: string;
  legalName: string;
  tradeName: string;
  registerDate: string;
  status: 'Active' | 'Inactive' | 'Cancelled';
  address: {
    building: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  taxpayerType: string;
  source?: 'LIVE';
}

export const verifyGST = async (gstin: string): Promise<GSTDetails> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
      throw new Error("GST API Configuration Missing");
  }

  const response = await fetch(`${getApiUrl()}/${gstin}?api_key=${apiKey}`);
  
  if (!response.ok) {
      throw new Error("GST Verification Failed");
  }
  
  const data = await response.json();
  
  return {
        gstin: data.gstin,
        legalName: data.legal_name,
        tradeName: data.trade_name,
        registerDate: data.register_date,
        status: data.status,
        address: {
            building: data.address?.building,
            street: data.address?.street,
            city: data.address?.city,
            state: data.address?.state,
            pincode: data.address?.pincode
        },
        taxpayerType: data.taxpayer_type,
        source: 'LIVE'
  };
};