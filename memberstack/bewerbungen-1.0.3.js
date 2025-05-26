// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url="; // Ensure your worker URL is correct
const JOB_COLLECTION_ID = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const JOBS_PER_PAGE = 15;
const MAX_VISIBLE_PAGES_MJ = 5;

let currentPage = 1;
let allJobResults = []; // Wird einmalig initial gefüllt
let currentWebflowMemberId = null;
let activeSortCriteria = null;
// currentSearchTerm und andere Filter-Status werden jetzt nicht mehr global gehalten,
// sondern direkt aus den tab-spezifischen Elementen gelesen.

const creatorDataCache = {}; // Cache für Creator-Profildaten (Bilder)

const TABS_CONFIG = [
    { id: "alle", listContainerId: "application-list-container", listId: "application-list", name: "Alle", filterFn: (jobData, memberId) => true },
    { id: "abgelehnt", listContainerId: "application-list-rejected-container", listId: "application-list-rejected", name: "Abgelehnt", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Abgelehnt" },
    { id: "ausstehend", listContainerId: "application-list-pending-container", listId: "application-list-pending", name: "Ausstehend", filterFn: (jobData, memberId) => getApplicationStatusForFilter(jobData, memberId) === "Ausstehend" },
    { id: "favoriten", listContainerId: "application-list-fav-container", listId: "application-list-fav", name: "In Auswahl", filterFn: (jobData, memberId) => jobData["job-favoriten"] && Array.isArray(jobData["job-favoriten"]) && jobData["job-favoriten"].includes(memberId) }
];
let activeTabId = TABS_CONFIG[0].id; // Standard-Tab

// Basis-IDs für Filterelemente (werden mit -${activeTabId} ergänzt)
const FILTER_BASE_IDS = {
    search: "filter-search",
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
    if (collectionId === USER_COLLECTION_ID && creatorDataCache[itemId]) {
        return creatorDataCache[itemId];
    }

    const apiUrl = `${API_BASE_URL}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    try {
        const response = await fetch(workerUrl); 
        if (!response.ok) {
            console.warn(`API Error (fetchCollectionItem ${collectionId}/${itemId}): ${response.status} - ${await response.text()}`);
            return null; 
        }
        const data = await response.json();
        if (collectionId === USER_COLLECTION_ID && data) {
            creatorDataCache[itemId] = data;
        }
        return data;
    } catch (error) {
        console.error(`❌ Error fetching Collection Item ${collectionId}/${itemId}: ${error.message}`);
        return null;
    }
}

async function fetchJobData(jobId) {
    const jobDataResult = await fetchCollectionItem(JOB_COLLECTION_ID, jobId);
    if (!jobDataResult) {
        return { appId: jobId, jobData: { id: jobId, error: true, message: `Failed to fetch job ${jobId}` } };
    }

    const fieldData = jobDataResult?.item?.fieldData || jobDataResult?.fieldData;
    const slug = fieldData?.slug || jobDataResult?.item?.slug || jobDataResult?.slug;

    if (fieldData && (jobDataResult.id || jobDataResult?.item?.id)) {
         return { appId: jobId, jobData: { ...fieldData, id: (jobDataResult.id || jobDataResult?.item?.id), slug: slug } };
    } else {
        console.warn(`No valid fieldData found for Job ${jobId} in GET request.`);
        return { appId: jobId, jobData: { id: jobId, error: true, message: `No valid fieldData for job ${jobId}` }};
    }
}

async function fetchIndividualJobsInBatches(appIds, batchSize = 100, delayBetweenBatches = 1000) { 
    console.log(`Starting fetch of ${appIds.length} jobs with individual GET requests. Batch size: ${batchSize}, Delay: ${delayBetweenBatches}ms.`);
    if (batchSize > 20 && delayBetweenBatches < (batchSize * 50) ) { 
        console.warn(`WARNING: Batch configuration (Size: ${batchSize}, Delay: ${delayBetweenBatches}ms) might exceed Webflow Rate Limits!`);
    }
    const allResults = []; 

    for (let i = 0; i < appIds.length; i += batchSize) {
        const batchAppIds = appIds.slice(i, i + batchSize);
        const currentBatchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(appIds.length / batchSize);
        console.log(`Processing individual GET request batch ${currentBatchNumber}/${totalBatches}: ${batchAppIds.length} Item IDs simultaneously`);

        const batchPromises = batchAppIds.map(appId => fetchJobData(appId));
        
        try {
            const batchJobResults = await Promise.all(batchPromises); 
            allResults.push(...batchJobResults); 
        } catch (batchError) {
            console.error("Unexpected error in Promise.all for individual GET requests:", batchError);
            batchAppIds.forEach(appId => allResults.push({appId, jobData: {id: appId, error: true, message: "Batch processing error for individual GETs"}}));
        }

        if (i + batchSize < appIds.length) { 
            console.log(`Waiting ${delayBetweenBatches / 1000} seconds before the next batch of individual GET requests...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
    console.log("All individual GET request batches processed.");
    return allResults;
}


function calculateDeadlineCountdown(endDate) {
    if (!endDate) return { text: "N/A", isExpired: false };
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return { text: "Abgelaufen", isExpired: true };

    const minutesTotal = Math.floor(diff / (1000 * 60));
    const hoursTotal = Math.floor(minutesTotal / 60);
    const daysTotal = Math.floor(hoursTotal / 24);

    if (daysTotal > 0) {
        return { text: `${daysTotal} Tag${daysTotal > 1 ? 'e' : ''}`, isExpired: false };
    }
    if (hoursTotal > 0) {
        return { text: `${hoursTotal} Stunde${hoursTotal > 1 ? 'n' : ''}`, isExpired: false };
    }
    return { text: `${minutesTotal} Minute${minutesTotal > 1 ? 'n' : ''}`, isExpired: false };
}

function getApplicationStatusForFilter(jobData, memberId) {
    if (!jobData || jobData.error) return "Ausstehend";
    const bookedCreators = jobData["booked-creators"] || [];
    const rejectedCreators = jobData["rejected-creators"] || [];
    const endDateApp = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
    const now = new Date();

    if (memberId && bookedCreators.includes(memberId)) return "Angenommen";
    if (memberId && rejectedCreators.includes(memberId)) return "Abgelehnt";
    if (memberId && endDateApp && endDateApp < now && !bookedCreators.includes(memberId)) return "Abgelehnt";
    
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
        { type: "applicants" } 
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
            const fieldDivItem = document.createElement("div");
            fieldDivItem.classList.add("db-table-row-item");
             if (skelType.type === "applicants") {
                fieldDivItem.classList.add("item-job-applicant-display"); 
                const applicantSkelDiv = document.createElement("div");
                applicantSkelDiv.classList.add("db-bewerber-count-list", "skeleton-element");
                applicantSkelDiv.style.width = "100px"; 
                applicantSkelDiv.style.height = "24px"; 
                fieldDivItem.appendChild(applicantSkelDiv);
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

function renderPaginationControls(paginationContainerElement, currentPageNum, totalPagesNum) {
    if (!paginationContainerElement) {
        return;
    }
    paginationContainerElement.innerHTML = ''; 
    paginationContainerElement.style.display = totalPagesNum <= 1 ? "none" : "flex";

    if (totalPagesNum <= 1) {
        return;
    }

    async function handlePageChange(newPage) {
        const buttons = paginationContainerElement.querySelectorAll('.db-pagination-count');
        buttons.forEach(btn => btn.classList.add('disabled-loading'));
        
        currentPage = newPage;
        renderActiveTabContent(); 
    }

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
            await handlePageChange(currentPageNum - 1);
        });
    }
    paginationContainerElement.appendChild(prevButton);

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
            await handlePageChange(totalPagesNum);
        });
        paginationContainerElement.appendChild(lastPageLink);
    }

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
            await handlePageChange(currentPageNum + 1);
        });
    }
    paginationContainerElement.appendChild(nextButton);
}

