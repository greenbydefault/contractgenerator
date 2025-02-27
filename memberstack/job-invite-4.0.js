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
    let inviteInProgress = false;

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
            }, 300);
        }
    }

    function openModal() {
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        if (modal) {
            modal.style.display = "flex";
            setTimeout(() => {
                modal.style.opacity = "1";
                modal.style.transform = "scale(1)";
                modal.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            }, 10);
        }
    }

    function hideStatusMessage() {
        setTimeout(() => {
            updateStatusMessage("");
        }, 10000);
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

    function showLoader() {
        if (!inviteInProgress) {
            const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
            if (loader) {
                loader.style.display = "block";
            }
        }
    }

    function hideLoader() {
        setTimeout(() => {
            const loader = document.getElementById(CONFIG.DATA_ATTRIBUTES.LOADER);
            if (loader) {
                loader.style.display = "none";
            }
        }, 3000);
    }

    function updateStatusMessage(message) {
        const statusMessage = document.getElementById(CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE);
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }

    function resetStatusMessage() {
        setTimeout(() => {
            const statusMessage = document.getElementById(CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE);
            if (statusMessage.textContent === "Vielen Dank! Die Einladung wurde an den Creator gesendet.") {
                statusMessage.textContent = "";
            }
        }, 10000);
    }

    async function sendInvite() {
        if (inviteInProgress) return;
        inviteInProgress = true;
        showLoader();
        updateStatusMessage("Einladung wird gesendet...");

        const userProfile = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE);
        const jobSelect = document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT);
        const selectedJobId = jobSelect.value;
        const selectedJobName = jobSelect.options[jobSelect.selectedIndex].text;

        const userData = {
            userName: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME),
            userEmail: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_EMAIL),
            memberstackId: userProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.MEMBERSTACK_ID),
            jobId: selectedJobId,
            jobName: selectedJobName
        };

        logDebug("📤 Sende Einladung mit folgenden Daten:", userData);

        try {
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: "POST",
                headers: { },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error(`Server-Antwort: ${response.status}`);
            
            updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.");
            resetStatusMessage();
        } catch (error) {
            console.error("❌ Fehler beim Senden der Einladung:", error);
            updateStatusMessage("Fehler beim Senden der Einladung. Bitte versuche es erneut.");
        }

        hideLoader();
        inviteInProgress = false;
    }

    window.addEventListener("DOMContentLoaded", () => {
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", openModal);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_SUBMIT}]`)?.addEventListener("click", sendInvite);
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);
    });
})();
