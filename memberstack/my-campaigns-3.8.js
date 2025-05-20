// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://meine-kampagnen.oliver-258.workers.dev/";
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525"; 
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526"; 
const SKELETON_JOBS_COUNT_MJ = 3;
const API_CALL_DELAY_MS = 550; 
let currentApplicantPageSize = 15; 

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = []; 
let jobDataCache = {}; // { jobId: { allItems: [], sortedAndFilteredItems: [], activeFilters: {} } }


// --- Mapping-Konfigurationen ---
const MAPPINGS = {
    followerRanges: {
        "4b742e0670e6172d81112005c1be62c0": "0 - 2.500",
        "b07d2c7b0cdc43e2c496bb3aa798f672": "2.500 - 5.000",
        "f3ecc03ef887ee305600d3c0342836d7": "5.000 - 10.000",
        "251f07f2aa5a2c7ab22bf1ad6dd29688": "10.000 - 25.000",
        "92f7d061cb8be70f6ffe29992e313f30": "25.000 - 50.000",
        "ce3977740d475283d1e1fc1410ffef3c": "50.000 - 100.000",
        "d279846f40353aa3cffc22ee2d8ea564": "100.000 - 250.000",
        "cc74dfe0b4fe308ac66e11ba55419501": "250.000 - 500.000",
        "24bdb369f9cdb37e28678b8d1fba0308": "500.000 - 1.000.000",
        "0f579a02ba3055cf32347301e34ce262": "1.000.000+",
        "126e325d19f997cd4158ebd2f6bc43c8": "0"
    },
    bundeslaender: {
        "ad69af181ec0a76ead7ca0808f9322d5": "Baden-Württemberg",
        "4ed09f2799f39cd4458f3e590563b0a7": "Bayern",
        "8c1ff8264b84de6bbffd30ff9e315c44": "Berlin",
        "76951a563940804aa945c925a4eaa52c": "Brandenburg",
        "e2dd8f0b080138d125c58421c45e9060": "Bremen",
        "e1eb8fe3d24f911f99395fad2d0c84f9": "Hamburg",
        "17f378f66aeb54c4f513f3e1d94a8885": "Hessen",
        "e5f9b206a121c4d3ded9fd18258fb76a": "Mecklenburg-Vorpommern",
        "5069427f38715209276132e26184ee1d": "Niedersachsen",
        "54f3ea7a90d2bc63ec97195e2de1a3a3": "Nordrhein-Westfalen",
        "b3801d7ef0176c308a5115b0a9307a5f": "Rheinland-Pfalz",
        "42b8ac1c54146db14db5f11c20af1d23": "Saarland",
        "ab6c9a1c2a60464b33d02c3097d648ca": "Sachsen",
        "ab852edb71d3280bfe41083c793a4961": "Sachsen-Anhalt",
        "d44e3e9bad2c19f3502da1c8d5832311": "Schleswig-Holstein",
        "070d97b7c9dd6ee1e87625e64029b1f2": "Thüringen"
    },
    laender: {
        "ff0fb336a4f4329e373519e2f4f146d0": "Deutschland",
        "f6cdc4f895b295eda5035ecde8a638bc": "Schweiz",
        "4e353955e21323d2805e89a1b5d2f0ed": "Österreich"
    },
    altersgruppen: {
        "c9ae1533c4edb215bc978af50ead8e11": "18 - 24",
        "f4bd16f836e299f51469985cffb7bebc": "25 - 35",
        "d20369fd239006b5f3eda9dbb532cb60": "36 - 50",
        "5744f42d22c8da504632912511a80667": "50+",
        "d8e4582c524ded37c12c2bd414ac4287": "Keine Angabe"
    },
    creatorTypen: {
        "ad1b8266d488daebad7c20c21ffa75c9": "UGC Creator",
        "126c5ed961ae4a5a100ec61f98bb0413": "Content Creator",
        "e2e05ef792fcc0e7e889945a53108133": "Influencer",
        "ee3384b6b32fb943768222af908ed2c3": "Model",
        "04dcb25068e192ec3ae1571d8bab7def": "Fotograf",
        "48e29cee99112e44c5d7cd505e9f2442": "Videograf",
        "29ad386dd5d90248db0ff689bbbbf68d": "Keine Angabe"
    },
    sprachen: {
        "1c8e60afd27397cecf0172584d642461": "Deutsch",
        "c80924ee660d3514aae61540d9b3d114": "Englisch"
    }
};

// --- Hilfsfunktionen ---
function buildWorkerUrl_MJ(apiUrl) {
    const baseUrl = WORKER_BASE_URL_MJ.endsWith('/') ? WORKER_BASE_URL_MJ : WORKER_BASE_URL_MJ + '/';
    return `${baseUrl}?url=${encodeURIComponent(apiUrl)}`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
}

