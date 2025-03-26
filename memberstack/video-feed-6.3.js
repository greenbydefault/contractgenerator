// 🌐 Webflow API Integration für Video-Feed
// Optimierte Version 2.0

/**
 * Konfigurationswerte mit Defaults
 */
const DEFAULT_BASE_URL = "https://api.webflow.com/v2/collections";
const DEFAULT_WORKER_BASE_URL = "https://bewerbungen.oliver-258.workers.dev/?url=";
const DEFAULT_MEMBER_COLLECTION_ID = "6448faf9c5a8a15f6cc05526";
const DEFAULT_VIDEO_COLLECTION_ID = "67d806e65cadcadf2f41e659";
const DEFAULT_FREE_MEMBER_LIMIT = 1;
const DEFAULT_PAID_MEMBER_LIMIT = 12;

/**
 * Globale Konfiguration für das Video-Feed-Skript
 */
window.WEBFLOW_API = window.WEBFLOW_API || {};

// KRITISCHER FIX: Stelle sicher, dass die globale Konfiguration korrekt initialisiert wird 
// und immer Fallback-Werte hat, selbst wenn window.WEBFLOW_API bereits existiert

// Funktion zur sicheren Initialisierung von Konfigurationswerten
function ensureConfigValue(key, defaultValue) {
  // Prüfen, ob der Wert bereits existiert und gültig ist
  if (!window.WEBFLOW_API[key]) {
    console.warn(`📋 Video-Feed: Konfiguration ${key} nicht gefunden oder undefined, setze Default:`, defaultValue);
    window.WEBFLOW_API[key] = defaultValue;
  }
}

// Grundkonfiguration mit garantierten Werten
ensureConfigValue('BASE_URL', DEFAULT_BASE_URL);
ensureConfigValue('WORKER_BASE_URL', DEFAULT_WORKER_BASE_URL);
ensureConfigValue('MEMBER_COLLECTION_ID', DEFAULT_MEMBER_COLLECTION_ID);
ensureConfigValue('VIDEO_COLLECTION_ID', DEFAULT_VIDEO_COLLECTION_ID);
ensureConfigValue('FREE_MEMBER_LIMIT', DEFAULT_FREE_MEMBER_LIMIT);
ensureConfigValue('PAID_MEMBER_LIMIT', DEFAULT_PAID_MEMBER_LIMIT);

// UI-Konfiguration
window.WEBFLOW_API.VIDEO_CONTAINER_ID = window.WEBFLOW_API.VIDEO_CONTAINER_ID || "video-feed";
window.WEBFLOW_API.UPLOAD_COUNTER_ID = window.WEBFLOW_API.UPLOAD_COUNTER_ID || "uploads-counter";
window.WEBFLOW_API.UPLOAD_PROGRESS_ID = window.WEBFLOW_API.UPLOAD_PROGRESS_ID || "uploads-progress";
window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID = window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID || "upload-limit-message";

// Kategorie-Mapping 
if (!window.WEBFLOW_API.CATEGORY_MAPPING) {
  window.WEBFLOW_API.CATEGORY_MAPPING = {
    "a1c318daa4a4fdc904d0ea6ae57e9eb6": "Travel",
    "f7375698898acddde00653547c8fa793": "Entertainment",
    "0e068df04f18438e4a5b68d397782f36": "Food",
    "2f1f2fe0cd35ddd19ca98f4b85b16258": "Beauty",
    "d98ec62473786dfe4b680ffaff56df3d": "Fashion",
    "7a825bdb2886afb7afc15ace93407334": "Fitness",
    "172297c1eff716fecb37e1086835fb54": "Technology",
    "0150c802834f25c5eb9a235e5f333086": "Gaming",
    "827b3ec71e6dd2e64687ac4a2bcde003": "Art & Culture",
    "17907bdb5206dc3d81ffc984f810e58b": "Household",
    "d9e7f4c91b3e5a8022c3a6497f1d8b55": "Home & Living" 
  };
}

// Debug-Informationen zur Konfiguration ausgeben
console.log("📋 Video-Feed: WEBFLOW_API Konfiguration:", {
  BASE_URL: window.WEBFLOW_API.BASE_URL,
  WORKER_BASE_URL: window.WEBFLOW_API.WORKER_BASE_URL,
  MEMBER_COLLECTION_ID: window.WEBFLOW_API.MEMBER_COLLECTION_ID,
  VIDEO_COLLECTION_ID: window.WEBFLOW_API.VIDEO_COLLECTION_ID,
  FREE_MEMBER_LIMIT: window.WEBFLOW_API.FREE_MEMBER_LIMIT,
  PAID_MEMBER_LIMIT: window.WEBFLOW_API.PAID_MEMBER_LIMIT
});

/**
 * Cache für API-Antworten
 */
