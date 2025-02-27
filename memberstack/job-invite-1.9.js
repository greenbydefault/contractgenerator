(function() {
    "use strict";

    // 🔧 Konfiguration
    const CONFIG = {
        API_BASE_URL: "https://api.webflow.com/v2/collections",
        WORKER_BASE_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
        USER_COLLECTION_ID: "6448faf9c5a8a15f6cc05526",
        JOB_COLLECTION_ID: "6448faf9c5a8a17455c05525",
        WEBHOOK_URL: "https://your-zapier-webhook-url.com",
        DATA_ATTRIBUTES: {
            MODAL: "data-modal",
            MODAL_TITLE: "data-modal-title",
            JOB_SELECT: "job-select",
            INVITE_BUTTON: "data-invite-button",
            MODAL_CLOSE: "data-modal-close",
            CREATOR_PROFILE: "creator-profile",
            USER_NAME: "data-user-name",
            USER_EMAIL: "data-user-email",
            MEMBERSTACK_ID: "data-memberstack-id"
        }
    };

    // 🛠️ Hilfsfunktion für Worker-URL
    function buildWorkerUrl(apiUrl) {
        return `${CONFIG.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
    }

    // 📥 Jobs des eingeloggten Nutzers abrufen
    async function fetchUserJobs(memberId) {
        try {
            const response = await fetch(buildWorkerUrl(`${CONFIG.API_BASE_URL}/${CONFIG.USER_COLLECTION_ID}/items/${memberId}/live`));
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            const userData = await response.json();
            return userData?.fieldData?.["posted-jobs"] || [];
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Jobs: ${error.message}`);
            return [];
        }
    }

    // 📥 Job-Details abrufen
    async function fetchJobDetails(jobId) {
        try {
            const response = await fetch(buildWorkerUrl(`${CONFIG.API_BASE_URL}/${CONFIG.JOB_COLLECTION_ID}/items/${jobId}/live`));
            if (!response.ok) throw new Error(`API-Fehler: ${response.status}`);
            return (await response.json())?.fieldData || {};
        } catch (error) {
            console.error(`❌ Fehler beim Abrufen der Job-Details: ${error.message}`);
            return {};
        }
    }

    // 🔍 Jobs abrufen und anzeigen
    async function fetchAndDisplayUserJobs() {
        try {
            const member = await window.$memberstackDom.getCurrentMember();
            const memberId = member?.data?.customFields?.['webflow-member-id'];
            if (!memberId) throw new Error("Kein 'webflow-member-id' gefunden.");
            
            const jobIds = await fetchUserJobs(memberId);
            const jobs = (await Promise.all(jobIds.map(fetchJobDetails)))
                .filter(job => new Date(job["job-date-end"]) > new Date());
            
            renderInviteModal(jobs);
        } catch (error) {
            console.error("❌ Fehler beim Laden der Jobs:", error);
        }
    }

    // 📩 Einladung senden
    function sendInvite() {
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        const creatorProfile = document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE);
        const selectedJobId = document.getElementById(CONFIG.DATA_ATTRIBUTES.JOB_SELECT).value;
        
        if (!selectedJobId) {
            alert("Bitte einen Job auswählen.");
            return;
        }
        
        const userData = {
            userName: creatorProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME),
            userEmail: creatorProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.USER_EMAIL),
            memberstackId: creatorProfile.getAttribute(CONFIG.DATA_ATTRIBUTES.MEMBERSTACK_ID),
            jobId: selectedJobId
        };

        fetch(CONFIG.WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(() => {
            alert("Einladung erfolgreich gesendet!");
            closeModal();
        })
        .catch(error => console.error("❌ Fehler beim Senden der Einladung:", error));
    }

    // 📜 Modal für Job-Auswahl rendern
    function renderInviteModal(jobs) {
        const modal = document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`);
        modal.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_TITLE}]`).textContent = `Einladung für ${document.getElementById(CONFIG.DATA_ATTRIBUTES.CREATOR_PROFILE).getAttribute(CONFIG.DATA_ATTRIBUTES.USER_NAME)}`;
        
        const jobSelect = modal.querySelector(`#${CONFIG.DATA_ATTRIBUTES.JOB_SELECT}`);
        jobSelect.innerHTML = `<option value="">-- Job auswählen --</option>` + 
            jobs.map(job => `<option value="${job.id}">${job.name}</option>`).join("");
        
        modal.classList.add("is-visible");
    }

    // 🛑 Modal schließen
    function closeModal() {
        document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL}]`).classList.remove("is-visible");
    }

    // 🎯 Event Listener
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.INVITE_BUTTON}]`)?.addEventListener("click", fetchAndDisplayUserJobs);
    document.querySelector(`[${CONFIG.DATA_ATTRIBUTES.MODAL_CLOSE}]`)?.addEventListener("click", closeModal);

    // 🌟 Initialisierung
    window.addEventListener("DOMContentLoaded", () => {
        console.log("Invite-Feature geladen.");
    });
})();