async function renderJobApplicantImages(jobData, collListElement) {
    const MAX_APPLICANT_IMAGES = 4;
    const applicantIds = jobData['bewerber'] || [];
    let imagesDisplayedCount = 0;
    collListElement.innerHTML = ''; 

    for (const creatorId of applicantIds) { 
        if (imagesDisplayedCount >= MAX_APPLICANT_IMAGES) {
            break; 
        }
        const creatorResult = await fetchCollectionItem(USER_COLLECTION_ID, creatorId); 
        
        let imageUrl;
        let creatorName = 'Creator';

        if (creatorResult && (creatorResult.item || creatorResult.fieldData) ) {
            const creatorFieldData = creatorResult.item?.fieldData || creatorResult.fieldData;
            creatorName = creatorFieldData?.name || 'Creator';
            imageUrl = creatorFieldData?.['image-thumbnail-small-92px']; 
        }
        
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            const listItem = document.createElement("div");
            listItem.classList.add("db-bewerber-count-list-item");
            const img = document.createElement("img");
            img.classList.add("db-creator-count-img");
            img.src = imageUrl;
            img.alt = creatorName;
            img.onerror = () => { /* Optional: Handle image load error */ }; 
            listItem.appendChild(img);
            collListElement.appendChild(listItem); 
            imagesDisplayedCount++;
        }
    }
}


