(function() {
    "use strict";

    // 🔧 Konfiguration
    const CONFIG = {
        API_BASE_URL: "https://api.webflow.com/v2/collections",
        WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
        USER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
        JOB_COLLECTION_ID: "6448faf9c5a8a17455c05525",
        WEBHOOK_URL: "https://your-zapier-webhook-url.com",
        DEBUG: true, // Debugging aktivieren/deaktivieren
        DATA_ATTRIBUTES: {
            MODAL: "data-modal",
            MODAL_TITLE: "data-modal-title",
            JOB_SELECT: "job-select",
            INVITE_BUTTON: "data-invite-button",
            MODAL_CLOSE: "data-modal-close",
            CREATOR_PROFILE: "creator-profile",
            USER_NAME: "data-user-name",
            USER_EMAIL: "data-user-email",
            MEMBERSTACK_ID: "data-memberstack-id",
            SEARCH_INPUT: "job-search-input"
        }
    };

    let cachedJobs = [];

    function logDebug(message, data = null) {
        if (CONFIG.DEBUG) {
            console.log(`🐛 DEBUG: ${message}`, data);
        }
    }

    function checkElements() {
        const elements = {
            modal: document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`),
            modalTitle: document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`),
            jobSelect: document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT),
            searchInput: document.getElementById(CONFIG.DATA_ATTRIBUTES.SEARCH_INPUT),
            inviteButton: document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`),
            modalClose: document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`),
            creatorProfile: document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE)
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) console.error(`❌ Fehlendes Element: ${key}`);
            else logDebug(`✔ Element gefunden: ${key}`, element);
        });
    }

    function buildWorkerUrl(apiUrl) {
        return `${CONFIG.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
    }

    async function preloadUserJobs() {
        try {
            logDebug("Preloading user jobs...");
            const member = await window.$memberstackDom.getCurrentMember();
            const memberId = member?.data?.customFields?.['webflow-member-id'];
            if (!memberId) throw new Error("Kein 'webflow-member-id' gefunden.");
            
            const jobIds = await fetchUserJobs(memberId);
            cachedJobs = (await Promise.all(jobIds.map(fetchJobDetails)))
                .filter(job => new Date(job["job-date-end"]) > new Date());
            
            logDebug("Preloading completed", cachedJobs);
        } catch (error) {
            console.error("❌ Fehler beim Vorladen der Jobs:", error);
        }
    }

    async function fetchUserJobs(memberId) {
        try {
            logDebug("Fetching jobs for user", memberId);
            const response = await fetch(buildWorkerUrl(`${CONFIG.API_BASE_URL}/${CONFIG.USER_COLLECTION_ID}/items/${memberId}/live`));
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const userData = await response.json();
            logDebug("User jobs received", userData);
            return userData?.fieldData?.["posted-jobs"] || [];
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Jobs: ${error.message}`);
            return [];
        }
    }

    function renderInviteModal() {
        logDebug("Rendering modal with jobs", cachedJobs);
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        const modalTitle = modal.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`);
        const jobSelect = modal.querySelector(`#${CONFIG.DATA_ATTRIBUTES.JOB_SELECT}`);
        const searchInput = document.getElementById(CONFIG.DATA_ATTRIBUTES.SEARCH_INPUT);

        if (!modal || !modalTitle || !jobSelect || !searchInput) {
            console.error("❌ Modal-Elemente fehlen");
            return;
        }

        modalTitle.textContent = `Einladung für ${document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE).getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME)}`;
        jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
            cachedJobs.map(job => `<option value="${job.id}">${job.name}</option>`).join("");
        
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
                cachedJobs.filter(job => job.name.toLowerCase().includes(searchTerm))
                    .map(job => `<option value="${job.id}">${job.name}</option>`).join("");
        });
        
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

    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", () => {
        logDebug("Invite-Button geklickt");
        renderInviteModal();
    });
    
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);

    function closeModal() {
        logDebug("Schließe Modal");
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        modal.style.opacity = "0";
        modal.style.transform = "scale(0.95)";
        setTimeout(() => {
            modal.style.display = "none";
        }, 300);
    }
})();
