// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items mit Uploadcare

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const DEBUG_MODE = true; // 🐞 Debugging aktivieren/deaktivieren
const UPLOADCARE_PUBLIC_KEY = "a6c530350c28177a0509";

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
            "video-kategorie": formData.kategorie || "2f1f2fe0cd35ddd19ca98f4b85b16258",
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
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        
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
    const allInputs = form.querySelectorAll("input, textarea, select, uc-file-uploader-regular");
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

// 🔄 Uploadcare Event-Listener hinzufügen
function setupUploadcareListeners() {
    // Listener für Uploadcare-Ereignisse
    document.addEventListener("uploadcare:regular:success", (event) => {
        const fileInfo = event.detail;
        console.log("📹 Uploadcare Video hochgeladen:", fileInfo);
        
        // Uploadcare-URL erstellen
        const videoUrl = `https://ucarecdn.com/${fileInfo.uuid}/`;
        console.log("🔗 Video-URL:", videoUrl);
        
        // Hidden Input-Feld für den Video-Link erstellen oder aktualisieren
        let videoLinkInput = document.querySelector("input[name='Video Link']");
        if (!videoLinkInput) {
            videoLinkInput = document.createElement("input");
            videoLinkInput.type = "hidden";
            videoLinkInput.name = "Video Link";
            document.getElementById(FORM_ID).appendChild(videoLinkInput);
        }
        videoLinkInput.value = videoUrl;
        
        // Anzeige für den Benutzer, dass das Video hochgeladen wurde
        const uploadStatusDiv = document.createElement("div");
        uploadStatusDiv.innerHTML = `
            <div style="padding: 10px; margin-top: 10px; border-radius: 5px; background-color: #e6f7ff; border: 1px solid #1890ff;">
                <p style="margin: 0; color: #1890ff;"><strong>Video hochgeladen!</strong></p>
                <p style="margin: 5px 0 0; font-size: 0.9em; word-break: break-all;">${videoUrl}</p>
            </div>
        `;
        
        // Uploadcare-Element finden und den Status danach einfügen
        const uploaderElement = document.querySelector("uc-file-uploader-regular");
        if (uploaderElement) {
            uploaderElement.parentNode.insertBefore(uploadStatusDiv, uploaderElement.nextSibling);
        } else {
            document.getElementById(FORM_ID).appendChild(uploadStatusDiv);
        }
    });
    
    // Listener für Uploadcare-Fehler
    document.addEventListener("uploadcare:regular:error", (event) => {
        console.error("❌ Uploadcare Fehler:", event.detail);
        
        // Fehleranzeige für den Benutzer
        const errorDiv = document.createElement("div");
        errorDiv.innerHTML = `
            <div style="padding: 10px; margin-top: 10px; border-radius: 5px; background-color: #fff1f0; border: 1px solid #ff4d4f;">
                <p style="margin: 0; color: #ff4d4f;"><strong>Fehler beim Hochladen!</strong></p>
                <p style="margin: 5px 0 0; font-size: 0.9em;">Bitte versuche es erneut oder kontaktiere den Support.</p>
            </div>
        `;
        
        const uploaderElement = document.querySelector("uc-file-uploader-regular");
        if (uploaderElement) {
            uploaderElement.parentNode.insertBefore(errorDiv, uploaderElement.nextSibling);
        } else {
            document.getElementById(FORM_ID).appendChild(errorDiv);
        }
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
    
    // Uploadcare-Listener einrichten
    setupUploadcareListeners();
    
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

        function getVideoLink() {
            // Prüfe zuerst, ob wir ein verstecktes Feld mit dem Video-Link haben
            const videoLinkInput = form.querySelector("input[name='Video Link']");
            if (videoLinkInput && videoLinkInput.value) {
                console.log("🔍 Video-Link gefunden:", videoLinkInput.value);
                return videoLinkInput.value;
            }
            
            // Verschiedene mögliche Selektoren für das Video-Link-Feld
            const videoLinkSelectors = [
                "input[data-name='Video Link']",
                "input[name='VideoLink']",
                "input[name='video-link']",
                "input[data-name='video-link']"
            ];
            
            for (const selector of videoLinkSelectors) {
                const element = form.querySelector(selector);
                if (element && element.value) {
                    console.log(`🔍 Video-Link-Feld gefunden mit Selektor: ${selector}`, element.value);
                    return element.value;
                }
            }
            
            // Prüfe auf Uploadcare-UUID über Uploadcare API
            const uploaderElement = form.querySelector("uc-file-uploader-regular");
            if (uploaderElement && uploaderElement.hasAttribute("ctx-name")) {
                // Versuche, die UUID zu bekommen (falls möglich)
                // Dies ist ein Fallback, sollte aber normalerweise nicht nötig sein
                console.log("⚠️ Kein direkter Video-Link gefunden, prüfe Uploadcare-Element");
                return "";
            }
            
            console.warn("⚠️ Kein Video-Link-Feld gefunden. Setze leer.");
            return "";
        }

        // Ermittle die Formulardaten mit den korrekten Selektoren
        const formData = {
            name: getValue("input[name='Name']", "Unbenanntes Video"),
            slug: getValue("input[name='Name']", "Unbenanntes Video").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Math.random().toString(36).substring(2, 6),
            kategorie: getValue("select[name='Kategorie']") || getValue("input[name='Kategorie']", "2f1f2fe0cd35ddd19ca98f4b85b16258"),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video']),
            videoContest: findCheckbox(['video contest', 'Video Contest']),
            webflowMemberId: getValue("input[name='Webflow Member ID']", ""),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']", ""),
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
            videoLink: getVideoLink()
        };

        if (DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }
        
        // Videolink prüfen
        if (!formData.videoLink) {
            console.error("❌ Kein Video-Link gefunden! Bitte lade zuerst ein Video hoch.");
            
            // Fehlermeldung anzeigen
            const errorMessage = document.createElement("div");
            errorMessage.innerHTML = `
                <div style="padding: 10px; margin-top: 15px; border-radius: 5px; background-color: #fff1f0; border: 1px solid #ff4d4f;">
                    <p style="margin: 0; color: #ff4d4f;"><strong>Fehler:</strong> Bitte lade zuerst ein Video hoch, bevor du das Formular absendest.</p>
                </div>
            `;
            form.appendChild(errorMessage);
            
            return; // Abbrechen, wenn kein Video-Link vorhanden ist
        }

        // Statusanzeige für den Upload-Prozess
        const statusMessage = document.createElement("div");
        statusMessage.id = "upload-status";
        statusMessage.style.padding = "10px";
        statusMessage.style.marginTop = "15px";
        statusMessage.style.borderRadius = "5px";
        statusMessage.style.fontWeight = "bold";
        
        // Zeige "Wird hochgeladen..." an
        statusMessage.textContent = "Video wird in die Datenbank eingetragen...";
        statusMessage.style.color = "#0066cc";
        statusMessage.style.border = "1px solid #0066cc";
        statusMessage.style.backgroundColor = "#f0f8ff";
        form.appendChild(statusMessage);

        try {
            const result = await createCMSItem(formData);
            console.log("🎉 Video erfolgreich in CMS eingetragen!", result);
            
            // Erfolgsmeldung anzeigen
            statusMessage.textContent = "Video erfolgreich hochgeladen und eingetragen!";
            statusMessage.style.color = "green";
            statusMessage.style.border = "1px solid green";
            statusMessage.style.backgroundColor = "#f0fff0";
            
            // Optional: Formular zurücksetzen oder zur Bestätigungsseite weiterleiten
            // form.reset();
            // oder
            // window.location.href = "/upload-success";
        } catch (error) {
            console.error("❌ Fehler beim Eintragen in CMS:", error);
            
            // Fehlermeldung anzeigen
            statusMessage.textContent = "Fehler beim Eintragen in die Datenbank. Bitte kontaktiere den Support.";
            statusMessage.style.color = "red";
            statusMessage.style.border = "1px solid red";
            statusMessage.style.backgroundColor = "#fff0f0";
        }
    });
});
