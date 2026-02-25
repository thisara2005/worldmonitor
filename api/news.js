export default async function handler(req, res) {
  // 1. Set CORS headers for n8n access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Curated Mexico-Targeted News Feeds
  const feeds = [
    'https://www.milenio.com/rss',                 // Milenio (Mexico)
    'https://cnnespanol.cnn.com/feed/',            // CNN en Español
    'https://feeds.bbci.co.uk/mundo/rss.xml',      // BBC Mundo
    'https://www.xataka.com.mx/feed.xml',          // Xataka México
    'http://rss.cnn.com/rss/edition_americas.rss'  // CNN Americas
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
      
      items.slice(0, 10).forEach(item => {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        const dateMatch = item.match(/<(?:pubDate|dc:date)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|dc:date)>/i);
        
        let timestamp = 0;
        if (dateMatch) {
            timestamp = new Date(dateMatch[1].trim()).getTime();
        }

        // --- THE SUPER IMAGE HUNTER ---
        const enclosureMatch = item.match(/enclosure[^>]+url=["']([^"']+)["']/i);
        const mediaMatch = item.match(/media:content[^>]+url=["']([^"']+)["']/i);
        const thumbMatch = item.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i);
        const imgMatch = item.match(/<img[^>]+src=["']([^"']+)["']/i);
        const contentMatch = item.match(/<content:encoded>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
        
        let imageUrl = "";
        if (enclosureMatch) imageUrl = enclosureMatch[1];
        else if (mediaMatch) imageUrl = mediaMatch[1];
        else if (thumbMatch) imageUrl = thumbMatch[1];
        else if (imgMatch) imageUrl = imgMatch[1];
        else if (contentMatch) imageUrl = contentMatch[1];

        if (titleMatch) {
          articles.push({
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            summary: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "No hay resumen disponible",
            image: imageUrl,
            time: timestamp
          });
        }
      });
    });

    // Sort by newest first
    articles.sort((a, b) => b.time - a.time);

    res.status(200).json({ articles: articles });
    
  } catch (error) {
    res.status(500).json({ error: "Error al obtener noticias" });
  }
}
