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

// Funktion zur Berechnung des Countdown bis zur Deadline
function calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "Abgelaufen";

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Endet in ${days} Tag(en)`;
    if (hours > 0) return `Endet in ${hours} Stunde(n)`;
    return `Endet in ${minutes} Minute(n)`;
}

// Hilfsfunktionen
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
        console.error(`Fehler beim Abrufen der Collection: ${error.message}`);
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
        console.error(`Fehler beim Abrufen der Job-Daten: ${error.message}`);
        return {};
    }
}

// Sortierfunktion nach Bewerbungsfrist
function sortByDeadline(jobs) {
    return jobs.sort((a, b) => {
        const dateA = new Date(a.jobData["job-date-end"]);
        const dateB = new Date(b.jobData["job-date-end"]);
        return dateA - dateB;
    });
}

// Joblisten nach Status
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

// Jobs rendern
function renderJobs(jobs, containerId, currentPage) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShow = jobs.slice(startIndex, endIndex);

    jobsToShow.forEach(({ jobData }) => {
        if (!jobData) return;

        const jobDiv = document.createElement("a");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");
        jobDiv.href = `https://www.creatorjobs.com/creator-job/${jobData.slug}`;
        jobDiv.target = "_blank";
        jobDiv.style.textDecoration = "none";

        const fields = [
            { key: "job-image", type: "image", class: "db-table-row-item" },
            { key: "name", class: "db-table-row-item truncate" },
            { key: "job-payment", class: "db-table-row-item", prefix: "€" },
            { key: "job-date-end", class: "db-table-row-item", transform: calculateDeadlineCountdown },
            { key: "fertigstellung-content", class: "db-table-row-item", transform: (date) => new Date(date).toLocaleDateString() || "Nicht verfügbar" }
        ];

        fields.forEach(field => {
            const value = jobData[field.key] || "Nicht verfügbar";
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add(field.class);

            if (field.type === "image") {
                const img = document.createElement("img");
                img.src = value || "https://via.placeholder.com/100";
                img.alt = jobData["name"] || "Job Bild";
                img.style.maxWidth = "100px";
                fieldDiv.appendChild(img);
            } else {
                fieldDiv.textContent = field.prefix ? `${value} ${field.prefix}` : (field.transform ? field.transform(value) : value);
            }

            jobDiv.appendChild(fieldDiv);
        });

        // Job-Status
        const jobStatusDiv = document.createElement("div");
        jobStatusDiv.classList.add("db-table-row-item");
        const jobStatusTag = document.createElement("div");
        jobStatusTag.classList.add("job-tag", new Date(jobData["job-date-end"]) < new Date() ? "is-bg-light-red" : "is-bg-light-green");
        const jobStatusText = document.createElement("span");
        jobStatusText.classList.add("db-job-tag-txt");
        jobStatusText.textContent = new Date(jobData["job-date-end"]) < new Date() ? "Beendet" : "Aktiv";
        jobStatusTag.appendChild(jobStatusText);
        jobStatusDiv.appendChild(jobStatusTag);
        jobDiv.appendChild(jobStatusDiv);

        // Bewerbungsstatus
        const applicationStatusDiv = document.createElement("div");
        applicationStatusDiv.classList.add("db-table-row-item");
        const appStatusTag = document.createElement("div");
        const appStatusText = document.createElement("span");
        appStatusTag.classList.add("job-tag");
        appStatusText.classList.add("db-job-tag-txt");

        if (jobData["booked-creators"]?.includes(currentWebflowMemberId)) {
            appStatusTag.classList.add("is-bg-light-green");
            appStatusText.textContent = "Angenommen";
        } else if (jobData["rejected-creators"]?.includes(currentWebflowMemberId) || new Date(jobData["job-date-end"]) < new Date()) {
            appStatusTag.classList.add("is-bg-light-red");
            appStatusText.textContent = "Abgelehnt";
        } else {
            appStatusTag.classList.add("is-bg-light-blue");
            appStatusText.textContent = "Ausstehend";
        }

        appStatusTag.appendChild(appStatusText);
        applicationStatusDiv.appendChild(appStatusTag);
        jobDiv.appendChild(applicationStatusDiv);

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

// Hauptfunktion
async function displayUserApplications() {
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId) {
            console.error("Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            return;
        }

        const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
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
            document.getElementById("application-list").innerHTML = "<p>Keine abgeschlossenen Bewerbungen gefunden.</p>";
        }
    } catch (error) {
        console.error("Fehler beim Laden der Bewerbungen:", error);
    }
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", displayUserApplications);
