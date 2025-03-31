// 🌐 Webflow API Integration für Video-Feed
// Fixed Version 6.9.1

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

// App starten mit verbessertem Error-Handling
startVideoFeedApp();


// Funktion zur sicheren Initialisierung von Konfigurationswerten
function ensureConfigValue(key, defaultValue) {
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

// UI-Konfiguration mit korrigierten IDs basierend auf den Log-Daten
window.WEBFLOW_API.VIDEO_CONTAINER_ID = window.WEBFLOW_API.VIDEO_CONTAINER_ID || "video-feed";
window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID = window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID || "upload-limit-title";
window.WEBFLOW_API.UPLOAD_COUNTER_ID = window.WEBFLOW_API.UPLOAD_COUNTER_ID || "counter_id"; // Geändert von "uploads-counter" zu "counter_id"
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
  PAID_MEMBER_LIMIT: window.WEBFLOW_API.PAID_MEMBER_LIMIT,
  VIDEO_CONTAINER_ID: window.WEBFLOW_API.VIDEO_CONTAINER_ID,
  UPLOAD_LIMIT_TITLE_ID: window.WEBFLOW_API.UPLOAD_LIMIT_TITLE_ID,
  UPLOAD_COUNTER_ID: window.WEBFLOW_API.UPLOAD_COUNTER_ID,
  UPLOAD_PROGRESS_ID: window.WEBFLOW_API.UPLOAD_PROGRESS_ID,
  UPLOAD_LIMIT_MESSAGE_ID: window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID
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
  return "Kategorie " + categoryId.substring(0, 6);
}

/**
 * Haupt-App-Klasse für den Video-Feed
 */
