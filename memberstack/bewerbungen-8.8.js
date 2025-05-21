// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Ensure your worker URL is correct
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15; // This was currentApplicantPageSize in Script 1
const MAX_VISIBLE_PAGES_MJ = 5; // From Script 1 for pagination controls

let currentPage = 1;
let allJobResults = []; // This will store all fetched job applications
let currentWebflowMemberId = null;
let activeSortCriteria = null;
let currentSearchTerm = "";

// 🛠️ Hilfsfunktionen (mostly unchanged from Script 2)
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${memberId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) throw new Error(`API-Fehler: ${response.status} - ${await response.text()}`);
        return await response.json();
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
            console.error(`API-Fehler beim Abrufen von Job ${jobId}: ${response.status} - ${await response.text()}`);
            return { id: jobId, error: true, status: response.status, message: `API Error for job ${jobId}` };
        }
        const jobData = await response.json();
        return jobData?.fieldData ? { ...jobData.fieldData, id: jobData.id, slug: jobData.fieldData.slug || jobData.slug } : { id: jobId, error: true, message: `No fieldData for job ${jobId}`}; // Ensure slug is captured if nested
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Job-Daten für ${jobId}: ${error.message}`);
        return { id: jobId, error: true, status: 'network_error', message: `Network error for job ${jobId}: ${error.message}` };
    }
}

function calculateDeadlineCountdown(endDate) {
    if (!endDate) return "N/A";
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

function getApplicationStatusForFilter(jobData, memberId) {
    if (!jobData || jobData.error) return "Ausstehend";
    const bookedCreators = jobData["booked-creators"] || [];
    const rejectedCreators = jobData["rejected-creators"] || [];
    const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
    const now = new Date();
    if (memberId && bookedCreators.includes(memberId)) return "Angenommen";
    if (memberId && (rejectedCreators.includes(memberId) || (endDateApp && endDateApp < now && !bookedCreators.includes(memberId)))) return "Abgelehnt";
    return "Ausstehend";
}

// 💀 Skeleton Loader rendern (unchanged)
function renderSkeletonLoader(container, count) {
    container.innerHTML = "";
    const fieldSkeletons = [
        { type: "text", classModifier: "skeleton-text-short" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "tag" }, { type: "tag" }
    ];
    for (let i = 0; i < count; i++) {
        const jobDiv = document.createElement("div");
        jobDiv.classList.add("db-table-row", "db-table-bewerbungen", "skeleton-row");
        const jobInfoDiv = document.createElement("div");
        jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");
        const skeletonImage = document.createElement("div");
        skeletonImage.classList.add("db-table-img", "is-margin-right-12", "skeleton-element", "skeleton-image");
        jobInfoDiv.appendChild(skeletonImage);
        const skeletonName = document.createElement("div");
        skeletonName.classList.add("truncate", "job-title", "skeleton-element", "skeleton-text", "skeleton-text-title");
        jobInfoDiv.appendChild(skeletonName);
        jobDiv.appendChild(jobInfoDiv);
        fieldSkeletons.forEach(skelType => {
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("db-table-row-item");
            if (skelType.type === "tag") {
                const skeletonTag = document.createElement("div");
                skeletonTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
                fieldDiv.appendChild(skeletonTag);
            } else {
                const skeletonFieldText = document.createElement("div");
                skeletonFieldText.classList.add("db-job-tag-txt", "skeleton-element", "skeleton-text", skelType.classModifier || "");
                fieldDiv.appendChild(skeletonFieldText);
            }
            jobDiv.appendChild(fieldDiv);
        });
        container.appendChild(jobDiv);
    }
}

// 📄 NEU: Pagination Controls rendern (adaptiert von Script 1)
function renderPaginationControls(paginationContainerElement, currentPageNum, totalPagesNum) {
    if (!paginationContainerElement) {
        console.warn("Pagination container not found.");
        return;
    }
    paginationContainerElement.innerHTML = ''; // Clear existing controls
    paginationContainerElement.style.display = totalPagesNum <= 1 ? "none" : "flex";

    if (totalPagesNum <= 1) {
        return;
    }

    // Helper function to handle page change
    async function handlePageChange(newPage) {
        // Optional: Add visual feedback for loading
        const buttons = paginationContainerElement.querySelectorAll('.db-pagination-count');
        buttons.forEach(btn => btn.classList.add('disabled-loading'));
        
        currentPage = newPage;
        renderJobs(allJobResults, currentWebflowMemberId); // renderJobs uses global currentPage

        // Optional: Remove visual feedback after loading (though renderJobs will rebuild pagination)
        // buttons.forEach(btn => btn.classList.remove('disabled-loading'));
    }

    // Previous Button
    const prevButton = document.createElement("a");
    prevButton.href = "#";
    prevButton.classList.add("db-pagination-count", "button-prev");
    prevButton.textContent = "Zurück";
    if (currentPageNum === 1) {
        prevButton.classList.add("disabled");
    } else {
        prevButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (prevButton.classList.contains("disabled") || prevButton.classList.contains("disabled-loading")) return;
            prevButton.textContent = "Lade...";
            await handlePageChange(currentPageNum - 1);
        });
    }
    paginationContainerElement.appendChild(prevButton);

    // Page Number Links
    let startPage, endPage;
    if (totalPagesNum <= MAX_VISIBLE_PAGES_MJ) {
        startPage = 1;
        endPage = totalPagesNum;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(MAX_VISIBLE_PAGES_MJ / 2);
        const maxPagesAfterCurrentPage = Math.ceil(MAX_VISIBLE_PAGES_MJ / 2) - 1;
        if (currentPageNum <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES_MJ;
        } else if (currentPageNum + maxPagesAfterCurrentPage >= totalPagesNum) {
            startPage = totalPagesNum - MAX_VISIBLE_PAGES_MJ + 1;
            endPage = totalPagesNum;
        } else {
            startPage = currentPageNum - maxPagesBeforeCurrentPage;
            endPage = currentPageNum + maxPagesAfterCurrentPage;
        }
    }

    if (startPage > 1) {
        const firstPageLink = document.createElement("a");
        firstPageLink.href = "#";
        firstPageLink.classList.add("db-pagination-count");
        firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (firstPageLink.classList.contains("disabled-loading") || currentPageNum === 1) return;
            document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            firstPageLink.textContent = "...";
            await handlePageChange(1);
        });
        paginationContainerElement.appendChild(firstPageLink);
        if (startPage > 2) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationContainerElement.appendChild(ellipsisSpan);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement("a");
        pageLink.href = "#";
        pageLink.classList.add("db-pagination-count");
        pageLink.textContent = i;
        if (i === currentPageNum) {
            pageLink.classList.add("current");
        } else {
            pageLink.addEventListener("click", async (e) => {
                e.preventDefault();
                if (pageLink.classList.contains("disabled-loading")) return;
                document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
                pageLink.textContent = "...";
                await handlePageChange(i);
            });
        }
        paginationContainerElement.appendChild(pageLink);
    }

    if (endPage < totalPagesNum) {
        if (endPage < totalPagesNum - 1) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationContainerElement.appendChild(ellipsisSpan);
        }
        const lastPageLink = document.createElement("a");
        lastPageLink.href = "#";
        lastPageLink.classList.add("db-pagination-count");
        lastPageLink.textContent = totalPagesNum;
        lastPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (lastPageLink.classList.contains("disabled-loading") || currentPageNum === totalPagesNum) return;
            document.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            lastPageLink.textContent = "...";
            await handlePageChange(totalPagesNum);
        });
        paginationContainerElement.appendChild(lastPageLink);
    }

    // Next Button
    const nextButton = document.createElement("a");
    nextButton.href = "#";
    nextButton.classList.add("db-pagination-count", "button-next");
    nextButton.textContent = "Weiter";
    if (currentPageNum === totalPagesNum) {
        nextButton.classList.add("disabled");
    } else {
        nextButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (nextButton.classList.contains("disabled") || nextButton.classList.contains("disabled-loading")) return;
            nextButton.textContent = "Lade...";
            await handlePageChange(currentPageNum + 1);
        });
    }
    paginationContainerElement.appendChild(nextButton);
}


// 🖨️ Jobs rendern (MODIFIZIERT für Pagination)
function renderJobs(jobsToProcess, webflowMemberId) {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) {
        console.error("❌ Element 'application-list' nicht gefunden.");
        return;
    }
    appContainer.innerHTML = ""; // Clear previous items for the new page

    // Filterlogik
    const showJobActiveFilter = document.getElementById("job-status-active-filter")?.checked;
    const showJobClosedFilter = document.getElementById("job-status-closed-filter")?.checked;
    const showAppPendingFilter = document.getElementById("application-status-pending-filter")?.checked;
    const showAppAcceptedFilter = document.getElementById("application-status-accepted-filter")?.checked;
    const showAppRejectedFilter = document.getElementById("application-status-rejected-filter")?.checked;
    const searchTermNormalized = currentSearchTerm.toLowerCase().trim();

    let filteredJobs = jobsToProcess.filter(({ jobData }) => {
        if (!jobData || jobData.error) return false; // Skip jobs with errors or no data

        if (searchTermNormalized) {
            const jobName = (jobData["name"] || "").toLowerCase();
            if (!jobName.includes(searchTermNormalized)) return false;
        }

        const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
        const now = new Date();
        const isJobCurrentlyActive = jobEndDate && jobEndDate >= now;
        let jobStatusPasses = (!showJobActiveFilter && !showJobClosedFilter) || (showJobActiveFilter && showJobClosedFilter) ||
            (showJobActiveFilter && isJobCurrentlyActive) || (showJobClosedFilter && !isJobCurrentlyActive);
        if (!jobEndDate && (showJobActiveFilter || showJobClosedFilter)) {
            if (showJobActiveFilter && !showJobClosedFilter) jobStatusPasses = false;
            else if (showJobClosedFilter && !showJobActiveFilter) jobStatusPasses = true;
        }
        if (!jobStatusPasses) return false;

        const currentApplicationStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
        let applicationStatusPasses = (!showAppPendingFilter && !showAppAcceptedFilter && !showAppRejectedFilter) ||
            (showAppPendingFilter && currentApplicationStatus === "Ausstehend") ||
            (showAppAcceptedFilter && currentApplicationStatus === "Angenommen") ||
            (showAppRejectedFilter && currentApplicationStatus === "Abgelehnt");
        return applicationStatusPasses;
    });

    // Sortierlogik
    let sortedJobs = [...filteredJobs];
    if (activeSortCriteria && activeSortCriteria.key) {
        sortedJobs.sort((a, b) => {
            const jobDataA = a.jobData;
            const jobDataB = b.jobData;
            if (!jobDataA || jobDataA.error || !jobDataB || jobDataB.error) return 0;
            let valA, valB;
            switch (activeSortCriteria.key) {
                case 'deadline':
                    valA = jobDataA['job-date-end'] ? new Date(jobDataA['job-date-end']) : new Date(0);
                    valB = jobDataB['job-date-end'] ? new Date(jobDataB['job-date-end']) : new Date(0);
                    if (valA.getTime() === 0) valA = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'content':
                    valA = jobDataA['fertigstellung-content'] ? new Date(jobDataA['fertigstellung-content']) : new Date(0);
                    valB = jobDataB['fertigstellung-content'] ? new Date(jobDataB['fertigstellung-content']) : new Date(0);
                    if (valA.getTime() === 0) valA = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = activeSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'budget':
                    valA = parseFloat(String(jobDataA['job-payment']).replace(/[^0-9.-]+/g, ""));
                    valB = parseFloat(String(jobDataB['job-payment']).replace(/[^0-9.-]+/g, ""));
                    if (isNaN(valA)) valA = activeSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    if (isNaN(valB)) valB = activeSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    break;
                default: return 0;
            }
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return activeSortCriteria.direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE);
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = sortedJobs.slice(startIndex, endIndex);

    if (jobsToShowOnPage.length === 0) {
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = "ℹ️ Keine Jobs entsprechen den aktuellen Filter-, Such- und Sortierkriterien für diese Seite.";
        noJobsMessage.classList.add('job-entry', 'visible');
        appContainer.appendChild(noJobsMessage);
    } else {
        const fragment = document.createDocumentFragment();
        jobsToShowOnPage.forEach(({ jobData }) => { // jobData comes from the structure { appId, jobData }
            if (!jobData || jobData.error) {
                 console.warn("Skipping job due to error or no data:", jobData);
                 return; // Skip rendering if jobData is problematic
            }
            const jobLink = document.createElement("a");
            // Use jobData.slug (which we ensured is top-level during fetchJobData)
            jobLink.href = `https://www.creatorjobs.com/creator-job/${jobData.slug || jobData.id || ''}`;
            jobLink.target = "_blank";
            jobLink.style.textDecoration = "none";
            jobLink.classList.add("job-listing-link", "job-entry");

            const jobDiv = document.createElement("div");
            jobDiv.classList.add("db-table-row", "db-table-bewerbungen");

            const jobInfoDiv = document.createElement("div");
            jobInfoDiv.classList.add("db-table-row-item", "justify-left", "job-info-container");
            const jobImage = document.createElement("img");
            jobImage.classList.add("db-table-img", "is-margin-right-12");
            jobImage.src = jobData["job-image"]?.url || jobData["job-image"] || "https://via.placeholder.com/80x80?text=Job";
            jobImage.alt = jobData["name"] || "Job Bild";
            jobInfoDiv.appendChild(jobImage);
            const jobName = document.createElement("span");
            jobName.classList.add("truncate", "job-title");
            jobName.textContent = jobData["name"] || "Unbekannter Job";
            jobInfoDiv.appendChild(jobName);
            jobDiv.appendChild(jobInfoDiv);

            const fields = [
                { key: "job-payment", label: "Bezahlung" }, { key: "job-date-end", label: "Bewerbungsfrist" },
                { key: "fertigstellung-content", label: "Contentdeadline" }, { key: "job-status", label: "Job Status" },
                { key: "application-status", label: "Bewerbungsstatus" }
            ];
            fields.forEach(field => {
                const value = jobData[field.key];
                const fieldDiv = document.createElement("div");
                fieldDiv.classList.add("db-table-row-item", `item-${field.key}`);
                const fieldText = document.createElement("span");
                if (field.key === "job-payment") {
                    fieldText.classList.add("db-job-tag-txt");
                    fieldText.textContent = value ? `${value} €` : "N/A";
                } else if (field.key === "job-date-end") {
                    fieldText.classList.add("db-job-tag-txt");
                    fieldText.textContent = calculateDeadlineCountdown(value); // Use helper
                } else if (field.key === "fertigstellung-content") {
                    fieldText.classList.add("db-job-tag-txt");
                    if (value) {
                        const date = new Date(value);
                        fieldText.textContent = !isNaN(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "N/A";
                    } else {
                        fieldText.textContent = "N/A";
                    }
                } else if (field.key === "job-status") {
                    const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                    const now = new Date();
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    if (endDateJob && endDateJob < now) { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Beendet"; }
                    else if (endDateJob) { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Aktiv"; }
                    else { statusDiv.classList.add("is-bg-light-grey"); statusTextInner.textContent = "Unbekannt"; }
                    statusDiv.appendChild(statusTextInner); fieldDiv.appendChild(statusDiv);
                } else if (field.key === "application-status") {
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                    if (appStatus === "Angenommen") { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Angenommen"; }
                    else if (appStatus === "Abgelehnt") { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Abgelehnt"; }
                    else { statusDiv.classList.add("is-bg-light-blue"); statusTextInner.textContent = "Ausstehend"; }
                    statusDiv.appendChild(statusTextInner); fieldDiv.appendChild(statusDiv);
                } else { // Should not happen with defined fields
                    fieldText.classList.add("db-job-tag-txt");
                    fieldText.textContent = value || "Nicht verfügbar";
                }
                if (field.key !== "job-status" && field.key !== "application-status") {
                    if (fieldText.textContent || fieldText.classList.contains("db-job-tag-txt")) { fieldDiv.appendChild(fieldText); }
                }
                jobDiv.appendChild(fieldDiv);
            });
            jobLink.appendChild(jobDiv);
            fragment.appendChild(jobLink);
        });
        appContainer.appendChild(fragment);
        requestAnimationFrame(() => {
            const newEntries = appContainer.querySelectorAll('.job-entry:not(.visible)');
            newEntries.forEach(entry => entry.classList.add('visible'));
        });
    }

    // Render pagination controls
    // Ensure you have a div with id="pagination-controls-container" in your HTML
    const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
    renderPaginationControls(paginationContainer, currentPage, totalPages);
}

// Helper to create pagination container if it doesn't exist (optional, better to have it in HTML)
function createPaginationContainer() {
    let container = document.getElementById("pagination-controls-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "pagination-controls-container";
        container.className = "db-table-pagination"; // Add class for styling
        // Try to append it after the application list or at a sensible place
        const appList = document.getElementById("application-list");
        if (appList && appList.parentNode) {
            appList.parentNode.insertBefore(container, appList.nextSibling);
        } else {
            document.body.appendChild(container); // Fallback
        }
    }
    return container;
}


// Initialisierungsfunktion
async function initializeUserApplications() {
    const appContainer = document.getElementById("application-list");
    if (!appContainer) { console.error("FEHLER: App-Container 'application-list' nicht im DOM gefunden."); return; }
    renderSkeletonLoader(appContainer, JOBS_PER_PAGE);

    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
            if (!currentWebflowMemberId) console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
        } else { console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar."); }

        let applications = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];
        }

        if (applications.length > 0) {
            const jobPromises = applications.map(appId => fetchJobData(appId).then(jobDataResponse => ({ appId, jobData: jobDataResponse })));
            allJobResults = await Promise.all(jobPromises);
            // Filter out jobs that had errors during fetch or have no actual data
            allJobResults = allJobResults.filter(job => job.jobData && !job.jobData.error && Object.keys(job.jobData).length > 2); // Check for more than just id/error keys
            
            currentPage = 1;
            renderJobs(allJobResults, currentWebflowMemberId);
        } else {
            appContainer.innerHTML = "";
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.";
            noJobsMessage.classList.add('job-entry', 'visible');
            appContainer.appendChild(noJobsMessage);
            const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
            paginationContainer.innerHTML = ""; // Clear pagination if no jobs
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        appContainer.innerHTML = "";
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = `❌ Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.`;
        errorMessage.classList.add('job-entry', 'visible');
        appContainer.appendChild(errorMessage);
    }
}

