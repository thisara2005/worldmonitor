export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

// 🇲🇽 Daily News feeds optimized for a Mexican audience
  const feeds = [
    'https://www.milenio.com/rss',                 // Milenio (Top Mexican Daily News)
    'https://cnnespanol.cnn.com/feed/',            // CNN en Español (Global/LatAm)
    'https://feeds.bbci.co.uk/mundo/rss.xml',      // BBC Mundo (Global/LatAm)
    'https://www.xataka.com.mx/feed.xml',          // Xataka México (Tech & Lifestyle)
    'http://rss.cnn.com/rss/edition_americas.rss'  // CNN Americas (Global events impacting LatAm)
  ];

  let articles = [];

  try {
    const requests = feeds.map(feed => 
      fetch(feed, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        .then(r => r.text())
        .catch(e => "") 
    );
    
    const results = await Promise.all(requests);

    results.forEach(xml => {
      if (!xml) return;

      const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
      
      items.slice(0, 5).forEach(item => {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        
        // --- NEW: Grab the exact publication date ---
        const dateMatch = item.match(/<(?:pubDate|dc:date)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|dc:date)>/i);
        let timestamp = 0;
        if (dateMatch) {
            // Convert the date text into a mathematical timestamp for sorting
            timestamp = new Date(dateMatch[1].trim()).getTime();
        }
        
        const enclosureMatch = item.match(/enclosure[^>]+url=["']([^"']+)["']/i);
        const mediaMatch = item.match(/media:content[^>]+url=["']([^"']+)["']/i);
        const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/i);
        
        let imageUrl = "";
        if (enclosureMatch && enclosureMatch[1]) imageUrl = enclosureMatch[1];
        else if (mediaMatch && mediaMatch[1]) imageUrl = mediaMatch[1];
        else if (imgMatch && imgMatch[1]) imageUrl = imgMatch[1];

        if (titleMatch) {
          articles.push({
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            summary: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "No summary available",
            image: imageUrl,
            time: timestamp // Store the timestamp
          });
        }
      });
    });

    // --- NEW: Sort the entire list so the newest is at the top ---
    articles.sort((a, b) => b.time - a.time);

    res.status(200).json({ articles: articles });
    
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news data" });
  }
}