async function fetchWebflowItem(collectionId, itemId) {
    if (!itemId) {
        console.warn(`Ungültige Item-ID für Collection ${collectionId} übergeben.`);
        return null; 
    }
    const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl_MJ(apiUrl);
    try {
        const response = await fetch(workerUrl);
        if (!response.ok) {
            if (response.status === 404) {
                return { id: itemId, error: true, status: 404, message: `Item ${itemId} not found.` };
            }
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
            if (response.status === 429) {
                console.warn(`Rate limit getroffen bei Item ${itemId}.`);
                return { error: true, status: 429, message: "Too Many Requests for item " + itemId, id: itemId };
            }
            return { id: itemId, error: true, status: response.status, message: `API Error for item ${itemId}: ${errorText}` };
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Netzwerkfehler oder anderer Fehler beim Abrufen des Items (${collectionId}/${itemId}): ${error.message}`);
        return { id: itemId, error: true, status: 'network_error', message: `Network error for item ${itemId}: ${error.message}` };
    }
}

// --- Skeleton Loader ---
function renderMyJobsSkeletonLoader(container, count) {
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item-skeleton", "skeleton-row", "job-entry");
        const jobHeader = document.createElement("div");
        jobHeader.classList.add("db-table-row", "db-table-my-job");
        const jobNameDiv = document.createElement("div");
        jobNameDiv.classList.add("db-table-row-item", "justify-left");
        const skeletonJobImage = document.createElement("div");
        skeletonJobImage.classList.add("db-table-img", "is-margin-right-12", "skeleton-element", "skeleton-image");
        jobNameDiv.appendChild(skeletonJobImage);
        const skeletonJobName = document.createElement("div");
        skeletonJobName.classList.add("truncate", "skeleton-element", "skeleton-text", "skeleton-text-title");
        jobNameDiv.appendChild(skeletonJobName);
        jobHeader.appendChild(jobNameDiv);
        const paymentDiv = document.createElement("div");
        paymentDiv.classList.add("db-table-row-item");
        const skeletonPayment = document.createElement("div");
        skeletonPayment.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        paymentDiv.appendChild(skeletonPayment);
        jobHeader.appendChild(paymentDiv);
        const placeholder1 = document.createElement("div"); 
        placeholder1.classList.add("db-table-row-item");
        const skeletonText1 = document.createElement("div");
        skeletonText1.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        placeholder1.appendChild(skeletonText1);
        jobHeader.appendChild(placeholder1);
        const placeholder2 = document.createElement("div"); 
        placeholder2.classList.add("db-table-row-item");
        const skeletonText2 = document.createElement("div");
        skeletonText2.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        placeholder2.appendChild(skeletonText2);
        jobHeader.appendChild(placeholder2);
        const categoryDiv = document.createElement("div");
        categoryDiv.classList.add("db-table-row-item");
        const skeletonCategory = document.createElement("div");
        skeletonCategory.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        categoryDiv.appendChild(skeletonCategory);
        jobHeader.appendChild(categoryDiv);
        const statusDiv = document.createElement("div");
        statusDiv.classList.add("db-table-row-item");
        const skeletonStatusTag = document.createElement("div");
        skeletonStatusTag.classList.add("job-tag", "skeleton-element", "skeleton-tag-box");
        statusDiv.appendChild(skeletonStatusTag);
        jobHeader.appendChild(statusDiv);
        const applicantsCountDiv = document.createElement("div");
        applicantsCountDiv.classList.add("db-table-row-item");
        const skeletonApplicantsCount = document.createElement("div");
        skeletonApplicantsCount.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        applicantsCountDiv.appendChild(skeletonApplicantsCount);
        jobHeader.appendChild(applicantsCountDiv);
        jobWrapper.appendChild(jobHeader);
        const skeletonPaginationRow = document.createElement("div");
        skeletonPaginationRow.classList.add("applicants-toggle-row-skeleton", "skeleton-element"); 
        skeletonPaginationRow.style.height = "30px"; 
        skeletonPaginationRow.style.width = "200px"; 
        skeletonPaginationRow.style.margin = "10px auto";
        jobWrapper.appendChild(skeletonPaginationRow);
        container.appendChild(jobWrapper);
    }
}

// --- Rendering-Funktionen ---
function createApplicantRowElement(applicantFieldData) {
    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");

    applicantDiv.addEventListener('click', (event) => {
        if (event.target.closest('a.db-application-option')) {
            return;
        }
        const slug = applicantFieldData.slug;
        if (slug) {
            const profileUrl = `https://www.creatorjobs.com/members/${slug}`;
            window.open(profileUrl, '_blank');
        } else {
            console.warn("Kein Slug für Bewerber gefunden, kann Profil nicht öffnen:", applicantFieldData.name);
        }
    });

    if (typeof MAPPINGS === 'undefined') {
        console.error("❌ MAPPINGS-Objekt ist nicht definiert.");
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Fehler: Mapping-Daten nicht verfügbar.";
        applicantDiv.appendChild(errorDiv);
        return applicantDiv;
    }

    const profileInfoDiv = document.createElement("div");
    profileInfoDiv.classList.add("db-table-row-item", "justify-left");

    const profileImageField = applicantFieldData["image-thumbnail-small-92px"] || applicantFieldData["user-profile-img"];
    if (profileImageField) {
        const applicantImg = document.createElement("img");
        applicantImg.classList.add("db-table-img", "is-margin-right-12");
        applicantImg.src = typeof profileImageField === 'string' ? profileImageField : profileImageField?.url;
        applicantImg.alt = applicantFieldData.name || "Bewerberbild";
        profileInfoDiv.appendChild(applicantImg);
    }

    const namePlusStatusDiv = document.createElement("div");
    namePlusStatusDiv.classList.add("is-flexbox-vertical");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = applicantFieldData.name || "Unbekannter Bewerber";
    nameSpan.classList.add("truncate");
    namePlusStatusDiv.appendChild(nameSpan);
    const plusStatusSpan = document.createElement("span");
    plusStatusSpan.classList.add("is-txt-tiny");
    plusStatusSpan.textContent = applicantFieldData["plus-mitglied"] ? "Plus Mitglied" : "Standard";
    namePlusStatusDiv.appendChild(plusStatusSpan);
    profileInfoDiv.appendChild(namePlusStatusDiv);
    applicantDiv.appendChild(profileInfoDiv);

    const locationDiv = document.createElement("div");
    locationDiv.classList.add("db-table-row-item");
    const city = applicantFieldData["user-city-2"] || "K.A.";
    const bundeslandId = applicantFieldData["bundesland-option"];
    const bundeslandName = MAPPINGS.bundeslaender[bundeslandId] || (bundeslandId ? bundeslandId : "K.A.");
    locationDiv.textContent = `${city}${bundeslandName !== "K.A." ? `, ${bundeslandName}` : ""}`;
    applicantDiv.appendChild(locationDiv);

    const categoryCell = document.createElement("div");
    categoryCell.classList.add("db-table-row-item");
    const categoryTag = document.createElement("span");
    categoryTag.classList.add("job-tag", "customer");
    categoryTag.textContent = applicantFieldData["creator-main-categorie"] || "K.A.";
    categoryCell.appendChild(categoryTag);
    applicantDiv.appendChild(categoryCell);

    const creatorTypeCell = document.createElement("div");
    creatorTypeCell.classList.add("db-table-row-item");
    const creatorTypeTag = document.createElement("span");
    creatorTypeTag.classList.add("job-tag", "customer");
    const creatorTypeId = applicantFieldData["creator-type"];
    creatorTypeTag.textContent = MAPPINGS.creatorTypen[creatorTypeId] || (creatorTypeId ? creatorTypeId : "K.A.");
    creatorTypeCell.appendChild(creatorTypeTag);
    applicantDiv.appendChild(creatorTypeCell);

    const socialCell = document.createElement("div");
    socialCell.classList.add("db-table-row-item");
    const socialPlatforms = [
        { key: "instagram", name: "Instagram", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e8d979b71d2a7e5db3_Instagram.svg" },
        { key: "tiktok", name: "TikTok", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e99dce86c2b6ba83fe_Tiktok.svg" },
        { key: "youtube", name: "YouTube", iconUrl: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e9b00d0480ffe289dc_YouTube.svg" }
    ];
    socialPlatforms.forEach(platform => {
        const platformUrlValue = applicantFieldData[platform.key];
        const normalizedPlatformUrl = normalizeUrl(platformUrlValue);
        if (normalizedPlatformUrl) {
            const socialLink = document.createElement("a");
            socialLink.href = normalizedPlatformUrl;
            socialLink.classList.add("db-application-option", "no-icon", "w-inline-block");
            socialLink.target = "_blank";
            socialLink.rel = "noopener noreferrer";
            const iconImg = document.createElement("img");
            iconImg.src = platform.iconUrl;
            iconImg.alt = `${platform.name} Profil`;
            iconImg.classList.add("db-icon-18");
            socialLink.appendChild(iconImg);
            socialCell.appendChild(socialLink);
        }
    });
    applicantDiv.appendChild(socialCell);

    const followerCell = document.createElement("div");
    followerCell.classList.add("db-table-row-item");
    const followerTag = document.createElement("span");
    followerTag.classList.add("job-tag", "customer");
    const followerId = applicantFieldData["creator-follower"];
    followerTag.textContent = MAPPINGS.followerRanges[followerId] || (followerId ? followerId : "K.A.");
    followerCell.appendChild(followerTag);
    applicantDiv.appendChild(followerCell);

    const ageCell = document.createElement("div");
    ageCell.classList.add("db-table-row-item");
    const ageTag = document.createElement("span");
    ageTag.classList.add("job-tag", "customer");
    const ageId = applicantFieldData["creator-age"];
    ageTag.textContent = MAPPINGS.altersgruppen[ageId] || (ageId ? ageId : "K.A.");
    ageCell.appendChild(ageTag);
    applicantDiv.appendChild(ageCell);

    return applicantDiv;
}

function createApplicantTableHeaderElement(jobId) { // jobId hinzugefügt für Filter-IDs
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("db-table-header", "db-table-applicant");

    const columns = [
        { text: "Creator", filter: false },
        { text: "Location", filter: false },
        { text: "Kategorie", filter: false },
        { text: "Creator Type", filter: false },
        { text: "Social Media", filter: false },
        { text: "Follower", filter: true, filterType: "followerRanges" }, // Filter hier markieren
        { text: "Alter", filter: false }
    ];

    columns.forEach(colConfig => {
        const colDiv = document.createElement("div");
        colDiv.classList.add("db-table-row-item"); // Grundklasse für alle Spalten

        if (colConfig.filter && colConfig.filterType === "followerRanges") {
            colDiv.classList.add("db-table-filter-wrapper"); // Deine Wrapper-Klasse

            const filterText = document.createElement("span");
            filterText.classList.add("is-txt-16", "is-txt-bold"); // Textklasse
            filterText.textContent = colConfig.text;
            colDiv.appendChild(filterText);

            // Hier könnte ein Icon für den Dropdown-Pfeil hinzugefügt werden
            // const filterIcon = document.createElement("img");
            // filterIcon.src = "url-zum-dropdown-pfeil.svg";
            // colDiv.appendChild(filterIcon);


            const dropdownList = document.createElement("div");
            dropdownList.classList.add("db-filter-dropdown-list");
            dropdownList.style.display = "none"; // Initial versteckt

            Object.entries(MAPPINGS.followerRanges).forEach(([id, rangeText]) => {
                if (rangeText === "0") return; // "0" nicht als Filteroption anzeigen

                const optionDiv = document.createElement("div");
                optionDiv.classList.add("db-filter-option");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.classList.add("db-filter-checkbox");
                checkbox.id = `filter-${jobId}-follower-${id}`; // Eindeutige ID
                checkbox.dataset.filterValue = id;
                checkbox.dataset.filterType = "follower"; // Typ für spätere Filterlogik

                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                label.classList.add("is-txt-16");
                label.textContent = rangeText;
                
                // Checkbox-Event-Listener (Funktionalität kommt später)
                checkbox.addEventListener("change", (event) => {
                    console.log(`Filter geändert: Job ${jobId}, Follower ${id}, Aktiv: ${event.target.checked}`);
                    // Hier würde die Filterlogik aufgerufen werden
                    // applyFiltersAndReloadApplicants(jobId);
                });

                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(label);
                dropdownList.appendChild(optionDiv);
            });
            colDiv.appendChild(dropdownList);

            // Event Listener zum Öffnen/Schließen des Dropdowns
            filterText.addEventListener("click", (e) => {
                e.stopPropagation(); // Verhindert, dass Klick auf andere Elemente durchschlägt
                dropdownList.style.display = dropdownList.style.display === "none" ? "block" : "none";
            });
            // Schließen, wenn außerhalb geklickt wird
            document.addEventListener("click", (e) => {
                if (!colDiv.contains(e.target)) {
                    dropdownList.style.display = "none";
                }
            });


        } else {
            // Normale Spaltenüberschrift
            const textSpan = document.createElement("span");
            textSpan.classList.add("is-txt-16", "is-txt-bold");
            textSpan.textContent = colConfig.text;
            colDiv.appendChild(textSpan);
        }
        headerDiv.appendChild(colDiv);
    });
    return headerDiv;
}


async function renderPaginationControls(jobId, displayedItemsArray, applicantsContentElement, paginationWrapper, currentPage, totalPages) {
    if (!paginationWrapper) {
        return;
    }
    paginationWrapper.innerHTML = ''; 
    paginationWrapper.style.display = totalPages <= 1 ? "none" : "flex"; 

    if (totalPages <= 1) {
        return;
    }

    const prevButton = document.createElement("a");
    prevButton.href = "#"; 
    prevButton.classList.add("db-pagination-count", "button-prev"); 
    prevButton.textContent = "Zurück";
    if (currentPage === 1) {
        prevButton.classList.add("disabled"); 
    } else {
        prevButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (prevButton.classList.contains("disabled-loading")) return;
            prevButton.classList.add("disabled-loading");
            prevButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, applicantsContentElement.parentElement, paginationWrapper, currentPage - 1);
        });
    }
    paginationWrapper.appendChild(prevButton);

    const MAX_VISIBLE_PAGES = 5; 
    let startPage, endPage;

    if (totalPages <= MAX_VISIBLE_PAGES) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrentPage = Math.floor(MAX_VISIBLE_PAGES / 2);
        const maxPagesAfterCurrentPage = Math.ceil(MAX_VISIBLE_PAGES / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrentPage) {
            startPage = 1;
            endPage = MAX_VISIBLE_PAGES;
        } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
            startPage = totalPages - MAX_VISIBLE_PAGES + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    if (startPage > 1) {
        const firstPageLink = document.createElement("a");
        firstPageLink.href = "#";
        firstPageLink.classList.add("db-pagination-count");
        firstPageLink.textContent = "1";
        firstPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
            if (firstPageLink.classList.contains("disabled-loading") || firstPageLink.classList.contains("current")) return;
            paginationWrapper.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            firstPageLink.textContent = "..."; 
            await loadAndDisplayApplicantsForJob(jobId, applicantsContentElement.parentElement, paginationWrapper, 1);
        });
        paginationWrapper.appendChild(firstPageLink);
        if (startPage > 2) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis"); 
            ellipsisSpan.textContent = "...";
            paginationWrapper.appendChild(ellipsisSpan);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement("a");
        pageLink.href = "#";
        pageLink.classList.add("db-pagination-count");
        pageLink.textContent = i;
        if (i === currentPage) {
            pageLink.classList.add("current"); 
        } else {
            pageLink.addEventListener("click", async (e) => {
                e.preventDefault();
                if (pageLink.classList.contains("disabled-loading")) return;
                paginationWrapper.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
                pageLink.textContent = "..."; 
                await loadAndDisplayApplicantsForJob(jobId, applicantsContentElement.parentElement, paginationWrapper, i);
            });
        }
        paginationWrapper.appendChild(pageLink);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisSpan = document.createElement("span");
            ellipsisSpan.classList.add("db-pagination-count", "ellipsis");
            ellipsisSpan.textContent = "...";
            paginationWrapper.appendChild(ellipsisSpan);
        }
        const lastPageLink = document.createElement("a");
        lastPageLink.href = "#";
        lastPageLink.classList.add("db-pagination-count");
        lastPageLink.textContent = totalPages;
        lastPageLink.addEventListener("click", async (e) => {
            e.preventDefault();
             if (lastPageLink.classList.contains("disabled-loading") || lastPageLink.classList.contains("current")) return;
            paginationWrapper.querySelectorAll('.db-pagination-count:not(.ellipsis)').forEach(el => el.classList.add("disabled-loading"));
            lastPageLink.textContent = "...";
            await loadAndDisplayApplicantsForJob(jobId, applicantsContentElement.parentElement, paginationWrapper, totalPages);
        });
        paginationWrapper.appendChild(lastPageLink);
    }

    const nextButton = document.createElement("a");
    nextButton.href = "#";
    nextButton.classList.add("db-pagination-count", "button-next"); 
    nextButton.textContent = "Weiter";
    if (currentPage === totalPages) {
        nextButton.classList.add("disabled");
    } else {
        nextButton.addEventListener("click", async (e) => {
            e.preventDefault();
            if (nextButton.classList.contains("disabled-loading")) return;
            nextButton.classList.add("disabled-loading");
            nextButton.textContent = "Lade...";
            await loadAndDisplayApplicantsForJob(jobId, applicantsContentElement.parentElement, paginationWrapper, currentPage + 1);
        });
    }
    paginationWrapper.appendChild(nextButton);
}

