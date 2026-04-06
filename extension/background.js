// Auto-Apply AI Assistant: Background Script
// Handles API calls to Gemini

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EVALUATE_JOB') {
    const { jd, profile, apiKey } = request;
    
    const prompt = `
      You are an expert technical recruiter and career coach.
      
      Evaluate this job against my profile. Return a JSON object with:
      1. matchScore: (number 0-100)
      2. analysis: (string, 1-2 sentences explaining why)
      3. shouldApply: (boolean, true if matchScore > 70)
      
      Job Description: ${jd}
      My Profile: ${JSON.stringify(profile)}
      
      Output ONLY the JSON object. Do not include any conversational filler.
    `;

    // Call Gemini API directly (V1 API)
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })
    .then(response => response.json())
    .then(data => {
      const text = data.candidates[0].content.parts[0].text;
      // Clean potential markdown code blocks
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      sendResponse({ result });
    })
    .catch(error => {
      console.error("Gemini API Error:", error);
      sendResponse({ error: error.message });
    });

    return true; // Keep the message channel open for async response
  }
});