class VideoFeedApp {
  constructor() {
    this.cache = new SimpleCache();
    this.videoContainer = null;
    this.currentMember = null;
    this.userVideos = [];
    this.isLoading = false;
    this.uiElements = {
      title: null,
      counter: null,
      progress: null,
      limitMessage: null
    };
    
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
    const baseUrl = window.WEBFLOW_API.BASE_URL || DEFAULT_BASE_URL;
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
    
    // Sicher die Collection-ID abrufen
    let memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID;
    
    if (!memberCollectionId) {
      console.warn("📋 Video-Feed: MEMBER_COLLECTION_ID ist undefined, verwende DEFAULT_MEMBER_COLLECTION_ID:", DEFAULT_MEMBER_COLLECTION_ID);
      memberCollectionId = DEFAULT_MEMBER_COLLECTION_ID;
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
   * Optimierte Methode zum Laden von Videos in Chunks
   */
  async fetchVideosInChunks(videoIds, chunkSize = 20) {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }
    
    const videoCollectionId = window.WEBFLOW_API.VIDEO_COLLECTION_ID || DEFAULT_VIDEO_COLLECTION_ID;
    const videoIdSet = new Set(videoIds);
    let allVideos = [];
    
    // Videos in Chunks aufteilen für bessere Performance
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += chunkSize) {
      chunks.push(videoIds.slice(i, i + chunkSize));
    }
    
    console.log(`📋 Video-Feed: Lade ${videoIds.length} Videos in ${chunks.length} Chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const apiUrl = this.buildApiUrl(`/${videoCollectionId}/items`, {
          live: true,
          filter: { id: { in: chunk } }
        });
        
        const workerUrl = this.buildWorkerUrl(apiUrl);
        const data = await this.fetchApi(workerUrl);
        
        if (data.items && data.items.length > 0) {
          // Sicherstellen, dass wir nur Videos mit IDs im Set behalten
          const chunkVideos = data.items
            .filter(item => videoIdSet.has(item.id))
            .map(item => this.processVideoItem(item))
            .filter(video => video && video["video-link"]);
          
          allVideos = allVideos.concat(chunkVideos);
        }
      } catch (error) {
        console.error(`📋 Video-Feed: Fehler beim Laden von Chunk ${i+1}`, error);
      }
    }
    
    return allVideos;
  }
  
  /**
   * Video-Item in einheitliches Format bringen
   */
  processVideoItem(item) {
    if (!item || !item.fieldData) {
      return null;
    }
    
    return {
      id: item.id,
      "video-link": item.fieldData["video-link"],
      "video-name": item.fieldData["video-name"] || item.fieldData["name"] || "Unbenanntes Video",
      "video-kategorie": item.fieldData["video-kategorie"],
      "kategorie-name": getCategoryName(item.fieldData["video-kategorie"])
    };
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
      console.log("📋 Video-Feed: Verfügbare Felder:", Object.keys(user.fieldData).join(", "));
      return [];
    }
    
    // Das video-feed Feld enthält die IDs der Videos im User-Profil
    const videoFeed = user.fieldData["video-feed"];
    
    // Detaillierte Debug-Informationen über das video-feed Feld
    console.log("📋 Video-Feed: Video-Feed-Typ:", Array.isArray(videoFeed) ? "Array" : typeof videoFeed);
    console.log("📋 Video-Feed: Video-Feed-Länge:", Array.isArray(videoFeed) ? videoFeed.length : "N/A");
    
    if (!videoFeed || !Array.isArray(videoFeed) || videoFeed.length === 0) {
      console.log("📋 Video-Feed: Leerer Video-Feed im User-Profil");
      return [];
    }
    
    console.log(`📋 Video-Feed: ${videoFeed.length} Video-IDs im User-Feed gefunden`);
    
    // Caching für bessere Performance
    const cacheKey = `videos_${user.id}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      console.log(`📋 Video-Feed: ${cachedVideos.length} Videos aus Cache geladen`);
      return cachedVideos;
    }
    
    // Videos in Chunks laden
    let videos = [];
    
    try {
      videos = await this.fetchVideosInChunks(videoFeed);
      console.log(`📋 Video-Feed: ${videos.length} Videos geladen mit den nötigen Daten`);
      
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
    
    const freeLimit = window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
    const paidLimit = window.WEBFLOW_API.PAID_MEMBER_LIMIT || DEFAULT_PAID_MEMBER_LIMIT;
    
    // Verwende die Werte mit sicheren Fallbacks
    const limit = isPaid ? paidLimit : freeLimit;
    console.log(`📋 Video-Feed: Mitglied (${isPaid ? 'PAID' : 'FREE'}) erhält Limit:`, limit);
    
    return limit;
  }

  /**
   * Verbesserte Version: Aktualisiert den Upload-Counter auf der Seite
   * Diese Version sucht flexibler nach den Elementen und erstellt sie bei Bedarf
   */
  updateUploadCounter(videoCount, maxUploads) {
    console.log("📊 Video-Feed: updateUploadCounter aufgerufen mit", videoCount, maxUploads);
    
    // Stelle sicher, dass die Zahlen für die Anzeige gültig sind
    const validVideoCount = isNaN(videoCount) ? 0 : videoCount;
    const validMaxUploads = isNaN(maxUploads) ? DEFAULT_PAID_MEMBER_LIMIT : maxUploads;
    
    // Counter-Element finden oder erstellen
    if (!this.uiElements.counter) {
      // Erst versuchen, über ID zu finden
      this.uiElements.counter = document.getElementById(window.WEBFLOW_API.UPLOAD_COUNTER_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.counter) {
        this.uiElements.counter = document.querySelector('[data-counter="uploads"]') || 
                                   document.querySelector('.upload-counter');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.counter && this.videoContainer) {
        const counterDiv = document.createElement('div');
        counterDiv.id = window.WEBFLOW_API.UPLOAD_COUNTER_ID;
        counterDiv.classList.add('upload-counter');
        counterDiv.style.margin = '10px 0';
        counterDiv.style.fontWeight = 'bold';
        
        // Vor dem Container einfügen
        this.videoContainer.parentNode.insertBefore(counterDiv, this.videoContainer);
        this.uiElements.counter = counterDiv;
        console.log("📊 Video-Feed: Counter-Element wurde erstellt");
      }
    }
    
    // Progress-Element finden oder erstellen
    if (!this.uiElements.progress) {
      // Erst versuchen, über ID zu finden
      this.uiElements.progress = document.getElementById(window.WEBFLOW_API.UPLOAD_PROGRESS_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.progress) {
        this.uiElements.progress = document.querySelector('[data-progress="uploads"]') || 
                                    document.querySelector('.upload-progress');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.progress && this.videoContainer) {
        const progressContainer = document.createElement('div');
        progressContainer.style.width = '100%';
        progressContainer.style.backgroundColor = '#f0f0f0';
        progressContainer.style.borderRadius = '4px';
        progressContainer.style.margin = '10px 0 20px 0';
        progressContainer.style.overflow = 'hidden';
        
        const progressBar = document.createElement('div');
        progressBar.id = window.WEBFLOW_API.UPLOAD_PROGRESS_ID;
        progressBar.classList.add('upload-progress', 'progress-low');
        progressBar.style.height = '10px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = '#4CAF50';
        progressBar.style.transition = 'width 0.3s ease';
        
        progressContainer.appendChild(progressBar);
        
        // Nach dem Counter einfügen
        if (this.uiElements.counter && this.uiElements.counter.nextSibling) {
          this.uiElements.counter.parentNode.insertBefore(progressContainer, this.uiElements.counter.nextSibling);
        } else {
          // Oder vor dem Container
          this.videoContainer.parentNode.insertBefore(progressContainer, this.videoContainer);
        }
        
        this.uiElements.progress = progressBar;
        console.log("📊 Video-Feed: Progress-Element wurde erstellt");
      }
    }
    
    // Limit-Message-Element finden oder erstellen
    if (!this.uiElements.limitMessage) {
      // Erst versuchen, über ID zu finden
      this.uiElements.limitMessage = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      
      // Wenn nicht gefunden, nach Attributen suchen
      if (!this.uiElements.limitMessage) {
        this.uiElements.limitMessage = document.querySelector('[data-message="limit"]') || 
                                        document.querySelector('.limit-message');
      }
      
      // Wenn immer noch nicht gefunden, erstellen
      if (!this.uiElements.limitMessage && this.videoContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.id = window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID;
        messageDiv.classList.add('limit-message');
        messageDiv.style.color = '#e53e3e';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.margin = '10px 0';
        messageDiv.style.display = 'none';
        
        // Vor dem Container einfügen
        this.videoContainer.parentNode.insertBefore(messageDiv, this.videoContainer);
        this.uiElements.limitMessage = messageDiv;
        console.log("📊 Video-Feed: Limit-Message-Element wurde erstellt");
      }
    }
    
    // Jetzt die UI-Elemente aktualisieren
    
    // Counter aktualisieren
    if (this.uiElements.counter) {
      this.uiElements.counter.textContent = `Videos: ${validVideoCount}/${validMaxUploads}`;
      console.log("📊 Video-Feed: Counter aktualisiert:", this.uiElements.counter.textContent);
    }
    
    // Progress-Bar aktualisieren
    if (this.uiElements.progress) {
      // Prozentsatz berechnen
      const progressPercent = validMaxUploads > 0 ? (validVideoCount / validMaxUploads) * 100 : 0;
      
      // Farbklassen basierend auf Fortschritt
      this.uiElements.progress.classList.remove("progress-low", "progress-medium", "progress-high", "progress-full");
      
      if (progressPercent >= 100) {
        this.uiElements.progress.classList.add("progress-full");
        this.uiElements.progress.style.backgroundColor = '#e53e3e';
      } else if (progressPercent >= 70) {
        this.uiElements.progress.classList.add("progress-high");
        this.uiElements.progress.style.backgroundColor = '#f6ad55';
      } else if (progressPercent >= 40) {
        this.uiElements.progress.classList.add("progress-medium");
        this.uiElements.progress.style.backgroundColor = '#68d391';
      } else {
        this.uiElements.progress.classList.add("progress-low");
        this.uiElements.progress.style.backgroundColor = '#4CAF50';
      }
      
      // Breite aktualisieren
      this.uiElements.progress.style.width = `${progressPercent}%`;
      console.log("📊 Video-Feed: Fortschrittsbalken auf", progressPercent, "% gesetzt");
    }
    
    // Prüfen, ob das Limit erreicht ist
    const isLimitReached = validVideoCount >= validMaxUploads;
    
    // Logging, um den Zustand besser zu verstehen
    console.log(`📊 Video-Feed: Upload-Status: ${validVideoCount}/${validMaxUploads}, Limit erreicht: ${isLimitReached}`);
    
    // Upload-Button je nach Limit-Status ein/ausblenden
    const uploadButtons = document.querySelectorAll('[data-modal-toggle="new-upload"]');
    uploadButtons.forEach(button => {
      button.style.display = isLimitReached ? "none" : "";
    });
    console.log("📊 Video-Feed: Upload-Buttons aktualisiert, Anzahl:", uploadButtons.length);
    
    // Upload-Limit-Meldung aktualisieren
    if (this.uiElements.limitMessage) {
      if (isLimitReached) {
        this.uiElements.limitMessage.style.display = "block";
        this.uiElements.limitMessage.textContent = "Upload-Limit erreicht";
        this.uiElements.limitMessage.classList.add("limit-reached");
        console.log("📊 Video-Feed: Limit-Meldung wird angezeigt");
      } else {
        // Limit nicht erreicht, mach die Nachricht unsichtbar
        this.uiElements.limitMessage.style.display = "none";
        this.uiElements.limitMessage.classList.remove("limit-reached");
        console.log("📊 Video-Feed: Limit-Meldung wird ausgeblendet");
      }
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
   * Videos im Container anzeigen mit optimierter DOM-Manipulation
   */
  renderVideos(videos) {
    if (!this.videoContainer) {
      console.error("📋 Video-Feed: Container nicht gefunden");
      return;
    }
    
    // Container leeren
    this.videoContainer.innerHTML = "";
    
    // Prüfen, ob das Limit erreicht ist
    const maxUploads = this.getMembershipLimit(this.currentMember);
    const isLimitReached = videos && videos.length >= maxUploads;
    
    if (isLimitReached) {
      console.log("📋 Video-Feed: Upload-Limit erreicht", videos.length, "/", maxUploads);
    }
    
    if (!videos || videos.length === 0) {
      // Statt Fehlermeldung den Upload-Button anzeigen
      this.createUploadButton();
      return;
    }
    
    // DocumentFragment für bessere Performance
    const fragment = document.createDocumentFragment();
    
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
        videoDiv.innerHTML = `
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
      const categoryName = videoData["kategorie-name"] || getCategoryName(videoData["video-kategorie"]);
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
      detailsDiv.appendChild(editButton);
      
      wrapperDiv.appendChild(videoDiv);
      wrapperDiv.appendChild(detailsDiv);
      
      fragment.appendChild(wrapperDiv);
    });
    
    // Alle Video-Elemente auf einmal anhängen (effizientes DOM-Update)
    this.videoContainer.appendChild(fragment);
    
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
    
    // Nach dem Rendern den Upload-Counter und Fortschrittsbalken aktualisieren
    this.updateUploadCounter(videos.length, maxUploads);
  }
