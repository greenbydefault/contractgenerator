// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://meine-kampagnen.oliver-258.workers.dev/";
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525";
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526";
const SKELETON_JOBS_COUNT_MJ = 3;
const API_CALL_DELAY_MS = 5;
let currentApplicantPageSize = 15;

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = [];
let jobDataCache = {}; // { jobId: { allItems: [], sortedAndFilteredItems: [], activeFilters: { follower: [] }, jobDetails: {} } }


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
        "126e325d19f997cd4158ebd2f6bc43c8": "0" // Wird nicht als Filteroption angezeigt
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
        // Placeholder for future columns or adjustments
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


// --- NEUE FUNKTION: Match Score Berechnung ---
/**
 * Calculates a match score between an applicant and job requirements.
 * @param {object} applicantFieldData - The applicant's data from Webflow.
 * @param {object} jobFieldData - The job's requirement data from Webflow.
 * @param {object} allMappings - The global MAPPINGS object.
 * @returns {object} An object containing { score: percentageScore, details: criteriaDetails, rawScore, maxScore }.
 */
function calculateMatchScore(applicantFieldData, jobFieldData, allMappings) {
    if (!applicantFieldData || !jobFieldData) {
        return { score: 0, details: {}, rawScore: 0, maxScore: 0 }; // Return 0 if data is missing
    }

    let totalScore = 0;
    let maxScorePossible = 0;
    const criteriaEvaluationDetails = {};

    // Define criteria, their Webflow field IDs (for the JOB), and points.
    // IMPORTANT: Adjust 'jobField' to your actual Webflow field IDs in the Job Collection.
    const scoringCriteria = [
        {
            name: "Kategorie",
            jobField: "industrie-kategorie", // Job's main category (e.g., text field)
            applicantField: "creator-main-categorie", // Applicant's main category (text field)
            points: 20,
            type: "exactStringMatch" // Case-insensitive string match
        },
        {
            name: "Creator Typ",
            // NEW JOB FIELD (Example): Assume 'job-required-creator-types' is a multi-reference field in Jobs
            // linking to the same Option Collection as applicant's 'creator-type'.
            jobField: "job-required-creator-types",
            applicantField: "creator-type", // Applicant's 'creator-type' (single Option ID)
            points: 25,
            type: "idInJobArray", // Checks if applicant's ID is in the job's array of required IDs
            mappingName: "creatorTypen"
        },
        {
            name: "Standort (Bundesland)",
            // NEW JOB FIELD (Example): Assume 'job-required-bundeslaender' is a multi-reference field in Jobs
            jobField: "job-required-bundeslaender",
            applicantField: "bundesland-option", // Applicant's 'bundesland-option' (single Option ID)
            points: 15,
            type: "idInJobArray",
            mappingName: "bundeslaender"
        },
        {
            name: "Follower",
            // NEW JOB FIELD (Example): Assume 'job-required-follower-id' is a single-reference field in Jobs
            jobField: "job-required-follower-id",
            applicantField: "creator-follower", // Applicant's 'creator-follower' (single Option ID)
            points: 15,
            type: "exactIdMatch"
        },
        {
            name: "Alter",
            // NEW JOB FIELD (Example): Assume 'job-required-age-id' is a single-reference field in Jobs
            jobField: "job-required-age-id",
            applicantField: "creator-age", // Applicant's 'creator-age' (single Option ID)
            points: 10,
            type: "exactIdMatch"
        },
        {
            name: "Sprachen",
            // NEW JOB FIELD (Example): Assume 'job-required-sprachen-ids' is a multi-reference field in Jobs
            jobField: "job-required-sprachen-ids",
            applicantField: "sprachen", // Applicant's 'sprachen' (array of Option IDs)
            points: 15,
            type: "anyIdOverlapInArrays", // Checks for any common language ID
            mappingName: "sprachen"
        }
    ];

    scoringCriteria.forEach(criterion => {
        maxScorePossible += criterion.points;
        let criterionAchievedPoints = 0;
        let jobRequirementValue = jobFieldData[criterion.jobField];
        let applicantAttributeValue = applicantFieldData[criterion.applicantField];
        let isMatch = false;

        // Ensure values are not undefined before processing
        const jobValExists = jobRequirementValue !== undefined && jobRequirementValue !== null;
        const appValExists = applicantAttributeValue !== undefined && applicantAttributeValue !== null;

        if (jobValExists && appValExists) {
            switch (criterion.type) {
                case "exactStringMatch":
                    if (typeof applicantAttributeValue === 'string' && typeof jobRequirementValue === 'string' &&
                        applicantAttributeValue.trim().toLowerCase() === jobRequirementValue.trim().toLowerCase()) {
                        isMatch = true;
                    }
                    break;
                case "exactIdMatch":
                    if (applicantAttributeValue === jobRequirementValue) {
                        isMatch = true;
                    }
                    break;
                case "idInJobArray": // Job has an array of required IDs, applicant has one ID.
                    if (Array.isArray(jobRequirementValue) && jobRequirementValue.includes(applicantAttributeValue)) {
                        isMatch = true;
                    }
                    break;
                case "anyIdOverlapInArrays": // Both job and applicant might have arrays of IDs.
                    const jobArray = Array.isArray(jobRequirementValue) ? jobRequirementValue : (jobRequirementValue ? [jobRequirementValue] : []);
                    const appArray = Array.isArray(applicantAttributeValue) ? applicantAttributeValue : (applicantAttributeValue ? [applicantAttributeValue] : []);
                    if (appArray.some(appId => jobArray.includes(appId))) {
                        isMatch = true;
                    }
                    break;
            }
        }

        if (isMatch) {
            criterionAchievedPoints = criterion.points;
            totalScore += criterion.points;
        }

        // For tooltip: get human-readable values
        const mappingForCriterion = criterion.mappingName ? allMappings[criterion.mappingName] : null;
        let jobDisplayValues = jobValExists ? (Array.isArray(jobRequirementValue) ? jobRequirementValue.map(id => mappingForCriterion?.[id] || id) : (mappingForCriterion?.[jobRequirementValue] || jobRequirementValue)) : "N/A";
        let appDisplayValues = appValExists ? (Array.isArray(applicantAttributeValue) ? applicantAttributeValue.map(id => mappingForCriterion?.[id] || id) : (mappingForCriterion?.[applicantAttributeValue] || applicantAttributeValue)) : "N/A";


        criteriaEvaluationDetails[criterion.name] = {
            matched: isMatch,
            jobRequirement: jobDisplayValues,
            applicantValue: appDisplayValues,
            pointsAwarded: criterionAchievedPoints,
            maxPoints: criterion.points
        };
    });

    const percentageScore = maxScorePossible > 0 ? Math.round((totalScore / maxScorePossible) * 100) : 0;
    return {
        score: percentageScore,
        details: criteriaEvaluationDetails,
        rawScore: totalScore,
        maxScore: maxScorePossible
    };
}


