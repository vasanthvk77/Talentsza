/**
 * Robust component loader for Talentsza
 * This version manually executes scripts inside the loaded components
 * and handles global form submissions via a custom PHP mailer.
 */
(function() {
    // 0. Inject Spinner Styles
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
            width: 40px;
            height: 40px;
            border: 4px solid #e5e7eb;
            border-top-color: #ED6D00;
            border-radius: 50%;
            animation: ts-spin 0.8s linear infinite;
        }
        @keyframes ts-spin {
            to { transform: rotate(360deg); }
        }
        .ts-form-wrap {
            position: relative;
        }
    `;
    document.head.appendChild(style);

    // 1. Initialize Config (Social + Email)
    let CONFIG = { socialLinks: {}, emailConfig: {} };
    
    async function initConfig() {
        try {
            const response = await fetch('/webflow-pages/config.json');
            if (response.ok) {
                CONFIG = await response.json();
                
                // Set global SOCIAL_LINKS so placeholders are replaced
                if (CONFIG.socialLinks) {
                    window.SOCIAL_LINKS = CONFIG.socialLinks;
                }
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

        const formData = new FormData(form);
        const cvFile = formData.get('CV');
        const fullName = formData.get('Full-Name');
        const place = formData.get('Place');
        const education = formData.get('Education');

        // Helper: Validate if text is meaningful (min 3 chars, contains at least one letter)
        const isInvalidText = (text) => {
            if (!text) return true; // Empty is invalid
            if (text.trim().length < 3) return true; // Too short
            if (!/[a-zA-Z]/.test(text)) return true; // No letters at all (just dots/symbols)
            return false;
        };

        // 1. IMMEDIATE VALIDATION: Check for 5MB limit before doing anything else
        if (cvFile && cvFile.size > 5 * 1024 * 1024) {
            alert("The file is too large! Please upload a CV smaller than 5MB.");
            return false;
        }

        // 2. TEXT VALIDATION: Ensure Name, Place, and Education are real
        if (isInvalidText(fullName)) {
            alert("Please enter a valid Full Name (min 3 characters).");
            return false;
        }
        if (isInvalidText(place)) {
            alert("Please enter a valid Place/Location (min 3 characters).");
            return false;
        }
        if (isInvalidText(education)) {
            alert("Please enter a valid Education detail (min 3 characters).");
            return false;
        }

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
            // Send via PHP Serverless API
            const response = await fetch('/api/send-email.php', {
                method: 'POST',
                body: formData // Send as multipart/form-data automatically
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Clear all form fields before hiding
                form.reset();

                // Show Success State
                form.style.display = 'none';
                const successMsg = form.parentElement.querySelector('.w-form-done');
                if (successMsg) successMsg.style.display = 'block';
                
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
            if (errorMsg) errorMsg.style.display = 'block';
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
