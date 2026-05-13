/**
 * Robust component loader for Talentsza
 * This version manually executes scripts inside the loaded components
 * and handles global form submissions via EmailJS.
 */
(function() {
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

                const emailKeys = CONFIG.emailConfig || {};
                if (emailKeys.publicKey && !window.emailjs) {
                    const script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
                    script.async = true;
                    script.onload = () => {
                        window.emailjs.init(emailKeys.publicKey);
                        console.log("EmailJS Initialized from config.json");
                    };
                    document.head.appendChild(script);
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

        const submitBtn = form.querySelector('[type="submit"]');
        const originalBtnValue = submitBtn ? submitBtn.value : "Submit";
        if (submitBtn) {
            submitBtn.value = "Sending...";
            submitBtn.disabled = true;
        }

        const emailKeys = CONFIG.emailConfig || {};

        try {
            const formData = new FormData(form);
            const templateParams = {};
            
            // Match your custom template variables EXACTLY
            templateParams.name = formData.get('Full-Name');
            templateParams.phone = formData.get('Phone-Number');
            templateParams.email = formData.get('Email-Address');
            templateParams.place = formData.get('Place');
            templateParams.education = formData.get('Education');
            templateParams.work_preference = formData.get('Work-Preference');
            templateParams.message = formData.get('Message') || formData.get('Comment');
            
            // Add dynamic time and a title
            templateParams.time = new Date().toLocaleString();
            templateParams.title = "Inquiry #" + Math.floor(Math.random() * 10000);
            
            // 1. Handle CV File Upload via Cloudinary (Free Storage)
            const cvFile = formData.get('CV');
            let cvUrl = "No attachment provided";
            
            if (cvFile && cvFile.size > 0) {
                // UI Enforcement: Check for 5MB limit
                if (cvFile.size > 5 * 1024 * 1024) {
                    alert("The file is too large! Please upload a CV smaller than 5MB.");
                    if (submitBtn) {
                        submitBtn.value = originalBtnValue;
                        submitBtn.disabled = false;
                    }
                    return; // Stop the whole process
                }

                if (emailKeys.cloudinaryCloudName && emailKeys.cloudinaryPreset) {
                    try {
                        const cloudData = new FormData();
                        cloudData.append('file', cvFile);
                        cloudData.append('upload_preset', emailKeys.cloudinaryPreset);
                        
                        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${emailKeys.cloudinaryCloudName}/upload`, {
                            method: 'POST',
                            body: cloudData
                        });
                        
                        if (cloudRes.ok) {
                            const cloudJson = await cloudRes.json();
                            cvUrl = cloudJson.secure_url;
                            console.log("File uploaded to Cloudinary:", cvUrl);
                        } else {
                            console.error("Cloudinary Upload Failed:", await cloudRes.text());
                            cvUrl = "Upload failed (file may be too large)";
                        }
                    } catch (err) {
                        console.error("Cloudinary Error:", err);
                        cvUrl = "Upload error";
                    }
                }
            }
            
            templateParams.cv_attachment = cvUrl;

            // Send via EmailJS
            await window.emailjs.send(
                emailKeys.serviceId,
                emailKeys.templateId,
                templateParams
            );

            // Show Success State
            form.style.display = 'none';
            const successMsg = form.parentElement.querySelector('.w-form-done');
            if (successMsg) successMsg.style.display = 'block';
            
            // For popups, auto-close
            if (window.closeCareerAdvisorPopup) {
                setTimeout(() => window.closeCareerAdvisorPopup(), 3000);
            }

        } catch (error) {
            console.error("EmailJS Error:", error);
            const errorMsg = form.parentElement.querySelector('.w-form-fail');
            if (errorMsg) errorMsg.style.display = 'block';
        } finally {
            if (submitBtn) {
                submitBtn.value = originalBtnValue;
                submitBtn.disabled = false;
            }
        }
    }

    document.addEventListener('submit', handleGlobalSubmit);

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
