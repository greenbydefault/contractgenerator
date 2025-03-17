// 🌐 Webflow API Integration mit direkter Uploadcare-Anbindung
// Version 2.0

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

// 🎥 Funktion für den direkten Uploadcare-Upload
async function uploadVideoToUploadcare(file) {
    return new Promise((resolve, reject) => {
        try {
            // Prüfen, ob der Uploader verfügbar ist
            const uploadcare = window.uploadcare || window.UC;
            if (!uploadcare) {
                console.error("❌ Uploadcare ist nicht verfügbar. Bitte stellen Sie sicher, dass es geladen ist.");
                reject(new Error("Uploadcare ist nicht verfügbar"));
                return;
            }
            
            // Uploadcare-Widget manuell initialisieren, falls noch nicht geschehen
            const widget = uploadcare.Widget('[role=uploadcare-uploader]');
            
            // Auf Erfolg warten
            widget.onUploadComplete(fileInfo => {
                console.log("🎉 Uploadcare Upload erfolgreich:", fileInfo);
                const videoUrl = `https://ucarecdn.com/${fileInfo.uuid}/`;
                resolve({
                    uuid: fileInfo.uuid,
                    url: videoUrl,
                    fileInfo: fileInfo
                });
            });
            
            // Auf Fehler warten
            widget.onUploadFail(error => {
                console.error("❌ Uploadcare Upload fehlgeschlagen:", error);
                reject(error);
            });
            
            // Datei manuell hochladen, wenn übergeben
            if (file) {
                widget.value(file);
            }
        } catch (error) {
            console.error("❌ Fehler bei der Uploadcare-Integration:", error);
            reject(error);
        }
    });
}

