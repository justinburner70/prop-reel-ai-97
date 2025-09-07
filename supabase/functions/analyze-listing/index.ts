import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ListingData {
  title: string;
  description: string;
  images: string[];
  price: string;
  address: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing listing URL:', url);

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract listing data using simple regex patterns
    // This is a basic implementation - in production you'd use proper HTML parsing
    const listingData: ListingData = {
      title: extractTitle(html, url),
      description: extractDescription(html),
      images: extractImages(html, url),
      price: extractPrice(html),
      address: extractAddress(html)
    };

    console.log('Extracted listing data:', listingData);

    return new Response(
      JSON.stringify(listingData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error analyzing listing:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze listing',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function extractTitle(html: string, url: string): string {
  // Try different title patterns
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<h1[^>]*>([^<]+)<\/h1>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback to URL-based title
  return url.includes('zillow') ? 'Property from Zillow' :
         url.includes('realtor') ? 'Property from Realtor.com' :
         url.includes('redfin') ? 'Property from Redfin' :
         'Real Estate Property';
}

function extractDescription(html: string): string {
  const patterns = [
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)</i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Beautiful property with modern amenities and great location.';
}

function extractImages(html: string, url: string): string[] {
  const images: string[] = [];
  const domain = new URL(url).origin;
  
  // Extract images from various patterns
  const patterns = [
    /<img[^>]*src="([^"]+)"/g,
    /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let imgUrl = match[1];
      
      // Convert relative URLs to absolute
      if (imgUrl.startsWith('/')) {
        imgUrl = domain + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        imgUrl = domain + '/' + imgUrl;
      }
      
      // Filter for actual property images (basic filtering)
      if (imgUrl.includes('.jpg') || imgUrl.includes('.jpeg') || imgUrl.includes('.png') || imgUrl.includes('.webp')) {
        if (!images.includes(imgUrl) && images.length < 10) {
          images.push(imgUrl);
        }
      }
    }
  }

  // If no images found, return placeholder
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop');
  }

  return images;
}

function extractPrice(html: string): string {
  const patterns = [
    /\$[\d,]+/g,
    /<span[^>]*class="[^"]*price[^"]*"[^>]*>\$?([\d,]+)/i,
    /<div[^>]*class="[^"]*price[^"]*"[^>]*>\$?([\d,]+)/i
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern);
    if (matches) {
      // Find the largest number (likely the main price)
      const prices = matches.map(m => parseInt(m.replace(/[$,]/g, ''))).filter(p => p > 50000);
      if (prices.length > 0) {
        const maxPrice = Math.max(...prices);
        return `$${maxPrice.toLocaleString()}`;
      }
    }
  }

  return 'Price upon request';
}

function extractAddress(html: string): string {
  const patterns = [
    /<span[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)</i,
    /<div[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)</i,
    /<meta[^>]*property="og:street-address"[^>]*content="([^"]+)"/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Beautiful Location';
}