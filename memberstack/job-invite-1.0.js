// 🌐 Optimierte Webflow API Integration für gefilterte Job-Ausgabe des aktuellen Users

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const BATCH_SIZE = 100; // Anzahl gleichzeitiger API-Anfragen
const RATE_LIMIT_DELAY = 500; // Wartezeit zwischen den Anfragen in Millisekunden

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
        const jobs = await Promise.all(jobIds.map(fetchJobDetails));

        console.log(`🎛️ Gefundene Jobs: ${jobs.length}`);
        renderJobs(jobs);
    } catch (error) {
        console.error("❌ Fehler beim Laden der Jobs:", error);
    }
}

// 🖨️ Jobs anzeigen
function renderJobs(jobs) {
    const container = document.getElementById("user-list");
    container.innerHTML = "";
    let innerList = document.createElement("div");
    innerList.classList.add("w-dyn-list");
    container.appendChild(innerList);
    container.setAttribute("role", "list");
    container.classList.add("w-dyn-list", "w-dyn-items");

    if (jobs.length === 0) {
        container.innerHTML = "<p>Keine Jobs gefunden.</p>";
        return;
    }

    jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-coll-item", "w-dyn-item");
        jobDiv.setAttribute("role", "listitem");

        // Job Details
        const jobRow = document.createElement("div");
        jobRow.classList.add("db-table-row", "db-table-fav");

        jobRow.innerHTML = `
            <div class="db-table-row-item is-txt-16"><strong>Job:</strong> ${job.name || "Unbekannt"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Firma:</strong> ${job["brand-name"] || "Nicht angegeben"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Budget:</strong> ${job["job-payment"] || "Nicht angegeben"}</div>
            <div class="db-table-row-item is-txt-16"><strong>Kategorie:</strong> ${job["industrie-kategorie"] || "Nicht angegeben"}</div>
        `;

        jobDiv.appendChild(jobRow);
        innerList.appendChild(jobDiv);
    });
}

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", fetchAndDisplayUserJobs);
