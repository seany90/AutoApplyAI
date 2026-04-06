// Auto-Apply AI Assistant: Popup Script
// Handles saving and loading settings in the extension popup

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const profileInput = document.getElementById('profile');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.local.get(['apiKey', 'profile'], (result) => {
    if (result.apiKey) apiKeyInput.value = result.apiKey;
    if (result.profile) {
      profileInput.value = JSON.stringify(result.profile, null, 2);
    }
  });

  // Save new settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    let profile;
    
    try {
      profile = JSON.parse(profileInput.value.trim());
    } catch (e) {
      statusDiv.innerText = "Error: Invalid JSON format in Profile.";
      statusDiv.style.color = "#ef4444";
      return;
    }

    if (!apiKey) {
      statusDiv.innerText = "Error: Please enter a Gemini API Key.";
      statusDiv.style.color = "#ef4444";
      return;
    }

    chrome.storage.local.set({ apiKey, profile }, () => {
      statusDiv.innerText = "✨ Settings saved & synced!";
      statusDiv.classList.add('success');
      setTimeout(() => {
        statusDiv.innerText = "Settings saved locally.";
        statusDiv.classList.remove('success');
      }, 3000);
    });
  });
});
