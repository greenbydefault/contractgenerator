// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
const VIDEO_CONVERT_WORKER_URL = "https://video-convert.oliver-258.workers.dev"; // URL deines Video-Konvertierungs-Workers
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const SUCCESS_DIV_ID = "db-upload-susscess"; // DIV ID für Erfolgsmeldung
const DEBUG_MODE = true; // 🐞 Debugging aktivieren/deaktivieren

// Uploadcare Datei-Informationen speichern
let uploadcareFileUuid = "";
let uploadcareFileCdnUrl = "";
let uploadcareProcessedUrl = ""; // URL mit Videokonvertierung
let isVideoProcessing = false;

// 🛠️ Hilfsfunktion zur Erstellung der Worker-URL
function buildWorkerUrl(apiUrl) {
    return `${WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
}

// Funktion zur Videokonvertierung mit dem Cloudflare Worker
async function convertVideoWithWorker(uuid) {
    if (!uuid) {
        console.warn("⚠️ Keine UUID für Videokonvertierung vorhanden");
        return null;
    }

    try {
        isVideoProcessing = true;
        console.log("🎬 Starte Videokonvertierung für UUID:", uuid);

        // Sende Anfrage an den Cloudflare Worker
        const response = await fetch(VIDEO_CONVERT_WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uuid: uuid,
                format: "mp4",
                quality: "lighter",
                size: "360x640"
            })
        });

        // Verarbeite die Antwort
        if (!response.ok) {
            throw new Error(`Worker-Fehler: ${response.status}`);
        }

        const data = await response.json();
        isVideoProcessing = false;

        if (data.status === "success" && data.result && data.result.uuid) {
            // Speichere die neue UUID des konvertierten Videos
            console.log("✅ Videokonvertierung erfolgreich:", data.result);
            
            // Erstelle die URL des konvertierten Videos
            uploadcareProcessedUrl = `https://ucarecdn.com/${data.result.uuid}/`;
            
            return data.result;
        } else {
            // Bei Fehler oder unerwarteter Antwort
            console.warn("⚠️ Unerwartete Antwort vom Worker:", data);
            return null;
        }
    } catch (error) {
        isVideoProcessing = false;
        console.error("❌ Fehler bei der Videokonvertierung:", error);
        return null;
    }
}

