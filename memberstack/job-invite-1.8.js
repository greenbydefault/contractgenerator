// 🌐 Optimierte Webflow API Integration für gefilterte Job-Ausgabe des aktuellen Users mit Invite-Modal

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const BATCH_SIZE = 100; // Anzahl gleichzeitiger API-Anfragen
const RATE_LIMIT_DELAY = 500; // Wartezeit zwischen den Anfragen in Millisekunden
const WEBHOOK_URL = "https://your-zapier-webhook-url.com"; // Hier später die richtige Webhook-URL einfügen

// 🛠️ Hilfsfunktion für Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📥 Jobs des eingeloggten Nutzers abrufen
async function fetchUserJobs(memberId) {
    let apiUrl = `${API_BASE_URL}/${USER_COLLECTION_ID}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        console.log(`🔄 Abruf der Jobs für User: ${memberId}`);
        const response = await fetch(workerUrl);

        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.status}`);
        }

        const userData = await response.json();
        return userData?.fieldData?.["posted-jobs"] || [];
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Jobs: ${error.message}`);
        return [];
    }
}

// 📥 Job-Details abrufen
async function fetchJobDetails(jobId) {
    let apiUrl = `${API_BASE_URL}/${JOB_COLLECTION_ID}/items/${jobId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.status}`);
        }
        const jobData = await response.json();
        return jobData?.fieldData || {};
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Details: ${error.message}`);
        return {};
    }
}

// 🔍 Jobs des eingeloggten Nutzers abrufen und anzeigen
async function fetchAndDisplayUserJobs() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const memberId = member?.data?.customFields?.['webflow-member-id'];

        if (!memberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        const jobIds = await fetchUserJobs(memberId);
        const jobs = (await Promise.all(jobIds.map(fetchJobDetails)))
            .filter(job => new Date(job["job-date-end"]) > new Date()); // Nur aktive Jobs

        console.log(`🎛️ Gefundene aktive Jobs: ${jobs.length}`);
        renderInviteModal(jobs);
    } catch (error) {
        console.error("❌ Fehler beim Laden der Jobs:", error);
    }
}

// 📩 Einladung senden (Webhook an Zapier)
function sendInvite() {
    const creatorProfile = document.getElementById("creator-profile");
    
    const userName = creatorProfile.getAttribute("data-user-name");
    const userEmail = creatorProfile.getAttribute("data-user-email");
    const memberstackId = creatorProfile.getAttribute("data-memberstack-id");
    const selectedJobId = document.getElementById("job-select").value;

    
    
    if (!selectedJobId) {
        alert("Bitte einen Job auswählen.");
        return;
    }
    
    const userData = {
        userName,
        userEmail,
        memberstackId,
        jobId: selectedJobId
    };

    fetch(WEBHOOK_URL, {
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

// 📜 Modal für Job-Auswahl erstellen
function renderInviteModal(jobs) {
    let modal = document.createElement("div");
    modal.id = "invite-modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "white";
    modal.style.padding = "20px";
    modal.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    modal.style.zIndex = "1000";

    modal.innerHTML = `
        <h2>Wähle einen Job aus</h2>
        <p id="error-message" style="color: red; display: none;">❌ Fehler: Creator-Informationen fehlen. Eine Einladung ist nicht möglich.</p>
        <select id="job-select">
            <option value="">-- Job auswählen --</option>
            ${jobs.map(job => `<option value="${job.id}">${job.name}</option>`).join("")}
        </select>
        <button onclick="sendInvite()">Einladung senden</button>
        <button onclick="closeModal()">Abbrechen</button>
    `;

    document.body.appendChild(modal);
}

// 🛑 Modal schließen
function closeModal() {
    const modal = document.getElementById("invite-modal");
    if (modal) {
        modal.remove();
    }
}

// 🎯 Event Listener für den Invite-Button
document.getElementById("invite-button")?.addEventListener("click", fetchAndDisplayUserJobs);

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", () => {
    console.log("Invite-Feature geladen.");
});
