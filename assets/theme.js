// 1. Instantly apply theme to <html> before the page renders to prevent FOUC
(function () {
    let theme = localStorage.getItem("theme");
    
    // Auto-detect system preference if no save exists
    if (!theme) {
        theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        localStorage.setItem("theme", theme);
    }

    // Natively applies the variables instantly. No flash!
    document.documentElement.setAttribute("data-theme", theme);
})();

// 2. Set the correct Sun/Moon icon and handle real-time switching
document.addEventListener("DOMContentLoaded", () => {
    updateThemeIcon(document.documentElement.getAttribute("data-theme"));
});

function updateThemeIcon(theme) {
    const pathEl = document.getElementById("theme-icon-path");
    if (pathEl) {
        const sunPath = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
        const moonPath = "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z";
        pathEl.setAttribute("d", theme === 'light' ? sunPath : moonPath);
    }
}

// 3. Toggle button function (No reload required!)
window.toggleTheme = function() {
    let currentTheme = document.documentElement.getAttribute("data-theme");
    let newTheme = currentTheme === "light" ? "dark" : "light";
    
    // Apply instantly
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Swap icon
    updateThemeIcon(newTheme);
};