// --- Rendering-Funktionen ---
// MODIFIED: createApplicantRowElement to accept full applicant item (with score) and job details for tooltip
function createApplicantRowElement(applicantItemWithScoreInfo, jobFieldDataForTooltip, allMappings) {
    const applicantFieldData = applicantItemWithScoreInfo.fieldData; // Original applicant data
    const matchInfo = applicantItemWithScoreInfo.matchInfo;         // Calculated score object {score, details, rawScore, maxScore}

    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");

    applicantDiv.addEventListener('click', (event) => {
        if (event.target.closest('a.db-application-option') || event.target.closest('.match-score-cell')) { // Prevent row click if score or social icon clicked
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

    if (typeof allMappings === 'undefined') {
        console.error("❌ MAPPINGS-Objekt ist nicht definiert in createApplicantRowElement.");
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Fehler: Mapping-Daten nicht verfügbar.";
        applicantDiv.appendChild(errorDiv);
        return applicantDiv;
    }

    // --- Match Score Cell (NEW) ---
    const matchScoreCell = document.createElement("div");
    matchScoreCell.classList.add("db-table-row-item", "match-score-cell"); // Class for styling

    const scoreValue = matchInfo ? matchInfo.score : 0;

    const scoreCircle = document.createElement("div");
    scoreCircle.classList.add("score-circle-indicator"); // Use this class for styling the circle

    let scoreColor = "#e0e0e0"; // Default/low score grey
    if (scoreValue >= 80) scoreColor = "#4CAF50"; // Green for high (e.g., 80-100)
    else if (scoreValue >= 60) scoreColor = "#FFC107"; // Orange for medium (e.g., 60-79)
    else if (scoreValue > 0) scoreColor = "#FF9800"; // Lighter orange for lower-medium

    // Apply styles for the circle (can be enhanced with SVG/conic-gradient via CSS)
    scoreCircle.style.width = "40px";
    scoreCircle.style.height = "40px";
    scoreCircle.style.borderRadius = "50%";
    scoreCircle.style.backgroundColor = scoreColor;
    scoreCircle.style.display = "flex";
    scoreCircle.style.justifyContent = "center";
    scoreCircle.style.alignItems = "center";
    scoreCircle.style.color = "white";
    scoreCircle.style.fontWeight = "bold";
    scoreCircle.style.fontSize = "14px";
    scoreCircle.style.cursor = "default"; // Indicate it's not directly clickable for row action

    const scoreText = document.createElement("span");
    scoreText.textContent = `${scoreValue}`;
    scoreCircle.appendChild(scoreText);
    matchScoreCell.appendChild(scoreCircle);

    // Tooltip for score details
    if (matchInfo && matchInfo.details) {
        const tooltip = document.createElement("div");
        tooltip.classList.add("score-tooltip-details"); // Style this with CSS
        let tooltipHTML = `<strong>Match Breakdown (Score: ${matchInfo.rawScore}/${matchInfo.maxScore})</strong><hr>`;
        for (const criterionName in matchInfo.details) {
            const detail = matchInfo.details[criterionName];
            tooltipHTML += `<p><strong>${criterionName}</strong> (${detail.pointsAwarded}/${detail.maxPoints} Pkt):<br>`;
            tooltipHTML += `  Job: <small>${JSON.stringify(detail.jobRequirement).replace(/"/g, '')}</small><br>`;
            tooltipHTML += `  Bewerber: <small>${JSON.stringify(detail.applicantValue).replace(/"/g, '')}</small><br>`;
            tooltipHTML += `  <em>${detail.matched ? 'Passt ✅' : 'Passt nicht ❌'}</em></p>`;
        }
        tooltip.innerHTML = tooltipHTML;
        matchScoreCell.appendChild(tooltip);
        matchScoreCell.style.position = "relative"; // For tooltip positioning
        matchScoreCell.addEventListener('mouseenter', () => tooltip.style.display = 'block');
        matchScoreCell.addEventListener('mouseleave', () => tooltip.style.display = 'none');
    }
    applicantDiv.appendChild(matchScoreCell);


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
    const bundeslandName = allMappings.bundeslaender[bundeslandId] || (bundeslandId ? bundeslandId.substring(0,10)+'...' : "K.A."); // Use allMappings
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
    creatorTypeTag.textContent = allMappings.creatorTypen[creatorTypeId] || (creatorTypeId ? creatorTypeId.substring(0,10)+'...' : "K.A."); // Use allMappings
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
    followerTag.textContent = allMappings.followerRanges[followerId] || (followerId ? followerId.substring(0,10)+'...' : "K.A."); // Use allMappings
    followerCell.appendChild(followerTag);
    applicantDiv.appendChild(followerCell);

    const ageCell = document.createElement("div");
    ageCell.classList.add("db-table-row-item");
    const ageTag = document.createElement("span");
    ageTag.classList.add("job-tag", "customer");
    const ageId = applicantFieldData["creator-age"];
    ageTag.textContent = allMappings.altersgruppen[ageId] || (ageId ? ageId.substring(0,10)+'...' : "K.A."); // Use allMappings
    ageCell.appendChild(ageTag);
    applicantDiv.appendChild(ageCell);

    return applicantDiv;
}

// MODIFIED: Added "Match" column
function createApplicantTableHeaderElement() {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("db-table-header", "db-table-applicant");

    const columns = ["Match", "Creator", "Location", "Kategorie", "Creator Type", "Social Media", "Follower", "Alter"]; // Added "Match"
    columns.forEach((colText, index) => {
        const colDiv = document.createElement("div");
        colDiv.classList.add("db-table-row-item");
        if (index === 0) { // Style for "Match" column header
            colDiv.style.textAlign = "center";
        }
        if (index === 1) { // Style for "Creator" column to make it wider if needed
             colDiv.style.flexGrow = "1.5"; // Example: make Creator column wider
        }


        const textSpan = document.createElement("span");
        textSpan.classList.add("is-txt-16", "is-txt-bold");
        textSpan.textContent = colText;
        colDiv.appendChild(textSpan);
        headerDiv.appendChild(colDiv);
    });
    return headerDiv;
}


function createFilterRowElement(jobId, applicantsListContainer, paginationWrapper) {
    const filterRow = document.createElement("div");
    filterRow.classList.add("db-table-filter-row");

    const filterWrapper = document.createElement("div");
    filterWrapper.classList.add("db-table-filter-row-wrapper");
    filterRow.appendChild(filterWrapper);

    // --- Follower Filter ---
    const followerFilterDiv = document.createElement("div");
    followerFilterDiv.classList.add("db-individual-filter-trigger");

    const followerFilterText = document.createElement("span");
    followerFilterText.classList.add("is-txt-16");
    followerFilterText.textContent = "Follower";
    followerFilterDiv.appendChild(followerFilterText);

    const followerFilterIcon = document.createElement("img");
    followerFilterIcon.src = "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/682c5e5b84cac09c56cdbebe_angle-down-small.svg";
    followerFilterIcon.classList.add("db-icon-18");
    followerFilterDiv.appendChild(followerFilterIcon);

    const followerDropdownList = document.createElement("div");
    followerDropdownList.classList.add("db-filter-dropdown-list");
    followerDropdownList.style.display = "none";

    Object.entries(MAPPINGS.followerRanges).forEach(([id, rangeText]) => {
        if (rangeText === "0") return;

        const optionDiv = document.createElement("div");
        optionDiv.classList.add("db-filter-option");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("db-filter-checkbox");
        checkbox.id = `filter-${jobId}-follower-${id}`;
        checkbox.dataset.filterValue = id;
        checkbox.dataset.filterType = "follower";

        if (jobDataCache[jobId]?.activeFilters?.follower?.includes(id)) {
            checkbox.checked = true;
        }

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.classList.add("is-txt-16");
        label.textContent = rangeText;

        checkbox.addEventListener("change", async () => {
            await applyAndReloadApplicants(jobId, applicantsListContainer, paginationWrapper);
        });

        optionDiv.appendChild(checkbox);
        optionDiv.appendChild(label);
        followerDropdownList.appendChild(optionDiv);
    });
    followerFilterDiv.appendChild(followerDropdownList);
    filterWrapper.appendChild(followerFilterDiv);

    followerFilterDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        const allDropdowns = filterRow.querySelectorAll('.db-filter-dropdown-list');
        allDropdowns.forEach(dd => {
            if (dd !== followerDropdownList) dd.style.display = 'none';
        });
        followerDropdownList.style.display = followerDropdownList.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", (e) => {
        if (!followerFilterDiv.contains(e.target)) {
            followerDropdownList.style.display = "none";
        }
    });

    return filterRow;
}

// MODIFIED: To use jobDetails from cache for sorting
async function applyAndReloadApplicants(jobId, applicantsListContainer, paginationWrapper) {
    if (!jobDataCache[jobId] || !jobDataCache[jobId].allItems) {
        console.warn("DEBUG: applyAndReloadApplicants - Keine Rohdaten im Cache für Job", jobId);
        return;
    }

    const activeFollowerFilters = [];
    const followerCheckboxes = applicantsListContainer.parentElement.querySelectorAll(`.db-filter-checkbox[data-filter-type="follower"]:checked`);
    followerCheckboxes.forEach(cb => activeFollowerFilters.push(cb.dataset.filterValue));

    jobDataCache[jobId].activeFilters = { follower: activeFollowerFilters };
    console.log(`DEBUG: Job ${jobId} - Aktive Follower-Filter:`, activeFollowerFilters);

    let filteredItems = jobDataCache[jobId].allItems;

    if (activeFollowerFilters.length > 0) {
        filteredItems = filteredItems.filter(item => {
            if (item.error || !item.fieldData) return false;
            const applicantFollowerId = item.fieldData["creator-follower"];
            return activeFollowerFilters.includes(applicantFollowerId);
        });
    }

    console.log(`DEBUG: Job ${jobId} - Anzahl Items nach Filterung: ${filteredItems.length}`);

    const jobDetails = jobDataCache[jobId]?.jobDetails;
    if (!jobDetails) {
        console.error(`DEBUG: Job ${jobId} - Job-Details nicht im Cache gefunden für Sortierung bei Filteranwendung.`);
        // Fallback: Sort without match score or show error
        jobDataCache[jobId].sortedAndFilteredItems = sortApplicantsGlobally(filteredItems, null, MAPPINGS);
    } else {
        jobDataCache[jobId].sortedAndFilteredItems = sortApplicantsGlobally(filteredItems, jobDetails, MAPPINGS);
    }

    await loadAndDisplayApplicantsForJob(jobId, applicantsListContainer, paginationWrapper, 1);
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
        const promises = applicantIds.map((applicantId, index) =>
            delay(index * (API_CALL_DELAY_MS / 2)) // Slightly increased delay staggering
            .then(() => fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId))
        );
        const results = await Promise.all(promises);
        results.forEach(item => {
            if (item) {
                fetchedItems.push(item);
                if (!item.error) successfulFetches++;
            }
        });
    }
    console.log(`DEBUG: fetchAllApplicantsForJob END - Job ID: ${jobId}, ${successfulFetches} von ${applicantIds.length} Items erfolgreich geladen.`);
    return fetchedItems;
}

