// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Ensure your worker URL is correct
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15;
const MAX_VISIBLE_PAGES_MJ = 5;
const INITIAL_LOAD_JOB_COUNT = JOBS_PER_PAGE * 2; // Initial 30 jobs targeted for fast load

const CACHE_PREFIX = "jobData_v1_"; // Prefix für Cache-Keys, v1 für Strukturänderungen
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 Minuten Verfallszeit für Jobdetails

let currentPage = 1;
let allJobResults = [];
let currentWebflowMemberId = null;
let isBackgroundLoadingComplete = false;

const TABS_CONFIG = [
    { id: "alle", listContainerId: "application-list-container", listId: "application-list", name: "Alle", filterFn: (jobData, memberId) => true },
    { id: "abgelehnt", listContainerId: "application-list-rejected-container", listId: "application-list-rejected", name: "Abgelehnt", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Abgelehnt" },
    { id: "ausstehend", listContainerId: "application-list-pending-container", listId: "application-list-pending", name: "Ausstehend", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Ausstehend" },
    { id: "favoriten", listContainerId: "application-list-fav-container", listId: "application-list-fav", name: "In Auswahl", filterFn: (jobData, memberId) => jobData && jobData["job-favoriten"] && Array.isArray(jobData["job-favoriten"]) && jobData["job-favoriten"].includes(memberId) }
];
let activeTabId = TABS_CONFIG[0].id;

const FILTER_BASE_IDS = {
    searchClass: "db-table-filter-search",
    searchIdPrefix: "filter-search",
    jobStatusActive: "job-status-active-filter",
    jobStatusClosed: "job-status-closed-filter",
    appStatusPending: "application-status-pending-filter",
    appStatusAccepted: "application-status-accepted-filter",
    appStatusRejected: "application-status-rejected-filter"
};

const SORT_BASE_IDS = {
    deadlineAsc: "job-sort-deadline-asc",
    deadlineDesc: "job-sort-deadline-desc",
    contentAsc: "job-sort-content-asc",
    contentDesc: "job-sort-content-desc",
    budgetAsc: "job-sort-budget-asc",
    budgetDesc: "job-sort-budget-desc"
};

// 🛠️ Hilfsfunktionen
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

async function fetchCollectionItem(collectionId, itemId) {
    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            console.warn(`API Error (fetchCollectionItem ${collectionId}/${itemId}): ${response.status} - ${await response.text()}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Error fetching Collection Item ${collectionId}/${itemId}: ${error.message}`);
        return null;
    }
}

// API-Abfragefunktion (ohne Cache)
async function fetchJobDataFromAPI(jobId) {
    const jobDataResult = await fetchCollectionItem(JOB_COLLECTION_ID, jobId);
    if (!jobDataResult) {
        return { appId: jobId, jobData: { id: jobId, error: true, isFullyLoaded: false, message: `Failed to fetch job ${jobId}` } };
    }
    // Flexiblere Handhabung der Webflow API Antwortstruktur
    const item = jobDataResult.items && jobDataResult.items.length > 0 ? jobDataResult.items[0] : jobDataResult.item || jobDataResult;
    const fieldData = item?.fieldData;
    const slug = fieldData?.slug || item?.slug;
    const id = item?.id; // ID direkt vom Item-Objekt nehmen

    if (fieldData && id) {
         return { appId: jobId, jobData: { ...fieldData, id: id, slug: slug, isFullyLoaded: true } };
    } else {
        console.warn(`No valid fieldData or id found for Job ${jobId} in GET request. Response:`, jobDataResult);
        return { appId: jobId, jobData: { id: jobId, error: true, isFullyLoaded: false, message: `No valid fieldData for job ${jobId}` }};
    }
}

// Funktion mit localStorage Caching für Jobdetails
async function fetchJobDataWithCache(jobId) {
    const cacheKey = CACHE_PREFIX + jobId;
    try {
        const cachedItemJSON = localStorage.getItem(cacheKey);
        if (cachedItemJSON) {
            const cachedItem = JSON.parse(cachedItemJSON);
            // Prüfe, ob der Cache-Eintrag gültig ist und nicht abgelaufen
            if (cachedItem && cachedItem.data && typeof cachedItem.timestamp === 'number' && (Date.now() - cachedItem.timestamp < CACHE_EXPIRY_MS)) {
                // console.log(`[Cache] HIT for job ${jobId}`);
                return {
                    appId: jobId,
                    jobData: {
                        ...cachedItem.data,
                        id: cachedItem.data.id || jobId, // Stelle sicher, dass die ID im jobData-Objekt ist
                        isFullyLoaded: true,
                        fromCache: true // Optionales Flag für Debugging
                    }
                };
            } else {
                // console.log(`[Cache] STALE or invalid for job ${jobId}`);
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.warn(`[Cache] Error reading cache for ${jobId}:`, e.message);
        localStorage.removeItem(cacheKey); // Bei Fehler (z.B. ungültiges JSON) Eintrag entfernen
    }

    // console.log(`[Cache] MISS for job ${jobId}, fetching from API.`);
    const result = await fetchJobDataFromAPI(jobId);

    if (result && result.jobData && !result.jobData.error && result.jobData.isFullyLoaded) {
        try {
            const itemToCache = {
                data: result.jobData, // Speichere nur das jobData-Objekt
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
        } catch (e) {
            console.warn(`[Cache] Error writing to cache for ${jobId}:`, e.message);
        }
    }
    return result;
}

async function fetchIndividualJobsInBatches(appIds, batchSize, delayBetweenBatches, operationName = "Batch Fetch") {
    // console.log(`[${operationName}] Starting fetch of ${appIds.length} jobs. Batch size: ${batchSize}, Delay: ${delayBetweenBatches}ms.`);
    if (appIds.length === 0) {
        return [];
    }
    const allResults = [];

    for (let i = 0; i < appIds.length; i += batchSize) {
        const batchAppIds = appIds.slice(i, i + batchSize);
        const batchPromises = batchAppIds.map(appId => fetchJobDataWithCache(appId)); // Nutzt Caching

        try {
            const batchJobResults = await Promise.all(batchPromises);
            allResults.push(...batchJobResults);
        } catch (batchError) {
            console.error(`[${operationName}] Unexpected error in Promise.all:`, batchError);
            batchAppIds.forEach(appId => allResults.push({appId, jobData: {id: appId, error: true, isFullyLoaded: false, message: "Batch processing error"}}));
        }

        if (i + batchSize < appIds.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
    return allResults;
}

function calculateDeadlineCountdown(endDate) {
    if (!endDate) return { text: "N/A", isExpired: false };
    const now = new Date();
    const deadline = new Date(endDate);
    if (isNaN(deadline.getTime())) return { text: "N/A", isExpired: false };
    
    const diff = deadline - now;

    if (diff <= 0) return { text: "Abgelaufen", isExpired: true };

    const minutesTotal = Math.floor(diff / (1000 * 60));
    const hoursTotal = Math.floor(minutesTotal / 60);
    const daysTotal = Math.floor(hoursTotal / 24);

    if (daysTotal > 0) return { text: `${daysTotal} Tag${daysTotal > 1 ? 'e' : ''}`, isExpired: false };
    if (hoursTotal > 0) return { text: `${hoursTotal} Stunde${hoursTotal > 1 ? 'n' : ''}`, isExpired: false };
    return { text: `${minutesTotal} Minute${minutesTotal > 1 ? 'n' : ''}`, isExpired: false };
}

function getApplicationStatusForFilter(jobData, memberId) {
    if (!jobData || jobData.error || !jobData.isFullyLoaded) return "Ausstehend";
    const bookedCreators = jobData["booked-creators"] || [];
    const rejectedCreators = jobData["rejected-creators"] || [];
    const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
    const now = new Date();

    if (endDateApp && isNaN(endDateApp.getTime())) {
        // console.warn(`Invalid job-date-end for job ${jobData.id}: ${jobData["job-date-end"]}`);
    }

    if (memberId && bookedCreators.includes(memberId)) return "Angenommen";
    if (memberId && rejectedCreators.includes(memberId)) return "Abgelehnt";
    if (memberId && endDateApp && !isNaN(endDateApp.getTime()) && endDateApp < now && !bookedCreators.includes(memberId)) return "Abgelehnt";

    return "Ausstehend";
}

function renderSkeletonLoader(targetListElement, count) {
    if (!targetListElement) {
        return;
    }
    targetListElement.innerHTML = "";
    const fieldSkeletons = [
        { type: "text", classModifier: "skeleton-text-short" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "text", classModifier: "skeleton-text-medium" },
        { type: "tag" }, { type: "tag" },
        { type: "applicant-count" }
    ];
    const actualCount = Math.min(count, JOBS_PER_PAGE);
    for (let i = 0; i < actualCount; i++) {
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
            const fieldDivItem = document.createElement("div");
            fieldDivItem.classList.add("db-table-row-item");
             if (skelType.type === "applicant-count") {
                fieldDivItem.classList.add("item-job-applicant-display");
                const applicantSkelText = document.createElement("div");
                applicantSkelText.classList.add("job-tag", "customer", "skeleton-element", "skeleton-text", "skeleton-text-short");
                fieldDivItem.appendChild(applicantSkelText);
            } else if (skelType.type === "tag") {
                const skeletonTag = document.createElement("div");
                skeletonTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
                fieldDivItem.appendChild(skeletonTag);
            } else {
                const skeletonFieldText = document.createElement("div");
                skeletonFieldText.classList.add("db-job-tag-txt", "skeleton-element", "skeleton-text", skelType.classModifier || "");
                fieldDivItem.appendChild(skeletonFieldText);
            }
            jobDiv.appendChild(fieldDivItem);
        });
        targetListElement.appendChild(jobDiv);
    }
}

async function handlePageChange(newPage) {
    const paginationContainerElement = document.getElementById("pagination-controls-container");
    if(paginationContainerElement){
        const buttons = paginationContainerElement.querySelectorAll('.db-pagination-count');
        buttons.forEach(btn => btn.classList.add('disabled-loading'));
    }

    currentPage = newPage;
    const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    if (!activeTabConfig) {
        renderActiveTabContent();
        return;
    }

    const allPotentialJobsForThisTab = allJobResults.filter(result =>
        result.jobData && activeTabConfig.filterFn(result.jobData, currentWebflowMemberId)
    );

    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = Math.min(startIndex + JOBS_PER_PAGE, allPotentialJobsForThisTab.length);
    const jobsForPageRange = allPotentialJobsForThisTab.slice(startIndex, endIndex);
    const idsToLoadForPage = jobsForPageRange
        .filter(job => !job.jobData.isFullyLoaded && !job.jobData.error)
        .map(job => job.appId);

    if (idsToLoadForPage.length > 0) {
        const onDemandBatchSize = Math.min(idsToLoadForPage.length, 10);
        const onDemandDelay = 1000;
        const newlyLoadedJobResults = await fetchIndividualJobsInBatches(idsToLoadForPage, onDemandBatchSize, onDemandDelay, "On-Demand Page Load");
        newlyLoadedJobResults.forEach(loadedResult => {
            const indexInAllJobs = allJobResults.findIndex(job => job.appId === loadedResult.appId);
            if (indexInAllJobs !== -1) allJobResults[indexInAllJobs] = loadedResult;
        });
    }
    renderActiveTabContent();
}

function renderPaginationControls(paginationContainerElement, currentPageNum, totalPagesNum) {
    if (!paginationContainerElement) return;
    paginationContainerElement.innerHTML = '';
    paginationContainerElement.style.display = totalPagesNum <= 1 ? "none" : "flex";
    if (totalPagesNum <= 1) return;

    const prevButton = document.createElement("a");
    prevButton.href = "#";
    prevButton.classList.add("db-pagination-count", "button-prev");
    prevButton.textContent = "Zurück";
    if (currentPageNum === 1) prevButton.classList.add("disabled");
    else prevButton.addEventListener("click", async (e) => { e.preventDefault(); if (prevButton.classList.contains("disabled") || prevButton.classList.contains("disabled-loading")) return; await handlePageChange(currentPageNum - 1); });
    paginationContainerElement.appendChild(prevButton);

    let startPage, endPage;
    if (totalPagesNum <= MAX_VISIBLE_PAGES_MJ) { startPage = 1; endPage = totalPagesNum; }
    else {
        const maxPagesBefore = Math.floor(MAX_VISIBLE_PAGES_MJ / 2);
        const maxPagesAfter = Math.ceil(MAX_VISIBLE_PAGES_MJ / 2) - 1;
        if (currentPageNum <= maxPagesBefore) { startPage = 1; endPage = MAX_VISIBLE_PAGES_MJ; }
        else if (currentPageNum + maxPagesAfter >= totalPagesNum) { startPage = totalPagesNum - MAX_VISIBLE_PAGES_MJ + 1; endPage = totalPagesNum; }
        else { startPage = currentPageNum - maxPagesBefore; endPage = currentPageNum + maxPagesAfter; }
    }

    if (startPage > 1) {
        const firstPageLink = document.createElement("a"); firstPageLink.href = "#"; firstPageLink.classList.add("db-pagination-count"); firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", async (e) => { e.preventDefault(); if (firstPageLink.classList.contains("disabled-loading") || currentPageNum === 1) return; await handlePageChange(1); });
        paginationContainerElement.appendChild(firstPageLink);
        if (startPage > 2) { const ellipsis = document.createElement("span"); ellipsis.classList.add("db-pagination-count", "ellipsis"); ellipsis.textContent = "..."; paginationContainerElement.appendChild(ellipsis); }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement("a"); pageLink.href = "#"; pageLink.classList.add("db-pagination-count"); pageLink.textContent = i;
        if (i === currentPageNum) pageLink.classList.add("current");
        else pageLink.addEventListener("click", async (e) => { e.preventDefault(); if (pageLink.classList.contains("disabled-loading")) return; await handlePageChange(i); });
        paginationContainerElement.appendChild(pageLink);
    }

    if (endPage < totalPagesNum) {
        if (endPage < totalPagesNum - 1) { const ellipsis = document.createElement("span"); ellipsis.classList.add("db-pagination-count", "ellipsis"); ellipsis.textContent = "..."; paginationContainerElement.appendChild(ellipsis); }
        const lastPageLink = document.createElement("a"); lastPageLink.href = "#"; lastPageLink.classList.add("db-pagination-count"); lastPageLink.textContent = totalPagesNum;
        lastPageLink.addEventListener("click", async (e) => { e.preventDefault(); if (lastPageLink.classList.contains("disabled-loading") || currentPageNum === totalPagesNum) return; await handlePageChange(totalPagesNum); });
        paginationContainerElement.appendChild(lastPageLink);
    }

    const nextButton = document.createElement("a"); nextButton.href = "#"; nextButton.classList.add("db-pagination-count", "button-next"); nextButton.textContent = "Weiter";
    if (currentPageNum === totalPagesNum) nextButton.classList.add("disabled");
    else nextButton.addEventListener("click", async (e) => { e.preventDefault(); if (nextButton.classList.contains("disabled") || nextButton.classList.contains("disabled-loading")) return; await handlePageChange(currentPageNum + 1); });
    paginationContainerElement.appendChild(nextButton);
}

function renderJobs(jobsToDisplayAfterPrimaryFilter, webflowMemberId, targetListId) {
    const appContainer = document.getElementById(targetListId);
    if (!appContainer) return;

    let currentFilteredList = [...jobsToDisplayAfterPrimaryFilter];
    const currentSearchTermValue = document.getElementById(`${FILTER_BASE_IDS.searchIdPrefix}-${activeTabId}`)?.value?.toLowerCase().trim() || "";
    const jobStatusActive = document.getElementById(`${FILTER_BASE_IDS.jobStatusActive}-${activeTabId}`)?.checked;
    const jobStatusClosed = document.getElementById(`${FILTER_BASE_IDS.jobStatusClosed}-${activeTabId}`)?.checked;
    const appStatusPending = document.getElementById(`${FILTER_BASE_IDS.appStatusPending}-${activeTabId}`)?.checked;
    const appStatusAccepted = document.getElementById(`${FILTER_BASE_IDS.appStatusAccepted}-${activeTabId}`)?.checked;
    const appStatusRejected = document.getElementById(`${FILTER_BASE_IDS.appStatusRejected}-${activeTabId}`)?.checked;

    currentFilteredList = currentFilteredList.filter(({ jobData }) => {
        if (!jobData || !jobData.isFullyLoaded || jobData.error) return false;
        if (currentSearchTermValue && !(jobData["name"] || "").toLowerCase().includes(currentSearchTermValue)) return false;

        const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
        const isJobCurrentlyActive = jobEndDate && !isNaN(jobEndDate.getTime()) && jobEndDate >= new Date();

        if (jobStatusActive && !jobStatusClosed && !isJobCurrentlyActive) return false;
        if (!jobStatusActive && jobStatusClosed && isJobCurrentlyActive) return false;

        const isSpecificStatusTab = activeTabId === 'abgelehnt' || activeTabId === 'ausstehend';
        const applyAppStatusFilterCheckboxes = (appStatusPending || appStatusAccepted || appStatusRejected) && !isSpecificStatusTab;

        if (applyAppStatusFilterCheckboxes) {
            const currentAppStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
            let passesAppStatus = false;
            if (appStatusPending && currentAppStatus === "Ausstehend") passesAppStatus = true;
            if (appStatusAccepted && currentAppStatus === "Angenommen") passesAppStatus = true;
            if (appStatusRejected && currentAppStatus === "Abgelehnt") passesAppStatus = true;
            if (!passesAppStatus) return false;
        }
        return true;
    });

    let currentSortCriteria = null;
    Object.keys(SORT_BASE_IDS).forEach(key => {
        const sortCheckbox = document.getElementById(`${SORT_BASE_IDS[key]}-${activeTabId}`);
        if (sortCheckbox?.checked) {
            currentSortCriteria = {
                key: sortCheckbox.dataset.sortKey,
                direction: sortCheckbox.dataset.sortDirection
            };
        }
    });

    if (currentSortCriteria && currentSortCriteria.key) {
        currentFilteredList.sort((a, b) => {
            const jobDataA = a.jobData;
            const jobDataB = b.jobData;
            if (!jobDataA || !jobDataB) return 0;
            let valA, valB;

            switch (currentSortCriteria.key) {
                case 'deadline':
                case 'content':
                    let dateStrA = currentSortCriteria.key === 'deadline' ? jobDataA['job-date-end'] : jobDataA['fertigstellung-content'];
                    let dateStrB = currentSortCriteria.key === 'deadline' ? jobDataB['job-date-end'] : jobDataB['fertigstellung-content'];
                    
                    let dateA = dateStrA ? new Date(dateStrA) : null;
                    let dateB = dateStrB ? new Date(dateStrB) : null;

                    if (dateA && isNaN(dateA.getTime())) dateA = null;
                    if (dateB && isNaN(dateB.getTime())) dateB = null;

                    if (dateA === null && dateB === null) valA = 0;
                    else if (dateA === null) valA = currentSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    else if (dateB === null) valB = currentSortCriteria.direction === 'asc' ? Infinity : -Infinity; // Fehler hier: sollte valA und valB sein
                    else { valA = dateA.getTime(); valB = dateB.getTime(); }
                    break;
                case 'budget':
                    valA = parseFloat(String(jobDataA['job-payment'] || '0').replace(/[^0-9.-]+/g, ""));
                    valB = parseFloat(String(jobDataB['job-payment'] || '0').replace(/[^0-9.-]+/g, ""));
                    if (isNaN(valA)) valA = currentSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    if (isNaN(valB)) valB = currentSortCriteria.direction === 'asc' ? Infinity : -Infinity;
                    break;
                default: return 0;
            }

            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return currentSortCriteria.direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    const totalPagesForDisplay = Math.ceil(currentFilteredList.length / JOBS_PER_PAGE) || 1;
    if (currentPage > totalPagesForDisplay) currentPage = totalPagesForDisplay > 0 ? totalPagesForDisplay : 1;

    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = currentFilteredList.slice(startIndex, endIndex);

    appContainer.innerHTML = "";

    if (jobsToShowOnPage.length === 0) {
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = "ℹ️ Keine Jobs entsprechen den aktuellen Kriterien für diesen Tab.";
        noJobsMessage.classList.add('job-entry', 'visible', 'no-jobs-message');
        appContainer.appendChild(noJobsMessage);
    } else {
        const fragment = document.createDocumentFragment();
        jobsToShowOnPage.forEach(({ appId, jobData }) => {
            const jobLink = document.createElement("a");
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
            jobImage.onerror = function() { this.src = 'https://via.placeholder.com/80x80?text=Error'; this.onerror = null; };
            jobInfoDiv.appendChild(jobImage);
            const jobNameSpan = document.createElement("span");
            jobNameSpan.classList.add("truncate", "job-title");
            jobNameSpan.textContent = jobData["name"] || "Unbekannter Job";
            jobInfoDiv.appendChild(jobNameSpan);
            jobDiv.appendChild(jobInfoDiv);

            const fields = [
                { key: "job-payment", label: "Bezahlung" }, { key: "job-date-end", label: "Bewerbungsfrist" },
                { key: "fertigstellung-content", label: "Contentdeadline" }, { key: "job-status", label: "Job Status" },
                { key: "application-status", label: "Bewerbungsstatus" }
            ];
            fields.forEach(field => {
                const value = jobData[field.key];
                const fieldDivItem = document.createElement("div");
                fieldDivItem.classList.add("db-table-row-item", `item-${field.key.replace(/\s+/g, '-').toLowerCase()}`);
                const fieldText = document.createElement("span");

                if (field.key === "job-payment") {
                    fieldText.classList.add("job-tag", "customer");
                    const payment = parseFloat(String(value || '0').replace(/[^0-9.-]+/g, ""));
                    fieldText.textContent = !isNaN(payment) ? payment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : "N/A";
                } else if (field.key === "job-date-end") {
                    const deadlineInfo = calculateDeadlineCountdown(value);
                    fieldText.classList.add("job-tag");
                    if (deadlineInfo.isExpired) fieldText.classList.add("is-bg-light-red");
                    fieldText.textContent = deadlineInfo.text;
                } else if (field.key === "fertigstellung-content") {
                    fieldText.classList.add("job-tag", "customer");
                    if (value) {
                        const date = new Date(value);
                        fieldText.textContent = !isNaN(date.getTime()) ? date.toLocaleDateString('de-DE') : "N/A";
                    } else fieldText.textContent = "N/A";
                } else if (field.key === "job-status") {
                    const endDateJob = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
                    const now = new Date();
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    if (endDateJob && !isNaN(endDateJob.getTime()) && endDateJob < now) { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Beendet"; }
                    else if (endDateJob && !isNaN(endDateJob.getTime())) { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Aktiv"; }
                    else { statusDiv.classList.add("is-bg-light-grey"); statusTextInner.textContent = "Unbekannt"; }
                    statusDiv.appendChild(statusTextInner); fieldDivItem.appendChild(statusDiv);
                } else if (field.key === "application-status") {
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                    if (appStatus === "Angenommen") { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Angenommen"; }
                    else if (appStatus === "Abgelehnt") { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Abgelehnt"; }
                    else { statusDiv.classList.add("is-bg-light-blue"); statusTextInner.textContent = "Ausstehend"; }
                    statusDiv.appendChild(statusTextInner); fieldDivItem.appendChild(statusDiv);
                }

                if (field.key !== "job-status" && field.key !== "application-status") {
                    if (fieldText.textContent || fieldText.classList.length > 0) fieldDivItem.appendChild(fieldText);
                }
                jobDiv.appendChild(fieldDivItem);
            });

            const applicantDisplayCell = document.createElement("div");
            applicantDisplayCell.classList.add("db-table-row-item", "item-job-applicant-display");
            const applicantCountText = document.createElement("span");
            applicantCountText.classList.add("job-tag", "customer");
            const applicantIds = jobData['bewerber'] || [];
            applicantCountText.textContent = `${applicantIds.length} Bewerber`;
            applicantDisplayCell.appendChild(applicantCountText);
            jobDiv.appendChild(applicantDisplayCell);

            jobLink.appendChild(jobDiv);
            fragment.appendChild(jobLink);
        });
        appContainer.appendChild(fragment);
        requestAnimationFrame(() => {
            appContainer.querySelectorAll('.job-entry:not(.visible)').forEach(entry => entry.classList.add('visible'));
        });
    }

    const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
    renderPaginationControls(paginationContainer, currentPage, totalPagesForDisplay);
}


function createPaginationContainer() {
    let container = document.getElementById("pagination-controls-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "pagination-controls-container";
        container.className = "db-table-pagination";
        const tabsWrapper = document.querySelector('.tabs-content');
        if (tabsWrapper && tabsWrapper.parentNode) {
            tabsWrapper.parentNode.insertBefore(container, tabsWrapper.nextSibling);
        } else {
            const firstTabListContainer = document.getElementById(TABS_CONFIG[0].listContainerId);
            if (firstTabListContainer && firstTabListContainer.parentNode) {
                firstTabListContainer.parentNode.appendChild(container);
            } else {
                const mainContentArea = document.querySelector('main') || document.body;
                mainContentArea.appendChild(container);
            }
        }
    }
    return container;
}

function renderActiveTabContent() {
    const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    if (!activeTabConfig) return;

    const targetListElement = document.getElementById(activeTabConfig.listId);
    if (!targetListElement) return;

    const potentialJobsForThisTab = allJobResults.filter(result =>
        result.jobData && activeTabConfig.filterFn(result.jobData, currentWebflowMemberId)
    );
    const jobsToPassToRenderJobs = potentialJobsForThisTab.filter(result =>
        result.jobData && result.jobData.isFullyLoaded && !result.jobData.error
    );

    const skeletonCount = Math.min(JOBS_PER_PAGE, potentialJobsForThisTab.length > 0 ? potentialJobsForThisTab.length : JOBS_PER_PAGE);
    renderSkeletonLoader(targetListElement, skeletonCount);

    setTimeout(() => {
        renderJobs(jobsToPassToRenderJobs, currentWebflowMemberId, activeTabConfig.listId);
    }, 50);
}

async function fetchAllRemainingJobDataInBackground(remainingAppIds) {
    if (remainingAppIds.length === 0) {
        isBackgroundLoadingComplete = true;
        renderActiveTabContent();
        return;
    }
    // console.log(`[Background Load] Starting for ${remainingAppIds.length} remaining jobs.`);

    const backgroundBatchSize = 5;
    const backgroundDelay = 5000;
    const backgroundJobResults = await fetchIndividualJobsInBatches(remainingAppIds, backgroundBatchSize, backgroundDelay, "Background Load");

    backgroundJobResults.forEach(loadedResult => {
        const index = allJobResults.findIndex(job => job.appId === loadedResult.appId);
        if (index !== -1) allJobResults[index] = loadedResult;
    });

    isBackgroundLoadingComplete = true;
    // console.log(`[Background Load] Complete.`);
    renderActiveTabContent();
}

async function initializeUserApplications() {
    const initialTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    const initialListElement = initialTabConfig ? document.getElementById(initialTabConfig.listId) : null;
    const itemCountElement = document.querySelector('[data-db-table-item-count]');

    if (itemCountElement) itemCountElement.textContent = "...";
    if (initialListElement) renderSkeletonLoader(initialListElement, JOBS_PER_PAGE);
    
    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
        }

        let applicationsFromUser = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId); // Immer frisch
            const userFieldData = userData?.item?.fieldData || userData?.fieldData;
            applicationsFromUser = userFieldData?.["abgeschlossene-bewerbungen"] || [];
        } else {
            console.warn("Keine Webflow Member ID gefunden.");
        }

        if (itemCountElement) itemCountElement.textContent = applicationsFromUser.length;

        allJobResults = applicationsFromUser.map(appId => ({
            appId: appId,
            jobData: { id: appId, isFullyLoaded: false, error: false }
        }));

        const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
        const initialPotentialJobsForActiveTab = allJobResults.filter(result =>
            initialTabConfig ? initialTabConfig.filterFn(result.jobData, currentWebflowMemberId) : true
        );
        const totalPagesInitial = Math.ceil(initialPotentialJobsForActiveTab.length / JOBS_PER_PAGE) || 1;
        renderPaginationControls(paginationContainer, 1, totalPagesInitial);

        if (applicationsFromUser.length > 0) {
            let appIdsForInitialLoad = [];
            let remainingAppIdsForBackground = [];

            if (initialTabConfig) {
                const activeTabAppIds = [];
                const otherAppIds = [];
                applicationsFromUser.forEach(appId => {
                    const tempJobData = { id: appId, isFullyLoaded: false };
                    if (initialTabConfig.filterFn(tempJobData, currentWebflowMemberId)) activeTabAppIds.push(appId);
                    else otherAppIds.push(appId);
                });
                appIdsForInitialLoad = [...activeTabAppIds];
                if (appIdsForInitialLoad.length < INITIAL_LOAD_JOB_COUNT) {
                    appIdsForInitialLoad.push(...otherAppIds.slice(0, INITIAL_LOAD_JOB_COUNT - appIdsForInitialLoad.length));
                }
                appIdsForInitialLoad = [...new Set(appIdsForInitialLoad)];
                remainingAppIdsForBackground = applicationsFromUser.filter(id => !appIdsForInitialLoad.includes(id));
            } else {
                appIdsForInitialLoad = applicationsFromUser.slice(0, INITIAL_LOAD_JOB_COUNT);
                remainingAppIdsForBackground = applicationsFromUser.slice(INITIAL_LOAD_JOB_COUNT);
            }
            
            const initialFastLoadBatchSize = 10;
            const initialFastLoadDelay = 1000;
            const initiallyLoadedResults = await fetchIndividualJobsInBatches(appIdsForInitialLoad, initialFastLoadBatchSize, initialFastLoadDelay, "Initial Fast Load");

            initiallyLoadedResults.forEach(loadedResult => {
                const index = allJobResults.findIndex(job => job.appId === loadedResult.appId);
                if (index !== -1) allJobResults[index] = loadedResult;
            });

            currentPage = 1;
            renderActiveTabContent();

            if (remainingAppIdsForBackground.length > 0) {
                fetchAllRemainingJobDataInBackground(remainingAppIdsForBackground);
            } else {
                isBackgroundLoadingComplete = true;
            }
        } else {
            isBackgroundLoadingComplete = true;
            if (initialListElement) initialListElement.innerHTML = "";
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "Keine abgeschlossenen Bewerbungen gefunden.";
            noJobsMessage.classList.add('job-entry', 'visible', 'no-jobs-message');
            if (initialListElement) initialListElement.appendChild(noJobsMessage);
            if (paginationContainer) paginationContainer.innerHTML = "";
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        isBackgroundLoadingComplete = true;
        if (initialListElement) initialListElement.innerHTML = `<p class="job-entry visible no-jobs-message">❌ Es ist ein Fehler aufgetreten: ${error.message}.</p>`;
        if (itemCountElement) itemCountElement.textContent = "0";
    }
}

function setupEventListeners() {
    document.querySelectorAll(`.${FILTER_BASE_IDS.searchClass}`).forEach(input => {
        input.addEventListener("input", () => { currentPage = 1; renderActiveTabContent(); });
    });

    const allFilterCheckboxIDs = [];
    TABS_CONFIG.forEach(tab => Object.keys(FILTER_BASE_IDS).forEach(baseKey => {
        if (baseKey !== 'searchClass' && baseKey !== 'searchIdPrefix') allFilterCheckboxIDs.push(`${FILTER_BASE_IDS[baseKey]}-${tab.id}`);
    }));
    allFilterCheckboxIDs.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.addEventListener("change", () => { currentPage = 1; renderActiveTabContent(); });
    });

    const allSortCheckboxIDs = [];
    TABS_CONFIG.forEach(tab => Object.keys(SORT_BASE_IDS).forEach(baseKey => allSortCheckboxIDs.push(`${SORT_BASE_IDS[baseKey]}-${tab.id}`)));
    allSortCheckboxIDs.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            if (!checkbox.dataset.sortKey) {
                if (id.includes("deadline")) checkbox.dataset.sortKey = "deadline";
                else if (id.includes("content")) checkbox.dataset.sortKey = "content";
                else if (id.includes("budget")) checkbox.dataset.sortKey = "budget";
            }
            if (!checkbox.dataset.sortDirection) {
                if (id.includes("asc")) checkbox.dataset.sortDirection = "asc";
                else if (id.includes("desc")) checkbox.dataset.sortDirection = "desc";
            }
            checkbox.addEventListener('change', (event) => {
                const targetCheckbox = event.target;
                const targetTabId = TABS_CONFIG.find(tab => targetCheckbox.id.endsWith(tab.id))?.id;
                if (targetTabId !== activeTabId) return;
                if (targetCheckbox.checked) {
                    allSortCheckboxIDs.forEach(otherId => {
                        const otherCb = document.getElementById(otherId);
                        if (otherCb && otherCb !== targetCheckbox && otherCb.id.endsWith(`-${activeTabId}`)) otherCb.checked = false;
                    });
                }
                currentPage = 1;
                renderActiveTabContent();
            });
        }
    });

    const tabLinks = document.querySelectorAll(".tab-link[data-tab-id]");
    tabLinks.forEach(link => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            const newTabId = link.dataset.tabId;
            const currentListContent = document.getElementById(TABS_CONFIG.find(t => t.id === newTabId)?.listId);
            if (newTabId === activeTabId && currentListContent && currentListContent.children.length > 0 && !currentListContent.querySelector('.skeleton-row')) return;

            activeTabId = newTabId;
            currentPage = 1;
            tabLinks.forEach(tl => tl.classList.remove("active-tab"));
            link.classList.add("active-tab");
            TABS_CONFIG.forEach(tabConfig => {
                const contentContainer = document.getElementById(tabConfig.listContainerId);
                if (contentContainer) contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
            });

            const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
            if (activeTabConfig) {
                const potentialJobsForNewTab = allJobResults.filter(result => result.jobData && activeTabConfig.filterFn(result.jobData, currentWebflowMemberId));
                const idsToLoadForNewTabPageOne = potentialJobsForNewTab.slice(0, JOBS_PER_PAGE)
                    .filter(job => !job.jobData.isFullyLoaded && !job.jobData.error).map(job => job.appId);
                if (idsToLoadForNewTabPageOne.length > 0 && !isBackgroundLoadingComplete) {
                    const onDemandBatchSize = Math.min(idsToLoadForNewTabPageOne.length, 10);
                    const onDemandDelay = 1000;
                    const newlyLoaded = await fetchIndividualJobsInBatches(idsToLoadForNewTabPageOne, onDemandBatchSize, onDemandDelay, "Tab Switch Pre-load");
                    newlyLoaded.forEach(loadedResult => {
                        const indexInAllJobs = allJobResults.findIndex(job => job.appId === loadedResult.appId);
                        if (indexInAllJobs !== -1) allJobResults[indexInAllJobs] = loadedResult;
                    });
                }
            }
            renderActiveTabContent();
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    TABS_CONFIG.forEach(tabConfig => {
        const contentContainer = document.getElementById(tabConfig.listContainerId);
        if (contentContainer) contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
    });
    const initialActiveTabLink = document.querySelector(`.tab-link[data-tab-id="${activeTabId}"]`);
    if(initialActiveTabLink) initialActiveTabLink.classList.add("active-tab");

    initializeUserApplications();
    setupEventListeners();
});
