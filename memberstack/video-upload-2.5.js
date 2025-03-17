// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const DEBUG_MODE = true; // 🐞 Debugging aktivieren/deaktivieren

// Uploadcare Datei-Informationen speichern
let uploadcareFileUuid = "";
let uploadcareFileCdnUrl = "";

// 🛠️ Hilfsfunktion zur Erstellung der Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// 📡 Funktion zur Erstellung eines CMS Items
async function createCMSItem(formData) {
    const apiUrl = `${API_BASE_URL}/${COLLECTION_ID}/items/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    
    // Die Webflow API erwartet dieses Format für ein Single Item
    const payload = {
        isArchived: false,
        isDraft: false,
        fieldData: {
            "name": formData.name || "Unbenanntes Video",
            "slug": formData.slug || "unbenanntes-video",
            "video-name": formData.name || "Unbenanntes Video",
            "video-kategorie": formData.kategorie || "",
            "video-beschreibung": formData.beschreibung || "Keine Beschreibung",
            "offentliches-video": formData.openVideo || false,
            "video-contest": formData.videoContest || false,
            "webflow-id": formData.webflowMemberId || "",
            "memberstack-id": formData.memberstackMemberId || "",
            "creator-name": formData.memberName || "Unbekannter Nutzer",
            "video-link": formData.videoLink || ""
        }
    };

    if (DEBUG_MODE) {
        console.log("📤 Sende Daten an Webflow API:", payload);
    }

    try {
        const response = await fetch(workerUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Der API-Token wird im Worker gesetzt
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error("📄 API-Antwort:", responseText);
            throw new Error(`API-Fehler: ${response.status} - ${responseText}`);
        }

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            responseData = { raw: responseText };
        }
        
        if (DEBUG_MODE) {
            console.log("✅ CMS Item erfolgreich erstellt:", responseData);
        }
        
        return responseData;
    } catch (error) {
        console.error("❌ Fehler beim Erstellen des CMS Items:", error);
        throw error;
    }
}

// 🔍 Funktion zur Analyse des Formulars und aller Felder
function analyzeForm(form) {
    console.log("🔍 Formular-Analyse:");
    
    const allInputs = form.querySelectorAll("input, textarea, select");
    console.log(`Gefundene Formularelemente: ${allInputs.length}`);
    
    allInputs.forEach((input, index) => {
        console.log(`${index + 1}. Element:`, {
            tag: input.tagName,
            type: input.type || "N/A",
            name: input.name || "Kein Name",
            id: input.id || "Keine ID",
            "data-name": input.getAttribute("data-name") || "Kein data-name",
            value: input.type === 'checkbox' ? input.checked : (input.value || "Kein Wert")
        });
    });
}

// Initialisiere Uploadcare und setze Event-Listener
function initUploadcare() {
    // Prüfe, ob das Uploadcare-Element existiert
    const uploaderCtx = document.querySelector('[id*="uploaderCtx"]');
    if (!uploaderCtx) {
        console.warn("⚠️ Uploadcare Context Provider nicht gefunden");
        return;
    }

    console.log("✅ Uploadcare Context Provider gefunden", uploaderCtx);

    // Funktion zum Abrufen der Dateiinformationen
    function getUploadcareFileInfo() {
        try {
            const api = uploaderCtx.getAPI();
            const state = api.getOutputCollectionState();
            
            if (state.successCount > 0) {
                // Nimm die erste erfolgreiche Datei
                const fileEntry = state.successEntries[0];
                
                // Speichere die UUID und CDN URL
                uploadcareFileUuid = fileEntry.uuid || "";
                uploadcareFileCdnUrl = fileEntry.cdnUrl || "";
                
                console.log("🎯 Uploadcare Datei gefunden:", {
                    name: fileEntry.name,
                    uuid: uploadcareFileUuid,
                    cdnUrl: uploadcareFileCdnUrl
                });
                
                // Aktualisiere versteckte Felder im Formular, falls vorhanden
                updateHiddenFields();
                
                return fileEntry;
            }
            return null;
        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
            return null;
        }
    }

    // Event-Listener für erfolgreiche Uploads
    uploaderCtx.addEventListener('file-upload-success', (event) => {
        console.log("🚀 Uploadcare Upload erfolgreich:", event.detail);
        getUploadcareFileInfo();
    });
    
    // Regelmäßige Überprüfung für Uploads
    setInterval(getUploadcareFileInfo, 2000);
}

// Aktualisiere versteckte Felder im Formular
function updateHiddenFields() {
    const form = document.getElementById(FORM_ID);
    if (!form) return;
    
    // Suche nach versteckten Feldern für die UUID und CDN URL
    const videoLinkInput = form.querySelector("input[name='Video Link'], input[name='VideoLink'], input[name='video-link']");
    if (videoLinkInput) {
        videoLinkInput.value = uploadcareFileCdnUrl;
        console.log("✅ Verstecktes Feld 'Video Link' aktualisiert:", uploadcareFileCdnUrl);
    }
    
    // Optional: Feld für die UUID finden und aktualisieren
    const uuidInput = form.querySelector("input[name='File UUID'], input[name='FileUUID'], input[name='file-uuid']");
    if (uuidInput) {
        uuidInput.value = uploadcareFileUuid;
        console.log("✅ Verstecktes Feld 'File UUID' aktualisiert:", uploadcareFileUuid);
    }
}

// Videolink extrahieren oder aus Uploadcare abrufen
function getVideoLink() {
    // Falls wir bereits einen CDN-Link von Uploadcare haben, verwende diesen
    if (uploadcareFileCdnUrl) {
        console.log("✅ Verwende Uploadcare CDN URL als Video-Link:", uploadcareFileCdnUrl);
        return uploadcareFileCdnUrl;
    }
    
    // Ansonsten versuche wie bisher die Felder zu finden
    const form = document.getElementById(FORM_ID);
    const videoLinkSelectors = [
        "input[name='Video Link']",
        "input[name='VideoLink']",
        "input[name='video-link']",
        "input[data-name='Video Link']",
        "input[data-name='video-link']"
    ];
    
    for (const selector of videoLinkSelectors) {
        const element = form.querySelector(selector);
        if (element) {
            console.log(`🔍 Video-Link-Feld gefunden mit Selektor: ${selector}`, element.value);
            return element.value;
        }
    }
    
    console.warn("⚠️ Kein Video-Link-Feld gefunden. Setze leer.");
    return "";
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    // Initialisiere Uploadcare-Integration
    initUploadcare();
    
    const form = document.getElementById(FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        return;
    }

    console.log("✅ Member Video Upload Script geladen für Formular:", form.id);
    
    // Formularanalyse durchführen
    analyzeForm(form);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("🚀 Formular wird gesendet...");
        
        // Hilfsfunktionen zur Felderermittlung
        function getValue(selector, defaultValue = "") {
            const element = form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Feld '${selector}' nicht gefunden. Setze Standardwert: '${defaultValue}'`);
                return defaultValue;
            }
            console.log(`🔍 Feld '${selector}' gefunden:`, element.value);
            return element.value;
        }

        function getChecked(selector) {
            const element = form.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Checkbox '${selector}' nicht gefunden. Standard: false`);
                return false;
            }
            console.log(`🔍 Checkbox '${selector}' gefunden:`, element.checked);
            return element.checked;
        }
        
        function findCheckbox(possibleNames) {
            for (const name of possibleNames) {
                const selectors = [
                    `input[name='${name}']`,
                    `input[data-name='${name}']`,
                    `input#${name}`,
                    `input[placeholder='${name}']`
                ];
                
                for (const selector of selectors) {
                    const element = form.querySelector(selector);
                    if (element && element.type === 'checkbox') {
                        console.log(`🔍 Checkbox gefunden mit Selektor: ${selector}`);
                        return element.checked;
                    }
                }
            }
            
            console.warn(`⚠️ Keine Checkbox mit Namen ${possibleNames.join(', ')} gefunden`);
            return false;
        }

        function getKategorieId() {
            const kategorieSelectors = [
                "select[name='Kategorie']",
                "select[data-name='Kategorie']",
                "input[name='Kategorie']",
                "input[data-name='Kategorie']"
            ];
            
            for (const selector of kategorieSelectors) {
                const element = form.querySelector(selector);
                if (element) {
                    console.log(`🔍 Kategorie-Feld gefunden mit Selektor: ${selector}`, element.value);
                    return element.value;
                }
            }
            
            console.warn("⚠️ Kein Kategorie-Feld gefunden. Standard-Kategorie wird verwendet.");
            return "2f1f2fe0cd35ddd19ca98f4b85b16258";
        }

        // Ermittle die Formulardaten mit den korrekten Selektoren
        const formData = {
            name: getValue("input[name='Name']", "Unbenanntes Video"),
            slug: getValue("input[name='Name']", "Unbenanntes Video").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Math.random().toString(36).substring(2, 6),
            kategorie: getKategorieId(),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video']),
            videoContest: findCheckbox(['video contest', 'Video Contest']),
            webflowMemberId: getValue("input[name='Webflow Member ID']", ""),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']", ""),
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
            videoLink: getVideoLink() // Diese Funktion nutzt nun auch Uploadcare-Daten
        };

        if (DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }

        // Statusanzeige für den Upload-Prozess
        const statusMessage = document.createElement("div");
        statusMessage.id = "upload-status";
        statusMessage.style.padding = "10px";
        statusMessage.style.marginTop = "15px";
        statusMessage.style.borderRadius = "5px";
        statusMessage.style.fontWeight = "bold";
        
        // Zeige "Wird hochgeladen..." an
        statusMessage.textContent = "Video wird hochgeladen...";
        statusMessage.style.color = "#0066cc";
        statusMessage.style.border = "1px solid #0066cc";
        statusMessage.style.backgroundColor = "#f0f8ff";
        form.appendChild(statusMessage);

        try {
            const result = await createCMSItem(formData);
            console.log("🎉 Video erfolgreich hochgeladen!", result);
            
            // Erfolgsmeldung anzeigen
            statusMessage.textContent = "Video erfolgreich hochgeladen!";
            statusMessage.style.color = "green";
            statusMessage.style.border = "1px solid green";
            statusMessage.style.backgroundColor = "#f0fff0";
        } catch (error) {
            console.error("❌ Fehler beim Hochladen:", error);
            
            // Fehlermeldung anzeigen
            statusMessage.textContent = "Fehler beim Hochladen. Bitte kontaktiere den Support.";
            statusMessage.style.color = "red";
            statusMessage.style.border = "1px solid red";
            statusMessage.style.backgroundColor = "#fff0f0";
        }
    });
});
