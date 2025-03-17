// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const DEBUG_MODE = true; // 🐞 Debugging aktivieren/deaktivieren

// 🛠️ Hilfsfunktion zur Erstellung der Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📡 Funktion zur Erstellung eines CMS Items
async function createCMSItem(formData) {
    const apiUrl = `${API_BASE_URL}/${COLLECTION_ID}/items/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    
    const payload = {
        fieldData: {
            name: formData.name,
            slug: formData.slug,
            kategorie: formData.kategorie,
            beschreibung: formData.beschreibung,
            open_video: formData.openVideo,
            video_contest: formData.videoContest,
            webflow_member_id: formData.webflowMemberId,
            memberstack_member_id: formData.memberstackMemberId,
            member_name: formData.memberName,
        }
    };

    if (DEBUG_MODE) {
        console.log("📤 Sende Daten an Webflow API:", payload);
    }

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_WEBFLOW_API_KEY"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        if (DEBUG_MODE) {
            console.log("✅ CMS Item erfolgreich erstellt:", responseData);
        }
    } catch (error) {
        console.error("❌ Fehler beim Erstellen des CMS Items:", error);
    }
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById(FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        return;
    }

    console.log("✅ Member Video Upload Script erfolgreich geladen.");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        function getValue(selector) {
            const element = form.querySelector(selector);
            if (!element) {
                console.error(`⚠️ Feld '${selector}' nicht gefunden.`);
                return "";
            }
            return element.value;
        }

        function getChecked(selector) {
            const element = form.querySelector(selector);
            if (!element) {
                console.error(`⚠️ Checkbox '${selector}' nicht gefunden.`);
                return false;
            }
            return element.checked;
        }

        const formData = {
            name: getValue("input[name='Name']"),
            slug: getValue("input[name='Name']").toLowerCase().replace(/\s+/g, "-"),
            kategorie: getValue("input[name='Kategorie']"),
            beschreibung: getValue("input[name='Beschreibung']"),
            openVideo: getChecked("input[name='open video']"),
            videoContest: getChecked("input[name='video contest']"),
            webflowMemberId: getValue("input[name='Webflow Member ID']"),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']"),
            memberName: getValue("input[name='Member Name']"),
        };

        if (DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }

        await createCMSItem(formData);
    });
});
