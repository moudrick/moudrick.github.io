document.addEventListener("DOMContentLoaded", function() {
  const currentDomain = window.location.hostname;
  document.querySelectorAll('nav a[href^="http"]').forEach(function(link) {
    // Only apply _blank if link is external
    const linkDomain = new URL(link.href).hostname;
    if (linkDomain !== currentDomain) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer"); // security best practice
    }
  });
});