async function fetchAllApplicantsForJob(jobId, applicantIds) {
    console.log(`DEBUG: fetchAllApplicantsForJob START - Job ID: ${jobId}, Anzahl IDs: ${applicantIds.length}`);
    const fetchedItems = [];
    let successfulFetches = 0;
    if (applicantIds.length > 0) {
        // Um die API-Rate-Limits nicht zu überschreiten, laden wir in Chunks mit Delays
        // oder sequenziell mit Delays. Für globale Sortierung ist sequenziell mit Delay sicherer.
        for (const applicantId of applicantIds) {
            // Ein kleinerer Delay hier, da dies ein einmaliger Ladevorgang pro Job ist.
            // Das Haupt-Delay ist zwischen den Aktionen des Nutzers (Seitenwechsel, Job öffnen).
            await delay(API_CALL_DELAY_MS / 2); // Z.B. 275ms
            const item = await fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId);
            if (item) { 
                fetchedItems.push(item);
                if (!item.error) successfulFetches++;
            }
        }
    }
    console.log(`DEBUG: fetchAllApplicantsForJob END - Job ID: ${jobId}, ${successfulFetches} von ${applicantIds.length} Items erfolgreich geladen.`);
    return fetchedItems;
}

function sortApplicantsGlobally(applicantItems) {
    // Erstelle eine Kopie, um das Original nicht zu verändern, falls es woanders noch gebraucht wird
    return [...applicantItems].sort((a, b) => {
        // Fehlerobjekte und Objekte ohne fieldData ans Ende sortieren
        const aIsValid = a && a.fieldData && !a.error;
        const bIsValid = b && b.fieldData && !b.error;

        if (aIsValid && !bIsValid) return -1; // a ist gültig, b nicht -> a zuerst
        if (!aIsValid && bIsValid) return 1;  // b ist gültig, a nicht -> b zuerst
        if (!aIsValid && !bIsValid) return 0; // beide ungültig -> Reihenfolge egal

        // Beide sind gültige Items, jetzt nach Plus-Status sortieren
        const aIsPlus = a.fieldData["plus-mitglied"] === true;
        const bIsPlus = b.fieldData["plus-mitglied"] === true;

        if (aIsPlus && !bIsPlus) return -1; // a ist Plus, b nicht -> a zuerst
        if (!aIsPlus && bIsPlus) return 1;  // b ist Plus, a nicht -> b zuerst
        
        // Optional: Sekundäre Sortierung, z.B. nach Name, wenn Plus-Status gleich ist
        // const nameA = a.fieldData.name || '';
        // const nameB = b.fieldData.name || '';
        // return nameA.localeCompare(nameB);
        return 0; 
    });
}