// MODIFIED: sortApplicantsGlobally to use match score
/**
 * Sorts applicants, primarily by match score (desc), then by Plus status.
 * @param {Array<object>} applicantItems - Array of applicant items from Webflow.
 * @param {object|null} jobFieldData - The job's requirement data. If null, sorts without match score.
 * @param {object} allMappings - The global MAPPINGS object.
 * @returns {Array<object>} Sorted array of applicant items, with 'matchInfo' attached to each.
 */
function sortApplicantsGlobally(applicantItems, jobFieldData, allMappings) {
    const itemsWithScore = applicantItems.map(applicant => {
        let matchInfo = { score: -1, details: {}, rawScore: 0, maxScore: 0 }; // Default for errors or no job data
        if (jobFieldData && applicant && applicant.fieldData && !applicant.error) {
            matchInfo = calculateMatchScore(applicant.fieldData, jobFieldData, allMappings);
        } else if (applicant && applicant.fieldData && !applicant.error && !jobFieldData) {
            // If no jobFieldData, we can't calculate a meaningful score, but keep applicant valid
             matchInfo = { score: 0, details: {note: "Job data missing for scoring"}, rawScore: 0, maxScore: 0 };
        }
        return { ...applicant, matchInfo };
    });

    return itemsWithScore.sort((a, b) => {
        const aIsValid = a && a.fieldData && !a.error;
        const bIsValid = b && b.fieldData && !b.error;

        if (aIsValid && !bIsValid) return -1;
        if (!aIsValid && bIsValid) return 1;
        if (!aIsValid && !bIsValid) return 0;

        // Primary sort: matchScore (descending)
        if (b.matchInfo.score !== a.matchInfo.score) {
            return b.matchInfo.score - a.matchInfo.score;
        }

        // Secondary sort: plus-mitglied (Plus members first)
        const aIsPlus = a.fieldData["plus-mitglied"] === true;
        const bIsPlus = b.fieldData["plus-mitglied"] === true;
        if (aIsPlus && !bIsPlus) return -1;
        if (!aIsPlus && bIsPlus) return 1;

        // Tertiary sort: applicant name (ascending) for consistent order if scores and plus status are same
        const nameA = a.fieldData.name || "";
        const nameB = b.fieldData.name || "";
        return nameA.localeCompare(nameB);
    });
}


