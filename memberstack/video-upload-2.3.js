// Add this function to your existing code to extract the uploadcare ID from a video URL
function extractUploadcareId(videoUrl) {
    // Check if it's an uploadcare URL
    if (videoUrl && videoUrl.includes('ucarecdn.com')) {
        // Extract the UUID from the URL pattern
        const uploadcarePattern = /ucarecdn\.com\/([a-f0-9-]+)/;
        const match = videoUrl.match(uploadcarePattern);
        
        if (match && match[1]) {
            console.log("✅ Uploadcare ID gefunden:", match[1]);
            return match[1];
        }
    } else if (videoUrl && /^[a-f0-9-]{36}$/.test(videoUrl)) {
        // The url itself might already be just the UUID (36 characters with hyphens)
        console.log("✅ Eingabe scheint bereits eine Uploadcare ID zu sein:", videoUrl);
        return videoUrl;
    }
    
    console.warn("⚠️ Keine Uploadcare ID im Video-Link gefunden");
    return null;
}

// Modify your getVideoLink function to extract the ID
function getVideoLink() {
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
        const element = form.querySelector(selector);
        if (element) {
            console.log(`🔍 Video-Link-Feld gefunden mit Selektor: ${selector}`, element.value);
            videoLinkElement = element;
            
            // Extract the uploadcare ID if available
            const uploadcareId = extractUploadcareId(element.value);
            if (uploadcareId) {
                console.log("📋 Uploadcare ID:", uploadcareId);
                
                // Store in a hidden field
                const uploadcareIdField = form.querySelector("input[name='uploadcare-id']") || 
                                         document.createElement("input");
                if (!uploadcareIdField.name) {
                    uploadcareIdField.type = "hidden";
                    uploadcareIdField.name = "uploadcare-id";
                    form.appendChild(uploadcareIdField);
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

// Add this to query the Uploadcare API for detailed file information
async function getUploadcareFileInfo(fileId) {
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
        form.appendChild(loadingElement);
        
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
        form.appendChild(copyButton);
        
        // You can now access properties like:
        // fileData.uuid - The file ID
        // fileData.original_filename - Original name
        // fileData.mime_type - MIME type
        // fileData.size - File size
        // fileData.content_info - Additional content info
        
        return fileData;
    } catch (error) {
        console.error("❌ Fehler beim Abrufen der Uploadcare-Dateiinformationen:", error);
        return null;
    }
}

// Modify your form submit handler to include the Uploadcare information
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("🚀 Formular wird gesendet...");
    
    // ... your existing code ...
    
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
        videoLink: getVideoLink()
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
        const fileInfo = await getUploadcareFileInfo(uploadcareId);
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
    
    if (DEBUG_MODE) {
        console.log("📝 Erfasste Formulardaten (mit Uploadcare-Info):", formData);
    }
    
    // ... rest of your existing code ...
});