async function loadAndDisplayApplicantsForJob(jobId, applicantsListContainer, paginationWrapper, pageNumber = 1) {
    console.log(`DEBUG: loadAndDisplayApplicantsForJob START - Job ID: ${jobId}, Page: ${pageNumber}`);
    
    const mainToggleButton = document.querySelector(`.my-job-item[data-job-id="${jobId}"] .db-table-applicants`);
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'none';
    
    let applicantsContentElement = applicantsListContainer.querySelector(".actual-applicants-content");
    if (!applicantsContentElement) {
        if (!applicantsListContainer.querySelector(".db-table-header.db-table-applicant")) {
            const headerElement = createApplicantTableHeaderElement(jobId); // jobId übergeben
            applicantsListContainer.insertBefore(headerElement, applicantsListContainer.firstChild);
        }
        applicantsContentElement = document.createElement("div");
        applicantsContentElement.classList.add("actual-applicants-content");
        applicantsListContainer.appendChild(applicantsContentElement);
    }
    
    applicantsContentElement.innerHTML = ''; 
    applicantsListContainer.dataset.currentPage = pageNumber;

    const loadingMessage = document.createElement("p");
    loadingMessage.classList.add("applicants-message");
    loadingMessage.textContent = `Lade Bewerber (Seite ${pageNumber})...`;
    applicantsContentElement.appendChild(loadingMessage);

    const jobCache = jobDataCache[jobId];
    if (!jobCache || !jobCache.sortedAndFilteredItems) {
        console.error(`DEBUG: Keine sortierten/gefilterten Daten im Cache für Job ${jobId} gefunden. Dies sollte nicht passieren, wenn fetchAllApplicantsForJob vorher gelaufen ist.`);
        loadingMessage.textContent = 'Fehler: Bewerberdaten konnten nicht geladen werden (Cache-Problem).';
        if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto';
        return;
    }
    
    const allSortedAndFilteredItems = jobCache.sortedAndFilteredItems;
    const totalPages = Math.ceil(allSortedAndFilteredItems.length / currentApplicantPageSize);
    const offset = (pageNumber - 1) * currentApplicantPageSize;
    const pageItems = allSortedAndFilteredItems.slice(offset, offset + currentApplicantPageSize);
    
    loadingMessage.remove(); 
    
    let validApplicantsRenderedOnThisPage = 0;
    if (pageItems.length > 0) {
        pageItems.forEach(applicant => {
            if (applicant && applicant.fieldData && !applicant.error) {
                const applicantRow = createApplicantRowElement(applicant.fieldData);
                applicantsContentElement.appendChild(applicantRow);
                requestAnimationFrame(() => { 
                    applicantRow.style.opacity = "0"; 
                    requestAnimationFrame(() => {
                        applicantRow.style.transition = "opacity 0.3s ease-in-out";
                        applicantRow.style.opacity = "1";
                    });
                });
                validApplicantsRenderedOnThisPage++;
            } else if (applicant && applicant.error) { // Fehlerobjekte aus fetchAllApplicantsForJob anzeigen
                const errorMsg = document.createElement("p");
                errorMsg.classList.add("applicants-message");
                if (applicant.status === 429) {
                    errorMsg.textContent = `Bewerberdaten (ID: ${applicant.id}) konnten wegen API-Limits nicht geladen werden.`;
                } else if (applicant.status === 404) {
                    errorMsg.textContent = `Bewerber (ID: ${applicant.id}) wurde nicht gefunden.`;
                } else {
                    errorMsg.textContent = applicant.message || `Daten für Bewerber ${applicant.id || 'unbekannt'} konnten nicht geladen werden.`;
                }
                applicantsContentElement.appendChild(errorMsg);
            }
        });
    }
    
    console.log(`DEBUG: Job ${jobId}, Seite ${pageNumber}: ${validApplicantsRenderedOnThisPage} Bewerber gerendert aus ${pageItems.length} Items für diese Seite.`);

    if (validApplicantsRenderedOnThisPage === 0 && allSortedAndFilteredItems.length > 0 && pageItems.length > 0) {
        const noDataMsg = document.createElement("p");
        noDataMsg.classList.add("applicants-message");
        noDataMsg.textContent = "Keine gültigen Bewerberdaten für diese Seite gefunden (möglicherweise Ladefehler für alle auf dieser Seite).";
        applicantsContentElement.appendChild(noDataMsg);
    } else if (allSortedAndFilteredItems.length === 0 && jobCache.allItems && jobCache.allItems.length > 0) {
        // Es gab ursprünglich IDs, aber nach dem Filtern/Laden ist nichts mehr übrig
        const noMatchMsg = document.createElement("p");
        noMatchMsg.classList.add("applicants-message");
        noMatchMsg.textContent = "Keine Bewerber entsprechen den aktuellen Kriterien oder konnten geladen werden.";
        applicantsContentElement.appendChild(noMatchMsg);
        if(paginationWrapper) paginationWrapper.style.display = "none";
    } else if (allSortedAndFilteredItems.length === 0) { // Generell keine Bewerber (auch keine initialen IDs)
         const noApplicantsMsg = document.createElement("p");
        noApplicantsMsg.classList.add("applicants-message");
        noApplicantsMsg.textContent = "Für diesen Job liegen keine Bewerbungen vor.";
        applicantsContentElement.appendChild(noApplicantsMsg);
        if(paginationWrapper) paginationWrapper.style.display = "none";
    }
    
    await renderPaginationControls(jobId, allSortedAndFilteredItems, applicantsContentElement, paginationWrapper, pageNumber, totalPages);
    
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto'; 
    applicantsListContainer.dataset.allApplicantsLoaded = 'true'; // Beibehalten, da alle Daten für den Job im Cache sind
}


