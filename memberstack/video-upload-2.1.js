// 🌐 Webflow API Integration mit vereinfachter Uploadcare-Anbindung
// Version 3.0

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const DEBUG_MODE = true; // 🐞 Debugging aktivieren/deaktivieren
const UPLOADCARE_PUBLIC_KEY = "a6c530350c28177a0509";

// Globales Objekt für Uploadcare-Daten
const uploadcareData = {
  videoUUID: null,
  videoURL: null
};

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

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    // Uploadcare-Elemente suchen
    const ucWidgetElement = document.querySelector('input[type="hidden"][role="uploadcare-uploader"]');
    const ucFileUploaderElement = document.querySelector('uc-file-uploader-regular');
    
    if (DEBUG_MODE) {
        console.log("🔍 Uploadcare Widget Element:", ucWidgetElement);
        console.log("🔍 Uploadcare File Uploader Element:", ucFileUploaderElement);
    }
    
    // Manuelle Integration von Uploadcare hinzufügen
    function initializeManualUploadcare() {
        // Entfernen vorhandener Uploadcare-Elemente (falls erforderlich)
        const existingUploadcare = document.getElementById('manual-uploadcare-container');
        if (existingUploadcare) {
            existingUploadcare.remove();
        }
        
        // Erstelle neuen Container
        const uploadcareContainer = document.createElement('div');
        uploadcareContainer.id = 'manual-uploadcare-container';
        uploadcareContainer.style.marginBottom = '20px';
        
        // Erstelle das Input-Element
        const uploadcareInput = document.createElement('input');
        uploadcareInput.type = 'hidden';
        uploadcareInput.id = 'uploadcare-widget';
        uploadcareInput.setAttribute('role', 'uploadcare-uploader');
        uploadcareInput.setAttribute('data-public-key', UPLOADCARE_PUBLIC_KEY);
        uploadcareInput.setAttribute('data-tabs', 'file camera url');
        uploadcareInput.setAttribute('data-effects', 'crop,rotate,enhance,sharp,grayscale');
        uploadcareInput.setAttribute('data-store', 'auto');
        uploadcareInput.setAttribute('data-images-only', 'false');
        uploadcareInput.setAttribute('data-system-dialog', 'true');
        
        // Hinzufügen zum Container
        uploadcareContainer.appendChild(uploadcareInput);
        
        // Container in das Formular einfügen
        const form = document.getElementById(FORM_ID);
        if (form) {
            // Finde eine gute Position im Formular
            const firstInput = form.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.parentNode.insertBefore(uploadcareContainer, firstInput);
            } else {
                form.insertBefore(uploadcareContainer, form.firstChild);
            }
            
            // Statusanzeige vorbereiten
            const statusDiv = document.createElement('div');
            statusDiv.id = 'uploadcare-status';
            statusDiv.style.display = 'none';
            statusDiv.style.padding = '10px';
            statusDiv.style.marginTop = '10px';
            statusDiv.style.borderRadius = '5px';
            uploadcareContainer.appendChild(statusDiv);
            
            console.log("✅ Manuelles Uploadcare-Widget hinzugefügt");
            
            // Widget initialisieren
            if (typeof uploadcare !== 'undefined') {
                const widget = uploadcare.Widget('#uploadcare-widget');
                
                widget.onUploadComplete(function(fileInfo) {
                    console.log("🎉 Upload erfolgreich:", fileInfo);
                    
                    // Video-URL und UUID speichern
                    uploadcareData.videoUUID = fileInfo.uuid;
                    uploadcareData.videoURL = 'https://ucarecdn.com/' + fileInfo.uuid + '/';
                    
                    // Status anzeigen
                    const statusDiv = document.getElementById('uploadcare-status');
                    if (statusDiv) {
                        statusDiv.style.display = 'block';
                        statusDiv.style.backgroundColor = '#e6f7ff';
                        statusDiv.style.border = '1px solid #1890ff';
                        statusDiv.innerHTML = `
                            <p style="margin: 0; color: #1890ff;"><strong>Video erfolgreich hochgeladen!</strong></p>
                            <p style="margin: 5px 0 0; font-size: 0.9em; word-break: break-all;">
                                <a href="${uploadcareData.videoURL}" target="_blank" style="color: #1890ff;">${uploadcareData.videoURL}</a>
                            </p>
                        `;
                    }
                    
                    // Hidden Input für Video-Link erstellen/aktualisieren
                    let videoLinkInput = document.getElementById('video-link-field');
                    if (!videoLinkInput) {
                        videoLinkInput = document.createElement('input');
                        videoLinkInput.type = 'hidden';
                        videoLinkInput.id = 'video-link-field';
                        videoLinkInput.name = 'Video Link';
                        form.appendChild(videoLinkInput);
                    }
                    videoLinkInput.value = uploadcareData.videoURL;
                });
                
                console.log("✅ Uploadcare Widget erfolgreich initialisiert");
            } else {
                console.error("❌ Uploadcare Widget-API nicht gefunden!");
                
                // Uploadcare-Script manuell laden
                const uploadcareScript = document.createElement('script');
                uploadcareScript.src = 'https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js';
                document.head.appendChild(uploadcareScript);
                
                uploadcareScript.onload = function() {
                    console.log("✅ Uploadcare Widget-API nachgeladen");
                    initializeManualUploadcare(); // Erneut initialisieren
                };
            }
        } else {
            console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        }
    }
    
    // Manuelle Uploadcare-Integration starten
    initializeManualUploadcare();
    
    // Formulardaten extrahieren
    const form = document.getElementById(FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        return;
    }
    
    console.log("✅ Video Upload Script geladen für Formular:", form.id);

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
        
        // Video-Link aus verschiedenen Quellen ermitteln
        function getVideoLink() {
            // Zuerst aus dem globalen Objekt
            if (uploadcareData.videoURL) {
                console.log("🔍 Video-Link aus globalem Objekt:", uploadcareData.videoURL);
                return uploadcareData.videoURL;
            }
            
            // Aus Hidden Field
            const videoLinkField = document.getElementById('video-link-field');
            if (videoLinkField && videoLinkField.value) {
                console.log("🔍 Video-Link aus Hidden Field:", videoLinkField.value);
                return videoLinkField.value;
            }
            
            // Aus Widget-API
            if (typeof uploadcare !== 'undefined') {
                const widget = uploadcare.Widget('#uploadcare-widget');
                if (widget && widget.value()) {
                    const fileInfo = widget.value();
                    if (fileInfo && fileInfo.uuid) {
                        const url = 'https://ucarecdn.com/' + fileInfo.uuid + '/';
                        console.log("🔍 Video-Link aus Widget-API:", url);
                        return url;
                    }
                }
            }
            
            console.warn("⚠️ Kein Video-Link gefunden.");
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
            
            // Existierende Fehlermeldung entfernen, falls vorhanden
            const existingError = form.querySelector(".error-message");
            if (existingError) {
                existingError.remove();
            }
            
            errorMessage.className = "error-message";
            form.appendChild(errorMessage);
            
            return; // Abbrechen, wenn kein Video-Link vorhanden ist
        }

        // Statusanzeige für den Upload-Prozess
        const statusMessage = document.createElement("div");
        statusMessage.id = "cms-upload-status";
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
