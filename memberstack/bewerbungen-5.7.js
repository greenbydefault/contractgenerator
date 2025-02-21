// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15;

let currentPage = 1;
let allJobResults = [];
const cache = new Map();

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

function showLoadingSpinner() {
    const appContainer = document.getElementById("application-list");
    appContainer.innerHTML = '<div id="loading-spinner" style="text-align: center; padding: 20px;"><span class="spinner"></span> Lade Bewerbungen...</div>';
}

function hideLoadingSpinner() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) spinner.remove();
}

async function fetchWithCache(url, context = "") {
    if (cache.has(url)) {
        console.log(`📦 Cache-Treffer für: ${context}`);
        return cache.get(url);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        cache.set(url, data);
        return data;
    } catch (error) {
        console.error(`❌ Fehler in ${context}: ${error.message}`);
        throw error;
    }
}

// 📥 API-Aufrufe
async function fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    return fetchWithCache(workerUrl, "fetchCollectionItem");
}

async function fetchJobData(jobId) {
    const apiUrl = `${API_BASE_URL}/${JOB_COLLECTION_ID}/items/${jobId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    const jobData = await fetchWithCache(workerUrl, `fetchJobData (${jobId})`);
    return jobData.fieldData || {};
}

// ⏳ Countdown-Berechnung
function calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "⏳ Abgelaufen";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

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

    jobsToShow.forEach(({ jobData }) => {
        const jobLink = document.createElement("a");
        jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug}`;
        jobLink.target = "_blank";
        jobLink.classList.add("job-link-wrapper");
        jobLink.style.textDecoration = "none";

        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

        // 🖼️ Bild und Name
        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left");

        const jobImage = document.createElement("img");
        jobImage.classList.add("db-table-img", "is-margin-right-12");
        jobImage.src = jobData["job-image"] || "https://via.placeholder.com/100";
        jobImage.alt = jobData["name"] || "Job Bild";
        jobImage.style.maxWidth = "100px";
        jobInfoDiv.appendChild(jobImage);

        const jobName = document.createElement("span");
        jobName.classList.add("truncate");
        jobName.textContent = jobData["name"] || "Unbekannter Job";
        jobInfoDiv.appendChild(jobName);

        jobDiv.appendChild(jobInfoDiv);

        // 📊 Weitere Felder
        const fields = [
            { key: "job-payment", label: "Bezahlung", format: (val) => `${val} €` },
            { key: "job-date-end", label: "Bewerbungsfrist", format: calculateDeadlineCountdown },
            { key: "fertigstellung-content", label: "Content-Deadline", format: (val) => new Date(val).toLocaleDateString() },
            { key: "job-status", label: "Job-Status", format: () => jobData["job-date-end"] ? "Aktiv" : "Beendet" },
            { key: "application-status", label: "Bewerbungsstatus", format: () => getApplicationStatus(jobData) }
        ];

        fields.forEach(({ key, format }) => {
            const value = jobData[key] || "Nicht verfügbar";
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item");

            const fieldText = document.createElement("span");
            fieldText.classList.add("is-txt-16");
            fieldText.textContent = format(value);

            if (key === "application-status") {
                const statusDiv = document.createElement("div");
                statusDiv.classList.add("job-tag");
                if (value === "Angenommen") {
                    statusDiv.classList.add("is-bg-light-green");
                } else if (value === "Abgelehnt") {
                    statusDiv.classList.add("is-bg-light-red");
                } else {
                    statusDiv.classList.add("is-bg-light-blue");
                }
                statusDiv.appendChild(fieldText);
                fieldDiv.appendChild(statusDiv);
            } else {
                fieldDiv.appendChild(fieldText);
            }

            jobDiv.appendChild(fieldDiv);
        });

        jobLink.appendChild(jobDiv);
        appContainer.appendChild(jobLink);
    });

    renderLoadMoreButton(jobs.length > endIndex);
}

function getApplicationStatus(jobData) {
    const status = jobData["application-status"] || "Ausstehend";
    return status;
}

// 🔄 Load More Button
function renderLoadMoreButton(hasMore) {
    const loadMoreContainer = document.getElementById("load-more-container");
    loadMoreContainer.innerHTML = "";

    if (hasMore) {
        const loadMoreButton = document.createElement("button");
        loadMoreButton.textContent = "Mehr laden";
        loadMoreButton.classList.add("load-more-btn");
        loadMoreButton.addEventListener("click", debounce(() => {
            currentPage++;
            renderJobs(allJobResults);
        }, 300));
        loadMoreContainer.appendChild(loadMoreButton);
    }
}

// 🚀 Hauptfunktion
async function displayUserApplications() {
    showLoadingSpinner();
    try {
        const member = await window.$memberstackDom.getCurrentMember();
        const webflowMemberId = member?.data?.customFields?.['webflow-member-id'];

        if (!webflowMemberId) throw new Error("Kein 'webflow-member-id' gefunden.");
        console.log(`👤 Webflow Member-ID: ${webflowMemberId}`);

        const userData = await fetchCollectionItem(USER_COLLECTION_ID, webflowMemberId);
        const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];

        allJobResults = await Promise.all(applications.map(async (appId) => {
            const jobData = await fetchJobData(appId);
            return { appId, jobData };
        }));

        hideLoadingSpinner();
        renderJobs(allJobResults);
    } catch (error) {
        console.error("❌ Fehler beim Laden der Bewerbungen:", error);
        document.getElementById("application-list").innerHTML = "🚫 Keine abgeschlossenen Bewerbungen gefunden.";
        hideLoadingSpinner();
    }
}

// 📅 Event Listener
window.addEventListener("DOMContentLoaded", displayUserApplications);

// 🕰️ Debouncing
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}
