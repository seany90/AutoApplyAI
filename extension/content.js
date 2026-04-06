// Auto-Apply AI Assistant: Content Script
console.log("Auto-Apply AI Extension loaded on LinkedIn/Indeed.");

// 1. Inject the AI Button
function injectAIButton() {
  const applyButtonContainer = document.querySelector('.jobs-apply-button--top-card');
  if (applyButtonContainer && !document.getElementById('ai-apply-btn')) {
    const aiBtn = document.createElement('button');
    aiBtn.id = 'ai-apply-btn';
    aiBtn.innerText = '✨ Auto-Apply with AI';
    aiBtn.style.cssText = `
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 600;
      margin-left: 10px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    `;
    
    aiBtn.onclick = handleAIApply;
    applyButtonContainer.parentNode.appendChild(aiBtn);
  }
}

// 2. Handle the AI Apply Click
async function handleAIApply() {
  const aiBtn = document.getElementById('ai-apply-btn');
  const originalText = aiBtn.innerText;
  aiBtn.innerText = '🧠 Evaluating...';
  aiBtn.disabled = true;

  try {
    // Extract Job Description
    const jdElement = document.querySelector('#job-details') || document.querySelector('.job-description');
    const jdText = jdElement ? jdElement.innerText : "Could not find job description.";

    // Get Profile from Extension Storage
    const { profile, apiKey } = await chrome.storage.local.get(['profile', 'apiKey']);
    
    if (!profile || !apiKey) {
      alert("Please set your Profile and Gemini API Key in the extension popup first!");
      aiBtn.innerText = originalText;
      aiBtn.disabled = false;
      return;
    }

    // Call Background Script to use Gemini
    chrome.runtime.sendMessage({
      type: 'EVALUATE_JOB',
      jd: jdText,
      profile: profile,
      apiKey: apiKey
    }, (response) => {
      if (response.error) {
        alert("AI Error: " + response.error);
      } else {
        const { matchScore, analysis, shouldApply } = response.result;
        
        if (shouldApply && matchScore > 70) {
          alert(`High Match (${matchScore}%): ${analysis}\n\nProceeding to auto-fill...`);
          // Trigger LinkedIn's Easy Apply
          const easyApplyBtn = document.querySelector('.jobs-apply-button');
          if (easyApplyBtn) easyApplyBtn.click();
          
          // Note: In a full version, we would now listen for the modal and fill inputs
        } else {
          alert(`Low Match (${matchScore}%): ${analysis}\n\nSkipping this job.`);
        }
      }
      aiBtn.innerText = originalText;
      aiBtn.disabled = false;
    });

  } catch (err) {
    console.error(err);
    aiBtn.innerText = originalText;
    aiBtn.disabled = false;
  }
}

// Run injection periodically (LinkedIn is a SPA)
setInterval(injectAIButton, 2000);
