
// Service to handle GST Verification - LIVE MODE

const getEnv = () => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env;
        }
    } catch(e) {}
    
    try {
        if (typeof process !== 'undefined' && process.env) {
            return process.env;
        }
    } catch(e) {}

    return {};
};

const env = getEnv();

// Configure keys in .env
const getApiKey = () => localStorage.getItem('SALONI_GST_API_KEY') || env.VITE_GST_API_KEY || '';
const getApiUrl = () => localStorage.getItem('SALONI_GST_API_URL') || env.VITE_GST_API_URL || 'https://api.gst-provider.com/verify'; 

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
  source?: 'LIVE' | 'MOCK';
}

const mapProviderResponseToAppInterface = (data: any): GSTDetails => {
    // Generic mapping, adjust based on actual provider response structure
    return {
        gstin: data.gstin || data.data?.gstin,
        legalName: data.legal_name || data.lgnm || data.data?.lgnm || 'Unknown Legal Name',
        tradeName: data.trade_name || data.tradeNam || data.data?.tradeNam || 'Unknown Trade Name',
        registerDate: data.register_date || data.rgdt || data.data?.rgdt || '',
        status: (data.status || data.sts || data.data?.sts) === 'Active' ? 'Active' : 'Inactive',
        address: {
            building: data.address?.building || data.pradr?.addr?.bno || '',
            street: data.address?.street || data.pradr?.addr?.st || '',
            city: data.address?.city || data.pradr?.addr?.city || '',
            state: data.address?.state || data.pradr?.addr?.stcd || '',
            pincode: data.address?.pincode || data.pradr?.addr?.pncd || ''
        },
        taxpayerType: data.taxpayer_type || data.dty || 'Regular'
    };
};

export const verifyGST = async (gstin: string): Promise<GSTDetails> => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstin || !gstinRegex.test(gstin)) {
     throw new Error("Invalid GSTIN Format.");
  }

  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  if (!apiKey) {
      // STRICT MODE: No mock fallback allowed
      throw new Error("Live GST API Key is missing. Verification service unavailable.");
  }

  try {
      console.log(`Fetching GST details for ${gstin}...`);
      
      const response = await fetch(`${apiUrl}/${gstin}?api_key=${apiKey}`, {
          method: 'GET',
          headers: { 
              'Content-Type': 'application/json'
          }
      });
      
      if (!response.ok) {
          throw new Error(`GST API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || (data.error && data.error !== false)) {
          throw new Error("GSTIN not found or invalid.");
      }

      const details = mapProviderResponseToAppInterface(data);
      return { ...details, source: 'LIVE' };

  } catch (error: any) {
      console.error("GST API Call Failed:", error);
      throw new Error(error.message || "Unable to verify GSTIN with the external service.");
  }
};