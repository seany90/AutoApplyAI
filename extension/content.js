// content.js - Runs on LinkedIn/Indeed job pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "INJECT_ANSWERS") {
    const { inferredAnswers, coverLetter } = request.data;
    
    console.log("AutoApply Copilot: Received answers to inject.", inferredAnswers);
    
    // Simulate human-like typing delay
    const typeText = async (element, text) => {
      element.focus();
      element.value = "";
      for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        // Dispatch input event so React/Angular picks it up
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 10 + Math.random() * 20)); // 10-30ms per char
      }
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
    };

    // Very basic heuristic for finding fields (this is a UAT demo)
    const inject = async () => {
      // Look for textareas (often cover letters or long answers)
      const textareas = document.querySelectorAll('textarea');
      for (const ta of textareas) {
        if (ta.name.toLowerCase().includes('cover') || ta.id.toLowerCase().includes('cover')) {
          await typeText(ta, coverLetter);
        }
      }

      // Look for inputs
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
      for (const input of inputs) {
        const label = input.closest('label') || document.querySelector(`label[for="${input.id}"]`);
        const labelText = label ? label.innerText.toLowerCase() : input.name.toLowerCase();
        
        // Match inferred answers to input labels
        for (const [key, value] of Object.entries(inferredAnswers)) {
          if (labelText.includes(key.toLowerCase().replace(/_/g, ' '))) {
            await typeText(input, String(value));
          }
        }
      }
      
      // Alert the user that the copilot has finished injecting
      const banner = document.createElement('div');
      banner.style.position = 'fixed';
      banner.style.top = '10px';
      banner.style.right = '10px';
      banner.style.backgroundColor = '#4f46e5';
      banner.style.color = 'white';
      banner.style.padding = '15px';
      banner.style.borderRadius = '8px';
      banner.style.zIndex = '999999';
      banner.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      banner.style.fontFamily = 'sans-serif';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="20" height="20">
            <rect width="128" height="128" rx="32" fill="white"/>
            <rect x="36" y="48" width="56" height="40" rx="8" fill="none" stroke="#4f46e5" stroke-width="8"/>
            <path d="M48 32v16h16" fill="none" stroke="#4f46e5" stroke-width="8" stroke-linejoin="round"/>
            <path d="M24 68h12M92 68h12" stroke="#4f46e5" stroke-width="8" stroke-linecap="round"/>
            <circle cx="52" cy="68" r="6" fill="#4f46e5"/>
            <circle cx="76" cy="68" r="6" fill="#4f46e5"/>
          </svg>
          <h3 style="margin:0;font-size:16px;color:white;">AutoApply Copilot Active</h3>
        </div>
        <p style="margin:0;font-size:14px;color:white;">Answers injected. Please review and click Submit.</p>
      `;
      document.body.appendChild(banner);
      
      setTimeout(() => banner.remove(), 5000);
    };

    // Wait a moment for the page to fully render the application modal
    setTimeout(inject, 2000);
    sendResponse({ status: "injected" });
  }
});
