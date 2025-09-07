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
    const requestData = await req.json();
    console.log('Request received:', requestData);
    
    const { url } = requestData;
    
    if (!url) {
      console.log('No URL provided in request');
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing listing URL:', url);

    // Handle demo URL
    if (url === "https://example.com/demo-listing") {
      console.log('Using demo listing data');
      const demoData: ListingData = {
        title: "Stunning Modern Downtown Condo",
        description: "Beautiful 2-bedroom, 2-bathroom condo in the heart of downtown. Features modern finishes, stainless steel appliances, hardwood floors, and panoramic city views. Building amenities include fitness center, rooftop deck, and concierge service.",
        images: [
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
        ],
        price: "$850,000",
        address: "123 Main Street, Downtown District"
      };
      
      return new Response(
        JSON.stringify(demoData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.log('Invalid URL format:', url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch the webpage content
    console.log('Fetching webpage content...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Fetch response status:', response.status);
    if (!response.ok) {
      console.log('Failed to fetch URL, status:', response.status);
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    console.log('Getting HTML content...');
    const html = await response.text();
    console.log('HTML content length:', html.length);
    
    // Extract listing data using simple patterns
    console.log('Extracting listing data...');
    const listingData: ListingData = {
      title: extractTitle(html, url),
      description: extractDescription(html),
      images: extractImages(html, url),
      price: extractPrice(html),
      address: extractAddress(html)
    };

    console.log('Successfully extracted listing data:', JSON.stringify(listingData, null, 2));

    return new Response(
      JSON.stringify(listingData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error analyzing listing:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze listing',
        details: error.message,
        type: error.name || 'Unknown error'
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