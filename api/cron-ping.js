export default async function handler(req, res) {
  // The specific URL you want to "visit"
  const targetUrl = "https://worldmonitor-rho-five.vercel.app/?lat=14.6629&lon=-0.0000&zoom=1.00&view=global&timeRange=7d&layers=conflicts%2Cbases%2Chotspots%2Cnuclear%2Csanctions%2Cweather%2Ceconomic%2Cwaterways%2Coutages%2Cmilitary%2Cnatural";

  try {
    // This simulates a visitor hitting the page
    const response = await fetch(targetUrl);
    
    res.status(200).json({ 
      success: true, 
      message: "Site visited successfully",
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
