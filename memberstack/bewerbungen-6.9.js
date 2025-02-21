// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 10;

let currentPageAccepted = 1;
let currentPagePending = 1;
let currentPageRejected = 1;
let allJobResults = [];
let currentWebflowMemberId = null;

// 🕰️ Funktion zur Berechnung des Countdown bis zur Deadline
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

// 🕰️ Sortierfunktion nach Bewerbungsfrist
function sortByDeadline(jobs) {
    return jobs.sort((a, b) => {
        const dateA = new Date(a.jobData["job-date-end"]);
        const dateB = new Date(b.jobData["job-date-end"]);
        return dateA - dateB;
    });
}

// 🔍 Joblisten nach Status
function categorizeJobs(jobs, memberId) {
    const accepted = [];
    const pending = [];
    const rejected = [];

    jobs.forEach(({ jobData }) => {
        const bookedCreators = jobData["booked-creators"] || [];
        const rejectedCreators = jobData["rejected-creators"] || [];
        const endDate = new Date(jobData["job-date-end"]);
        const now = new Date();

        if (bookedCreators.includes(memberId)) {
            accepted.push({ jobData });
        } else if (rejectedCreators.includes(memberId) || endDate < now) {
            rejected.push({ jobData });
        } else {
            pending.push({ jobData });
        }
    });

    return { accepted, pending, rejected };
}

// 🖨️ Jobs rendern
function renderJobs(jobs, containerId, currentPage) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShow = jobs.slice(0, endIndex);

    jobsToShow.forEach(({ jobData }) => {
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

        // Bezahlung
        const jobPayment = document.createElement("div");
        jobPayment.textContent = `💰 ${jobData["job-payment"] || "Nicht verfügbar"} €`;
        jobDiv.appendChild(jobPayment);

        // Bewerbungsfrist
        const jobDeadline = document.createElement("div");
        jobDeadline.textContent = `📅 ${calculateDeadlineCountdown(jobData["job-date-end"] || "")}`;
        jobDiv.appendChild(jobDeadline);

        container.appendChild(jobDiv);
    });

    // Load More Button
    const loadMoreContainer = document.getElementById(`${containerId}-load-more`);
    loadMoreContainer.innerHTML = "";

    if (endIndex < jobs.length) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn");
        loadMoreButton.addEventListener("click", () => {
            if (containerId === "accepted-jobs") currentPageAccepted++;
            if (containerId === "pending-jobs") currentPagePending++;
            if (containerId === "rejected-jobs") currentPageRejected++;

            renderJobs(jobs, containerId, currentPage + 1);
        });
        loadMoreContainer.appendChild(loadMoreButton);
    }
}

// 🌟 Hauptfunktion
async function displayUserApplications() {
    const collectionId = USER_COLLECTION_ID;

    try {
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        console.log(`👤 Aktuelle eingeloggte Webflow Member-ID: ${currentWebflowMemberId}`);

        const userData = await fetchCollectionItem(collectionId, currentWebflowMemberId);
        const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];

        if (applications.length > 0) {
            const jobPromises = applications.map(async (appId) => {
                const jobData = await fetchJobData(appId);
                return { appId, jobData };
            });

            allJobResults = await Promise.all(jobPromises);
            const sortedJobs = sortByDeadline(allJobResults);
            const { accepted, pending, rejected } = categorizeJobs(sortedJobs, currentWebflowMemberId);

            renderJobs(accepted, "accepted-jobs", currentPageAccepted);
            renderJobs(pending, "pending-jobs", currentPagePending);
            renderJobs(rejected, "rejected-jobs", currentPageRejected);
        } else {
            document.getElementById("application-list").innerHTML = "<p>🚫 Keine abgeschlossenen Bewerbungen gefunden.</p>";
        }
    } catch (error) {
        console.error("❌ Fehler beim Laden der Bewerbungen:", error);
    }
}

// 🌟 Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserApplications);
