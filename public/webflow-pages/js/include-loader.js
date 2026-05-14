/**
 * Robust component loader for Talentsza
 * This version manually executes scripts inside the loaded components
 * and handles global form submissions via a custom PHP mailer.
 */
(function() {
    // 0. Inject Spinner & Error Styles
    const style = document.createElement('style');
    style.textContent = `
        .ts-form-overlay {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(255,255,255,0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            border-radius: 8px;
            backdrop-filter: blur(2px);
        }
        .ts-spinner {
            width: 40px; height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #ED6D00;
            border-radius: 50%;
            animation: ts-spin 0.8s linear infinite;
        }
        @keyframes ts-spin { to { transform: rotate(360deg); } }
        .ts-form-wrap { position: relative; }
        .ts-error-msg {
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
            display: block;
            animation: ts-fade-in 0.2s ease;
        }
        @keyframes ts-fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .ts-input-error { border-color: #ef4444 !important; }
    `;
    document.head.appendChild(style);

    // Helper: Show Error below field
    function showFieldError(input, message) {
        clearFieldError(input);
        input.classList.add('ts-input-error');
        const err = document.createElement('span');
        err.className = 'ts-error-msg';
        err.innerText = message;
        input.after(err);
        
        // Clear on input
        input.addEventListener('input', () => clearFieldError(input), { once: true });
    }

    function clearFieldError(input) {
        input.classList.remove('ts-input-error');
        const existing = input.nextElementSibling;
        if (existing && existing.classList.contains('ts-error-msg')) {
            existing.remove();
        }
    }

    function clearAllErrors(form) {
        form.querySelectorAll('.ts-error-msg').forEach(el => el.remove());
        form.querySelectorAll('.ts-input-error').forEach(el => el.classList.remove('ts-input-error'));
    }

    // 1. Initialize Config (Social + Email)
    let CONFIG = { socialLinks: {} };
    
    async function initConfig() {
        try {
            const response = await fetch('/webflow-pages/config.json');
            if (response.ok) {
                CONFIG = await response.json();
                if (CONFIG.socialLinks) window.SOCIAL_LINKS = CONFIG.socialLinks;
            }
        } catch (err) {
            console.error("Failed to load config.json:", err);
        }
    }
    initConfig();

    // 2. Global Form Submission Handler
    async function handleGlobalSubmit(e) {
        const form = e.target;
        // Only handle forms that look like our contact forms
        if (!form.id.includes('wf-form')) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        clearAllErrors(form);

        const formData = new FormData(form);
        // Try to find CV regardless of case
        const cvFile = formData.get('CV') || formData.get('cv');
        
        const fullNameInput = form.querySelector('[name="Full-Name"]');
        const placeInput = form.querySelector('[name="Place"]');
        const educationInput = form.querySelector('[name="Education"]');
        // Find input regardless of case
        const cvInput = form.querySelector('[name="CV"]') || form.querySelector('[name="cv"]');

        const isInvalidText = (text) => {
            if (!text) return true;
            if (text.trim().length < 3) return true;
            if (!/[a-zA-Z]/.test(text)) return true;
            return false;
        };

        // 1. Validation Logic
        let hasError = false;
        
        // Check if file is actually selected (has a name) and is too large
        if (cvFile && cvFile.name && cvFile.size > 5 * 1024 * 1024) {
            showFieldError(cvInput, "File too large (Max 5MB)");
            hasError = true;
        }
        if (isInvalidText(formData.get('Full-Name'))) {
            showFieldError(fullNameInput, "Enter a valid full name");
            hasError = true;
        }
        if (isInvalidText(formData.get('Place'))) {
            showFieldError(placeInput, "Enter a valid location");
            hasError = true;
        }
        if (isInvalidText(formData.get('Education'))) {
            showFieldError(educationInput, "Enter your education details");
            hasError = true;
        }

        if (hasError) return false;

        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        // Show non-invasive overlay spinner over the form
        const formWrapper = form.closest('.w-form') || form.parentElement;
        if (formWrapper) {
            formWrapper.style.position = 'relative';
            const overlay = document.createElement('div');
            overlay.className = 'ts-form-overlay';
            overlay.id = 'ts-loading-overlay';
            overlay.innerHTML = '<div class="ts-spinner"></div>';
            formWrapper.appendChild(overlay);
        }

        try {
            // Clear any existing messages before starting
            const successMsg = form.parentElement.querySelector('.w-form-done');
            const errorMsg = form.parentElement.querySelector('.w-form-fail');
            if (successMsg) successMsg.style.display = 'none';
            if (errorMsg) errorMsg.style.display = 'none';

            // Send via PHP Serverless API
            const response = await fetch('/api/send-email.php', {
                method: 'POST',
                body: formData // Send as multipart/form-data automatically
            });

            const result = await response.json();

            if (result.status === 'success') {
                form.reset();
                
                // Hide the form fields
                form.style.display = 'none';
                
                // Show Success Message
                if (successMsg) {
                    successMsg.style.display = 'block';
                    // After 3 seconds, hide message and bring the form back
                    setTimeout(() => {
                        successMsg.style.display = 'none';
                        form.style.display = 'block';
                    }, 3000);
                }
                
                // For popups, auto-close
                if (window.closeCareerAdvisorPopup) {
                    setTimeout(() => window.closeCareerAdvisorPopup(), 3000);
                }
            } else {
                throw new Error(result.message || "Failed to send email");
            }

        } catch (error) {
            console.error("Submission Error:", error);
            const errorMsg = form.parentElement.querySelector('.w-form-fail');
            if (errorMsg) {
                errorMsg.style.display = 'block';
                // Auto-hide after 3 seconds
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                }, 3000);
            }
        } finally {
            // Remove overlay spinner
            const overlay = document.getElementById('ts-loading-overlay');
            if (overlay) overlay.remove();
            // Re-enable submit button
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    }

    // Use capture phase (true) to ensure our handler runs before Webflow's default scripts
    document.addEventListener('submit', handleGlobalSubmit, true);

    function loadIncludes() {
        const includes = document.querySelectorAll('[data-include]');
        includes.forEach(async (el) => {
            const file = el.getAttribute('data-include');
            try {
                const response = await fetch(file);
                if (response.ok) {
                    let content = await response.text();
                    
                    // Replace placeholders if SOCIAL_LINKS is available
                    if (window.SOCIAL_LINKS) {
                        const links = window.SOCIAL_LINKS;
                        content = content
                            .replace(/{{VITE_FACEBOOK_URL}}/g, links.facebookUrl || '')
                            .replace(/{{VITE_LINKEDIN_URL}}/g, links.linkedinUrl || '')
                            .replace(/{{VITE_INSTAGRAM_URL}}/g, links.instagramUrl || '')
                            .replace(/{{VITE_BLOG_URL}}/g, links.blogUrl || '');
                    }
                    
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
                        
                        // Robust Webflow re-initialization
                        if (window.Webflow) {
                            if (window.Webflow.destroy) window.Webflow.destroy();
                            if (window.Webflow.ready) window.Webflow.ready();
                            if (window.Webflow.require) {
                                const ix2 = window.Webflow.require('ix2');
                                if (ix2) ix2.init();
                                
                                // Specifically re-init navbar if present
                                const navbar = window.Webflow.require('navbar');
                                if (navbar) navbar.ready();
                            }
                        }
                    }, 200);
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
