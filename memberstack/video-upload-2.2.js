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
    
    for (const selector of videoLinkSelectors) {
        const element = form.querySelector(selector);
        if (element) {
            console.log(`🔍 Video-Link-Feld gefunden mit Selektor: ${selector}`, element.value);
            
            // Extract the uploadcare ID if available
            const uploadcareId = extractUploadcareId(element.value);
            if (uploadcareId) {
                console.log("📋 Uploadcare ID:", uploadcareId);
                // You can store this ID in a hidden field or use it directly
                const uploadcareIdField = form.querySelector("input[name='uploadcare-id']") || 
                                         document.createElement("input");
                if (!uploadcareIdField.name) {
                    uploadcareIdField.type = "hidden";
                    uploadcareIdField.name = "uploadcare-id";
                    form.appendChild(uploadcareIdField);
                }
                uploadcareIdField.value = uploadcareId;
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
        
        const response = await fetch(workerUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/vnd.uploadcare-v0.7+json"
                // Der API-Token wird im Worker gesetzt
            }
        });
        
        if (!response.ok) {
            throw new Error(`Uploadcare API Fehler: ${response.status}`);
        }
        
        const fileData = await response.json();
        console.log("📄 Uploadcare Dateiinformationen:", fileData);
        
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
    
    // Get the uploadcare ID either from the hidden field or extract it from the video link
    const uploadcareId = form.querySelector("input[name='uploadcare-id']")?.value || 
                         extractUploadcareId(formData.videoLink);
    
    if (uploadcareId) {
        formData.uploadcareId = uploadcareId;
        
        // Optionally fetch detailed file information
        const fileInfo = await getUploadcareFileInfo(uploadcareId);
        if (fileInfo) {
            // Add additional file information to your formData if needed
            formData.videoMimeType = fileInfo.mime_type;
            formData.videoSize = fileInfo.size;
            
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
