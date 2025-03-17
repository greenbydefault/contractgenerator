// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url="; // Neuer Worker-Endpunkt
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
    
    // Die Webflow API erwartet dieses Format für ein Single Item
    const payload = {
        isArchived: false,
        isDraft: false,
        fieldData: {
            name: formData.name || "Unbenanntes Video",
            slug: formData.slug || "unbenanntes-video",
            kategorie: formData.kategorie || "Keine Kategorie",
            beschreibung: formData.beschreibung || "Keine Beschreibung",
            open_video: formData.openVideo || false,
            video_contest: formData.videoContest || false,
            webflow_member_id: formData.webflowMemberId || "",
            memberstack_member_id: formData.memberstackMemberId || "",
            member_name: formData.memberName || "Unbekannter Nutzer"
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
                // Der API-Token wird jetzt direkt im Worker gesetzt
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text(); // Immer zuerst als Text holen
        
        if (!response.ok) {
            console.error("📄 API-Antwort:", responseText);
            throw new Error(`API-Fehler: ${response.status} - ${responseText}`);
        }

        // Versuche, die Antwort als JSON zu parsen
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
    
    // Alle Input-Elemente im Formular auflisten
    const allInputs = form.querySelectorAll("input, textarea, select");
    console.log(`Gefundene Formularelemente: ${allInputs.length}`);
    
    allInputs.forEach((input, index) => {
        console.log(`${index + 1}. Element:`, {
            tag: input.tagName,
            type: input.type || "N/A",
            name: input.name || "Kein Name",
            id: input.id || "Keine ID",
            value: input.type === 'checkbox' ? input.checked : (input.value || "Kein Wert")
        });
    });
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
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
        
        // Alternative Selektoren für die Checkbox-Feldsuche 
        function findCheckbox(possibleNames) {
            for (const name of possibleNames) {
                // Versuche verschiedene Selektoren
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

        // Ermittle die Formulardaten mit verbesserten Selektoren
        const formData = {
            name: getValue("input[name='Name']", "Unbenanntes Video"),
            slug: getValue("input[name='Name']", "Unbenanntes Video").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            kategorie: getValue("input[name='Kategorie']", "Keine Kategorie"),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'open-video', 'OpenVideo']),
            videoContest: findCheckbox(['video contest', 'Video Contest', 'video-contest', 'VideoContest']),
            webflowMemberId: getValue("input[name='Webflow Member ID']", ""),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']", ""),
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
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
            
            // Optional: Formular zurücksetzen
            // form.reset();
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
