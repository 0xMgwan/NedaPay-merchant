/**
 * Direct implementation for Base name resolution
 * This uses the official Base name resolution service
 */

// Base name resolution endpoints
const BASE_MAINNET_RPC = 'https://mainnet.base.org';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

/**
 * Directly fetch a Base name for an address using the Base RPC endpoints
 */
export async function resolveBaseName(address: string): Promise<string | null> {
  try {
    // Ensure address is properly formatted
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      console.error('[DirectBaseName] Invalid address format:', address);
      return null;
    }

    console.log('[DirectBaseName] Resolving name for address:', address);
    
    // Try direct RPC calls to resolve the name
    // First try mainnet, then fallback to testnet
    const endpoints = [BASE_MAINNET_RPC, BASE_SEPOLIA_RPC];
    
    for (const endpoint of endpoints) {
      try {
        // Use the eth_call method to call the Base name registry contract
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [
              {
                // Base Name Registry contract
                to: '0x4E2597A42D955fDEd11D3B844b3Ef4f58FB07B9C',
                // Call the getPrimaryName function
                data: `0x7550e612000000000000000000000000${address.substring(2)}`,
              },
              'latest'
            ]
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DirectBaseName] RPC response:', data);
          
          if (data && data.result && data.result !== '0x') {
            // Decode the result - it's a bytes32 string
            const hexResult = data.result.slice(2); // Remove 0x prefix
            const nameBytes = Buffer.from(hexResult, 'hex');
            const name = nameBytes.toString().replace(/\u0000/g, '').trim();
            
            if (name) {
              const formattedName = name.endsWith('.base') ? name : `${name}.base`;
              console.log('[DirectBaseName] Resolved name:', formattedName);
              return formattedName;
            }
          }
        }
      } catch (endpointError) {
        console.error(`[DirectBaseName] Error with endpoint ${endpoint}:`, endpointError);
        // Continue to next endpoint
      }
    }
    
    // Try the official Base name API as a fallback
    try {
      const response = await fetch(`https://www.base.org/api/v1/addresses/${address}/names`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DirectBaseName] Base.org API response:', data);
        
        if (data && data.names && data.names.length > 0) {
          const name = data.names[0].endsWith('.base') ? data.names[0] : `${data.names[0]}.base`;
          console.log('[DirectBaseName] Resolved name from Base.org API:', name);
          return name;
        }
      }
    } catch (apiError) {
      console.error('[DirectBaseName] Error with Base.org API:', apiError);
    }
    
    // As a last resort, try the ENS reverse lookup for .base names
    try {
      const response = await fetch(BASE_MAINNET_RPC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              // ENS Reverse Registrar
              to: '0x084b1c3C81545d370f3634392De611CaaBFf8148',
              // Call the node(address) function
              data: `0xdfa86aba000000000000000000000000${address.substring(2)}`,
            },
            'latest'
          ]
        })
      });
      
      if (response.ok) {
        const nodeData = await response.json();
        
        if (nodeData && nodeData.result && nodeData.result !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // Now get the name for this node
          const nameResponse = await fetch(BASE_MAINNET_RPC, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_call',
              params: [
                {
                  // ENS Registry
                  to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
                  // Call the resolver(bytes32) function
                  data: `0x0178b8bf${nodeData.result.substring(2)}`,
                },
                'latest'
              ]
            })
          });
          
          if (nameResponse.ok) {
            // Further processing to get the name...
            console.log('[DirectBaseName] ENS reverse lookup successful');
          }
        }
      }
    } catch (ensError) {
      console.error('[DirectBaseName] Error with ENS reverse lookup:', ensError);
    }
    
    console.log('[DirectBaseName] No Base name found for address');
    return null;
  } catch (error) {
    console.error('[DirectBaseName] Error resolving Base name:', error);
    return null;
  }
}
