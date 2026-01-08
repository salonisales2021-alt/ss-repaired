
// Service to handle GST Verification - LIVE MODE & SIMULATION FALLBACK

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
  source?: 'LIVE' | 'MOCK' | 'FALLBACK';
}

const mapProviderResponseToAppInterface = (data: any): GSTDetails => {
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

const getMockData = (gstin: string, source: 'MOCK' | 'FALLBACK'): GSTDetails => ({
    gstin: gstin,
    legalName: "SIMULATION TRADERS LLP",
    tradeName: `SIMULATION ENTERPRISES (${gstin.substring(0, 5)}...)`,
    registerDate: "2023-01-01",
    status: "Active",
    address: {
        building: "101",
        street: "Simulation Street",
        city: "Demo City",
        state: "DL",
        pincode: "110001"
    },
    taxpayerType: "Regular",
    source: source
});

export const verifyGST = async (gstin: string): Promise<GSTDetails> => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstin || !gstinRegex.test(gstin)) {
     throw new Error("Invalid GSTIN Format.");
  }

  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  // 1. Explicit Simulation Mode (No Key)
  if (!apiKey) {
      console.warn("GST API Key missing. Returning SIMULATION data.");
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve(getMockData(gstin, 'MOCK'));
          }, 800);
      });
  }

  // 2. Try Live Fetch with Fallback
  try {
      console.log(`Fetching GST details for ${gstin} from ${apiUrl}...`);
      
      const response = await fetch(`${apiUrl}/${gstin}?api_key=${apiKey}`, {
          method: 'GET',
          headers: { 
              'Content-Type': 'application/json'
          }
      });
      
      if (!response.ok) {
          console.warn(`GST API Error: ${response.statusText}. Falling back to simulation.`);
          return getMockData(gstin, 'FALLBACK');
      }
      
      const data = await response.json();
      
      if (!data || (data.error && data.error !== false)) {
          // If API specifically returns an error (like Invalid GSTIN), throw it properly
          throw new Error("GSTIN not found or invalid.");
      }

      const details = mapProviderResponseToAppInterface(data);
      return { ...details, source: 'LIVE' };

  } catch (error: any) {
      // 3. Network/Fetch Error Fallback
      console.error("GST API Network Failure:", error);
      console.warn("Falling back to Simulation Mode due to network error.");
      return getMockData(gstin, 'FALLBACK');
  }
};