function renderMyJobsAndApplicants(jobItems) {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' nicht gefunden.");
        return;
    }
    container.innerHTML = "";

    if (jobItems.length === 0) {
        const noJobsMsg = document.createElement("p");
        noJobsMsg.textContent = "Du hast noch keine Jobs erstellt oder es wurden keine Jobs gefunden.";
        noJobsMsg.classList.add("job-entry", "visible");
        container.appendChild(noJobsMsg);
        return;
    }

    const fragment = document.createDocumentFragment();
    let globalRateLimitMessageShown = false;

    jobItems.forEach(jobItem => {
        if (jobItem.error && jobItem.status === 429) { 
            console.warn(`Job (ID: ${jobItem.id || 'unbekannt'}) konnte wegen Rate Limit nicht geladen werden und wird nicht gerendert.`);
            if (!globalRateLimitMessageShown && !document.getElementById('global-rate-limit-message')) {
                const globalRateLimitInfo = document.createElement("p");
                globalRateLimitInfo.id = 'global-rate-limit-message';
                globalRateLimitInfo.textContent = "Hinweis: Einige Jobdaten konnten aufgrund von API-Anfragelimits nicht geladen werden.";
                globalRateLimitInfo.classList.add("job-entry", "visible", "error-message"); 
                if (container.firstChild) container.insertBefore(globalRateLimitInfo, container.firstChild);
                else container.appendChild(globalRateLimitInfo);
                globalRateLimitMessageShown = true;
            }
            return; 
        }
        
        if (jobItem.error) { 
             console.warn(`Job (ID: ${jobItem.id || 'unbekannt'}) konnte nicht geladen werden: ${jobItem.message}. Er wird nicht gerendert.`);
             return; 
        }

        const jobFieldData = jobItem.fieldData;
        if (!jobFieldData) {
            console.warn("Job-Item ohne fieldData übersprungen:", jobItem);
            return;
        }

        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item", "job-entry");
        jobWrapper.dataset.jobId = jobItem.id; 

        const jobHeaderDiv = document.createElement("div");
        jobHeaderDiv.classList.add("db-table-row", "db-table-my-job");
        
        const jobInfoDataCell = document.createElement("div");
        jobInfoDataCell.classList.add("db-table-row-item", "justify-left");
        if (jobFieldData["job-image"]?.url || jobFieldData["job-image"]) {
            const jobImg = document.createElement("img");
            jobImg.classList.add("db-table-img", "is-margin-right-12");
            jobImg.src = jobFieldData["job-image"].url || jobFieldData["job-image"];
            jobImg.alt = jobFieldData.name || "Job Bild";
            jobInfoDataCell.appendChild(jobImg);
        }
        const jobNameSpan = document.createElement("span");
        jobNameSpan.classList.add("truncate");
        jobNameSpan.textContent = jobFieldData.name || "Unbenannter Job";
        jobInfoDataCell.appendChild(jobNameSpan);
        jobHeaderDiv.appendChild(jobInfoDataCell);

        const paymentCell = document.createElement("div");
        paymentCell.classList.add("db-table-row-item");
        paymentCell.textContent = jobFieldData["job-payment"] ? `${jobFieldData["job-payment"]} €` : "K.A.";
        jobHeaderDiv.appendChild(paymentCell);

        const categoryCell = document.createElement("div");
        categoryCell.classList.add("db-table-row-item");
        categoryCell.textContent = jobFieldData["industrie-kategorie"] || "K.A.";
        jobHeaderDiv.appendChild(categoryCell);

        const statusCell = document.createElement("div");
        statusCell.classList.add("db-table-row-item");
        const statusTag = document.createElement("div");
        statusTag.classList.add("job-tag");
        statusTag.textContent = jobFieldData["job-status"] || "Unbekannt";
        if (jobFieldData["job-status"] === "Aktiv") statusTag.classList.add("is-bg-light-green");
        if (jobFieldData["job-status"] === "Beendet") statusTag.classList.add("is-bg-light-red");
        statusCell.appendChild(statusTag);
        jobHeaderDiv.appendChild(statusCell);

        const applicantIdsForThisSpecificJob = jobFieldData["bewerber"] || [];
        const applicantsCountCell = document.createElement("div");
        applicantsCountCell.classList.add("db-table-row-item");
        applicantsCountCell.textContent = `Bewerber: ${applicantIdsForThisSpecificJob.length}`;
        jobHeaderDiv.appendChild(applicantsCountCell);

        jobWrapper.appendChild(jobHeaderDiv);
        const toggleButtonRow = document.createElement("div");
        toggleButtonRow.classList.add("applicants-toggle-row"); 
        const toggleDivElement = document.createElement("div");
        toggleDivElement.classList.add("db-table-applicants"); 
        
        const toggleTextSpan = document.createElement("span");
        toggleTextSpan.classList.add("is-txt-16");
        toggleTextSpan.textContent = "Bewerberliste anzeigen";
        
        const toggleIconImg = document.createElement("img");
        toggleIconImg.src = "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/682c5e5b84cac09c56cdbebe_angle-down-small.svg";
        toggleIconImg.alt = "Toggle Icon";
        toggleIconImg.classList.add("db-icon-24", "toggle-icon");

        toggleDivElement.appendChild(toggleTextSpan);
        toggleDivElement.appendChild(toggleIconImg);
        
        toggleButtonRow.appendChild(toggleDivElement);
        jobWrapper.appendChild(toggleButtonRow);

        const applicantsListContainer = document.createElement("div"); 
        applicantsListContainer.classList.add("applicants-list-container");
        applicantsListContainer.style.display = "none";
        applicantsListContainer.dataset.jobId = jobItem.id; 
        applicantsListContainer.dataset.allApplicantsLoaded = 'false'; // Markiert, ob alle Bewerber für diesen Job geladen wurden

        jobWrapper.appendChild(applicantsListContainer);
        
        let paginationWrapper = jobWrapper.querySelector(".db-table-pagination");
        if (!paginationWrapper) {
            paginationWrapper = document.createElement("div");
            paginationWrapper.classList.add("db-table-pagination");
            jobWrapper.appendChild(paginationWrapper); 
        }
        paginationWrapper.style.display = "none"; 

        fragment.appendChild(jobWrapper);

        toggleDivElement.addEventListener("click", async () => {
            const isHidden = applicantsListContainer.style.display === "none";
            const allApplicantsLoaded = applicantsListContainer.dataset.allApplicantsLoaded === 'true';

            if (isHidden) {
                applicantsListContainer.style.display = "block";
                toggleTextSpan.textContent = "Bewerberliste ausblenden";
                toggleIconImg.classList.add("icon-up"); // Klasse für CSS-Rotation hinzufügen

                if (!allApplicantsLoaded) { 
                    toggleDivElement.style.pointerEvents = 'none';
                    const loadingAllMsg = document.createElement("p");
                    loadingAllMsg.classList.add("applicants-message");
                    loadingAllMsg.textContent = "Lade alle Bewerberdaten für Sortierung...";
                    
                    // Leere den Container und füge die Lade-Nachricht ein
                    // Der Header wird in loadAndDisplayApplicantsForJob hinzugefügt
                    const contentWrapper = applicantsListContainer.querySelector('.actual-applicants-content') || applicantsListContainer;
                    contentWrapper.innerHTML = ''; // Leere vorherigen Inhalt oder Header
                    contentWrapper.appendChild(loadingAllMsg);


                    const fetchedItems = await fetchAllApplicantsForJob(jobItem.id, applicantIdsForThisSpecificJob);
                    loadingAllMsg.remove();

                    if (!jobDataCache[jobItem.id]) jobDataCache[jobItem.id] = { activeFilters: {} };
                    jobDataCache[jobItem.id].allItems = fetchedItems; // Rohdaten für Filterung speichern
                    jobDataCache[jobItem.id].sortedAndFilteredItems = sortApplicantsGlobally(fetchedItems); // Global sortieren
                    
                    applicantsListContainer.dataset.allApplicantsLoaded = 'true';
                    await loadAndDisplayApplicantsForJob(jobItem.id, applicantsListContainer, paginationWrapper, 1);
                    toggleDivElement.style.pointerEvents = 'auto';
                } else {
                    // Daten sind bereits geladen, Paginierung anzeigen falls nötig
                    const jobCache = jobDataCache[jobItem.id];
                    if (jobCache && jobCache.sortedAndFilteredItems) {
                         paginationWrapper.style.display = (Math.ceil(jobCache.sortedAndFilteredItems.length / currentApplicantPageSize) <= 1) ? "none" : "flex";
                    }
                }
            } else {
                applicantsListContainer.style.display = "none";
                paginationWrapper.style.display = "none";
                toggleTextSpan.textContent = "Bewerberliste anzeigen";
                toggleIconImg.classList.remove("icon-up");
            }
        });
    });

    container.appendChild(fragment);

    requestAnimationFrame(() => {
        container.querySelectorAll(".my-job-item.job-entry:not(.job-error)").forEach(entry => entry.classList.add("visible"));
    });
}

