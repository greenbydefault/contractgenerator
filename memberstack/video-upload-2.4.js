// 🌐 Webflow API Integration zur Erstellung eines CMS Collection Items

// 🔧 Konfiguration
const API_BASE_URL = "https://api.webflow.com/v2/collections";
const WORKER_BASE_URL = "https://upload.oliver-258.workers.dev/?url=";
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

// Add this function to extract the uploadcare ID from a video URL
function extractUploadcareId(videoUrl) {
    if (!videoUrl) return null;
    
    // Check if it's an uploadcare URL
    if (videoUrl.includes('ucarecdn.com')) {
        // Extract the UUID from the URL pattern
        const uploadcarePattern = /ucarecdn\.com\/([a-f0-9-]{36})/;
        const match = videoUrl.match(uploadcarePattern);
        
        if (match && match[1]) {
            console.log("✅ Uploadcare ID gefunden:", match[1]);
            return match[1];
        }
    } else if (/^[a-f0-9-]{36}$/.test(videoUrl)) {
        // The url itself might already be just the UUID (36 characters with hyphens)
        console.log("✅ Eingabe scheint bereits eine Uploadcare ID zu sein:", videoUrl);
        return videoUrl;
    }
    
    console.warn("⚠️ Keine Uploadcare ID im Video-Link gefunden");
    return null;
}

// Add this to query the Uploadcare API for detailed file information
async function getUploadcareFileInfo(fileId, formElement) {
    if (!fileId) {
        console.error("❌ Keine Uploadcare ID für API-Anfrage vorhanden");
        return null;
    }
    
    try {
        // Use your worker to proxy the API request or make a direct request if CORS is configured
        const apiUrl = `https://api.uploadcare.com/files/${fileId}/`;
        const workerUrl = buildWorkerUrl(apiUrl);
        
        // Anzeigen eines Lade-Indikators
        const loadingElement = document.createElement('div');
        loadingElement.id = 'uploadcare-loading';
        loadingElement.style.margin = '10px 0';
        loadingElement.style.padding = '8px';
        loadingElement.style.backgroundColor = '#f1f1f1';
        loadingElement.style.borderRadius = '4px';
        loadingElement.style.textAlign = 'center';
        loadingElement.innerHTML = 'Lade Dateiinformationen von Uploadcare...';
        
        // Füge den Ladeindikator unter dem Formular ein
        formElement.appendChild(loadingElement);
        
        const response = await fetch(workerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/vnd.uploadcare-v0.7+json"
                // Der API-Token wird im Worker gesetzt
            }
        });
        
        // Entferne den Lade-Indikator
        loadingElement.remove();
        
        if (!response.ok) {
            throw new Error(`Uploadcare API Fehler: ${response.status}`);
        }
        
        const fileData = await response.json();
        console.log("📄 Uploadcare Dateiinformationen:", fileData);
        
        // Create a clickable button to copy the UUID to clipboard
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.id = 'copy-uuid-button';
        copyButton.style.marginTop = '10px';
        copyButton.style.padding = '5px 10px';
        copyButton.style.backgroundColor = '#1890ff';
        copyButton.style.color = 'white';
        copyButton.style.border = 'none';
        copyButton.style.borderRadius = '4px';
        copyButton.style.cursor = 'pointer';
        copyButton.innerHTML = 'UUID in die Zwischenablage kopieren';
        copyButton.onclick = function() {
            navigator.clipboard.writeText(fileId).then(() => {
                copyButton.innerHTML = '✓ Kopiert!';
                setTimeout(() => {
                    copyButton.innerHTML = 'UUID in die Zwischenablage kopieren';
                }, 2000);
            }).catch(err => {
                console.error('Fehler beim Kopieren:', err);
                copyButton.innerHTML = '✗ Fehler beim Kopieren';
            });
        };
        
        // Anfügen des Buttons an das Formular oder an ein Element deiner Wahl
        formElement.appendChild(copyButton);
        
        return fileData;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
        return null;
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

