(function() {
    "use strict";

    // 🔧 Konfiguration
    const CONFIG = {
        API_BASE_URL: "https://api.webflow.com/v2/collections",
        WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
        USER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
        JOB_COLLECTION_ID: "6448faf9c5a8a17455c05525",
        WEBHOOK_URL: "https://hooks.zapier.com/hooks/catch/10061116/23n4ylm/",
        DEBUG: true,
        DATA_ATTRIBUTES: {
            MODAL: "data-modal",
            MODAL_TITLE: "data-modal-title",
            JOB_SELECT: "job-select",
            INVITE_BUTTON: "data-invite-button",
            INVITE_SUBMIT: "data-invite-submit",
            MODAL_CLOSE: "data-modal-close",
            CREATOR_PROFILE: "creator-profile",
            USER_NAME: "data-user-name",
            USER_EMAIL: "data-user-email",
            MEMBERSTACK_ID: "data-memberstack-id",
            LOADER: "invite-loader",
            STATUS_MESSAGE: "invite-status-message"
        },
        ANIMATIONS: {
            FADE_DURATION: 300,
            MESSAGE_DURATION: 7000
        }
    };

    let cachedJobs = [];
    let inviteInProgress = false;
    let successTimeout = null;

    function logDebug(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`🐛 DEBUG: ${message}`, data);
        }
    }

    function closeModal() {
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        if (modal) {
            modal.style.opacity = "0";
            modal.style.transform = "scale(0.95)";
            setTimeout(() => {
                modal.style.display = "none";
            }, CONFIG.ANIMATIONS.FADE_DURATION);
        }
    }

    function showLoader() {
        const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
        const statusMessage = document.getElementById(CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE);
        
        if (loader) {
            // Erst Status ausblenden (falls vorhanden)
            if (statusMessage) {
                statusMessage.style.opacity = "0";
                setTimeout(() => {
                    statusMessage.style.display = "none";
                    
                    // Dann Loader einblenden
                    loader.style.display = "flex";
                    loader.style.opacity = "0";
                    setTimeout(() => {
                        loader.style.opacity = "1";
                    }, 10);
                }, CONFIG.ANIMATIONS.FADE_DURATION);
            } else {
                // Direkt Loader einblenden
                loader.style.display = "flex";
                loader.style.opacity = "0";
                setTimeout(() => {
                    loader.style.opacity = "1";
                }, 10);
            }
        }
    }

    function hideLoader() {
        const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, CONFIG.ANIMATIONS.FADE_DURATION);
        }
    }

    function updateStatusMessage(message, autoHide = false) {
        const statusMessage = document.getElementById(CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE);
        const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
        
        if (statusMessage) {
            statusMessage.textContent = message;
            
            // Erst Loader ausblenden falls vorhanden
            if (loader && loader.style.display !== "none") {
                loader.style.opacity = "0";
                setTimeout(() => {
                    loader.style.display = "none";
                    
                    // Dann Status einblenden
                    statusMessage.style.display = "block";
                    statusMessage.style.opacity = "0";
                    setTimeout(() => {
                        statusMessage.style.opacity = "1";
                    }, 10);
                }, CONFIG.ANIMATIONS.FADE_DURATION);
            } else {
                // Direkt Status einblenden
                statusMessage.style.display = "block";
                statusMessage.style.opacity = "0";
                setTimeout(() => {
                    statusMessage.style.opacity = "1";
                }, 10);
            }

            if (autoHide) {
                clearTimeout(successTimeout);
                successTimeout = setTimeout(() => {
                    statusMessage.style.opacity = "0";
                    setTimeout(() => {
                        statusMessage.style.display = "none";
                    }, CONFIG.ANIMATIONS.FADE_DURATION);
                }, CONFIG.ANIMATIONS.MESSAGE_DURATION);
            }
        }
    }

    async function fetchUserJobs(memberId) {
        try {
            logDebug("Fetching jobs for user", memberId);
            const response = await fetch(`${CONFIG.WORKER_BASE_URL}${CONFIG.API_BASE_URL}/${CONFIG.USER_COLLECTION_ID}/items/${memberId}/live`);
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const userData = await response.json();
            return userData?.fieldData?.["posted-jobs"] || [];
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Jobs: ${error.message}`);
            return [];
        }
    }

    async function fetchJobDetails(jobId) {
        try {
            logDebug("Fetching job details", jobId);
            const response = await fetch(`${CONFIG.WORKER_BASE_URL}${CONFIG.API_BASE_URL}/${CONFIG.JOB_COLLECTION_ID}/items/${jobId}/live`);
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const jobData = await response.json();
            return jobData?.fieldData || {};
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Job-Details: ${error.message}`);
            return {};
        }
    }

    async function preloadUserJobs() {
        try {
            logDebug("Preloading user jobs...");
            const member = await window.$memberstackDom.getCurrentMember();
            const memberId = member?.data?.customFields?.['webflow-member-id'];
            if (!memberId) throw new Error("Kein 'webflow-member-id' gefunden.");
            
            const jobIds = await fetchUserJobs(memberId);
            cachedJobs = (await Promise.all(jobIds.map(fetchJobDetails)))
                .filter(job => new Date(job["job-date-end"]) > new Date()); // Nur aktive Jobs
            logDebug("Preloading completed", cachedJobs);
        } catch (error) {
            console.error("❌ Fehler beim Vorladen der Jobs:", error);
        }
    }

    function renderInviteModal() {
        logDebug("Rendering modal with jobs", cachedJobs);
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        const modalTitle = modal?.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`);
        const jobSelect = modal?.querySelector(`#${CONFIG.DATA_ATTRIBUTES.JOB_SELECT}`);

        if (!modal || !modalTitle || !jobSelect) {
            console.error("❌ Modal-Elemente fehlen");
            return;
        }

        // Modal Title setzen
        modalTitle.textContent = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE).getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME);

        // Job-Auswahlfeld aktualisieren
        jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
            cachedJobs.map(job => `<option value="${job.slug}">${job.name}</option>`).join("");

        // Loader und Status Message zurücksetzen
        const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
        const statusMessage = document.getElementById(CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE);
        
        if (loader) {
            loader.style.display = "none";
            loader.style.opacity = "0";
        }
        
        if (statusMessage) {
            statusMessage.style.display = "none";
            statusMessage.style.opacity = "0";
            statusMessage.textContent = "";
        }

        modal.style.display = "flex";
        modal.style.opacity = "0";
        modal.style.transform = "scale(0.95)";
        setTimeout(() => {
            modal.style.opacity = "1";
            modal.style.transform = "scale(1)";
            modal.style.transition = `opacity ${CONFIG.ANIMATIONS.FADE_DURATION}ms ease, transform ${CONFIG.ANIMATIONS.FADE_DURATION}ms ease`;
        }, 10);
        logDebug("Modal sichtbar gemacht");
    }

    async function sendInvite() {
        if (inviteInProgress) return;
        inviteInProgress = true;

        showLoader();
        updateStatusMessage("Einladung wird gesendet...");

        setTimeout(async () => {
            const userProfile = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE);
            const jobSelect = document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT);
            const selectedJobSlug = jobSelect.value;
            const selectedJobName = jobSelect.options[jobSelect.selectedIndex].text;

            if (!selectedJobSlug) {
                updateStatusMessage("Bitte wähle einen Job aus.");
                hideLoader();
                inviteInProgress = false;
                return;
            }

            const userData = {
                userName: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME),
                userEmail: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_EMAIL),
                memberstackId: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.MEMBERSTACK_ID),
                jobId: selectedJobSlug,
                jobName: selectedJobName
            };

            logDebug("📤 Sende Einladung mit folgenden Daten:", userData);

            try {
                const response = await fetch(CONFIG.WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) throw new Error(`Server-Antwort: ${response.status}`);

                updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.", true);
            } catch (error) {
                console.error("❌ Fehler beim Senden der Einladung:", error);
                updateStatusMessage("Fehler beim Senden der Einladung. Bitte versuche es erneut.");
            }

            hideLoader();
            inviteInProgress = false;
        }, 3000);
    }

    // Hinzufügen von CSS für Loader und Statusmeldung
    function addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            #${CONFIG.DATA_ATTRIBUTES.LOADER} {
                display: none;
                align-items: center;
                justify-content: flex-start;
                opacity: 0;
                transition: opacity ${CONFIG.ANIMATIONS.FADE_DURATION}ms ease;
                margin: 10px 0;
            }
            
            #${CONFIG.DATA_ATTRIBUTES.LOADER} .dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #4CAF50;
                margin-right: 5px;
            }
            
            #${CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE} {
                display: none;
                opacity: 0;
                transition: opacity ${CONFIG.ANIMATIONS.FADE_DURATION}ms ease;
                margin: 10px 0;
                color: #333;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // Erstellen des Loaders im DOM
    function createLoaderElement() {
        const loaderContainer = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
        if (loaderContainer) {
            loaderContainer.innerHTML = `
                <span class="dot"></span>
                <span>Processing...</span>
            `;
            loaderContainer.style.display = "none";
        }
    }

    window.addEventListener("DOMContentLoaded", () => {
        addStyles();
        createLoaderElement();
        preloadUserJobs();
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", renderInviteModal);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_SUBMIT}]`)?.addEventListener("click", sendInvite);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);
    });
})();