// --- Hauptfunktion ---
async function displayMyJobsAndApplicants() {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' für displayMyJobsAndApplicants nicht gefunden.");
        return;
    }
    renderMyJobsSkeletonLoader(container, SKELETON_JOBS_COUNT_MJ);

    try {
        if (typeof window.$memberstackDom === 'undefined') {
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (typeof window.$memberstackDom !== 'undefined') { clearInterval(interval); resolve(); }
                }, 100);
            });
        }
        const member = await window.$memberstackDom.getCurrentMember();
        currentWebflowMemberId_MJ = member?.data?.customFields?.['webflow-member-id'];

        if (!currentWebflowMemberId_MJ) {
            console.error("❌ Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
            container.innerHTML = "<p class='error-message job-entry visible'>Benutzerdaten konnten nicht geladen werden.</p>";
            return;
        }
        console.log(`✅ MyJobs: Webflow Member ID: ${currentWebflowMemberId_MJ}`);

        await delay(API_CALL_DELAY_MS); 
        const currentUserItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, currentWebflowMemberId_MJ);

        if (!currentUserItem || (currentUserItem.error && currentUserItem.status !== 429 && currentUserItem.status !== 404) ) {
            console.error("❌ Benutzerdaten des aktuellen Users nicht gefunden oder kritischer Fehler beim Abruf.", currentUserItem);
            container.innerHTML = `<p class='error-message job-entry visible'>Benutzerdaten des aktuellen Users konnten nicht geladen werden.</p>`;
            return;
        }
        if (currentUserItem.error && currentUserItem.status === 429) {
            console.warn("Rate limit beim Abrufen des aktuellen Benutzers. Breche ab.");
            container.innerHTML = `<p class='error-message job-entry visible'>Zu viele Anfragen beim Laden der initialen Benutzerdaten. Bitte versuche es später erneut.</p>`;
            return;
        }
         if (!currentUserItem.fieldData && !(currentUserItem.error && currentUserItem.status === 404)) { 
            console.error("❌ Benutzerdaten des aktuellen Users (fieldData) nicht gefunden, obwohl User existiert.", currentUserItem);
            renderMyJobsAndApplicants([]); 
            return;
        }
        
        const postedJobIds = currentUserItem.fieldData ? currentUserItem.fieldData["posted-jobs"] || [] : [];
        console.log(`User hat ${postedJobIds.length} Jobs im Feld 'posted-jobs'.`);

        if (postedJobIds.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }

        let myJobItems = [];
        for (const jobId of postedJobIds) {
            console.log(`Fetching job item: ${jobId}`);
            await delay(API_CALL_DELAY_MS); 
            const jobItem = await fetchWebflowItem(JOB_COLLECTION_ID_MJ, jobId);
            
            if (jobItem) { 
                myJobItems.push(jobItem);
            } else { 
                console.warn(`Job ${jobId} führte zu einer unerwarteten null-Antwort von fetchWebflowItem.`);
                 myJobItems.push({id: jobId, error: true, status: 'fetch_null_error', message: `Unerwartete null-Antwort für Job ${jobId}.`});
            }
        }

        console.log("--- Überprüfung der geladenen Job-Daten (myJobItems) ---");
        myJobItems.forEach(job => {
            if (job.error) {
                 console.log(`Job ID: ${job.id}, Fehler: ${job.message}, Status: ${job.status}`);
            } else if (job.fieldData) {
                 console.log(`Job ID: ${job.id}, Name: ${job.fieldData.name}, Bewerber IDs im Job-Objekt: ${JSON.stringify(job.fieldData["bewerber"] || [])}`);
            } else {
                 console.log(`Job ID: ${job.id}, Unerwarteter Zustand (weder fieldData noch error-Property). Item:`, job);
            }
        });
        console.log("-----------------------------------------------------");
        
        if (myJobItems.length === 0 && postedJobIds.length > 0) { 
            container.innerHTML = `<p class='info-message job-entry visible'>Keine Jobdaten konnten geladen oder verarbeitet werden.</p>`;
            return;
        }

        allMyJobsData_MJ = myJobItems; 
        renderMyJobsAndApplicants(allMyJobsData_MJ);

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler in displayMyJobsAndApplicants:", error);
        if (container) {
            container.innerHTML = `<p class='error-message job-entry visible'>Ein allgemeiner Fehler ist aufgetreten: ${error.message}. Bitte versuche es später erneut.</p>`;
        }
    }
}