class SimpleCache {
  constructor() {
    this.items = {};
    this.expiration = 5 * 60 * 1000; // 5 Minuten Standard-Cache-Zeit
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > this.expiration) { 
      delete this.items[key];
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.items[key] = {
      timestamp: Date.now(),
      data: data
    };
  }

  clear() {
    this.items = {};
  }
}

/**
 * Hilfsfunktion zum Abrufen von Kategorienamen aus IDs
 */
function getCategoryName(categoryId) {
  if (!categoryId) return "Nicht angegeben";
  
  // Prüfe, ob die Kategorie-ID im Mapping existiert
  if (window.WEBFLOW_API.CATEGORY_MAPPING && window.WEBFLOW_API.CATEGORY_MAPPING[categoryId]) {
    return window.WEBFLOW_API.CATEGORY_MAPPING[categoryId];
  }
  
  // Fallback: Gib die ID zurück, wenn kein Mapping gefunden wurde
  return categoryId;
}

/**
 * Haupt-App-Klasse für den Video-Feed
 */
class VideoFeedApp {
  constructor() {
    this.cache = new SimpleCache();
    this.videoContainer = null;
    this.uploadCounter = null;
    this.uploadProgress = null;
    this.limitMessageEl = null;
    this.currentMember = null;
    this.userVideos = [];
    
    // Wir verwenden keine hardcoded Limits mehr, sondern beziehen sie aus der Konfiguration
    console.log("📋 Video-Feed: Initialisiert mit Limits:", 
      window.WEBFLOW_API.FREE_MEMBER_LIMIT, 
      window.WEBFLOW_API.PAID_MEMBER_LIMIT
    );
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   */
  buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * Einen vollständigen API-Endpunkt erstellen
   */
  buildApiUrl(path, params = {}) {
    // KRITISCHER FIX: Stelle sicher, dass BASE_URL definiert ist
    const baseUrl = window.WEBFLOW_API.BASE_URL || DEFAULT_BASE_URL;
    
    // Vollständige URL mit Pfad
    const fullUrl = `${baseUrl}${path}`;
    
    console.log("📋 Video-Feed: API-URL vor Parametern:", fullUrl);
    
    // Parameter als Query-String hinzufügen, wenn vorhanden
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'object') {
        queryParams.append(key, encodeURIComponent(JSON.stringify(value)));
      } else {
        queryParams.append(key, value);
      }
    }
    
