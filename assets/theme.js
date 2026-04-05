// 1. Load saved theme instantly on every page
(function () {
    let theme = localStorage.getItem("theme");
    
    // Auto-detect system preference if no save exists
    if (!theme) {
        theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        localStorage.setItem("theme", theme);
    }

    // --- UPDATED ANTI-FLASH FIX (The Blocker) ---
    // If light mode is needed, we must block the default dark CSS from painting
    // while the browser downloads the light CSS files over the network.
    if (theme === "light") {
        // Set the base canvas to your light background color instantly
        document.documentElement.style.backgroundColor = "#eef2ff"; 
        
        // Create a temporary style to hide the body content completely
        const style = document.createElement('style');
        style.id = "fouc-blocker";
        style.textContent = `
            body { 
                opacity: 0 !important; 
                visibility: hidden !important; 
            }
        `;
        document.documentElement.appendChild(style);
    } else {
        // Set base canvas to dark instantly
        document.documentElement.style.backgroundColor = "#020617"; 
    }

    // Smart path swapper
    let stylesheetsToLoad = 0;

    function applyTheme(linkId) {
        const link = document.getElementById(linkId);
        if (link) {
            let href = link.getAttribute("href");
            let isSwapping = false;

            // Detect if we need to swap the CSS file
            if (theme === "light" && !href.includes("-light.css")) {
                link.setAttribute("href", href.replace(".css", "-light.css"));
                isSwapping = true;
            } else if (theme === "dark" && href.includes("-light.css")) {
                link.setAttribute("href", href.replace("-light.css", ".css"));
                isSwapping = true;
            }

            // If we are swapping, wait for the new CSS to finish downloading
            if (isSwapping) {
                stylesheetsToLoad++;
                link.onload = () => {
                    stylesheetsToLoad--;
                    removeBlockerIfReady();
                };
            }
        }
    }

    // Removes the invisible cloak once the correct CSS is ready
    function removeBlockerIfReady() {
        if (stylesheetsToLoad === 0) {
            const blocker = document.getElementById("fouc-blocker");
            if (blocker) {
                // Smoothly fade the UI into view
                blocker.textContent = `
                    body { 
                        opacity: 1 !important; 
                        visibility: visible !important; 
                        transition: opacity 0.2s ease !important; 
                    }
                `;
            }
        }
    }

    applyTheme("master-style");
    applyTheme("hub-style");

    // Safety fallback: Unhide the body just in case the network hangs or onload fails
    window.addEventListener('load', () => {
        setTimeout(removeBlockerIfReady, 100); 
    });
})();

// 2. Set the correct Sun/Moon icon when the page loads
document.addEventListener("DOMContentLoaded", () => {
    const pathEl = document.getElementById("theme-icon-path");
    if (pathEl) {
        const theme = localStorage.getItem("theme");
        
        const sunPath = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
        const moonPath = "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z";
        
        // Directly swap the drawing path
        pathEl.setAttribute("d", theme === 'light' ? sunPath : moonPath);
    }
});

// 3. Toggle button function
window.toggleTheme = function() {
    let theme = localStorage.getItem("theme");
    localStorage.setItem("theme", theme === "light" ? "dark" : "light");
    location.reload();
};