// 📡 Funktion zur Erstellung eines CMS Items
async function createCMSItem(formData) {
    const apiUrl = `${API_BASE_URL}/${COLLECTION_ID}/items/live`;
    const workerUrl = buildWorkerUrl(apiUrl);
    
    // Die Webflow API erwartet dieses Format für ein Single Item
    // WICHTIG: Hier sind die korrekten Feldnamen aus der Webflow-Kollektion
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
    
    // Erstelle den Upload-Fortschrittsbalken
    createProgressBar();

    // Funktion zum Abrufen der Dateiinformationen
    function getUploadcareFileInfo() {
        try {
            const api = uploaderCtx.getAPI();
            const state = api.getOutputCollectionState();
            
            // Update Progress Bar basierend auf dem aktuellen Status
            updateProgressBar(state.progress, state.status);
            
            if (state.successCount > 0) {
                // Nimm die erste erfolgreiche Datei
                const fileEntry = state.successEntries[0];
                
                // Speichere die UUID und CDN URL
                uploadcareFileUuid = fileEntry.uuid || "";
                uploadcareFileCdnUrl = fileEntry.cdnUrl || "";
                
                console.log("🎯 Uploadcare Datei gefunden:", {
                    name: fileEntry.name,
                    uuid: uploadcareFileUuid,
                    originalCdnUrl: uploadcareFileCdnUrl
                });
                
                // Aktualisiere versteckte Felder im Formular, falls vorhanden
                updateHiddenFields();
                
                // Zeige Dateiinformationen an
                displayFileInfo(fileEntry);
                
                return fileEntry;
            }
            
            // Prüfe, ob derzeit eine Datei hochgeladen wird
            if (state.uploadingCount > 0) {
                const uploadingFile = state.uploadingEntries[0];
                displayFileInfo(uploadingFile, true);
            }
            
            return null;
        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
            return null;
        }
    }

    // Zeige Dateiinformation an
    function displayFileInfo(fileEntry, isUploading = false) {
        const fileInfoDiv = document.getElementById('fileInfo');
        if (!fileInfoDiv) return;
        
        let statusText = "";
        
        if (isUploading) {
            statusText = `<span style="color: #0066cc;">Wird hochgeladen (${Math.round(fileEntry.uploadProgress)}%)...</span>`;
        } else if (isVideoProcessing) {
            statusText = '<span style="color: #ff9900;">Video wird optimiert...</span>';
        } else {
            statusText = '<span style="color: green;">✓ Erfolgreich hochgeladen</span>';
        }
        
        fileInfoDiv.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <p><strong>Datei:</strong> ${fileEntry.name}</p>
                <p><strong>Größe:</strong> ${formatFileSize(fileEntry.size)}</p>
                <p><strong>Status:</strong> ${statusText}</p>
            </div>
        `;
    }

    // Formatiere Dateigröße
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Event-Listener für erfolgreiche Uploads
    uploaderCtx.addEventListener('file-upload-success', async (event) => {
        console.log("🚀 Uploadcare Upload erfolgreich:", event.detail);
        const fileEntry = getUploadcareFileInfo();
        
        // Wenn Video hochgeladen, starte die Konvertierung
        if (fileEntry && uploadcareFileUuid) {
            // Warte einen kurzen Moment, damit das Uploadcare-System das Video verarbeiten kann
            setTimeout(async () => {
                // Starte die Videokonvertierung mit dem Worker
                await convertVideoWithWorker(uploadcareFileUuid);
                
                // Aktualisiere die Anzeige nach der Konvertierung
                if (fileEntry) {
                    displayFileInfo(fileEntry, false);
                }
                
                // Aktualisiere die versteckten Felder mit der konvertierten URL
                updateHiddenFields();
            }, 1000);
        }
    });
    
    // Event-Listener für Upload-Fortschritt
    uploaderCtx.addEventListener('file-upload-progress', (event) => {
        console.log("📊 Upload-Fortschritt:", event.detail);
        getUploadcareFileInfo();
    });
    
    // Event-Listener für Start des Uploads
    uploaderCtx.addEventListener('file-upload-start', () => {
        console.log("🏁 Upload gestartet");
        showProgressBar();
    });
    
    // Event-Listener für Upload-Fehler
    uploaderCtx.addEventListener('file-upload-failed', (event) => {
        console.error("❌ Upload fehlgeschlagen:", event.detail);
        updateProgressBar(0, 'failed');
    });
    
    // Regelmäßige Überprüfung für Uploads
    setInterval(getUploadcareFileInfo, 1000);
}

// Erstellen des Fortschrittsbalkens
function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'upload-progress-container';
    progressContainer.style.display = 'none';
    progressContainer.style.marginTop = '15px';
    progressContainer.style.width = '100%';
    
    const progressLabel = document.createElement('div');
    progressLabel.id = 'upload-progress-label';
    progressLabel.textContent = 'Upload-Fortschritt:';
    progressLabel.style.marginBottom = '5px';
    progressLabel.style.fontWeight = 'bold';
    
    const progressBarOuter = document.createElement('div');
    progressBarOuter.style.width = '100%';
    progressBarOuter.style.backgroundColor = '#e0e0e0';
    progressBarOuter.style.borderRadius = '4px';
    progressBarOuter.style.overflow = 'hidden';
    progressBarOuter.style.height = '20px';
    
    const progressBarInner = document.createElement('div');
    progressBarInner.id = 'upload-progress-bar';
    progressBarInner.style.width = '0%';
    progressBarInner.style.height = '100%';
    progressBarInner.style.backgroundColor = '#4CAF50';
    progressBarInner.style.transition = 'width 0.3s ease';
    
    const progressText = document.createElement('div');
    progressText.id = 'upload-progress-text';
    progressText.textContent = '0%';
    progressText.style.marginTop = '5px';
    progressText.style.textAlign = 'center';
    
    progressBarOuter.appendChild(progressBarInner);
    progressContainer.appendChild(progressLabel);
    progressContainer.appendChild(progressBarOuter);
    progressContainer.appendChild(progressText);
    
    // Füge den Fortschrittsbalken zum Formular hinzu
    const form = document.getElementById(FORM_ID);
    if (form) {
        // Nach dem Uploadcare-Element einfügen
        const uploader = form.querySelector('uc-file-uploader-minimal');
        if (uploader) {
            uploader.parentNode.insertBefore(progressContainer, uploader.nextSibling);
        } else {
            form.appendChild(progressContainer);
        }
    }
    
    // Erstelle einen Container für Dateiinformationen
    const fileInfoDiv = document.createElement('div');
    fileInfoDiv.id = 'fileInfo';
    
    if (form) {
        form.appendChild(fileInfoDiv);
    }
}

// Zeige den Fortschrittsbalken an
function showProgressBar() {
    const progressContainer = document.getElementById('upload-progress-container');
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
}

// Aktualisiere den Fortschrittsbalken
function updateProgressBar(progress, status) {
    const progressBar = document.getElementById('upload-progress-bar');
    const progressText = document.getElementById('upload-progress-text');
    const progressLabel = document.getElementById('upload-progress-label');
    
    if (!progressBar || !progressText || !progressLabel) return;
    
    // Konvertiere Fortschritt in Prozent
    const percent = Math.round(progress * 100);
    
    // Aktualisiere die Anzeige
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    
    // Färbe den Balken je nach Status
    switch (status) {
        case 'uploading':
            progressBar.style.backgroundColor = '#4CAF50'; // Grün
            progressLabel.textContent = 'Upload-Fortschritt:';
            break;
        case 'success':
            progressBar.style.backgroundColor = '#4CAF50'; // Grün
            progressLabel.textContent = 'Upload abgeschlossen:';
            break;
        case 'failed':
            progressBar.style.backgroundColor = '#f44336'; // Rot
            progressLabel.textContent = 'Upload fehlgeschlagen:';
            break;
        case 'processing':
            progressBar.style.backgroundColor = '#ff9900'; // Orange
            progressLabel.textContent = 'Video wird optimiert:';
            break;
        default:
            progressBar.style.backgroundColor = '#4CAF50'; // Grün
            break;
    }
}

// Aktualisiere versteckte Felder im Formular
function updateHiddenFields() {
    const form = document.getElementById(FORM_ID);
    if (!form) return;
    
    // Suche nach versteckten Feldern für die UUID und CDN URL
    const videoLinkInput = form.querySelector("input[name='Video Link'], input[name='VideoLink'], input[name='video-link']");
    if (videoLinkInput) {
        // Bevorzuge die konvertierte URL, falls vorhanden
        videoLinkInput.value = uploadcareProcessedUrl || uploadcareFileCdnUrl;
        console.log("✅ Verstecktes Feld 'Video Link' aktualisiert:", videoLinkInput.value);
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
    // Falls wir bereits eine prozessierte URL haben, verwende diese
    if (uploadcareProcessedUrl) {
        console.log("✅ Verwende prozessierte Uploadcare URL als Video-Link:", uploadcareProcessedUrl);
        return uploadcareProcessedUrl;
    }
    
    // Falls keine prozessierte URL, aber eine Standard-CDN URL verfügbar ist
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

// Kategorien-ID extrahieren oder leeren String verwenden
function getKategorieId() {
    const form = document.getElementById(FORM_ID);
    // Versuche verschiedene Selektoren für das Kategorie-Feld
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
    
    // Wenn nicht gefunden, versuche einen festen Wert
    console.warn("⚠️ Kein Kategorie-Feld gefunden. Standard-Kategorie wird verwendet.");
    return "2f1f2fe0cd35ddd19ca98f4b85b16258"; // Standard-Kategorie-ID
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

        // Prüfe, ob ein Video hochgeladen wurde
        if (!uploadcareFileUuid) {
            alert("Bitte lade zuerst ein Video hoch, bevor du das Formular absendest.");
            return;
        }

        // Ausblenden des erfolgs-DIVs, falls vorhanden
        const successDiv = document.getElementById(SUCCESS_DIV_ID);
        if (successDiv) {
            successDiv.style.display = 'none';
        }

        // Videoname abrufen oder Default verwenden
        const videoName = getValue("input[name='Name']", "Unbenanntes Video");
        
        // Erstelle einen Slug aus Videoname und UUID
        let slug = videoName.toLowerCase()
            .replace(/\s+/g, "-")        // Leerzeichen zu Bindestrichen
            .replace(/[^a-z0-9-]/g, "")  // Nur alphanumerische und Bindestriche
            .replace(/-+/g, "-")         // Mehrfache Bindestriche zu einem
            .replace(/^-|-$/g, "");      // Bindestriche am Anfang und Ende entfernen
            
        // Füge UUID hinzu
        if (uploadcareFileUuid) {
            slug = `${slug}-${uploadcareFileUuid.slice(0, 8)}`; // Nimm die ersten 8 Zeichen der UUID
        }

        // Ermittle die Formulardaten mit den korrekten Selektoren
        const formData = {
            name: videoName,
            slug: slug,
            kategorie: getKategorieId(),
            beschreibung: getValue("textarea[name='Beschreibung']") || getValue("input[name='Beschreibung']", "Keine Beschreibung"),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video']),
            videoContest: findCheckbox(['video contest', 'Video Contest']),
            webflowMemberId: getValue("input[name='Webflow Member ID']", ""),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']", ""),
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer"),
            videoLink: getVideoLink() // Diese Funktion nutzt die konvertierte URL, falls vorhanden
        };

        if (DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }

        // Statusanzeige für den Webflow-Upload-Prozess mit Verzögerung anzeigen
        const uploadContainer = document.getElementById('upload-progress-container');
        if (uploadContainer) {
            const progressLabel = document.getElementById('upload-progress-label');
            if (progressLabel) {
                progressLabel.textContent = 'Daten werden an Webflow gesendet:';
            }
            
            // Zeige den Fortschrittsbalken mit 2 Sekunden Verzögerung
            setTimeout(() => {
                uploadContainer.style.display = 'block';
                updateProgressBar(0, 'uploading');
            }, 2000);
        }

        try {
            // Simuliere Fortschritt beim Webflow-Upload
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 0.1; // Erhöhe um 10%
                if (progress > 0.9) {
                    clearInterval(progressInterval);
                }
                updateProgressBar(progress, 'uploading');
            }, 300);

            const result = await createCMSItem(formData);
            console.log("🎉 Video erfolgreich hochgeladen!", result);
            
            // Fortschrittsintervall stoppen und auf 100% setzen
            clearInterval(progressInterval);
            updateProgressBar(1.0, 'success');
            
            // Optional: Formular zurücksetzen oder zur Bestätigungsseite weiterleiten
            // setTimeout(() => {
            //     window.location.href = "/upload-success";
            // }, 2000);
        } catch (error) {
            console.error("❌ Fehler beim Hochladen:", error);
            
            // Fortschrittsbalken auf Fehler setzen
            updateProgressBar(0.3, 'failed');
        }
    });
});