// MODIFIED: To pass jobDetails to createApplicantRowElement
async function loadAndDisplayApplicantsForJob(jobId, applicantsListContainer, paginationWrapper, pageNumber = 1) {
    console.log(`DEBUG: loadAndDisplayApplicantsForJob START - Job ID: ${jobId}, Page: ${pageNumber}`);

    const mainToggleButton = document.querySelector(`.my-job-item[data-job-id="${jobId}"] .db-table-applicants`);
    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'none';

    if (!applicantsListContainer.querySelector(".db-table-filter-row")) {
        const filterRowElement = createFilterRowElement(jobId, applicantsListContainer, paginationWrapper);
        applicantsListContainer.insertBefore(filterRowElement, applicantsListContainer.firstChild);
    }
    if (!applicantsListContainer.querySelector(".db-table-header.db-table-applicant")) {
        const headerElement = createApplicantTableHeaderElement();
        const filterRow = applicantsListContainer.querySelector(".db-table-filter-row");
        if (filterRow && filterRow.nextSibling) {
            applicantsListContainer.insertBefore(headerElement, filterRow.nextSibling);
        } else if (filterRow) {
            applicantsListContainer.appendChild(headerElement);
        } else {
            applicantsListContainer.insertBefore(headerElement, applicantsListContainer.firstChild);
        }
    }

    let applicantsContentElement = applicantsListContainer.querySelector(".actual-applicants-content");
    if (!applicantsContentElement) {
        applicantsContentElement = document.createElement("div");
        applicantsContentElement.classList.add("actual-applicants-content");
        const header = applicantsListContainer.querySelector(".db-table-header.db-table-applicant");
        if (header && header.nextSibling) {
            applicantsListContainer.insertBefore(applicantsContentElement, header.nextSibling);
        } else if (header) {
            applicantsListContainer.appendChild(applicantsContentElement);
        } else {
            applicantsListContainer.appendChild(applicantsContentElement);
        }
    }

    applicantsContentElement.innerHTML = '';
    applicantsListContainer.dataset.currentPage = pageNumber;

    const loadingMessage = document.createElement("p");
    loadingMessage.classList.add("applicants-message");
    loadingMessage.textContent = `Lade Bewerber (Seite ${pageNumber})...`;
    applicantsContentElement.appendChild(loadingMessage);

    const jobCache = jobDataCache[jobId];
    if (!jobCache || !jobCache.sortedAndFilteredItems) {
        console.error(`DEBUG: Keine sortierten/gefilterten Daten im Cache für Job ${jobId}.`);
        loadingMessage.textContent = 'Fehler: Bewerberdaten konnten nicht geladen werden (Cache-Problem).';
        if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto';
        return;
    }
    // --- Get Job Details for creating applicant rows ---
    const jobDetailsForRows = jobCache.jobDetails;
    if (!jobDetailsForRows) {
        console.warn(`DEBUG: Job-Details für Job ${jobId} nicht im Cache beim Rendern der Bewerberzeilen.`);
        // You might want to display a specific message if job details are missing,
        // as scoring might not be accurate or tooltips won't have job context.
    }


    const allSortedAndFilteredItems = jobCache.sortedAndFilteredItems;
    const totalPages = Math.ceil(allSortedAndFilteredItems.length / currentApplicantPageSize);
    const offset = (pageNumber - 1) * currentApplicantPageSize;
    const pageItems = allSortedAndFilteredItems.slice(offset, offset + currentApplicantPageSize);

    loadingMessage.remove();

    let validApplicantsRenderedOnThisPage = 0;
    if (pageItems.length > 0) {
        pageItems.forEach(applicantItemWithScore => { // This item now includes 'matchInfo'
            if (applicantItemWithScore && applicantItemWithScore.fieldData && !applicantItemWithScore.error) {
                // Pass the full applicantItem (which has fieldData and matchInfo), jobDetails, and MAPPINGS
                const applicantRow = createApplicantRowElement(applicantItemWithScore, jobDetailsForRows, MAPPINGS);
                applicantsContentElement.appendChild(applicantRow);
                requestAnimationFrame(() => {
                    applicantRow.style.opacity = "0";
                    requestAnimationFrame(() => {
                        applicantRow.style.transition = "opacity 0.3s ease-in-out";
                        applicantRow.style.opacity = "1";
                    });
                });
                validApplicantsRenderedOnThisPage++;
            } else if (applicantItemWithScore && applicantItemWithScore.error) {
                const errorMsg = document.createElement("p");
                errorMsg.classList.add("applicants-message");
                if (applicantItemWithScore.status === 429) {
                    errorMsg.textContent = `Bewerberdaten (ID: ${applicantItemWithScore.id}) konnten wegen API-Limits nicht geladen werden.`;
                } else if (applicantItemWithScore.status === 404) {
                    errorMsg.textContent = `Bewerber (ID: ${applicantItemWithScore.id}) wurde nicht gefunden.`;
                } else {
                    errorMsg.textContent = applicantItemWithScore.message || `Daten für Bewerber ${applicantItemWithScore.id || 'unbekannt'} konnten nicht geladen werden.`;
                }
                applicantsContentElement.appendChild(errorMsg);
            }
        });
    }

    console.log(`DEBUG: Job ${jobId}, Seite ${pageNumber}: ${validApplicantsRenderedOnThisPage} Bewerber gerendert aus ${pageItems.length} Items für diese Seite.`);

    if (validApplicantsRenderedOnThisPage === 0 && allSortedAndFilteredItems.length > 0 && pageItems.length > 0) {
        const noDataMsg = document.createElement("p");
        noDataMsg.classList.add("applicants-message");
        noDataMsg.textContent = "Keine gültigen Bewerberdaten für diese Seite gefunden.";
        applicantsContentElement.appendChild(noDataMsg);
    } else if (allSortedAndFilteredItems.length === 0 && jobCache.allItems && jobCache.allItems.length > 0) {
        const noMatchMsg = document.createElement("p");
        noMatchMsg.classList.add("applicants-message");
        noMatchMsg.textContent = "Keine Bewerber entsprechen den aktuellen Kriterien oder konnten geladen werden.";
        applicantsContentElement.appendChild(noMatchMsg);
        if (paginationWrapper) paginationWrapper.style.display = "none";
    } else if (allSortedAndFilteredItems.length === 0) {
        const noApplicantsMsg = document.createElement("p");
        noApplicantsMsg.classList.add("applicants-message");
        noApplicantsMsg.textContent = "Für diesen Job liegen keine Bewerbungen vor.";
        applicantsContentElement.appendChild(noApplicantsMsg);
        if (paginationWrapper) paginationWrapper.style.display = "none";
    }

    await renderPaginationControls(jobId, allSortedAndFilteredItems, applicantsContentElement, paginationWrapper, pageNumber, totalPages);

    if (mainToggleButton) mainToggleButton.style.pointerEvents = 'auto';
    applicantsListContainer.dataset.allApplicantsLoaded = 'true'; // This flag might need re-evaluation if filters change often
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
        categoryCell.textContent = jobFieldData["industrie-kategorie"] || "K.A."; // This is used for matching
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
        applicantsListContainer.dataset.allApplicantsLoaded = 'false';

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
            // const allApplicantsLoaded = applicantsListContainer.dataset.allApplicantsLoaded === 'true'; // Re-evaluate if this flag is still useful with dynamic sorting/filtering

            if (isHidden) {
                applicantsListContainer.style.display = "block";
                toggleTextSpan.textContent = "Bewerberliste ausblenden";
                toggleIconImg.classList.add("icon-up");

                // Always fetch/re-process if not already cached or if job details might have changed (though not handled here)
                // Store job details in cache if not already present or if an update is needed
                if (!jobDataCache[jobItem.id] || !jobDataCache[jobItem.id].jobDetails) {
                     if (!jobDataCache[jobItem.id]) {
                        jobDataCache[jobItem.id] = { activeFilters: { follower: [] } };
                     }
                     jobDataCache[jobItem.id].jobDetails = jobFieldData; // Store current job's fieldData
                }


                // Check if all applicant items for this job are already in cache
                if (!jobDataCache[jobItem.id].allItems || jobDataCache[jobItem.id].allItems.length !== applicantIdsForThisSpecificJob.length) {
                    toggleDivElement.style.pointerEvents = 'none';
                    applicantsListContainer.innerHTML = '';
                    const loadingAllMsg = document.createElement("p");
                    loadingAllMsg.classList.add("applicants-message");
                    loadingAllMsg.textContent = "Lade alle Bewerberdaten für Sortierung...";
                    applicantsListContainer.appendChild(loadingAllMsg);

                    const fetchedItems = await fetchAllApplicantsForJob(jobItem.id, applicantIdsForThisSpecificJob);
                    loadingAllMsg.remove();
                    jobDataCache[jobItem.id].allItems = fetchedItems;
                }
                // Always re-sort and filter based on current job details and filters
                jobDataCache[jobItem.id].sortedAndFilteredItems = sortApplicantsGlobally(
                    jobDataCache[jobItem.id].allItems,
                    jobDataCache[jobItem.id].jobDetails, // Use cached/current job details
                    MAPPINGS
                );

                applicantsListContainer.dataset.allApplicantsLoaded = 'true'; // Indicates base data is loaded
                await loadAndDisplayApplicantsForJob(jobItem.id, applicantsListContainer, paginationWrapper, 1);
                toggleDivElement.style.pointerEvents = 'auto';

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

        if (!currentUserItem || (currentUserItem.error && currentUserItem.status !== 429 && currentUserItem.status !== 404)) {
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
                myJobItems.push({ id: jobId, error: true, status: 'fetch_null_error', message: `Unerwartete null-Antwort für Job ${jobId}.` });
            }
        }

        console.log("--- Überprüfung der geladenen Job-Daten (myJobItems) ---");
        myJobItems.forEach(job => {
            if (job.error) {
                console.log(`Job ID: ${job.id}, Fehler: ${job.message}, Status: ${job.status}`);
            } else if (job.fieldData) {
                console.log(`Job ID: ${job.id}, Name: ${job.fieldData.name}, Bewerber IDs im Job-Objekt: ${JSON.stringify(job.fieldData["bewerber"] || [])}`);
                // Log new job requirement fields if they exist for debugging
                // console.log(`   Job Requirements (example): Creator Types - ${JSON.stringify(job.fieldData["job-required-creator-types"])}`);
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
                    const jobCacheEntry = jobDataCache[jobId];
                    const jobWrapper = openApplicantContainer.closest('.my-job-item');
                    const paginationWrapper = jobWrapper ? jobWrapper.querySelector(".db-table-pagination") : null;
                    const toggleDivElement = jobWrapper ? jobWrapper.querySelector(".db-table-applicants") : null;

                    if (jobCacheEntry && jobCacheEntry.allItems && paginationWrapper && toggleDivElement && jobCacheEntry.jobDetails) {
                        console.log(`DEBUG: Lade Job ${jobId} mit neuer Seitengröße ${currentApplicantPageSize} neu (Seite 1).`);

                        toggleDivElement.style.pointerEvents = 'none';
                        paginationWrapper.querySelectorAll('.db-pagination-count').forEach(el => el.classList.add("disabled-loading"));

                        // Re-filter and re-sort with new page size logic (sorting already done by score)
                        let itemsToDisplay = jobCacheEntry.allItems;
                        if (jobCacheEntry.activeFilters.follower && jobCacheEntry.activeFilters.follower.length > 0) {
                            itemsToDisplay = itemsToDisplay.filter(item => {
                                if (item.error || !item.fieldData) return false;
                                const applicantFollowerId = item.fieldData["creator-follower"];
                                return jobCacheEntry.activeFilters.follower.includes(applicantFollowerId);
                            });
                        }
                        // Re-sort with potentially new set of filtered items
                        jobCacheEntry.sortedAndFilteredItems = sortApplicantsGlobally(itemsToDisplay, jobCacheEntry.jobDetails, MAPPINGS);

                        loadAndDisplayApplicantsForJob(jobId, openApplicantContainer, paginationWrapper, 1)
                            .finally(() => {
                                if (toggleDivElement) toggleDivElement.style.pointerEvents = 'auto';
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

    // NEW: Add CSS for score circle and tooltip
    const style = document.createElement('style');
    style.textContent = `
        .match-score-cell {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative; /* For tooltip positioning */
        }
        .score-circle-indicator {
            /* Styles are applied inline via JS for dynamic color */
            /* Base styles can be here if needed */
        }
        .score-tooltip-details {
            display: none;
            position: absolute;
            bottom: 105%; /* Position above the score cell */
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            z-index: 1000; /* Ensure it's above other elements */
            width: 280px; /* Adjust as needed */
            font-size: 11px;
            line-height: 1.5;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            text-align: left;
        }
        .score-tooltip-details strong { color: #FFC107; }
        .score-tooltip-details hr { border-top: 1px solid #555; margin: 4px 0; }
        .score-tooltip-details p { margin: 5px 0; }
        .score-tooltip-details small { color: #ccc; }

        /* Adjust table layout if necessary for the new "Match" column */
        .db-table-applicant {
            /* If using grid, ensure your template-columns account for the new column */
            /* Example: grid-template-columns: 70px repeat(7, 1fr); */
        }
        .db-table-header.db-table-applicant .db-table-row-item:first-child,
        .db-table-row.db-table-applicant .db-table-row-item.match-score-cell {
             flex-basis: 70px !important; /* Ensure enough space for the score circle */
             flex-grow: 0 !important;
             flex-shrink: 0 !important;
             padding-left: 5px;
             padding-right: 5px;
        }
    `;
    document.head.appendChild(style);
});
