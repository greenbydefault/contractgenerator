(function() {
    "use strict";

    // 🔧 Konfiguration
    const CONFIG = {
        API_BASE_URL: "https://api.webflow.com/v2/collections",
        WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
        USER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
        JOB_COLLECTION_ID: "6448faf9c5a8a17455c05525",
        WEBHOOK_URL: "https://your-zapier-webhook-url.com",
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
            cachedJobs = await Promise.all(jobIds.map(fetchJobDetails));
            logDebug("Preloading completed", cachedJobs);
        } catch (error) {
            console.error("❌ Fehler beim Vorladen der Jobs:", error);
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

    function createLoader() {
        return `<div ${CONFIG.DATA_ATTRIBUTES.LOADER} style="display: none; align-items: center; gap: 10px; opacity: 0; transition: opacity 0.3s ease;">
                    <svg width="24" height="24" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#fd5392" stroke-width="5" stroke-dasharray="90,150" stroke-dashoffset="0">
                            <animateTransform attributeType="XML" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                    <span ${CONFIG.DATA_ATTRIBUTES.STATUS_MESSAGE}>Einladung wird gesendet...</span>
                </div>`;
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

    async function sendInvite() {
        showLoader();
        updateStatusMessage("Einladung wird gesendet...");
        
        setTimeout(() => {
            updateStatusMessage("Vielen Dank! Die Einladung wurde an den Creator gesendet.");
            hideLoader();
            setTimeout(closeModal, 2000);
        }, 2000);
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

        modalTitle.textContent = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE).getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME);
        jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
            cachedJobs.map(job => `<option value="${job.id}">${job.name}</option>`).join("");
        
        modal.style.display = "flex";
        modal.style.opacity = "0";
        modal.style.transform = "scale(0.95)";
        setTimeout(() => {
            modal.style.opacity = "1";
            modal.style.transform = "scale(1)";
            modal.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        }, 10);
        logDebug("Modal sichtbar gemacht");
    }

    window.addEventListener("DOMContentLoaded", preloadUserJobs);
    
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", renderInviteModal);
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_SUBMIT}]`)?.addEventListener("click", sendInvite);
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);
})();
