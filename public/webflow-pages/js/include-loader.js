/**
 * Robust component loader for Talentsza
 * This version manually executes scripts inside the loaded components.
 */
(function() {
    function loadIncludes() {
        const includes = document.querySelectorAll('[data-include]');
        includes.forEach(async (el) => {
            const file = el.getAttribute('data-include');
            try {
                const response = await fetch(file);
                if (response.ok) {
                    const content = await response.text();
                    
                    // Create a temporary container to parse the HTML
                    const temp = document.createElement('div');
                    temp.innerHTML = content;
                    
                    // Find all scripts in the content
                    const scripts = Array.from(temp.querySelectorAll('script'));
                    
                    // Replace the placeholder
                    el.replaceWith(...temp.childNodes);
                    
                    // Manually execute each script
                    scripts.forEach(oldScript => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => {
                            newScript.setAttribute(attr.name, attr.value);
                        });
                        newScript.textContent = oldScript.textContent;
                        document.body.appendChild(newScript);
                        // Clean up by removing the injected script tag after execution
                        newScript.remove();
                    });

                    // Re-trigger layout events for Webflow/Animations
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 100);
                } else {
                    console.error('Failed to load component:', file, response.status);
                }
            } catch (err) {
                console.error('Error fetching component:', file, err);
            }
        });
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadIncludes();
    } else {
        document.addEventListener('DOMContentLoaded', loadIncludes);
    }
})();
