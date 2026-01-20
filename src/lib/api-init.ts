// Initialize API keys from environment to localStorage
// Using OpenRouter (same as AlpiForge - proven to work)

if (typeof window !== 'undefined') {
  // OpenRouter API Key (DeepSeek V3 model - fast & reliable)
  const openRouterKey = 'OPENROUTER_KEY_REDACTED';
  if (openRouterKey && !localStorage.getItem('viraith_openrouter_api_key')) {
    localStorage.setItem('viraith_openrouter_api_key', openRouterKey);
  }
}
