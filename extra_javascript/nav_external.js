document.addEventListener("DOMContentLoaded", function() {
    const currentDomain = window.location.hostname;

    // 1️⃣ Handle nav links (existing behavior)
    document.querySelectorAll('nav a[href^="http"]').forEach(function(link) {
        const linkDomain = new URL(link.href).hostname;
        if (linkDomain !== currentDomain) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        }
    });
});

document.addEventListener("click", function(event) {
    const link = event.target.closest('a.md-ext, nav a[href^="http"]');
    if (!link) return;

    const currentDomain = window.location.hostname;
    const linkDomain = new URL(link.href).hostname;

    if (linkDomain !== currentDomain) {
        event.preventDefault(); // stop normal navigation
        window.open(link.href, "_blank", "noopener,noreferrer");
    }
});