function renderJobs(jobsToProcessPrimaryFilter, webflowMemberId, targetListId) {
    const appContainer = document.getElementById(targetListId);
    if (!appContainer) {
        console.error(`❌ Element '${targetListId}' nicht gefunden.`);
        return;
    }
    appContainer.innerHTML = "";
    console.log(`[renderJobs for ${targetListId}] Tab-ID: ${activeTabId}. Items after tab-specific pre-filter: ${jobsToProcessPrimaryFilter.length}`);

    let currentFilteredList = [...jobsToProcessPrimaryFilter];

    // Dynamically get filter values based on activeTabId
    // WICHTIG: HTML muss IDs wie "filter-search-alle", "job-status-active-filter-abgelehnt" etc. haben
    const currentSearchTerm = document.getElementById(`${FILTER_BASE_IDS.search}-${activeTabId}`)?.value?.toLowerCase().trim() || "";
    const jobStatusActive = document.getElementById(`${FILTER_BASE_IDS.jobStatusActive}-${activeTabId}`)?.checked;
    const jobStatusClosed = document.getElementById(`${FILTER_BASE_IDS.jobStatusClosed}-${activeTabId}`)?.checked;
    const appStatusPending = document.getElementById(`${FILTER_BASE_IDS.appStatusPending}-${activeTabId}`)?.checked;
    const appStatusAccepted = document.getElementById(`${FILTER_BASE_IDS.appStatusAccepted}-${activeTabId}`)?.checked;
    const appStatusRejected = document.getElementById(`${FILTER_BASE_IDS.appStatusRejected}-${activeTabId}`)?.checked;

    // 1. Search Filter
    if (currentSearchTerm) {
        currentFilteredList = currentFilteredList.filter(({ jobData }) => {
            if (!jobData || jobData.error) return false;
            return (jobData["name"] || "").toLowerCase().includes(currentSearchTerm);
        });
    }
    console.log(`[renderJobs for ${targetListId}] Items after search ('${currentSearchTerm}'): ${currentFilteredList.length}`);

    // 2. Job Status Filter (Active/Closed)
    if (jobStatusActive && !jobStatusClosed) { 
        currentFilteredList = currentFilteredList.filter(({ jobData }) => {
            if (!jobData || jobData.error) return false;
            const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
            return jobEndDate && jobEndDate >= new Date();
        });
    } else if (!jobStatusActive && jobStatusClosed) { 
        currentFilteredList = currentFilteredList.filter(({ jobData }) => {
            if (!jobData || jobData.error) return false;
            const jobEndDate = jobData["job-date-end"] ? new Date(jobData["job-date-end"]) : null;
            return jobEndDate && jobEndDate < new Date(); 
        });
    } 
    console.log(`[renderJobs for ${targetListId}] Items after job status filter (Active: ${jobStatusActive}, Closed: ${jobStatusClosed}): ${currentFilteredList.length}`);
    
    // 3. Application Status Filter (Pending/Accepted/Rejected)
    if (appStatusPending || appStatusAccepted || appStatusRejected) {
        currentFilteredList = currentFilteredList.filter(({ jobData }) => {
            if (!jobData || jobData.error) return false;
            const currentAppStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
            if (appStatusPending && currentAppStatus === "Ausstehend") return true;
            if (appStatusAccepted && currentAppStatus === "Angenommen") return true;
            if (appStatusRejected && currentAppStatus === "Abgelehnt") return true;
            return false; 
        });
    }
    console.log(`[renderJobs for ${targetListId}] Items after application status filter (Pending: ${appStatusPending}, Accepted: ${appStatusAccepted}, Rejected: ${appStatusRejected}): ${currentFilteredList.length}`);

    const filteredJobs = currentFilteredList;

    // Sortierung (liest Sortierkriterien aus globalen Variablen, die in setupEventListeners gesetzt werden)
    let sortedJobs = [...filteredJobs];
    // Lese Sortierkriterien basierend auf dem aktiven Tab
    let currentSortCriteria = null;
    TABS_CONFIG.forEach(tab => {
        Object.keys(SORT_BASE_IDS).forEach(key => {
            const sortCheckbox = document.getElementById(`${SORT_BASE_IDS[key]}-${tab.id}`);
            if (sortCheckbox?.checked && tab.id === activeTabId) {
                currentSortCriteria = {
                    key: sortCheckbox.dataset.sortKey,
                    direction: sortCheckbox.dataset.sortDirection
                };
            }
        });
    });


    if (currentSortCriteria && currentSortCriteria.key) {
        console.log(`[renderJobs for ${targetListId}] Sorting by: ${currentSortCriteria.key}, Direction: ${currentSortCriteria.direction}`);
        sortedJobs.sort((a, b) => {
            const jobDataA = a.jobData; 
            const jobDataB = b.jobData; 
            if (!jobDataA || jobDataA.error || !jobDataB || jobDataB.error) return 0;
            let valA, valB;
            switch (currentSortCriteria.key) {
                case 'deadline':
                    valA = jobDataA['job-date-end'] ? new Date(jobDataA['job-date-end']) : new Date(0);
                    valB = jobDataB['job-date-end'] ? new Date(jobDataB['job-date-end']) : new Date(0);
                    if (valA.getTime() === 0) valA = currentSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = currentSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    break;
                case 'content':
                    valA = jobDataA['fertigstellung-content'] ? new Date(jobDataA['fertigstellung-content']) : new Date(0);
                    valB = jobDataB['fertigstellung-content'] ? new Date(jobDataB['fertigstellung-content']) : new Date(0);
                    if (valA.getTime() === 0) valA = currentSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
                    if (valB.getTime() === 0) valB = currentSortCriteria.direction === 'asc' ? new Date(8640000000000000) : new Date(-8640000000000000);
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


    const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE);
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    const jobsToShowOnPage = sortedJobs.slice(startIndex, endIndex);

    if (jobsToShowOnPage.length === 0) {
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = "ℹ️ Keine Jobs entsprechen den aktuellen Kriterien für diesen Tab.";
        noJobsMessage.classList.add('job-entry', 'visible');
        appContainer.appendChild(noJobsMessage);
    } else {
        const fragment = document.createDocumentFragment();
        jobsToShowOnPage.forEach(({ appId, jobData }) => { 
            if (!jobData || jobData.error) {
                 return;
            }
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
                fieldDivItem.classList.add("db-table-row-item", `item-${field.key}`);
                const fieldText = document.createElement("span"); 

                if (field.key === "job-payment") {
                    fieldText.classList.add("job-tag", "customer");
                    fieldText.textContent = value ? `${value} €` : "N/A";
                } else if (field.key === "job-date-end") {
                    const deadlineInfo = calculateDeadlineCountdown(value);
                    fieldText.classList.add("job-tag"); 
                    if (deadlineInfo.isExpired) {
                        fieldText.classList.add("is-bg-light-red");
                    }
                    fieldText.textContent = deadlineInfo.text;
                } else if (field.key === "fertigstellung-content") {
                    fieldText.classList.add("job-tag", "customer"); 
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
                    statusDiv.appendChild(statusTextInner); fieldDivItem.appendChild(statusDiv);
                } else if (field.key === "application-status") {
                    const statusDiv = document.createElement("div"); statusDiv.classList.add("job-tag");
                    const statusTextInner = document.createElement("span");
                    const appStatus = getApplicationStatusForFilter(jobData, webflowMemberId);
                    if (appStatus === "Angenommen") { statusDiv.classList.add("is-bg-light-green"); statusTextInner.textContent = "Angenommen"; }
                    else if (appStatus === "Abgelehnt") { statusDiv.classList.add("is-bg-light-red"); statusTextInner.textContent = "Abgelehnt"; }
                    else { statusDiv.classList.add("is-bg-light-blue"); statusTextInner.textContent = "Ausstehend"; }
                    statusDiv.appendChild(statusTextInner); fieldDivItem.appendChild(statusDiv);
                } else { 
                    fieldText.classList.add("db-job-tag-txt");
                    fieldText.textContent = value || "Nicht verfügbar";
                }

                if (field.key !== "job-status" && field.key !== "application-status") {
                    if (fieldText.textContent || fieldText.classList.length > 0) { 
                         fieldDivItem.appendChild(fieldText);
                    }
                }
                jobDiv.appendChild(fieldDivItem);
            });
            
            const applicantDisplayCell = document.createElement("div");
            applicantDisplayCell.classList.add("db-table-row-item", "item-job-applicant-display");

            const applicantListContainer = document.createElement("div");
            applicantListContainer.classList.add("db-bewerber-count-list");

            const listWrapper = document.createElement("div");
            listWrapper.classList.add("db-bewerber-list-wrapper");

            const collList = document.createElement("div");
            collList.classList.add("db-bewerber-count-coll-list");
            listWrapper.appendChild(collList);
            applicantListContainer.appendChild(listWrapper);

            const applicantCountText = document.createElement("span");
            applicantCountText.classList.add("is-txt-16"); 
            
            const applicantIds = jobData['bewerber'] || []; 
            applicantCountText.textContent = `${applicantIds.length} Bewerber`;
            applicantListContainer.appendChild(applicantCountText);
            
            applicantDisplayCell.appendChild(applicantListContainer);
            jobDiv.appendChild(applicantDisplayCell);

            renderJobApplicantImages(jobData, collList);


            jobLink.appendChild(jobDiv);
            fragment.appendChild(jobLink);
        });
        appContainer.appendChild(fragment);
        requestAnimationFrame(() => {
            const newEntries = appContainer.querySelectorAll('.job-entry:not(.visible)');
            newEntries.forEach(entry => entry.classList.add('visible'));
        });
    }

    const paginationContainer = document.getElementById("pagination-controls-container") || createPaginationContainer();
    renderPaginationControls(paginationContainer, currentPage, totalPages);
}

function createPaginationContainer() {
    let container = document.getElementById("pagination-controls-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "pagination-controls-container";
        container.className = "db-table-pagination"; 
        const firstTabContainer = document.getElementById(TABS_CONFIG[0].listContainerId);
        if (firstTabContainer && firstTabContainer.parentNode) {
             firstTabContainer.parentNode.appendChild(container);
        } else {
            const bodyFirstChild = document.body.firstChild;
            if (bodyFirstChild) document.body.insertBefore(container, bodyFirstChild.nextSibling);
            else document.body.appendChild(container);
        }
    }
    return container;
}

function renderActiveTabContent() {
    const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    if (!activeTabConfig) {
        console.error("Aktiver Tab nicht in Konfiguration gefunden:", activeTabId);
        return;
    }

    const targetListElement = document.getElementById(activeTabConfig.listId);
    if (!targetListElement) {
        console.error("Ziellisten-Element für Tab nicht gefunden:", activeTabConfig.listId);
        return;
    }
    
    renderSkeletonLoader(targetListElement, JOBS_PER_PAGE);

    const jobsForThisTab = allJobResults.filter(result => {
        return result.jobData && !result.jobData.error && activeTabConfig.filterFn(result.jobData, currentWebflowMemberId);
    });
    
    setTimeout(() => {
        renderJobs(jobsForThisTab, currentWebflowMemberId, activeTabConfig.listId);
    }, 50); 
}

async function initializeUserApplications() {
    const initialTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
    const initialListElement = initialTabConfig ? document.getElementById(initialTabConfig.listId) : null;
    const itemCountElement = document.querySelector('[data-db-table-item-count]');

    if (itemCountElement) {
        itemCountElement.textContent = "..."; 
    }

    if (initialListElement) {
        renderSkeletonLoader(initialListElement, JOBS_PER_PAGE);
    } else {
        const fallbackListElement = document.getElementById(TABS_CONFIG[0].listId);
        if (fallbackListElement) renderSkeletonLoader(fallbackListElement, JOBS_PER_PAGE);
        else console.error("FEHLER: Initialer App-Container für Skeleton nicht im DOM gefunden.");
    }
    
    try {
        if (window.$memberstackDom && typeof window.$memberstackDom.getCurrentMember === 'function') {
            const member = await window.$memberstackDom.getCurrentMember();
            currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
            if (!currentWebflowMemberId) console.warn("⚠️ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
        } else { console.warn("⚠️ MemberStack (window.$memberstackDom.getCurrentMember) ist nicht verfügbar."); }

        let applicationsFromUser = [];
        if (currentWebflowMemberId) {
            const userData = await fetchCollectionItem(USER_COLLECTION_ID, currentWebflowMemberId);
            const userFieldData = userData?.item?.fieldData || userData?.fieldData;
            applicationsFromUser = userFieldData?.["abgeschlossene-bewerbungen"] || [];
        }

        if (applicationsFromUser.length > 0) {
            allJobResults = await fetchIndividualJobsInBatches(applicationsFromUser); 
            
            const validJobResults = allJobResults.filter(result => result.jobData && !result.jobData.error && Object.keys(result.jobData).length > 2);
            const erroredJobsCount = allJobResults.length - validJobResults.length;

            if (erroredJobsCount > 0) {
                console.warn(`${erroredJobsCount} Jobs konnten nicht korrekt geladen werden oder hatten Fehler (Rate-Limit sehr wahrscheinlich).`);
            }
            allJobResults = validJobResults; 
            
            if (itemCountElement) {
                itemCountElement.textContent = allJobResults.length;
            }
            
            currentPage = 1;
            renderActiveTabContent();
        } else {
            if (initialListElement) initialListElement.innerHTML = ""; 
            else if (document.getElementById(TABS_CONFIG[0].listId)) document.getElementById(TABS_CONFIG[0].listId).innerHTML = "";

            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = "Keine abgeschlossenen Bewerbungen gefunden oder keine Jobs zum Anzeigen.";
            noJobsMessage.classList.add('job-entry', 'visible');
            
            const firstTabList = document.getElementById(TABS_CONFIG[0].listId);
            if (firstTabList) {
                firstTabList.appendChild(noJobsMessage);
            } else {
                 console.error("Konnte 'Keine Jobs'-Nachricht nicht im ersten Tab anzeigen.");
            }
            
            if (itemCountElement) {
                itemCountElement.textContent = "0";
            }

            const paginationContainer = document.getElementById("pagination-controls-container");
            if (paginationContainer) paginationContainer.innerHTML = "";
        }
    } catch (error) {
        console.error("❌ Schwerwiegender Fehler beim Laden der Bewerbungen:", error);
        if (initialListElement) initialListElement.innerHTML = "";
        const errorMessageText = `❌ Es ist ein Fehler aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.`;
        if (initialListElement) {
            const errorP = document.createElement('p');
            errorP.innerHTML = errorMessageText;
            errorP.classList.add('job-entry', 'visible');
            initialListElement.appendChild(errorP);
        } else {
             const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTabId);
             const currentListElement = activeTabConfig ? document.getElementById(activeTabConfig.listId) : null;
             if(currentListElement) {
                currentListElement.innerHTML = `<p class="job-entry visible">${errorMessageText}</p>`;
             }
        }
        if (itemCountElement) {
            itemCountElement.textContent = "0"; 
        }
    }
}

function setupEventListeners() {
    // Event Listener für ALLE gleichartigen Filterelemente über alle Tabs hinweg.
    // Die Logik in renderJobs() kümmert sich darum, die Werte der Filter des AKTIVEN Tabs zu lesen.
    
    // Suchfelder (Annahme: Klasse .filter-search-input für alle Suchfelder)
    document.querySelectorAll(`.${FILTER_BASE_IDS.search}`).forEach(input => {
        input.addEventListener("input", () => {
            currentPage = 1;
            renderActiveTabContent();
        });
    });

    // Checkbox-Filter
    const allFilterCheckboxes = [];
    TABS_CONFIG.forEach(tab => {
        Object.values(FILTER_BASE_IDS).forEach(baseId => {
            if (baseId === FILTER_BASE_IDS.search) return; // Suchfeld schon oben behandelt
            const el = document.getElementById(`${baseId}-${tab.id}`);
            if (el) allFilterCheckboxes.push(el);
        });
    });

    allFilterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            currentPage = 1; 
            renderActiveTabContent();
        });
    });

    // Sortier-Checkboxen
    const allSortCheckboxes = [];
     TABS_CONFIG.forEach(tab => {
        Object.values(SORT_BASE_IDS).forEach(baseId => {
            const el = document.getElementById(`${baseId}-${tab.id}`);
            if (el) {
                // Dynamisch data-Attribute setzen, falls nicht schon im HTML
                // (basierend auf der Annahme, dass die ID-Struktur die Sortierlogik impliziert)
                if (!el.dataset.sortKey) {
                    if (baseId.includes("deadline")) el.dataset.sortKey = "deadline";
                    else if (baseId.includes("content")) el.dataset.sortKey = "content";
                    else if (baseId.includes("budget")) el.dataset.sortKey = "budget";
                }
                if (!el.dataset.sortDirection) {
                     if (baseId.includes("asc")) el.dataset.sortDirection = "asc";
                     else if (baseId.includes("desc")) el.dataset.sortDirection = "desc";
                }
                allSortCheckboxes.push(el);
            }
        });
    });


    allSortCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const targetCheckbox = event.target;
            const targetTabId = TABS_CONFIG.find(tab => targetCheckbox.id.endsWith(tab.id))?.id;

            if (targetTabId !== activeTabId) {
                // Wenn ein Sortierfilter in einem inaktiven Tab geändert wird,
                // nur den Status dieser Checkbox aktualisieren, aber nicht sofort neu rendern oder andere deaktivieren.
                // Das Deaktivieren anderer Sortieroptionen geschieht nur für den aktiven Tab.
                return;
            }

            if (targetCheckbox.checked) {
                // Deaktiviere andere Sortier-Checkboxes NUR im AKTIVEN Tab
                allSortCheckboxes.forEach(otherCb => {
                    const otherCbTabId = TABS_CONFIG.find(tab => otherCb.id.endsWith(tab.id))?.id;
                    if (otherCb !== targetCheckbox && otherCbTabId === activeTabId) {
                        otherCb.checked = false;
                    }
                });
            }
            currentPage = 1;
            renderActiveTabContent(); // Re-render active tab with new sort criteria
        });
    });


    const tabLinks = document.querySelectorAll(".tab-link[data-tab-id]");
    tabLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const newTabId = link.dataset.tabId;
            if (newTabId === activeTabId) { 
                 const currentListContent = document.getElementById(TABS_CONFIG.find(t => t.id === newTabId).listId);
                 if(currentListContent && currentListContent.children.length > 0 && !currentListContent.querySelector('.skeleton-row')) { 
                    return;
                 }
            }

            activeTabId = newTabId;
            currentPage = 1; 

            tabLinks.forEach(tl => tl.classList.remove("active-tab")); 
            link.classList.add("active-tab");

            TABS_CONFIG.forEach(tabConfig => {
                const contentContainer = document.getElementById(tabConfig.listContainerId);
                if (contentContainer) {
                    contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
                } else {
                    console.warn(`Listen-Container ${tabConfig.listContainerId} für Tab ${tabConfig.id} nicht gefunden.`);
                }
            });
            renderActiveTabContent();
        });
    });

    // Warnungen für fehlende Elemente (optional, zur Entwicklungszeit hilfreich)
    // if (tabLinks.length === 0 && TABS_CONFIG.length > 1) console.warn("⚠️ Keine Tab-Links mit 'data-tab-id' gefunden. Tab-Navigation wird nicht funktionieren.");
    // TABS_CONFIG.forEach(tab => {
    //     Object.values(FILTER_BASE_IDS).forEach(baseId => {
    //         if (!document.getElementById(`${baseId}-${tab.id}`)) console.warn(`⚠️ Filter-Element '${baseId}-${tab.id}' nicht im DOM gefunden.`);
    //     });
    //      Object.values(SORT_BASE_IDS).forEach(baseId => {
    //         if (!document.getElementById(`${baseId}-${tab.id}`)) console.warn(`⚠️ Sortier-Element '${baseId}-${tab.id}' nicht im DOM gefunden.`);
    //     });
    //     if (!document.getElementById(tab.listId)) console.warn(`⚠️ Listen-Element für Tab '${tab.name}' (ID: ${tab.listId}) nicht im DOM gefunden.`);
    //     if (!document.getElementById(tab.listContainerId)) console.warn(`⚠️ Listen-Container-Element für Tab '${tab.name}' (ID: ${tab.listContainerId}) nicht im DOM gefunden.`);
    // });

}

window.addEventListener("DOMContentLoaded", () => {
    TABS_CONFIG.forEach(tabConfig => {
        const contentContainer = document.getElementById(tabConfig.listContainerId);
        if (contentContainer) {
            contentContainer.style.display = tabConfig.id === activeTabId ? "" : "none";
        }
    });
    const initialActiveTabLink = document.querySelector(`.tab-link[data-tab-id="${activeTabId}"]`);
    if(initialActiveTabLink) initialActiveTabLink.classList.add("active-tab");


    initializeUserApplications();
    setupEventListeners();
    createPaginationContainer(); 
});
