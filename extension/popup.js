// AutoApply AI Assistant: Popup Script
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

  function showStatus(message, type = 'success') {
    statusDiv.innerText = message;
    statusDiv.className = 'status ' + type;
    setTimeout(() => {
      statusDiv.innerText = '';
      statusDiv.className = 'status';
    }, 3000);
  }

  // Save new settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    let profile;
    
    if (!apiKey) {
      showStatus("Error: Please enter a Gemini API Key.", "error");
      return;
    }

    try {
      const profileText = profileInput.value.trim();
      if (!profileText) {
        showStatus("Error: Profile data cannot be empty.", "error");
        return;
      }
      profile = JSON.parse(profileText);
    } catch (e) {
      showStatus("Error: Invalid JSON format in Profile.", "error");
      return;
    }

    chrome.storage.local.set({ apiKey, profile }, () => {
      showStatus("✨ Settings saved & synced successfully!");
    });
  });
});
