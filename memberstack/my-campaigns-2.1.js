// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// 🔧 Konfiguration
const API_BASE_URL_MJ = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL_MJ = "https://bewerbungen.oliver-258.workers.dev/?url="; // Deine Worker URL
const JOB_COLLECTION_ID_MJ = "6448faf9c5a8a17455c05525"; // Deine Job Collection ID
const USER_COLLECTION_ID_MJ = "6448faf9c5a8a15f6cc05526"; // Deine User Collection ID (für den eingeloggten User und Bewerber)
const SKELETON_JOBS_COUNT_MJ = 3; // Anzahl der Skeleton-Job-Zeilen
const API_CALL_DELAY_MS = 50; // NEU: Verzögerung zwischen API-Aufrufen in Millisekunden (z.B. 250ms = 4 Anfragen/Sekunde)

let currentWebflowMemberId_MJ = null;
let allMyJobsData_MJ = []; // Speichert alle geladenen eigenen Jobs mit Bewerbern

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
        "126e325d19f997cd4158ebd2f6bc43c8": "Follower (spez.)"
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
    return `${WORKER_BASE_URL_MJ}${encodeURIComponent(apiUrl)}`;
}

// Hilfsfunktion für Verzögerungen
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWebflowCollection(collectionId, params = {}) {
    let allItems = [];
    let offset = 0;
    const limit = 100;
    try {
        while (true) {
            const queryParams = new URLSearchParams({ ...params, limit: limit.toString(), offset: offset.toString() }).toString();
            const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/live?${queryParams}`;
            const workerUrl = buildWorkerUrl_MJ(apiUrl);
            
            console.log(`Fetching collection page: ${apiUrl}`); // Debug-Log
            await delay(API_CALL_DELAY_MS); // Verzögerung vor jedem paginierten Aufruf
            const response = await fetch(workerUrl);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API-Fehler (Collection ${collectionId}, Offset ${offset}): ${response.status} - ${errorText}`);
                if (response.status === 429) {
                    console.warn(`Rate limit getroffen bei Collection fetch. Versuche es später erneut oder erhöhe API_CALL_DELAY_MS.`);
                    // Hier könnte man eine komplexere Retry-Logik mit Exponential Backoff einbauen
                }
                throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            allItems = allItems.concat(data.items || []);
            if ((data.items && data.items.length < limit) || !data.items || data.items.length === 0) {
                break;
            }
            offset += limit;
        }
        return allItems;
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Collection ${collectionId}: ${error.message}`);
        return []; // Leeres Array zurückgeben, um Totalabsturz zu vermeiden
    }
}

async function fetchWebflowItem(collectionId, itemId) {
    if (!itemId) {
        console.warn(`Ungültige Item-ID für Collection ${collectionId} übergeben.`);
        return null;
    }
    const apiUrl = `${API_BASE_URL_MJ}/${collectionId}/items/${itemId}/live`;
    const workerUrl = buildWorkerUrl_MJ(apiUrl);
    try {
        // Die Verzögerung wird jetzt VOR dem Aufruf in den Schleifen von displayMyJobsAndApplicants gehandhabt.
        // await delay(API_CALL_DELAY_MS); // Entfernt von hier, um Doppel-Delays zu vermeiden
        const response = await fetch(workerUrl);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Item ${itemId} in Collection ${collectionId} nicht gefunden (404).`);
                return null;
            }
            const errorText = await response.text();
            console.error(`API-Fehler beim Abrufen von Item ${itemId} aus Collection ${collectionId}: ${response.status} - ${errorText}`);
             if (response.status === 429) {
                console.warn(`Rate limit getroffen bei Item ${itemId}. Erhöhe API_CALL_DELAY_MS oder implementiere Retry.`);
                // Rückgabe eines speziellen Objekts oder null, um den Fehler anzuzeigen
                return { error: true, status: 429, message: "Too Many Requests for item " + itemId };
            }
            return null; // Bei anderen Fehlern null zurückgeben
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Netzwerkfehler oder anderer Fehler beim Abrufen des Items (${collectionId}/${itemId}): ${error.message}`);
        return null;
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
        const skeletonPlaceholder1 = document.createElement("div");
        skeletonPlaceholder1.classList.add("db-table-row-item");
        const skeletonText1 = document.createElement("div");
        skeletonText1.classList.add("skeleton-element", "skeleton-text", "skeleton-text-medium");
        skeletonPlaceholder1.appendChild(skeletonText1);
        jobHeader.appendChild(skeletonPlaceholder1);
        const skeletonPlaceholder2 = document.createElement("div");
        skeletonPlaceholder2.classList.add("db-table-row-item");
        const skeletonText2 = document.createElement("div");
        skeletonText2.classList.add("skeleton-element", "skeleton-text", "skeleton-text-short");
        skeletonPlaceholder2.appendChild(skeletonText2);
        jobHeader.appendChild(skeletonPlaceholder2);
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
        const skeletonToggleRow = document.createElement("div");
        skeletonToggleRow.classList.add("applicants-toggle-row-skeleton", "skeleton-element");
        skeletonToggleRow.style.height = "30px";
        skeletonToggleRow.style.width = "150px";
        skeletonToggleRow.style.margin = "10px auto";
        jobWrapper.appendChild(skeletonToggleRow);
        container.appendChild(jobWrapper);
    }
}

// --- Rendering-Funktionen ---
function createApplicantRowElement(applicantFieldData) {
    const applicantDiv = document.createElement("div");
    applicantDiv.classList.add("db-table-row", "db-table-applicant", "job-entry");

    if (typeof MAPPINGS === 'undefined') {
        console.error("❌ MAPPINGS-Objekt ist nicht definiert.");
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Fehler: Mapping-Daten nicht verfügbar.";
        errorDiv.style.color = "red";
        applicantDiv.appendChild(errorDiv);
        return applicantDiv;
    }

    // 1. Spalte: Bild + Name/Plus-Status
    const profileInfoDiv = document.createElement("div");
    profileInfoDiv.classList.add("db-table-row-item", "justify-left");
    if (applicantFieldData["user-profile-img"]) {
        const applicantImg = document.createElement("img");
        applicantImg.classList.add("db-table-img", "is-margin-right-12");
        applicantImg.src = typeof applicantFieldData["user-profile-img"] === 'string' ? applicantFieldData["user-profile-img"] : applicantFieldData["user-profile-img"]?.url;
        applicantImg.alt = applicantFieldData.name || "Bewerberbild";
        profileInfoDiv.appendChild(applicantImg);
    }
    const namePlusStatusDiv = document.createElement("div");
    namePlusStatusDiv.classList.add("is-flexbox-vertical");
    const nameSpan = document.createElement("span");
    nameSpan.textContent = applicantFieldData.name || "Unbekannter Bewerber";
    namePlusStatusDiv.appendChild(nameSpan);
    const plusStatusSpan = document.createElement("span");
    plusStatusSpan.classList.add("is-txt-tiny");
    plusStatusSpan.textContent = applicantFieldData["plus-mitglied"] ? "Plus Mitglied" : "Standard";
    namePlusStatusDiv.appendChild(plusStatusSpan);
    profileInfoDiv.appendChild(namePlusStatusDiv);
    applicantDiv.appendChild(profileInfoDiv);

    // 2. Spalte: City + Bundesland + Land
    const locationDiv = document.createElement("div");
    locationDiv.classList.add("db-table-row-item");
    const city = applicantFieldData["user-city-2"] || "K.A.";
    const bundeslandId = applicantFieldData["bundesland-option"];
    const bundeslandName = MAPPINGS.bundeslaender[bundeslandId] || (bundeslandId ? bundeslandId : "K.A.");
    const landId = applicantFieldData["creator-land"];
    const landName = MAPPINGS.laender[landId] || (landId ? landId : "");
    locationDiv.textContent = `${city}${bundeslandName !== "K.A." ? `, ${bundeslandName}` : ""}${landName ? `, ${landName}` : ""}`;
    applicantDiv.appendChild(locationDiv);

    // 3. Spalte: Kategorie (creator-main-categorie - direkt angezeigt)
    const categoryDivElement = document.createElement("div");
    categoryDivElement.classList.add("db-table-row-item");
    categoryDivElement.textContent = applicantFieldData["creator-main-categorie"] || "K.A.";
    applicantDiv.appendChild(categoryDivElement);

    // 4. Spalte: Creator Typ (gemappt über creator-type)
    const creatorTypeDiv = document.createElement("div");
    creatorTypeDiv.classList.add("db-table-row-item");
    const creatorTypeId = applicantFieldData["creator-type"];
    creatorTypeDiv.textContent = MAPPINGS.creatorTypen[creatorTypeId] || (creatorTypeId ? creatorTypeId : "K.A.");
    applicantDiv.appendChild(creatorTypeDiv);

    // 5. Spalte: Sprache (gemappt über sprache)
    const spracheDiv = document.createElement("div");
    spracheDiv.classList.add("db-table-row-item");
    const spracheId = applicantFieldData["sprache"];
    spracheDiv.textContent = MAPPINGS.sprachen[spracheId] || (spracheId ? spracheId : "K.A.");
    applicantDiv.appendChild(spracheDiv);

    // 6. Spalte: Social Media Kanäle
    const socialDiv = document.createElement("div");
    socialDiv.classList.add("db-table-row-item");
    const homepageUrl = applicantFieldData["homepage"];
    if (homepageUrl) {
        const platforms = [
            { name: "Instagram", icon: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e8d979b71d2a7e5db3_Instagram.svg", keyword: "instagram.com" },
            { name: "TikTok", icon: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e99dce86c2b6ba83fe_Tiktok.svg", keyword: "tiktok.com" },
            { name: "YouTube", icon: "https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/640219e9b00d0480ffe289dc_YouTube.svg", keyword: "youtube.com" }
        ];
        for (const platform of platforms) {
            if (homepageUrl.toLowerCase().includes(platform.keyword)) {
                const socialLink = document.createElement("a");
                socialLink.href = homepageUrl;
                socialLink.classList.add("db-application-option", "no-icon", "w-inline-block");
                socialLink.target = "_blank";
                socialLink.rel = "noopener noreferrer";
                const iconImg = document.createElement("img");
                iconImg.src = platform.icon;
                iconImg.alt = `${platform.name} Profil`;
                iconImg.classList.add("db-icon-18");
                socialLink.appendChild(iconImg);
                socialDiv.appendChild(socialLink);
                break;
            }
        }
    }
    applicantDiv.appendChild(socialDiv);

    // 7. Spalte: Anzahl der Follower (gemappt über creator-follower)
    const followerDiv = document.createElement("div");
    followerDiv.classList.add("db-table-row-item");
    const followerId = applicantFieldData["creator-follower"];
    followerDiv.textContent = MAPPINGS.followerRanges[followerId] || (followerId ? followerId : "K.A.");
    applicantDiv.appendChild(followerDiv);

    // 8. Spalte: Alter (gemappt über creator-age)
    const ageDiv = document.createElement("div");
    ageDiv.classList.add("db-table-row-item");
    const ageId = applicantFieldData["creator-age"];
    ageDiv.textContent = MAPPINGS.altersgruppen[ageId] || (ageId ? ageId : "K.A.");
    applicantDiv.appendChild(ageDiv);

    return applicantDiv;
}

function renderMyJobsAndApplicants(jobsWithApplicants) {
    const container = document.getElementById("jobs-list");
    if (!container) {
        console.error("❌ Container 'jobs-list' nicht gefunden.");
        return;
    }
    container.innerHTML = "";
    if (jobsWithApplicants.length === 0) {
        const noJobsMsg = document.createElement("p");
        noJobsMsg.textContent = "Du hast noch keine Jobs erstellt oder es wurden keine Jobs gefunden, die deinen Kriterien entsprechen.";
        noJobsMsg.classList.add("job-entry");
        container.appendChild(noJobsMsg);
        requestAnimationFrame(() => noJobsMsg.classList.add("visible"));
        return;
    }
    const fragment = document.createDocumentFragment();
    jobsWithApplicants.forEach(jobItem => {
        const jobFieldData = jobItem.fieldData;
        if (!jobFieldData) {
            console.warn("Job-Item ohne fieldData übersprungen:", jobItem);
            return;
        }
        const jobWrapper = document.createElement("div");
        jobWrapper.classList.add("my-job-item", "job-entry");
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
        const applicantsCountCell = document.createElement("div");
        applicantsCountCell.classList.add("db-table-row-item");
        applicantsCountCell.textContent = `Bewerber: ${jobItem.applicants.length}`;
        jobHeaderDiv.appendChild(applicantsCountCell);
        jobWrapper.appendChild(jobHeaderDiv);
        const toggleButtonRow = document.createElement("div");
        toggleButtonRow.classList.add("applicants-toggle-row");
        const toggleDivElement = document.createElement("div");
        toggleDivElement.classList.add("db-table-applicants");
        toggleDivElement.innerHTML = `Bewerberliste <span class="toggle-icon">▼</span>`;
        toggleDivElement.style.cursor = "pointer";
        toggleButtonRow.appendChild(toggleDivElement);
        jobWrapper.appendChild(toggleButtonRow);
        const applicantsContainer = document.createElement("div");
        applicantsContainer.classList.add("applicants-list-container");
        applicantsContainer.style.display = "none";
        if (jobItem.applicants.length > 0) {
            jobItem.applicants.forEach(applicant => {
                if (applicant && applicant.fieldData) {
                    applicantsContainer.appendChild(createApplicantRowElement(applicant.fieldData));
                } else if (applicant && applicant.error && applicant.status === 429) {
                    // Zeige eine Nachricht für diesen spezifischen Bewerber an, wenn Rate Limit getroffen wurde
                    const rateLimitMsg = document.createElement("p");
                    rateLimitMsg.textContent = `Daten für Bewerber konnten wegen API-Limits nicht geladen werden.`;
                    rateLimitMsg.style.color = "orange";
                    rateLimitMsg.style.padding = "5px 0";
                    applicantsContainer.appendChild(rateLimitMsg);
                }
            });
        } else {
            const noApplicantsMsg = document.createElement("p");
            noApplicantsMsg.textContent = "Noch keine Bewerbungen für diesen Job.";
            noApplicantsMsg.style.padding = "10px 0";
            applicantsContainer.appendChild(noApplicantsMsg);
        }
        jobWrapper.appendChild(applicantsContainer);
        fragment.appendChild(jobWrapper);
        toggleDivElement.addEventListener("click", () => {
            const isHidden = applicantsContainer.style.display === "none";
            applicantsContainer.style.display = isHidden ? "block" : "none";
            toggleDivElement.querySelector(".toggle-icon").textContent = isHidden ? "▲" : "▼";
            if (isHidden) {
                const applicantEntries = applicantsContainer.querySelectorAll(".job-entry");
                applicantEntries.forEach(entry => entry.classList.remove("visible"));
                requestAnimationFrame(() => {
                    applicantEntries.forEach(entry => entry.classList.add("visible"));
                });
            }
        });
    });
    container.appendChild(fragment);
    requestAnimationFrame(() => {
        container.querySelectorAll(".my-job-item.job-entry").forEach(entry => entry.classList.add("visible"));
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

        await delay(API_CALL_DELAY_MS); // Erste Verzögerung vor dem Abrufen des aktuellen Benutzers
        const currentUserItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, currentWebflowMemberId_MJ);

        if (!currentUserItem || currentUserItem.error) {
            console.error("❌ Benutzerdaten des aktuellen Users nicht gefunden oder Fehler beim Abruf.", currentUserItem);
            let errorMsg = "Benutzerdaten des aktuellen Users konnten nicht geladen werden.";
            if (currentUserItem && currentUserItem.status === 429) {
                errorMsg = "Zu viele Anfragen beim Laden der Benutzerdaten. Bitte versuche es später erneut.";
            }
            container.innerHTML = `<p class='error-message job-entry visible'>${errorMsg}</p>`;
            return;
        }
         if (!currentUserItem.fieldData) {
            console.error("❌ Benutzerdaten des aktuellen Users (fieldData) nicht gefunden.");
            renderMyJobsAndApplicants([]);
            return;
        }


        const postedJobIds = currentUserItem.fieldData["posted-jobs"] || [];
        console.log(`User hat ${postedJobIds.length} Jobs im Feld 'posted-jobs'.`);

        if (postedJobIds.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }

        let myJobItems = [];
        for (const jobId of postedJobIds) {
            console.log(`Fetching job item: ${jobId}`);
            await delay(API_CALL_DELAY_MS); // Verzögerung vor jedem Job-Abruf
            const jobItem = await fetchWebflowItem(JOB_COLLECTION_ID_MJ, jobId);
            if (jobItem && jobItem.fieldData && !jobItem.error) { // Stelle sicher, dass es kein Fehlerobjekt ist
                myJobItems.push(jobItem);
            } else if (jobItem && jobItem.error && jobItem.status === 429) {
                console.warn(`Rate limit für Job ${jobId} getroffen. Job wird übersprungen.`);
                // Optional: Dem User eine Nachricht anzeigen, dass nicht alle Jobs geladen werden konnten.
            } else {
                console.warn(`Job ${jobId} konnte nicht geladen werden oder hat keine fieldData.`);
            }
        }
        
        console.log(`Found ${myJobItems.length} valid jobs posted by this user.`);

        if (myJobItems.length === 0 && postedJobIds.length > 0) {
             container.innerHTML = "<p class='info-message job-entry visible'>Einige Jobdaten konnten aufgrund von API-Limits nicht geladen werden. Es werden möglicherweise nicht alle Jobs angezeigt.</p>";
             // Nicht direkt returnen, sondern versuchen, das zu rendern, was wir haben (was leer sein könnte)
             // oder eine spezifischere Nachricht anzeigen.
             // Fürs Erste, wenn keine Jobs geladen werden konnten, aber welche da sein sollten:
             if(myJobItems.length === 0) renderMyJobsAndApplicants([]);
             return; // Oder zumindest die Verarbeitung hier abbrechen, wenn keine Jobs geladen werden konnten
        } else if (myJobItems.length === 0) {
            renderMyJobsAndApplicants([]);
            return;
        }


        const jobsWithApplicantsData = [];
        for (const jobItem of myJobItems) {
            const jobFieldData = jobItem.fieldData;
            let fetchedApplicantsData = [];
            const applicantIds = jobFieldData["bewerber"] || [];

            if (applicantIds.length > 0) {
                for (const applicantId of applicantIds) {
                    console.log(`Fetching applicant item: ${applicantId} for job ${jobItem.id}`);
                    await delay(API_CALL_DELAY_MS); // Verzögerung vor jedem Bewerber-Abruf
                    const applicantItem = await fetchWebflowItem(USER_COLLECTION_ID_MJ, applicantId);
                    if (applicantItem && !applicantItem.error) { // Stelle sicher, dass es kein Fehlerobjekt ist
                        fetchedApplicantsData.push(applicantItem);
                    } else if (applicantItem && applicantItem.error && applicantItem.status === 429) {
                         console.warn(`Rate limit für Bewerber ${applicantId} (Job ${jobItem.id}) getroffen. Bewerber wird übersprungen.`);
                         fetchedApplicantsData.push(applicantItem); // Füge das Fehlerobjekt hinzu, um es in renderMyJobsAndApplicants zu behandeln
                    } else {
                        console.warn(`Bewerber ${applicantId} (Job ${jobItem.id}) konnte nicht geladen werden.`);
                    }
                }
            }
            jobsWithApplicantsData.push({ ...jobItem, applicants: fetchedApplicantsData });
        }

        allMyJobsData_MJ = jobsWithApplicantsData;
        renderMyJobsAndApplicants(allMyJobsData_MJ);

    } catch (error) {
        console.error("❌ Schwerwiegender Fehler in displayMyJobsAndApplicants:", error);
        if (container) {
            container.innerHTML = `<p class='error-message job-entry visible'>Ein Fehler ist aufgetreten: ${error.message}. Bitte versuche es später erneut.</p>`;
        }
    }
}

// --- Initialisierung ---
window.addEventListener("DOMContentLoaded", displayMyJobsAndApplicants);