// --- Initialisierung ---
function initializePageSizeSelector() {
    const pageSizeSelector = document.getElementById('job-applicants-page-size-selector'); 
    if (pageSizeSelector) {
        pageSizeSelector.value = currentApplicantPageSize; 
        pageSizeSelector.addEventListener('change', (event) => {
            const newSize = parseInt(event.target.value, 10);
            if (newSize === 15 || newSize === 25) { 
                const oldSize = currentApplicantPageSize;
                currentApplicantPageSize = newSize;
                console.log(`DEBUG: Seitengröße geändert von ${oldSize} auf ${currentApplicantPageSize}`);
                
                const openApplicantContainer = document.querySelector('.applicants-list-container[style*="display: block"]');
                if (openApplicantContainer) {
                    const jobId = openApplicantContainer.dataset.jobId;
                    // const jobData = allMyJobsData_MJ.find(job => job.id === jobId); // Nicht mehr nötig, da jobDataCache verwendet wird
                    const jobCacheEntry = jobDataCache[jobId];
                    const jobWrapper = openApplicantContainer.closest('.my-job-item');
                    const paginationWrapper = jobWrapper ? jobWrapper.querySelector(".db-table-pagination") : null;
                    const toggleDivElement = jobWrapper ? jobWrapper.querySelector(".db-table-applicants") : null;

                    if (jobCacheEntry && jobCacheEntry.allItems && paginationWrapper && toggleDivElement) { // Prüfe auf allItems im Cache
                        console.log(`DEBUG: Lade Job ${jobId} mit neuer Seitengröße ${currentApplicantPageSize} neu (Seite 1).`);
                        
                        toggleDivElement.style.pointerEvents = 'none';
                        paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));
                        
                        // Sortiere die vorhandenen Rohdaten neu (falls Filter aktiv wären, müssten die auch angewendet werden)
                        jobCacheEntry.sortedAndFilteredItems = sortApplicantsGlobally(jobCacheEntry.allItems);
                        // Filterlogik würde hier auch greifen, falls implementiert:
                        // jobCacheEntry.sortedAndFilteredItems = applyAllActiveFilters(sortApplicantsGlobally(jobCacheEntry.allItems), jobCacheEntry.activeFilters);


                        loadAndDisplayApplicantsForJob(jobId, openApplicantContainer, paginationWrapper, 1) 
                          .finally(() => {
                            toggleDivElement.style.pointerEvents = 'auto';
                          });
                    }
                }
            }
        });
    } else {
        console.warn("DEBUG: Element für Seitengrößenauswahl ('job-applicants-page-size-selector') nicht gefunden. Nutze Standard: " + currentApplicantPageSize);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    initializePageSizeSelector(); 
    displayMyJobsAndApplicants(); 
});
