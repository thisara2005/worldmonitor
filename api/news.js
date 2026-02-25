export default async function handler(req, res) {
  // 1. Set CORS headers so n8n can access this API without being blocked
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. The Master List of News Feeds (Global Tech, Crypto, and Mexico)
  const feeds = [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.technologyreview.com/feed/',
    'https://feeds.feedburner.com/VentureBeat',
    'https://krebsonsecurity.com/feed/',
    'https://www.bleepingcomputer.com/feed/',
    'https://hnrss.org/frontpage',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://www.xataka.com.mx/feed.xml' // Mexican tech news
  ];

  let articles = [];

  try {
    // 3. Fetch all RSS feeds at the same time
    // We add a User-Agent header so the news sites don't block the request
    const requests = feeds.map(feed => 
      fetch(feed, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
        .then(r => r.text())
        .catch(e => "") // If one feed goes offline, it won't crash the whole API
    );
    
    const results = await Promise.all(requests);

    // 4. Parse the XML data from each feed
    results.forEach(xml => {
      if (!xml) return;

      // Find all <item> blocks (individual articles)
      const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
      
      // Grab the top 5 newest stories from each feed
      items.slice(0, 5).forEach(item => {
        
        // Extract Title and Summary
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        
        // Extract Image URL
        const enclosureMatch = item.match(/enclosure[^>]+url=["']([^"']+)["']/i);
        const mediaMatch = item.match(/media:content[^>]+url=["']([^"']+)["']/i);
        const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/i);
        
        // Pick the first image found, or leave empty if none exist
        let imageUrl = "";
        if (enclosureMatch && enclosureMatch[1]) imageUrl = enclosureMatch[1];
        else if (mediaMatch && mediaMatch[1]) imageUrl = mediaMatch[1];
        else if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1];

        // Clean up the text and add it to the final array
        if (titleMatch) {
          const cleanTitle = titleMatch[1].replace(/<[^>]+>/g, '').trim();
          const cleanSummary = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "No summary available";
          
          articles.push({
            title: cleanTitle,
            summary: cleanSummary,
            image: imageUrl
          });
        }
      });
    });

    // 5. Send the final, clean JSON back to n8n
    res.status(200).json({ articles: articles });
    
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Failed to fetch news data" });
  }
}