// 📥 Event Listener für das Formular
document.addEventListener("DOMContentLoaded", () => {
    // Überprüfe, ob der Uploadcare-Locale-Fehler behoben werden muss
    if (window.UPLOADCARE_LOCALE && window.UPLOADCARE_LOCALE === 'de') {
        console.log("🌍 Korrigiere Uploadcare Locale-Einstellung...");
        window.UPLOADCARE_LOCALE = 'en';
    }
    
    const form = document.getElementById(FORM_ID);
    if (!form) {
        console.error(`❌ Formular mit ID '${FORM_ID}' nicht gefunden.`);
        return;
    }

    console.log("✅ Member Video Upload Script geladen für Formular:", form.id);
    
    // Formularanalyse durchführen
    analyzeForm(form);
    
    // Hilfsfunktion: getVideoLink - WICHTIG: form als Parameter übergeben
    function getVideoLink(formElement) {
        // Verschiedene mögliche Selektoren für das Video-Link-Feld
        const videoLinkSelectors = [
            "input[name='Video Link']",
            "input[name='VideoLink']",
            "input[name='video-link']",
            "input[data-name='Video Link']",
            "input[data-name='video-link']"
        ];
        
        let videoLinkElement = null;
        
        for (const selector of videoLinkSelectors) {
            const element = formElement.querySelector(selector);
            if (element) {
                console.log(`🔍 Video-Link-Feld gefunden mit Selektor: ${selector}`, element.value);
                videoLinkElement = element;
                
                // Extract the uploadcare ID if available
                const uploadcareId = extractUploadcareId(element.value);
                if (uploadcareId) {
                    console.log("📋 Uploadcare ID:", uploadcareId);
                    
                    // Store in a hidden field
                    const uploadcareIdField = formElement.querySelector("input[name='uploadcare-id']") || 
                                             document.createElement("input");
                    if (!uploadcareIdField.name) {
                        uploadcareIdField.type = "hidden";
                        uploadcareIdField.name = "uploadcare-id";
                        formElement.appendChild(uploadcareIdField);
                    }
                    uploadcareIdField.value = uploadcareId;
                    
                    // Create a user-visible field to display the UUID
                    const idDisplayElement = document.getElementById('uploadcare-id-display') || 
                                            document.createElement('div');
                    if (!idDisplayElement.id) {
                        idDisplayElement.id = 'uploadcare-id-display';
                        idDisplayElement.style.marginTop = '10px';
                        idDisplayElement.style.padding = '8px';
                        idDisplayElement.style.border = '1px solid #ddd';
                        idDisplayElement.style.borderRadius = '4px';
                        idDisplayElement.style.backgroundColor = '#f9f9f9';
                        idDisplayElement.style.fontFamily = 'monospace';
                        videoLinkElement.parentNode.insertBefore(idDisplayElement, videoLinkElement.nextSibling);
                    }
                    idDisplayElement.innerHTML = `<strong>Uploadcare UUID:</strong> <span style="color:#0066cc">${uploadcareId}</span>`;
                }
                
                return element.value;
            }
        }
        
        console.warn("⚠️ Kein Video-Link-Feld gefunden. Setze leer.");
        return "";
    }

    // Hilfsfunktionen zur Felderermittlung - WICHTIG: form als Parameter übergeben
    function getValue(selector, defaultValue = "", formElement) {
        const element = formElement.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ Feld '${selector}' nicht gefunden. Setze Standardwert: '${defaultValue}'`);
            return defaultValue;
        }
        console.log(`🔍 Feld '${selector}' gefunden:`, element.value);
        return element.value;
    }

    function getChecked(selector, formElement) {
        const element = formElement.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ Checkbox '${selector}' nicht gefunden. Standard: false`);
            return false;
        }
        console.log(`🔍 Checkbox '${selector}' gefunden:`, element.checked);
        return element.checked;
    }
    
    // Alternative Selektoren für die Checkbox-Feldsuche 
    function findCheckbox(possibleNames, formElement) {
        for (const name of possibleNames) {
            // Versuche verschiedene Selektoren
            const selectors = [
                `input[name='${name}']`,
                `input[data-name='${name}']`,
                `input#${name}`,
                `input[placeholder='${name}']`
            ];
            
            for (const selector of selectors) {
                const element = formElement.querySelector(selector);
                if (element && element.type === 'checkbox') {
                    console.log(`🔍 Checkbox gefunden mit Selektor: ${selector}`);
                    return element.checked;
                }
            }
        }
        
        console.warn(`⚠️ Keine Checkbox mit Namen ${possibleNames.join(', ')} gefunden`);
        return false;
    }

    // Kategorien-ID extrahieren oder leeren String verwenden
    function getKategorieId(formElement) {
        // Versuche verschiedene Selektoren für das Kategorie-Feld
        const kategorieSelectors = [
            "select[name='Kategorie']",
            "select[data-name='Kategorie']",
            "input[name='Kategorie']",
            "input[data-name='Kategorie']"
        ];
        
        for (const selector of kategorieSelectors) {
            const element = formElement.querySelector(selector);
            if (element) {
                console.log(`🔍 Kategorie-Feld gefunden mit Selektor: ${selector}`, element.value);
                return element.value;
            }
        }
        
        // Wenn nicht gefunden, versuche einen festen Wert (z.B. "2f1f2fe0cd35ddd19ca98f4b85b16258")
        console.warn("⚠️ Kein Kategorie-Feld gefunden. Standard-Kategorie wird verwendet.");
        return "2f1f2fe0cd35ddd19ca98f4b85b16258"; // Standard-Kategorie-ID
    }

    // Automatische Überprüfung beim Laden der Seite
    const initialVideoLink = getVideoLink(form);
    if (initialVideoLink) {
        const uploadcareId = extractUploadcareId(initialVideoLink);
        if (uploadcareId) {
            console.log("🔄 Automatisch erkannte Uploadcare ID:", uploadcareId);
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("🚀 Formular wird gesendet...");
        
        // Ermittle die Formulardaten mit den korrekten Selektoren
        // WICHTIG: Übergebe das Formular-Element an jede Hilfsfunktion
        const formData = {
            name: getValue("input[name='Name']", "Unbenanntes Video", form),
            slug: getValue("input[name='Name']", "Unbenanntes Video", form).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Math.random().toString(36).substring(2, 6),
            kategorie: getKategorieId(form),
            beschreibung: getValue("textarea[name='Beschreibung']", "", form) || getValue("input[name='Beschreibung']", "Keine Beschreibung", form),
            openVideo: findCheckbox(['open video', 'Open Video', 'öffentliches video', 'Öffentliches Video'], form),
            videoContest: findCheckbox(['video contest', 'Video Contest'], form),
            webflowMemberId: getValue("input[name='Webflow Member ID']", "", form),
            memberstackMemberId: getValue("input[name='Memberstack Member ID']", "", form),
            memberName: getValue("input[name='Member Name']", "Unbekannter Nutzer", form),
            videoLink: getVideoLink(form)
        };
        
        // Finde das Video-Link-Feld für spätere Aktualisierung
        let videoLinkElement = null;
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
                videoLinkElement = element;
                break;
            }
        }

        if (DEBUG_MODE) {
            console.log("📝 Erfasste Formulardaten:", formData);
        }
        
        // Get the uploadcare ID either from the hidden field or extract it from the video link
        const uploadcareId = form.querySelector("input[name='uploadcare-id']")?.value || 
                             extractUploadcareId(formData.videoLink);
        
        if (uploadcareId) {
            formData.uploadcareId = uploadcareId;
            
            // Aktualisiere das Video-Link-Feld, um nur die UUID zu zeigen,
            // falls es sich um eine vollständige URL handelt
            if (videoLinkElement && formData.videoLink.includes('ucarecdn.com')) {
                videoLinkElement.value = uploadcareId;
                formData.videoLink = uploadcareId; // Aktualisiere auch in den Formulardaten
            }
            
            // Statusanzeige für die Uploadcare ID
            const statusDiv = document.createElement('div');
            statusDiv.style.margin = '15px 0';
            statusDiv.style.padding = '10px';
            statusDiv.style.backgroundColor = '#e6f7ff';
            statusDiv.style.border = '1px solid #91d5ff';
            statusDiv.style.borderRadius = '4px';
            statusDiv.innerHTML = `
                <strong>Uploadcare ID erfolgreich extrahiert:</strong>
                <div style="font-family: monospace; margin-top: 5px; word-break: break-all;">${uploadcareId}</div>
            `;
            
            // Füge die Statusanzeige unter dem Formular ein
            if (document.getElementById('uploadcare-status')) {
                document.getElementById('uploadcare-status').remove();
            }
            statusDiv.id = 'uploadcare-status';
            form.appendChild(statusDiv);
            
            // Optionally fetch detailed file information
            const fileInfo = await getUploadcareFileInfo(uploadcareId, form);
            if (fileInfo) {
                // Add additional file information to your formData if needed
                formData.videoMimeType = fileInfo.mime_type;
                formData.videoSize = fileInfo.size;
                
                // Füge Dateiinformationen zur Statusanzeige hinzu
                const fileInfoDiv = document.createElement('div');
                fileInfoDiv.style.marginTop = '10px';
                fileInfoDiv.innerHTML = `
                    <strong>Dateiinformationen:</strong>
                    <ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
                        <li>MIME-Typ: ${fileInfo.mime_type || 'Nicht verfügbar'}</li>
                        <li>Dateigröße: ${fileInfo.size ? (fileInfo.size / 1024 / 1024).toFixed(2) + ' MB' : 'Nicht verfügbar'}</li>
                        <li>Originalname: ${fileInfo.original_filename || 'Nicht verfügbar'}</li>
                    </ul>
                `;
                statusDiv.appendChild(fileInfoDiv);
                
                // If there's content analysis data available
                if (fileInfo.appdata) {
                    console.log("📊 Zusätzliche Videoanalyse-Daten:", fileInfo.appdata);
                    
                    // Store any specific analysis data you need
                    if (fileInfo.appdata.uc_clamav_virus_scan) {
                        formData.virusScanResult = fileInfo.appdata.uc_clamav_virus_scan.data;
                    }
                }
            }
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
            
            // Optional: Formular zurücksetzen oder zur Bestätigungsseite weiterleiten
            // form.reset();
            // oder
            // window.location.href = "/upload-success";
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
