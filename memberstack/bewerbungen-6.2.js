// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15;

let currentPage = 1;
let allJobResults = [];

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

// ⏳ Countdown-Berechnung
function calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "⏳ Abgelaufen";

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Endet in ${days} Tag(en)`;
    if (hours > 0) return `Endet in ${hours} Stunde(n)`;
    return `Endet in ${minutes} Minute(n)`;
}

// 🖨️ Jobs rendern
function renderJobs(jobs) {
    const appContainer = document.getElementById("application-list");
    appContainer.innerHTML = "";

    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShow = jobs.slice(0, endIndex);

    jobsToShow.forEach(({ jobData }, index) => {
        if (!jobData) return;

        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
        if (index === 0) jobDiv.classList.add("justify-left");

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

        // Weitere Felder
        const fields = [
            { key: "job-payment", label: "Bezahlung" },
            { key: "job-date-end", label: "Bewerbungsfrist" },
            { key: "fertigstellung-content", label: "Contentdeadline" },
            { key: "job-status", label: "Job Status" },
            { key: "application-status", label: "Bewerbungsstatus" }
        ];

        fields.forEach(field => {
            const value = jobData[field.key] || "Nicht verfügbar";
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item");

            const fieldText = document.createElement("span");
            fieldText.classList.add("db-job-tag-txt");

            if (field.key === "job-payment" && value !== "Nicht verfügbar") {
                fieldText.textContent = `${value} €`;
            } else if (field.key === "job-date-end" && value !== "Nicht verfügbar") {
                fieldText.textContent = calculateDeadlineCountdown(value);
            } else if (field.key === "fertigstellung-content" && value !== "Nicht verfügbar") {
                const date = new Date(value);
                fieldText.textContent = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
            } else if (field.key === "job-status") {
                const endDate = new Date(jobData["job-date-end"]);
                const now = new Date();
                const statusDiv = document.createElement("div");
                const statusText = document.createElement("span");
                statusText.classList.add("db-job-tag-txt");

                if (endDate < now) {
                    statusDiv.classList.add("job-tag", "is-bg-light-red");
                    statusText.textContent = "Beendet";
                } else {
                    statusDiv.classList.add("job-tag", "is-bg-light-green");
                    statusText.textContent = "Aktiv";
                }
                statusDiv.appendChild(statusText);
                fieldDiv.appendChild(statusDiv);
            } else if (field.key === "application-status") {
                const webflowMemberId = jobData['webflow-member-id'];
                const bookedCreators = jobData["booked-creators"] || [];
                const rejectedCreators = jobData["rejected-creators"] || [];
                const endDate = new Date(jobData["job-date-end"]);
                const now = new Date();
                const statusDiv = document.createElement("div");
                const statusText = document.createElement("span");
                statusText.classList.add("db-job-tag-txt");

                if (webflowMemberId && bookedCreators.includes(webflowMemberId)) {
                    statusDiv.classList.add("job-tag", "is-bg-light-green");
                    statusText.textContent = "Angenommen";
                } else if (rejectedCreators.includes(webflowMemberId) || endDate < now) {
                    statusDiv.classList.add("job-tag", "is-bg-light-red");
                    statusText.textContent = "Abgelehnt";
                } else {
                    statusDiv.classList.add("job-tag", "is-bg-light-blue");
                    statusText.textContent = "Ausstehend";
                }

                statusDiv.appendChild(statusText);
                fieldDiv.appendChild(statusDiv);
            } else {
                fieldText.textContent = value;
            }

            fieldDiv.appendChild(fieldText);
            jobDiv.appendChild(fieldDiv);
        });

        appContainer.appendChild(jobDiv);
    });

    // Load More Button
    const loadMoreContainer = document.getElementById("load-more-container");
    loadMoreContainer.innerHTML = "";

    if (endIndex < jobs.length) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn");
        loadMoreButton.addEventListener("click", () => {
            currentPage++;
            renderJobs(allJobResults);
        });
        loadMoreContainer.appendChild(loadMoreButton);
    }
}

// Beispiel-Aufruf der Funktion
async function displayUserApplications() {
    const collectionId = USER_COLLECTION_ID;

    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const webflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!webflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        const userData = await fetchCollectionItem(collectionId, webflowMemberId);
        const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];

        if (applications.length > 0) {
            const jobPromises = applications.map(async (appId) => {
                const jobData = await fetchJobData(appId);
                return { appId, jobData };
            });

            allJobResults = await Promise.all(jobPromises);
            renderJobs(allJobResults);
        } else {
            appContainer.innerHTML = "<p>🚫 Keine abgeschlossenen Bewerbungen gefunden.</p>";
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden der Bewerbungen:", error);
    }
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserApplications);
