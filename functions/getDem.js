export async function onRequest(context) {
    const { request, env } = context;
    
    // Parse query parameters from URL
    const url = new URL(request.url);
    const south = url.searchParams.get('south');
    const north = url.searchParams.get('north');
    const west = url.searchParams.get('west');
    const east = url.searchParams.get('east');
    const demtype = url.searchParams.get('demtype') || 'SRTMGL1';
    
    // Validate required parameters
    if (!south || !north || !west || !east) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: south, north, west, east' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get API key from environment variables (secrets)
    const apiKey = env.OPENTOPOGRAPHY_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    try {
      // Build the OpenTopography API URL
      const apiUrl = `https://portal.opentopography.org/API/globaldem?demtype=${demtype}&south=${south}&north=${north}&west=${west}&east=${east}&outputFormat=GTiff&API_Key=${apiKey}`;
      
      // Fetch the TIFF file from OpenTopography
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({ error: `OpenTopography API error: ${errorText}` }),
          { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Get the TIFF file as ArrayBuffer
      const tiffBuffer = await response.arrayBuffer();
      
      //  Return directly (no caching)
      return new Response(tiffBuffer, {
        headers: {
          'Content-Type': 'image/tiff',
          'Content-Disposition': `attachment; filename="dem_${south}_${north}_${west}_${east}.tif"`,
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
      
      // Option 2: Store in R2 and return URL (if you have R2 configured)
      /*
      if (env.R2_BUCKET) {
        const r2 = env.R2_BUCKET;
        const fileName = `dem_${south}_${north}_${west}_${east}_${Date.now()}.tif`;
        
        // Store in R2
        await r2.put(fileName, tiffBuffer, {
          httpMetadata: {
            contentType: 'image/tiff',
          },
        });
        
        // Return the R2 URL (you'll need to configure public access)
        const r2Url = `https://your-r2-domain.com/${fileName}`;
        return new Response(
          JSON.stringify({ url: r2Url }),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      */
      
    } catch (error) {
      console.error('Error fetching DEM [CF]:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }