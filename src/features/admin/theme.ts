/** Where the admin's light/dark choice is kept (this device only). */
export const ADMIN_THEME_KEY = "admin_theme";

/**
 * Runs in the admin <head> before the first paint: applies the saved choice, or the device setting,
 * to <html data-theme> so the panel never flashes light before turning dark.
 */
export const ADMIN_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${ADMIN_THEME_KEY}");if(t!=="light"&&t!=="dark")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