// 🏗️ Funktion zum Hinzufügen des Video-Link-Feldes
function createOrUpdateVideoLinkField(formElement, uuid) {
    const videoUrl = `https://ucarecdn.com/${uuid}/`;
    let videoLinkInput = formElement.querySelector("input[name='Video Link']");
    
    if (!videoLinkInput) {
        videoLinkInput = document.createElement("input");
        videoLinkInput.type = "hidden";
        videoLinkInput.name = "Video Link";
        videoLinkInput.id = "video-link-field";
        formElement.appendChild(videoLinkInput);
    }
    
    videoLinkInput.value = videoUrl;
    
    // Rückmeldung auf der Benutzeroberfläche
    let statusDiv = document.getElementById("video-upload-status");
    if (!statusDiv) {
        statusDiv = document.createElement("div");
        statusDiv.id = "video-upload-status";
        statusDiv.style.padding = "10px";
        statusDiv.style.marginTop = "10px";
        statusDiv.style.borderRadius = "5px";
        statusDiv.style.backgroundColor = "#e6f7ff";
        statusDiv.style.border = "1px solid #1890ff";
        
        const uploaderEl = document.querySelector("uc-file-uploader-regular") || 
                           document.querySelector("[role=uploadcare-uploader]");
        if (uploaderEl && uploaderEl.parentNode) {
            uploaderEl.parentNode.insertBefore(statusDiv, uploaderEl.nextSibling);
        } else {
            formElement.appendChild(statusDiv);
        }
    }
    
    statusDiv.innerHTML = `
        <p style="margin: 0; color: #1890ff;"><strong>Video erfolgreich hochgeladen!</strong></p>
        <p style="margin: 5px 0 0; font-size: 0.9em; word-break: break-all;">
            <a href="${videoUrl}" target="_blank" style="color: #1890ff;">${videoUrl}</a>
        </p>
    `;
    
    console.log("🔗 Video-Link gesetzt:", videoUrl);
    return videoUrl;
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById(FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        return;
    }

    console.log("✅ Video Upload Script geladen für Formular:", form.id);
    
    // 🔍 Suche und analysiere das Uploadcare-Element
    const uploaderElement = form.querySelector("uc-file-uploader-regular") || form.querySelector("[role=uploadcare-uploader]");
    if (!uploaderElement) {
        console.warn("⚠️ Kein Uploadcare-Element im Formular gefunden. Bitte fügen Sie eines hinzu.");
    } else {
        console.log("✅ Uploadcare-Element gefunden:", uploaderElement);
        
        // Stelle sicher, dass Uploadcare den richtigen Public Key verwendet
        if (!uploaderElement.hasAttribute("pubkey") && uploaderElement.tagName === "UC-FILE-UPLOADER-REGULAR") {
            uploaderElement.setAttribute("pubkey", UPLOADCARE_PUBLIC_KEY);
        }
    }
    
    // 🎭 Anpassen des Uploadcare Elements, falls Web Components verwendet werden
    if (uploaderElement && uploaderElement.tagName === "UC-FILE-UPLOADER-REGULAR") {
        // Event-Listener für Uploadcare Web Component
        uploaderElement.addEventListener("success", (event) => {
            const fileInfo = event.detail;
            console.log("📹 Uploadcare Video hochgeladen:", fileInfo);
            
            if (fileInfo && fileInfo.uuid) {
                createOrUpdateVideoLinkField(form, fileInfo.uuid);
            }
        });
        
        // Event-Listener für Fehler
        uploaderElement.addEventListener("error", (event) => {
            console.error("❌ Uploadcare Fehler:", event.detail);
        });
    } 
    // Füge globalen Event-Listener für Widget-API hinzu (ältere Version)
    else {
        document.addEventListener("uploadcare:widget:success", (event) => {
            const fileInfo = event.detail && event.detail.fileInfo;
            if (fileInfo && fileInfo.uuid) {
                createOrUpdateVideoLinkField(form, fileInfo.uuid);
            }
        });
    }
    
    // Direkten Upload-Handler für jQuery-basierte Uploadcare-Version hinzufügen
    if (window.uploadcare && window.uploadcare.fileFrom) {
        console.log("✅ Uploadcare jQuery API gefunden");
        
        // Versuche, bestehende Uploadcare-Widgets zu finden
        const widgets = window.uploadcare.initialize();
        if (widgets && widgets.length > 0) {
            console.log(`✅ ${widgets.length} Uploadcare-Widgets gefunden`);
            
            widgets.forEach(widget => {
                widget.onUploadComplete(fileInfo => {
                    if (fileInfo && fileInfo.uuid) {
                        createOrUpdateVideoLinkField(form, fileInfo.uuid);
                    }
                });
            });
        }
    }
    
    // Alternative Methode, um auf Uploadcare-Ereignisse zu reagieren
    window.addEventListener("message", function(event) {
        if (event.data && event.data.type === "uploadcare:upload:success") {
            const fileInfo = event.data.file;
            if (fileInfo && fileInfo.uuid) {
                createOrUpdateVideoLinkField(form, fileInfo.uuid);
            }
        }
    });

    // Form-Submission-Handler
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

        // 🎬 Video-Link aus verschiedenen Quellen ermitteln
        function getVideoLink() {
            // 1. Prüfe das versteckte Feld
            const hiddenField = form.querySelector("#video-link-field") || 
                               form.querySelector("input[name='Video Link']");
            if (hiddenField && hiddenField.value) {
                console.log("🔍 Video-Link aus Hidden Field:", hiddenField.value);
                return hiddenField.value;
            }
            
            // 2. Prüfe alle anderen möglichen Namenskonventionen
            const possibleSelectors = [
                "input[data-name='Video Link']",
                "input[name='VideoLink']",
                "input[name='video-link']",
                "input[data-name='video-link']"
            ];
            
            for (const selector of possibleSelectors) {
                const element = form.querySelector(selector);
                if (element && element.value) {
                    console.log(`🔍 Video-Link gefunden mit Selektor: ${selector}`, element.value);
                    return element.value;
                }
            }
            
            // 3. Prüfe Uploadcare-Widgets 
            if (window.uploadcare && window.uploadcare.fileFrom) {
                const widgets = window.uploadcare.initialize();
                for (const widget of widgets) {
                    if (widget.value()) {
                        const file = widget.value();
                        if (file && file.uuid) {
                            const url = `https://ucarecdn.com/${file.uuid}/`;
                            console.log(`🔍 Video-Link aus Uploadcare-Widget:`, url);
                            return url;
                        }
                    }
                }
            }
            
            // 4. Prüfe auf Web Component-Element
            const uploaderEl = form.querySelector("uc-file-uploader-regular");
            if (uploaderEl && uploaderEl.hasAttribute("data-file-uuid")) {
                const uuid = uploaderEl.getAttribute("data-file-uuid");
                if (uuid) {
                    const url = `https://ucarecdn.com/${uuid}/`;
                    console.log(`🔍 Video-Link aus Web Component Attribut:`, url);
                    return url;
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

// 🎭 Hilfsfunktion für direkten Upload über die Uploadcare API (falls nötig)
async function directUploadToUploadcare(file) {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
    formData.append('UPLOADCARE_STORE', 'auto');
    formData.append('file', file);
    
    try {
        const response = await fetch('https://upload.uploadcare.com/base/', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload fehlgeschlagen: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("🎉 Direkter Upload erfolgreich:", result);
        
        // Extrahiere die UUID aus der Antwort
        const uuid = result[file.name];
        return {
            uuid: uuid,
            url: `https://ucarecdn.com/${uuid}/`
        };
    } catch (error) {
        console.error("❌ Direkter Upload fehlgeschlagen:", error);
        throw error;
    }
}

// Exportiere Funktionen für externe Nutzung
window.videoUploader = {
    uploadToUploadcare: directUploadToUploadcare,
    createCMSItem: createCMSItem
};
