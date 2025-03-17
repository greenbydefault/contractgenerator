// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
const COLLECTION_ID = "67d806e65cadcadf2f41e659"; // Collection ID für Videos
const FORM_ID = "db-upload-video";
const SUCCESS_DIV_ID = "db-upload-susscess";
const DEBUG_MODE = false; // 🐞 Debugging deaktiviert für Produktion

// Uploadcare Datei-Informationen speichern (nicht im Frontend sichtbar)
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
            "video-link": formData.videoLink || "",
            "file-uuid": uploadcareFileUuid || "" // Speichere die UUID im CMS
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
            if (DEBUG_MODE) {
                console.error("📄 API-Antwort:", responseText);
            }
            throw new Error(`API-Fehler: ${response.status}`);
        }

        // Versuche, die Antwort als JSON zu parsen
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            if (DEBUG_MODE) {
                console.warn("⚠️ Konnte API-Antwort nicht als JSON parsen:", responseText);
            }
            responseData = { raw: responseText };
        }
        
        if (DEBUG_MODE) {
            console.log("✅ CMS Item erfolgreich erstellt:", responseData);
        }
        
        return responseData;
    } catch (error) {
        if (DEBUG_MODE) {
            console.error("❌ Fehler beim Erstellen des CMS Items:", error);
        }
        throw error;
    }
}

// Erstellen des Fortschrittsbalkens
function createProgressBar() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'upload-progress-container';
    progressContainer.style.display = 'none'; // Initial versteckt
    progressContainer.style.marginTop = '15px';
    progressContainer.style.width = '100%';
    
    const progressLabel = document.createElement('div');
    progressLabel.id = 'upload-progress-label';
    progressLabel.textContent = 'Daten werden an Webflow gesendet:';
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
        form.appendChild(progressContainer);
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
            break;
        case 'success':
            progressBar.style.backgroundColor = '#4CAF50'; // Grün
            progressLabel.textContent = 'Video erfolgreich hochgeladen!';
            break;
        case 'failed':
            progressBar.style.backgroundColor = '#f44336'; // Rot
            progressLabel.textContent = 'Fehler beim Hochladen!';
            break;
        default:
            progressBar.style.backgroundColor = '#4CAF50'; // Grün
            break;
    }
}

// Initialisiere Uploadcare und setze Event-Listener
function initUploadcare() {
    // Prüfe, ob das Uploadcare-Element existiert
    const uploaderCtx = document.querySelector('[id*="uploaderCtx"]');
    if (!uploaderCtx) {
        if (DEBUG_MODE) {
            console.warn("⚠️ Uploadcare Context Provider nicht gefunden");
        }
        return;
    }

    if (DEBUG_MODE) {
        console.log("✅ Uploadcare Context Provider gefunden");
    }
    
    // Erstelle den Fortschrittsbalken (nicht für Uploadcare, sondern für Webflow-Upload)
    createProgressBar();

    // Funktion zum Abrufen der Dateiinformationen
    function getUploadcareFileInfo() {
        try {
            const api = uploaderCtx.getAPI();
            const state = api.getOutputCollectionState();
            
            if (state.successCount > 0) {
                // Nimm die erste erfolgreiche Datei
                const fileEntry = state.successEntries[0];
                
                // Speichere die UUID und CDN URL im Script, nicht sichtbar im Frontend
                uploadcareFileUuid = fileEntry.uuid || "";
                uploadcareFileCdnUrl = fileEntry.cdnUrl || "";
                
                if (DEBUG_MODE) {
                    console.log("🎯 Uploadcare Datei gefunden:", {
                        name: fileEntry.name,
                        uuid: uploadcareFileUuid,
                        originalCdnUrl: uploadcareFileCdnUrl
                    });
                }
                
                // Aktualisiere versteckte Felder im Formular, falls vorhanden
                updateHiddenFields();
                
                // Minimale Dateiinformation anzeigen (nur Bestätigung, keine technischen Details)
                const fileInfoDiv = document.getElementById('fileInfo');
                if (fileInfoDiv) {
                    fileInfoDiv.innerHTML = `
                        <div style="margin-top: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; background-color: #f9f9f9;">
                            <p>✅ <strong>Video bereit zum Hochladen</strong></p>
                        </div>
                    `;
                }
                
                return fileEntry;
            }
            
            return null;
        } catch (error) {
            if (DEBUG_MODE) {
                console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
            }
            return null;
        }
    }

    // Event-Listener für erfolgreiche Uploads
    uploaderCtx.addEventListener('file-upload-success', (event) => {
        if (DEBUG_MODE) {
            console.log("🚀 Uploadcare Upload erfolgreich");
        }
        getUploadcareFileInfo();
    });
    
    // Regelmäßige Überprüfung für Uploads
    setInterval(getUploadcareFileInfo, 1000);
}