// Event Listener für Filter, Sortierung UND Suche
function setupEventListeners() {
    const filterCheckboxIds = [
        "job-status-active-filter", "job-status-closed-filter",
        "application-status-pending-filter", "application-status-accepted-filter", "application-status-rejected-filter"
    ];

    const sortCheckboxDefinitions = [
        { id: "job-sort-deadline-asc", key: "deadline", direction: "asc" },
        { id: "job-sort-deadline-desc", key: "deadline", direction: "desc" },
        { id: "job-sort-content-asc", key: "content", direction: "asc" },
        { id: "job-sort-content-desc", key: "content", direction: "desc" },
        { id: "job-sort-budget-asc", key: "budget", direction: "asc" },
        { id: "job-sort-budget-desc", key: "budget", direction: "desc" }
    ];

    const searchInput = document.getElementById("filter-search");

    const allFilterCheckboxes = filterCheckboxIds.map(id => document.getElementById(id)).filter(cb => cb !== null);
    const allSortCheckboxes = sortCheckboxDefinitions.map(def => {
        const cb = document.getElementById(def.id);
        if (cb) {
            cb.dataset.sortKey = def.key;
            cb.dataset.sortDirection = def.direction;
        }
        return cb;
    }).filter(cb => cb !== null);

    function handleInteraction() {
        currentPage = 1; // Reset to first page on filter/sort/search change
        renderJobs(allJobResults, currentWebflowMemberId);
    }

    allFilterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", handleInteraction);
    });

    allSortCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const targetCheckbox = event.target;
            if (targetCheckbox.checked) {
                activeSortCriteria = {
                    key: targetCheckbox.dataset.sortKey,
                    direction: targetCheckbox.dataset.sortDirection
                };
                allSortCheckboxes.forEach(otherCb => {
                    if (otherCb !== targetCheckbox) {
                        otherCb.checked = false;
                    }
                });
            } else {
                // If unchecking the currently active sort, clear it
                if (activeSortCriteria &&
                    activeSortCriteria.key === targetCheckbox.dataset.sortKey &&
                    activeSortCriteria.direction === targetCheckbox.dataset.sortDirection) {
                    activeSortCriteria = null;
                }
            }
            handleInteraction();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            currentSearchTerm = event.target.value;
            handleInteraction();
        });
    } else {
        console.warn("⚠️ Suchfeld 'filter-search' nicht im DOM gefunden.");
    }

    filterCheckboxIds.forEach(id => {
        if (!document.getElementById(id)) console.warn(`⚠️ Filter-Checkbox '${id}' nicht im DOM gefunden.`);
    });
    sortCheckboxDefinitions.forEach(def => {
        if (!document.getElementById(def.id)) console.warn(`⚠️ Sortier-Checkbox '${def.id}' nicht im DOM gefunden.`);
    });
}

// Start der Anwendung
window.addEventListener("DOMContentLoaded", () => {
    initializeUserApplications();
    setupEventListeners();
    // Ensure pagination container exists or is created
    createPaginationContainer();
});
