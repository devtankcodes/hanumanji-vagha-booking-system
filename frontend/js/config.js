export const CONFIG = {
  SHEET_API_URL: "https://script.google.com/macros/s/AKfycbwlHYjmaSjVVbftOqJ_wxBAr3mxU1FJG30lm20BGYUdodTn3UzYotHf383noLkKT7rNyw/exec",
  // Shared secret checked by Code.gs before accepting a write/delete.
  // This is NOT true security — since the site is static and this file
  // ships to every visitor's browser, anyone who reads the JS source can
  // still find this value. What it DOES do is stop casual/automated abuse
  // (e.g. someone finding the bare Apps Script URL and POSTing to it
  // without ever having opened this app). For real protection, this call
  // would need to go through a server you control instead of hitting
  // Apps Script directly from the browser.
  SYNC_SECRET: "633837c7b52b1d5cc32b685e7bcfb14f6abb409569770d58",
  SHEET_SYNC_MAX_RETRIES: 2,
  SHEET_SYNC_RETRY_DELAY_MS: 1500
}