    const queryString = queryParams.toString();
    return queryString ? `${fullUrl}?${queryString}` : fullUrl;
  }

  /**
   * API-Anfrage mit Retry-Logik und besserem Error-Handling
   */
  async fetchApi(url, retries = 2) {
    let attempt = 1;
    
    while (true) {
      try {
        console.log(`📋 Video-Feed: API-Anfrage (Versuch ${attempt}/${retries + 1}) an`, url);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`📋 Video-Feed: API-Fehler ${response.status}:`, errorText);
          
          if (attempt <= retries) {
            const delay = Math.min(1000 * attempt, 3000); // Exponential Backoff
            console.log(`📋 Video-Feed: Wiederhole in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            continue;
          }
          
          throw new Error(`API-Fehler: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        return await response.json();
      } catch (error) {
        if (attempt <= retries) {
          const delay = Math.min(1000 * attempt, 3000);
          console.log(`📋 Video-Feed: Fehler, wiederhole in ${delay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        console.error("📋 Video-Feed: Maximale Anzahl an Versuchen erreicht", error);
        throw error;
      }
    }
  }

  /**
   * User direkt anhand der Webflow-ID abrufen
   */
  async getUserByWebflowId(webflowId) {
    if (!webflowId) {
      throw new Error("Webflow-ID fehlt");
    }
    
    console.log("📋 Video-Feed: Rufe User mit Webflow-ID ab:", webflowId);
    
    const cacheKey = `webflow_user_${webflowId}`;
    const cachedUser = this.cache.get(cacheKey);
    
    if (cachedUser) {
      console.log("📋 Video-Feed: User aus Cache geladen", webflowId);
      return cachedUser;
    }
    
    // KRITISCHER FIX: Stelle absolut sicher, dass wir eine gültige Collection-ID haben
    let memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID;
    
    // Wenn die ID undefined ist, setze sie auf den Default-Wert
    if (!memberCollectionId) {
      console.warn("📋 Video-Feed: MEMBER_COLLECTION_ID ist undefined, verwende DEFAULT_MEMBER_COLLECTION_ID:", DEFAULT_MEMBER_COLLECTION_ID);
      memberCollectionId = DEFAULT_MEMBER_COLLECTION_ID;
      
      // Stelle sicher, dass die ID auch für zukünftige Aufrufe gesetzt ist
      window.WEBFLOW_API.MEMBER_COLLECTION_ID = DEFAULT_MEMBER_COLLECTION_ID;
    }
    
    console.log("📋 Video-Feed: Verwende Member-Collection-ID:", memberCollectionId);
    
    // Direkter API-Aufruf mit der ID und /live Endpunkt für veröffentlichte Inhalte
    const apiUrl = this.buildApiUrl(`/${memberCollectionId}/items/${webflowId}/live`);
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const user = await this.fetchApi(workerUrl);
      
      if (!user || !user.id) {
        console.warn("📋 Video-Feed: Kein User gefunden mit Webflow-ID", webflowId);
        return null;
      }
      
      console.log("📋 Video-Feed: User gefunden in Member-Collection:", user.id);
      
      // Zusätzliches Logging zur Überprüfung der fieldData und des video-feed Feldes
      if (user.fieldData && user.fieldData["video-feed"]) {
        console.log("📋 Video-Feed: User hat video-feed Feld mit", 
          Array.isArray(user.fieldData["video-feed"]) ? 
          user.fieldData["video-feed"].length + " Einträgen" : 
          "Wert " + typeof user.fieldData["video-feed"]
        );
      } else {
        console.warn("📋 Video-Feed: User hat KEIN video-feed Feld in fieldData!");
        console.log("📋 Video-Feed: Verfügbare Felder:", 
          user.fieldData ? Object.keys(user.fieldData).join(", ") : "keine fieldData"
        );
      }
      
      this.cache.set(cacheKey, user);
      return user;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen des Users mit Webflow-ID", error);
      throw error;
    }
  }

  /**
   * Holt die Videos aus dem Video-Feed des Users
   */
  async getVideosFromUserFeed(user) {
    if (!user || !user.fieldData) {
      console.log("📋 Video-Feed: Keine fieldData im User-Profil gefunden");
      return [];
    }
    
    // Vorsichtiger Zugriff auf das video-feed Feld
    if (!user.fieldData["video-feed"]) {
      console.log("📋 Video-Feed: Keine Video-Referenzen im User-Profil gefunden");
      // Alle verfügbaren Felder zur Diagnose ausgeben
      console.log("📋 Video-Feed: Verfügbare Felder:", Object.keys(user.fieldData).join(", "));
      return [];
    }
    
    // Das video-feed Feld enthält die IDs der Videos im User-Profil
    const videoFeed = user.fieldData["video-feed"];
    
    // Detaillierte Debug-Informationen über das video-feed Feld
    console.log("📋 Video-Feed: Video-Feed-Typ:", Array.isArray(videoFeed) ? "Array" : typeof videoFeed);
    console.log("📋 Video-Feed: Video-Feed-Länge:", Array.isArray(videoFeed) ? videoFeed.length : "N/A");
    console.log("📋 Video-Feed: Erster Eintrag Typ:", 
      Array.isArray(videoFeed) && videoFeed.length > 0 ? typeof videoFeed[0] : "N/A"
    );
    
    if (!videoFeed || !Array.isArray(videoFeed) || videoFeed.length === 0) {
      console.log("📋 Video-Feed: Leerer Video-Feed im User-Profil");
      return [];
    }
    
    // Im Multi-Referenzfeld sind nur die IDs enthalten, nicht die vollständigen Video-Objekte
    // Wir müssen leider doch auf die Video-Collection zugreifen, um die Video-Details zu erhalten
    
    console.log(`📋 Video-Feed: ${videoFeed.length} Video-IDs im User-Feed gefunden`);
    
    // Caching für bessere Performance
    const cacheKey = `videos_${user.id}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      console.log(`📋 Video-Feed: ${cachedVideos.length} Videos aus Cache geladen`);
      return cachedVideos;
    }
    
    // Verwende die konfigurierte Video-Collection-ID
    // FIX: Verwende die konfigurierte ID mit Fallback zur Default-Konstante 
    let videoCollectionId = window.WEBFLOW_API.VIDEO_COLLECTION_ID;
    
    // KRITISCHER FIX: Stelle absolut sicher, dass die Collection-ID definiert ist
    if (!videoCollectionId) {
      console.warn("📋 Video-Feed: VIDEO_COLLECTION_ID ist undefined, verwende DEFAULT_VIDEO_COLLECTION_ID:", DEFAULT_VIDEO_COLLECTION_ID);
      videoCollectionId = DEFAULT_VIDEO_COLLECTION_ID;
      
      // Stelle sicher, dass die ID auch für zukünftige Aufrufe gesetzt ist
      window.WEBFLOW_API.VIDEO_COLLECTION_ID = DEFAULT_VIDEO_COLLECTION_ID;
    }
    
    console.log("📋 Video-Feed: Verwende Video-Collection-ID:", videoCollectionId);
    
    // Videos aus der Video-Collection laden
    let videos = [];
    
    try {
      // Für viele Videos ist der Filter mit IN-Operator am effizientesten
      console.log("📋 Video-Feed: Lade Videos via Filter...");
      
      // KRITISCHER FIX: Erstelle Set aus den IDs für schnellen Lookup
      const videoIdSet = new Set(videoFeed);
      console.log("📋 Video-Feed: Erstelle ID-Set mit", videoIdSet.size, "IDs");
      
      // IDs in Anführungszeichen setzen und mit Komma trennen
      const idList = videoFeed.map(id => `"${id}"`).join(",");
      
      // Verwende die buildApiUrl-Methode für konsistente URL-Erstellung
      const apiUrl = this.buildApiUrl(`/${videoCollectionId}/items`, {
        live: true,
        filter: { id: { in: videoFeed } }
      });
      
      const workerUrl = this.buildWorkerUrl(apiUrl);
      
      console.log("📋 Video-Feed: API-URL:", apiUrl);
      
      const data = await this.fetchApi(workerUrl);
      
      if (data.items && data.items.length > 0) {
        // KRITISCHER FIX: Explizite Filterung, um nur Videos zu behalten, die tatsächlich zum User gehören
        const unfilteredCount = data.items.length;
        
        // Extrahiere die Video-Daten mit Prüfungen auf fehlende Felder
        videos = data.items
          .filter(item => {
            // Prüfe, ob die ID tatsächlich im Set des Users ist
            const belongs = videoIdSet.has(item.id);
            if (!belongs) {
              console.warn("📋 Video-Feed: Video mit ID", item.id, "gehört nicht zum User, wird gefiltert");
            }
            return belongs;
          })
          .map(item => {
            // Sicherheitsprüfungen für jedes Feld
            const videoData = {
              "id": item.id
            };
            
            // Sicher Felder abfragen
            if (item.fieldData) {
              videoData["video-link"] = item.fieldData["video-link"];
              videoData["video-name"] = item.fieldData["video-name"] || item.fieldData["name"] || "Unbenanntes Video";
              videoData["video-kategorie"] = item.fieldData["video-kategorie"];
            }
            
            return videoData;
          })
          .filter(video => video["video-link"]); // Nur Videos mit gültigem Link behalten
        
        // KRITISCHER FIX: Überprüfe, ob Videos gefiltert wurden
        if (unfilteredCount !== videos.length) {
          console.warn(`📋 Video-Feed: Ursprünglich ${unfilteredCount} Videos geladen, aber nur ${videos.length} gehören zum User`);
        }
        
        console.log(`📋 Video-Feed: ${videos.length} Videos geladen mit den nötigen Daten`);
      } else {
        console.log("📋 Video-Feed: Keine Videos in der Video-Collection gefunden");
      }
      
      // Im Cache speichern
      this.cache.set(cacheKey, videos);
      
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
    }
    
    return videos;
  }

  /**
   * Bestimmt das Video-Limit basierend auf dem Mitgliedsstatus
   */
  getMembershipLimit(member) {
    if (!member || !member.data) {
      console.log("📋 Video-Feed: Kein Member-Objekt, verwende FREE_MEMBER_LIMIT");
      // Stelle sicher, dass wir einen gültigen Fallback-Wert haben
      return window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
    }
    
    // Prüfen ob Paid-Member anhand der planConnections
    let isPaid = false;
    
    // Option 1: Prüfen auf planConnections Array
    if (member.data.planConnections && member.data.planConnections.length > 0) {
      for (const connection of member.data.planConnections) {
        if (connection.status === "ACTIVE" && connection.type !== "FREE") {
          isPaid = true;
          console.log("📋 Video-Feed: Paid-Member erkannt über planConnections");
          break;
        }
      }
    }
    
    // Option 2: Fallback auf ältere Memberstack-Version
    if (!isPaid && member.data.acl && (
        member.data.acl.includes("paid") || 
        member.data.status === "paid"
      )) {
      isPaid = true;
      console.log("📋 Video-Feed: Paid-Member erkannt über acl/status");
    }
    
    // KRITISCHER FIX: Stelle sicher, dass die Limit-Werte definiert sind
    const freeLimit = window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
    const paidLimit = window.WEBFLOW_API.PAID_MEMBER_LIMIT || DEFAULT_PAID_MEMBER_LIMIT;
    
    // Setze die globalen Werte
    if (!window.WEBFLOW_API.FREE_MEMBER_LIMIT) {
      console.warn("📋 Video-Feed: FREE_MEMBER_LIMIT war undefined, setze auf Default:", DEFAULT_FREE_MEMBER_LIMIT);
      window.WEBFLOW_API.FREE_MEMBER_LIMIT = DEFAULT_FREE_MEMBER_LIMIT;
    }
    
    if (!window.WEBFLOW_API.PAID_MEMBER_LIMIT) {
      console.warn("📋 Video-Feed: PAID_MEMBER_LIMIT war undefined, setze auf Default:", DEFAULT_PAID_MEMBER_LIMIT);
      window.WEBFLOW_API.PAID_MEMBER_LIMIT = DEFAULT_PAID_MEMBER_LIMIT;
    }
    
    // Verwende die Werte mit sicheren Fallbacks
    const limit = isPaid ? paidLimit : freeLimit;
    console.log(`📋 Video-Feed: Mitglied (${isPaid ? 'PAID' : 'FREE'}) erhält Limit:`, limit);
    
    return limit;
  }

  /**
   * Aktualisiert den Upload-Counter auf der Seite
   */
  updateUploadCounter(videoCount, maxUploads) {
    if (!this.uploadCounter) return;
    
    // KRITISCHER FIX: Stelle sicher, dass die Zahlen für die Anzeige gültig sind
    const validVideoCount = isNaN(videoCount) ? 0 : videoCount;
    const validMaxUploads = isNaN(maxUploads) ? DEFAULT_PAID_MEMBER_LIMIT : maxUploads;
    
    this.uploadCounter.textContent = `${validVideoCount}/${validMaxUploads}`;
    
    // Wenn der Fortschrittsbalken existiert, aktualisieren
    if (this.uploadProgress) {
      // Prozentsatz berechnen
      const progressPercent = validMaxUploads > 0 ? (validVideoCount / validMaxUploads) * 100 : 0;
      
      // Farbklassen basierend auf Fortschritt
      this.uploadProgress.classList.remove("progress-low", "progress-medium", "progress-high", "progress-full");
      
      if (progressPercent >= 100) {
        this.uploadProgress.classList.add("progress-full");
      } else if (progressPercent >= 70) {
        this.uploadProgress.classList.add("progress-high");
      } else if (progressPercent >= 40) {
        this.uploadProgress.classList.add("progress-medium");
      } else {
        this.uploadProgress.classList.add("progress-low");
      }
      
      // Breite aktualisieren - Animation durch CSS
      this.uploadProgress.style.width = `${progressPercent}%`;
    }
    
    // Prüfen, ob das Limit erreicht ist
    const isLimitReached = validVideoCount >= validMaxUploads;
    
    // Logging, um den Zustand besser zu verstehen
    console.log(`📋 Video-Feed: Upload-Status: ${validVideoCount}/${validMaxUploads}, Limit erreicht: ${isLimitReached}`);
    
    // Den "video-upload-button" finden und je nach Limit-Status ein/ausblenden
    const uploadButton = document.getElementById("video-upload-button");
    if (uploadButton) {
      if (isLimitReached) {
        // Button ausblenden
        uploadButton.style.display = "none";
        console.log("📋 Video-Feed: Upload-Limit erreicht, Button ausgeblendet");
      } else {
        // Button anzeigen
        uploadButton.style.display = "";
      }
    }
    
    // Upload-Limit-Meldung aktualisieren
    this.updateLimitMessage(isLimitReached);
  }
  
  /**
   * Upload-Limit-Meldung anzeigen oder ausblenden
   */
  updateLimitMessage(isLimitReached) {
    // Element mit der konfigurierten ID suchen
    if (!this.limitMessageEl) {
      // Versuche, das Element erneut zu finden, falls es zwischenzeitlich erstellt wurde
      this.limitMessageEl = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      
      if (!this.limitMessageEl) {
        console.warn(`📋 Video-Feed: Kein Limit-Meldungs-Element mit ID '${window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID}' gefunden`);
        return;
      }
    }
    
    if (isLimitReached) {
      // Meldung anzeigen
      this.limitMessageEl.style.display = "block";
      this.limitMessageEl.textContent = "Upload-Limit erreicht";
      this.limitMessageEl.classList.add("limit-reached");
      console.log("📋 Video-Feed: Limit-Meldung wird angezeigt");
    } else {
      // Meldung ausblenden
      this.limitMessageEl.style.display = "none";
      this.limitMessageEl.classList.remove("limit-reached");
      console.log("📋 Video-Feed: Limit-Meldung wird ausgeblendet");
    }
  }

  /**
   * Erstellt einen "Erstes Video hochladen" Button, falls keine Videos vorhanden sind
   */
  createUploadButton() {
    if (!this.videoContainer) return;
    
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("db-upload-empty-state");
    
    // Normaler Upload-Button mit den gewünschten Attributen
    const uploadButton = document.createElement("a");
    uploadButton.href = "#"; 
    uploadButton.classList.add("db-upload-more-upload-button");
    uploadButton.setAttribute("data-modal-toggle", "new-upload");
    uploadButton.textContent = "Lade dein erstes Video hoch";
    
    buttonContainer.appendChild(uploadButton);
    this.videoContainer.appendChild(buttonContainer);
  }

  /**
   * Videos im Container anzeigen
   */
  renderVideos(videos) {
    if (!this.videoContainer) {
      console.error("📋 Video-Feed: Container nicht gefunden");
      return;
    }
    
    // Container leeren
    this.videoContainer.innerHTML = "";
    
    // Prüfen, ob das Limit erreicht ist (nur für Logging)
    const maxUploads = this.getMembershipLimit(this.currentMember);
    const isLimitReached = videos && videos.length >= maxUploads;
    
    if (isLimitReached) {
      console.log("📋 Video-Feed: Upload-Limit erreicht", videos.length, "/", maxUploads);
      
      // KRITISCHER FIX: Upload-Button aus dem DOM entfernen, wenn das Limit erreicht ist
      const uploadButton = document.getElementById("video-upload-button");
      if (uploadButton) {
        console.log("📋 Video-Feed: Upload-Button wird aus dem DOM entfernt");
        uploadButton.parentNode.removeChild(uploadButton);
      } else {
        console.log("📋 Video-Feed: Upload-Button nicht gefunden, kann nicht entfernt werden");
      }
    }
    
    if (!videos || videos.length === 0) {
      // Statt Fehlermeldung den Upload-Button anzeigen
      this.createUploadButton();
      return;
    }
    
    videos.forEach(videoData => {
      if (!videoData || !videoData["video-link"]) return;
      
      const wrapperDiv = document.createElement("div");
      wrapperDiv.classList.add("db-upload-wrapper-item");
      
      const videoDiv = document.createElement("div");
      videoDiv.classList.add("db-upload-item-video");
      
      const videoElement = document.createElement("video");
      videoElement.src = videoData["video-link"];
      videoElement.controls = true;
      videoElement.classList.add("db-upload-video");
      videoElement.addEventListener("error", () => {
        videoElement.outerHTML = `
          <div class="video-error">
            <p>Video konnte nicht geladen werden</p>
          </div>
        `;
      });
      
      videoDiv.appendChild(videoElement);
      
      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("db-upload-item-details");
      
      // Container für Titel und Kategorie
      const detailsContainerDiv = document.createElement("div");
      detailsContainerDiv.classList.add("db-upload-details-container");
      
      // Titel
      const titleDiv = document.createElement("div");
      titleDiv.classList.add("db-upload-video-title");
      titleDiv.textContent = videoData["video-name"] || "Unbenanntes Video";
      
      // Kategorie mit Mapping
      const categoryName = getCategoryName(videoData["video-kategorie"]);
      const categoryP = document.createElement("p");
      categoryP.classList.add("is-txt-tiny");
      categoryP.textContent = `Kategorie: ${categoryName}`;
      
      // Edit-Button erstellen
      const editButton = document.createElement("button");
      editButton.classList.add("db-upload-settings");
      
      // Videodata-ID als Attribut setzen
      const videoId = videoData.id;
      
      editButton.setAttribute("data-video-edit", videoId);
      editButton.innerHTML = `<img src="https://cdn.prod.website-files.com/63db7d558cd2e4be56cd7e2f/678a26c04581673826145b8b_settings.svg" alt="Bearbeiten">`;
      editButton.title = "Video bearbeiten";
      
      // Event-Handler für Edit-Button
      editButton.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Option 1: Wenn die editVideo-Funktion im globalen Scope ist
        if (typeof window.editVideo === "function") {
          window.editVideo(videoId);
        } 
        // Option 2: Manuell ein Event auslösen, das vom Edit-Script abgefangen werden kann
        else {
          console.log("📋 Video-Feed: Löse Edit-Event aus für Video ID:", videoId);
          const editEvent = new CustomEvent('videoEditRequest', { 
            detail: { videoId: videoId } 
          });
          document.dispatchEvent(editEvent);
        }
      };
      
      // Struktur zusammenfügen
      detailsContainerDiv.appendChild(titleDiv);
      detailsContainerDiv.appendChild(categoryP);
      detailsDiv.appendChild(detailsContainerDiv);
      
      // Edit-Button zum Details-Container hinzufügen
      detailsDiv.appendChild(editButton);
      
      wrapperDiv.appendChild(videoDiv);
      wrapperDiv.appendChild(detailsDiv);
      
      this.videoContainer.appendChild(wrapperDiv);
    });
    
    // Button für neue Videos hinzufügen, wenn Limit nicht erreicht
    if (!isLimitReached && videos && videos.length > 0) {
      const addButtonContainer = document.createElement("div");
      addButtonContainer.classList.add("db-upload-add-new");
      
      const addButton = document.createElement("a");
      addButton.href = "#";
      addButton.classList.add("db-upload-more-upload-button");
      addButton.setAttribute("data-modal-toggle", "new-upload");
      addButton.textContent = "Video hinzufügen";
      
      addButtonContainer.appendChild(addButton);
      this.videoContainer.appendChild(addButtonContainer);
    }
  }

  /**
   * Ladeanimation mit Skeleton Loader anzeigen
   */
  showLoading() {
    if (!this.videoContainer) return;
    
    // Container leeren
    this.videoContainer.innerHTML = '';
    
    // Erstelle 3 Skeleton-Items
    for (let i = 0; i < 3; i++) {
      const skeleton = document.createElement('div');
      skeleton.classList.add('db-upload-wrapper-item', 'skeleton-item');
      
      skeleton.innerHTML = `
        <div class="db-upload-item-video skeleton-video">
          <div class="skeleton-video-pulse"></div>
        </div>
        <div class="db-upload-item-details">
          <div class="db-upload-details-container">
            <div class="skeleton-text-pulse" style="width: 70%; height: 20px;"></div>
            <div class="skeleton-text-pulse" style="width: 40%; height: 14px; margin-top: 8px;"></div>
          </div>
          <div class="skeleton-button-pulse"></div>
        </div>
      `;
      
      this.videoContainer.appendChild(skeleton);
    }
  }
  
  /**
   * Fehlermeldung anzeigen
   */
  showError(message) {
    if (!this.videoContainer) return;
    
    this.videoContainer.innerHTML = `
      <div class="error-message">
        <p>🚫 ${message}</p>
      </div>
    `;
  }

  /**
   * Videos für eingeloggten User laden und anzeigen
   */
  async loadUserVideos() {
    try {
      if (!this.videoContainer) {
        console.error("📋 Video-Feed: Container nicht gefunden");
        return;
      }
      
      this.showLoading();
      
      // Memberstack-User laden
      const member = await window.$memberstackDom.getCurrentMember();
      this.currentMember = member;
      const memberstackId = member?.data?.id;
      
      if (!memberstackId) {
        this.showError("Kein eingeloggter User gefunden");
        return;
      }
      
      console.log("📋 Video-Feed: Eingeloggter User mit Memberstack-ID", memberstackId);
      
      // Video-Limit basierend auf Membership bestimmen
      const maxUploads = this.getMembershipLimit(member);
      console.log("📋 Video-Feed: Maximale Uploads für User:", maxUploads);
      
      // 1. Webflow-ID aus den Custom Fields der Memberstack-Daten extrahieren
      let webflowMemberId = this.extractWebflowId(member);
      
      if (!webflowMemberId) {
        this.showError("Keine Webflow-Member-ID in den Memberstack-Daten gefunden");
        console.error("📋 Video-Feed: Memberstack-Daten ohne Webflow-ID:", member.data);
        return;
      }
      
      // 2. User direkt mit der Webflow-ID abrufen
      const user = await this.getUserByWebflowId(webflowMemberId);
      
      if (!user) {
        this.showError(`User mit Webflow-ID "${webflowMemberId}" nicht gefunden`);
        return;
      }
      
      // 3. Videos aus dem Video-Feed des Users holen
      const videos = await this.getVideosFromUserFeed(user);
      this.userVideos = videos;
      
      // Upload-Counter aktualisieren
      this.updateUploadCounter(videos.length, maxUploads);
      
      // Videos anzeigen
      this.renderVideos(videos);
      
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
      this.showError(`Fehler beim Laden des Video-Feeds: ${error.message}`);
    }
  }

  /**
   * Helper-Methode zum Extrahieren der Webflow-ID aus Memberstack-Daten
   */
  extractWebflowId(member) {
    if (!member || !member.data) return null;
    
    // Mögliche Orte für die Webflow-ID prüfen
    if (member.data.customFields && member.data.customFields["webflow-member-id"]) {
      const id = member.data.customFields["webflow-member-id"];
      console.log("📋 Video-Feed: Webflow-Member-ID aus customFields gefunden:", id);
      return id;
    } 
    
    if (member.data.metaData && member.data.metaData["webflow-member-id"]) {
      const id = member.data.metaData["webflow-member-id"];
      console.log("📋 Video-Feed: Webflow-Member-ID aus metaData gefunden:", id);
      return id;
    }
    
    // Weitere mögliche Felder prüfen
    const possibleFields = ["webflow-id", "webflow_id", "webflowId"];
    
    // Prüfe customFields
    if (member.data.customFields) {
      for (const field of possibleFields) {
        if (member.data.customFields[field]) {
          console.log(`📋 Video-Feed: Webflow-Member-ID aus customFields["${field}"] gefunden:`, 
            member.data.customFields[field]);
          return member.data.customFields[field];
        }
      }
    }
    
    // Prüfe metaData
    if (member.data.metaData) {
      for (const field of possibleFields) {
        if (member.data.metaData[field]) {
          console.log(`📋 Video-Feed: Webflow-Member-ID aus metaData["${field}"] gefunden:`, 
            member.data.metaData[field]);
          return member.data.metaData[field];
        }
      }
    }
    
    return null;
  }

  /**
   * App initialisieren
   */
  init() {
    // Initialisierungsfunktion definieren
    const initApp = () => {
      // Video-Container finden
      this.videoContainer = document.getElementById(window.WEBFLOW_API.VIDEO_CONTAINER_ID);
      
      if (!this.videoContainer) {
        console.error("📋 Video-Feed: Container-Element nicht gefunden! ID:", window.WEBFLOW_API.VIDEO_CONTAINER_ID);
        
        // Fallback: Versuche den Container über Klasse zu finden
        const containerByClass = document.querySelector(".db-upload-wrapper");
        if (containerByClass) {
          console.log("📋 Video-Feed: Container über Klasse gefunden statt über ID");
          this.videoContainer = containerByClass;
        } else {
          console.error("📋 Video-Feed: Container konnte weder über ID noch über Klasse gefunden werden");
          return;
        }
      }
      
      console.log("📋 Video-Feed: Container erfolgreich gefunden");
      
    
      
      // Event-Listener für Video-Feed-Updates
      document.addEventListener('videoFeedUpdate', () => {
        console.log("📋 Video-Feed: Update-Event empfangen, lade Feed neu");
        
        // Cache löschen und Daten neu laden
        this.cache.clear();
        this.loadUserVideos();
      });
      
      // Videos laden
      this.loadUserVideos();
    };
    
  
    
    // Prüfen, ob das DOM bereits geladen ist
    if (document.readyState === "loading") {
      // Wenn noch nicht geladen, warten auf DOMContentLoaded
      document.addEventListener("DOMContentLoaded", initApp);
    } else {
      // Wenn DOM bereits geladen ist, sofort initialisieren
      initApp();
    }
  }
}

// App starten mit zusätzlicher Verzögerung, um sicherzustellen, dass alle globalen Variablen gesetzt sind
document.addEventListener('DOMContentLoaded', () => {
  // Letzte Überprüfung der kritischen Konfigurationswerte vor dem Start
  console.log("📋 Video-Feed: Letzte Prüfung der Konfiguration vor dem Start:", {
    BASE_URL: window.WEBFLOW_API.BASE_URL,
    MEMBER_COLLECTION_ID: window.WEBFLOW_API.MEMBER_COLLECTION_ID,
    VIDEO_COLLECTION_ID: window.WEBFLOW_API.VIDEO_COLLECTION_ID,
    FREE_MEMBER_LIMIT: window.WEBFLOW_API.FREE_MEMBER_LIMIT,
    PAID_MEMBER_LIMIT: window.WEBFLOW_API.PAID_MEMBER_LIMIT
  });
  
  // Stelle absolut sicher, dass alle wichtigen Konfigurationswerte gesetzt sind
  if (!window.WEBFLOW_API.MEMBER_COLLECTION_ID) {
    console.warn("📋 Video-Feed: MEMBER_COLLECTION_ID fehlt immer noch, setze auf Default:", DEFAULT_MEMBER_COLLECTION_ID);
    window.WEBFLOW_API.MEMBER_COLLECTION_ID = DEFAULT_MEMBER_COLLECTION_ID;
  }
  
  if (!window.WEBFLOW_API.VIDEO_COLLECTION_ID) {
    console.warn("📋 Video-Feed: VIDEO_COLLECTION_ID fehlt immer noch, setze auf Default:", DEFAULT_VIDEO_COLLECTION_ID);
    window.WEBFLOW_API.VIDEO_COLLECTION_ID = DEFAULT_VIDEO_COLLECTION_ID;
  }
  
  // KRITISCHER FIX: Stelle sicher, dass die Membership-Limits gesetzt sind
  if (!window.WEBFLOW_API.FREE_MEMBER_LIMIT) {
    console.warn("📋 Video-Feed: FREE_MEMBER_LIMIT fehlt immer noch, setze auf Default:", DEFAULT_FREE_MEMBER_LIMIT);
    window.WEBFLOW_API.FREE_MEMBER_LIMIT = DEFAULT_FREE_MEMBER_LIMIT;
  }
  
  if (!window.WEBFLOW_API.PAID_MEMBER_LIMIT) {
    console.warn("📋 Video-Feed: PAID_MEMBER_LIMIT fehlt immer noch, setze auf Default:", DEFAULT_PAID_MEMBER_LIMIT);
    window.WEBFLOW_API.PAID_MEMBER_LIMIT = DEFAULT_PAID_MEMBER_LIMIT;
  }
  
  try {
    console.log("📋 Video-Feed: Starte App...");
    const videoFeedApp = new VideoFeedApp();
    videoFeedApp.init();
    
    // Für Debug-Zwecke global zugänglich machen
    window.videoFeedApp = videoFeedApp;
  } catch (error) {
    console.error("📋 Video-Feed: Kritischer Fehler beim Start", error);
  }
});
