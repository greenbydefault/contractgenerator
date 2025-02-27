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
        }
    };

    let cachedJobs = [];

    function logDebug(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`🐛 DEBUG: ${message}`, data);
        }
    }

    async function sendInvite() {
        showLoader();
        updateStatusMessage("Einladung wird gesendet...");

        const userProfile = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE);
        const jobSelect = document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT);
        const selectedJobId = jobSelect.value;

        const userData = {
            userName: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME),
            userEmail: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_EMAIL),
            memberstackId: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.MEMBERSTACK_ID),
            jobId: selectedJobId
        };

        logDebug("📤 Sende Einladung mit folgenden Daten:", userData);

        try {
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error(`Server-Antwort: ${response.status}`);
            
            updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.");
        } catch (error) {
            console.error("❌ Fehler beim Senden der Einladung:", error);
            updateStatusMessage("Fehler beim Senden der Einladung. Bitte versuche es erneut.");
        }

        hideLoader();
    }

    function showLoader() {
        const loader = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.LOADER}]`);
        if (loader) {
            loader.style.display = "flex";
            setTimeout(() => loader.style.opacity = "1", 10);
        }
    }

    function updateStatusMessage(message) {
        const statusMessage = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE}]`);
        if (statusMessage) statusMessage.textContent = message;
    }

    function hideLoader() {
        const loader = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.LOADER}]`);
        if (loader) setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 300);
        }, 2000);
    }

    window.addEventListener("DOMContentLoaded", () => {
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_SUBMIT}]`)?.addEventListener("click", sendInvite);
    });
})();
