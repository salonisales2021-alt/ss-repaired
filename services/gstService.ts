
// Service to handle GST Verification
// Supports switching between Mock Mode and Real API Mode via Environment Variables or Local Storage

const meta = import.meta as any;
const env = meta.env || {};

// Keys can come from .env (build time) or LocalStorage (runtime configuration via Admin Panel)
const getApiKey = () => localStorage.getItem('SALONI_GST_API_KEY') || env.VITE_GST_API_KEY || '';
const getApiUrl = () => localStorage.getItem('SALONI_GST_API_URL') || env.VITE_GST_API_URL || 'https://common-gst-api-wrapper.com/verify'; 

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

// Helper to map external API response to our App's interface
// Note: Actual mapping depends on the specific provider (ClearTax, Masters India, etc.)
const mapProviderResponseToAppInterface = (data: any): GSTDetails => {
    // This assumes a generic standard structure. Adjust fields based on your specific API provider.
    return {
        gstin: data.gstin || data.data?.gstin,
        legalName: data.legal_name || data.lgnm || data.data?.lgnm,
        tradeName: data.trade_name || data.tradeNam || data.data?.tradeNam,
        registerDate: data.register_date || data.rgdt || data.data?.rgdt,
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
  // Input Validation
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstin || !gstinRegex.test(gstin)) {
     throw new Error("Invalid GSTIN Format. Please ensure it follows the standard 15-character pattern (e.g., 07AAAAA0000A1Z5).");
  }

  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  // 1. REAL API MODE
  if (apiKey) {
      try {
          console.log(`Fetching GST details for ${gstin} using Configured API...`);
          
          // Construct URL - Adjust query param vs header based on provider
          // Example: GET https://api.provider.com/verify/{gstin}?key=xyz
          const response = await fetch(`${apiUrl}/${gstin}?api_key=${apiKey}`, {
              method: 'GET',
              headers: { 
                  'Content-Type': 'application/json',
                  // Some providers require key in header:
                  // 'Authorization': `Bearer ${apiKey}` 
              }
          });
          
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.message || `API Error: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (!data || (data.error && data.error !== false)) {
              throw new Error("GSTIN not found in government database.");
          }

          const details = mapProviderResponseToAppInterface(data);
          return { ...details, source: 'LIVE' };

      } catch (error: any) {
          console.error("GST API Call Failed:", error);
          // Fallback to mock only if explicitly desired, otherwise throw
          // throw new Error(error.message || "Unable to verify GSTIN with the server.");
          console.warn("API Request failed. Falling back to Mock data for demonstration.");
      }
  }

  // 2. MOCK MODE (Default Demo)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate API success for specific or random valid-looking strings
      if (gstin === '000000000000000') {
        reject(new Error("GSTIN not found in government database."));
        return;
      }

      // Mock Data Response
      resolve({
        gstin: gstin.toUpperCase(),
        legalName: "M/S SALONI MOCK ENTERPRISES",
        tradeName: "SALONI MOCK STORE",
        registerDate: "12/05/2019",
        status: "Active",
        address: {
          building: "Shop No. 12, Ground Floor",
          street: "Main Market, Gandhi Nagar",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110031"
        },
        taxpayerType: "Regular",
        source: 'MOCK'
      });
    }, 1500); // Simulate network latency
  });
};
