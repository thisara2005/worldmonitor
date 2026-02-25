export default async function handler(req, res) {
  // 1. Allow n8n to connect without security blocks
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. The master list of news sources to pull from 
  // You can add as many RSS links from the repo's source list here as you want
  const feeds = [
    'https://techcrunch.com/feed/',
    'https://www.wired.com/feed/rss',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://www.xataka.com.mx/feed.xml' // Mexican Tech News
  ];

  let articles = [];

  try {
    // 3. Fetch all feeds at the exact same time
    const requests = feeds.map(feed => fetch(feed).then(r => r.text()).catch(e => ""));
    const results = await Promise.all(requests);

    results.forEach(xml => {
      // 4. Extract the items using basic matching (No external packages required)
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      // Grab the top 5 newest stories from each source
      items.slice(0, 5).forEach(item => {
        const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const descMatch = item.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);
        
        if (titleMatch) {
          articles.push({
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            summary: descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "No summary available"
          });
        }
      });
    });

    // 5. Output perfect JSON for n8n
    res.status(200).json({ articles: articles });
    
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