// Aktualisiere versteckte Felder im Formular
function updateHiddenFields() {
    const form = document.getElementById(FORM_ID);
    if (!form) return;
    
    // Suche nach versteckten Feldern für die UUID und CDN URL
    const videoLinkInput = form.querySelector("input[name='Video Link'], input[name='VideoLink'], input[name='video-link']");
    if (videoLinkInput) {
        videoLinkInput.value = uploadcareFileCdnUrl;
    }
    
    // Optional: Feld für die UUID finden und aktualisieren
    const uuidInput = form.querySelector("input[name='File UUID'], input[name='FileUUID'], input[name='file-uuid']");
    if (uuidInput) {
        uuidInput.value = uploadcareFileUuid;
    }
}

// Videolink aus Uploadcare abrufen
function getVideoLink() {
    // Falls UUID und CDN-URL verfügbar sind
    if (uploadcareFileCdnUrl) {
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
        if (element && element.value) {
            return element.value;
        }
    }
    
    return "";
}

// Kategorie ID extrahieren
function getKategorieId() {
    const form = document.getElementById(FORM_ID);
    const kategorieSelectors = [
        "select[name='Kategorie']",
        "select[data-name='Kategorie']",
        "input[name='Kategorie']",
        "input[data-name='Kategorie']"
    ];
    
    for (const selector of kategorieSelectors) {
        const element = form.querySelector(selector);
        if (element && element.value) {
            return element.value;
        }
    }
    
    return "2f1f2fe0cd35ddd19ca98f4b85b16258"; // Standard-Kategorie-ID
}

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    // Initialisiere Uploadcare-Integration
    initUploadcare();
    
    const form = document.getElementById(FORM_ID);
    if (!form) {
        if (DEBUG_MODE) {
            console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        }
        return;
    }

    if (DEBUG_MODE) {
        console.log("✅ Member Video Upload Script geladen für Formular:", form.id);
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        if (DEBUG_MODE) {
            console.log("🚀 Formular wird gesendet...");
        }
        
        // Hilfsfunktionen zur Felderermittlung
        function getValue(selector, defaultValue = "") {
            const element = form.querySelector(selector);
            if (!element || !element.value) {
                return defaultValue;
            }
            return element.value;
        }

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
                        return element.checked;
                    }
                }
            }
            
            return false;
        }

        // Prüfe, ob ein Video hochgeladen wurde
        if (!uploadcareFileUuid) {
            alert("Bitte lade zuerst ein Video hoch, bevor du das Formular absendest.");
            return;
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
            videoLink: getVideoLink() // Diese Funktion nutzt Uploadcare-Daten
        };

        // Blende das Success-Div aus, falls vorhanden
        const successDiv = document.getElementById(SUCCESS_DIV_ID);
        if (successDiv) {
            successDiv.style.display = 'none';
        }

        // Zeige den Fortschrittsbalken mit Verzögerung an
        setTimeout(() => {
            const uploadContainer = document.getElementById('upload-progress-container');
            if (uploadContainer) {
                uploadContainer.style.display = 'block';
                updateProgressBar(0, 'uploading');
            }
        }, 2000); // 2 Sekunden Verzögerung

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
            
            // Fortschrittsintervall stoppen und auf 100% setzen
            clearInterval(progressInterval);
            updateProgressBar(1.0, 'success');
            
            // Optional: Formular zurücksetzen oder zur Bestätigungsseite weiterleiten
            // setTimeout(() => {
            //     window.location.href = "/upload-success";
            // }, 2000);
        } catch (error) {
            // Fortschrittsbalken auf Fehler setzen
            updateProgressBar(0.3, 'failed');
        }
    });
});
