// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";

let currentWebflowMemberId = null; // 💡 Hier wird die eingeloggte Member-ID gespeichert

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const userItem = await response.json();
        return userItem;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection: ${error.message}`);
        return null;
    }
}

async function fetchJobData(jobId) {
    const apiUrl = `${API_BASE_URL}/${JOB_COLLECTION_ID}/items/${jobId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);

    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const jobData = await response.json();
        return jobData?.fieldData || {};
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Daten: ${error.message}`);
        return {};
    }
}

// 🖨️ Jobs rendern
function renderJobs(jobs, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    jobs.forEach(jobData => {
        if (!jobData) return;

        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left");

        // Bild
        const jobImage = document.createElement("img");
        jobImage.classList.add("db-table-img", "is-margin-right-12");
        jobImage.src = jobData["job-image"] || "https://via.placeholder.com/100";
        jobImage.alt = jobData["name"] || "Job Bild";
        jobImage.style.maxWidth = "100px";
        jobInfoDiv.appendChild(jobImage);

        // Name
        const jobName = document.createElement("span");
        jobName.classList.add("truncate");
        jobName.textContent = jobData["name"] || "Unbekannter Job";
        jobInfoDiv.appendChild(jobName);

        jobDiv.appendChild(jobInfoDiv);

        // Budget
        const jobBudget = document.createElement("div");
        jobBudget.classList.add("db-table-row-item");
        jobBudget.textContent = `Budget: ${jobData["job-payment"] || "Nicht verfügbar"} €`;
        jobDiv.appendChild(jobBudget);

        // Kategorie
        const jobCategory = document.createElement("div");
        jobCategory.classList.add("db-table-row-item");
        jobCategory.textContent = `Kategorie: ${jobData["job-category"] || "Nicht verfügbar"}`;
        jobDiv.appendChild(jobCategory);

        container.appendChild(jobDiv);
    });
}

// 🌟 Hauptfunktion
async function displayUserJobs() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
        const bookedJobIds = userData?.fieldData?.["booked-jobs"] || [];
        const rejectedJobIds = userData?.fieldData?.["rejected-jobs"] || [];

        const bookedJobs = await Promise.all(bookedJobIds.map(fetchJobData));
        const rejectedJobs = await Promise.all(rejectedJobIds.map(fetchJobData));

        renderJobs(bookedJobs, "booked-jobs-list");
        renderJobs(rejectedJobs, "rejected-jobs-list");
    } catch (error) {
        console.error("❌ Fehler beim Laden der Jobs:", error);
    }
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserJobs);
