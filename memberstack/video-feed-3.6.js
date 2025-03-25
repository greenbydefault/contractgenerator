// 🌐 Webflow API Integration für Video-Feed
// Optimierte Version

/**
 * Globale Konfiguration für das Video-Feed-Skript
 * Wird mit einem globalen Objekt für alle Skripte zugänglich gemacht
 */
window.WEBFLOW_API = window.WEBFLOW_API || {};

// Grundkonfiguration erweitern
window.WEBFLOW_API = {
  ...window.WEBFLOW_API,
  // API-Konfiguration
  BASE_URL: window.WEBFLOW_API.BASE_URL || "https://api.webflow.com/v2/collections",
  WORKER_BASE_URL: window.WEBFLOW_API.WORKER_BASE_URL || "https://bewerbungen.oliver-258.workers.dev/?url=",
  MEMBER_COLLECTION_ID: window.WEBFLOW_API.MEMBER_COLLECTION_ID || "6448faf9c5a8a15f6cc05526", 
  VIDEO_COLLECTION_ID: window.WEBFLOW_API.VIDEO_COLLECTION_ID || "67d806e65cadcadf2f41e659",
  
  // UI-Konfiguration
  VIDEO_CONTAINER_ID: window.WEBFLOW_API.VIDEO_CONTAINER_ID || "video-feed",
  UPLOAD_COUNTER_ID: window.WEBFLOW_API.UPLOAD_COUNTER_ID || "uploads-counter",
  UPLOAD_PROGRESS_ID: window.WEBFLOW_API.UPLOAD_PROGRESS_ID || "uploads-progress",
  
  // Cache-Konfiguration
  CACHE_DURATION: window.WEBFLOW_API.CACHE_DURATION || 5 * 60 * 1000, // 5 Minuten Cache
  
  // Memberstack Limits
  FREE_MEMBER_LIMIT: window.WEBFLOW_API.FREE_MEMBER_LIMIT || 1,
  PAID_MEMBER_LIMIT: window.WEBFLOW_API.PAID_MEMBER_LIMIT || 12,
  
  // Debug-Modus
  DEBUG_MODE: window.WEBFLOW_API.DEBUG_MODE !== undefined ? window.WEBFLOW_API.DEBUG_MODE : true
};

// Kategorie-Mapping aus dem zweiten Skript übernehmen
window.WEBFLOW_API.CATEGORY_MAPPING = {
  "a6a0530c5c476df59cb16022541a8233": "Travel",
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

/**
 * Cache für API-Antworten
 */
class SimpleCache {
  constructor() {
    this.items = {};
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > window.WEBFLOW_API.CACHE_DURATION) {
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
    this.currentMember = null;
    this.currentUser = null;
    this.userVideos = [];
    console.log("📋 Video-Feed: Initialisiert");
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   */
  buildWorkerUrl(apiUrl) {
    // Direkte Verwendung des Worker-URL-Basis ohne Konfiguration
    const workerBaseUrl = window.WEBFLOW_API.WORKER_BASE_URL || "https://bewerbungen.oliver-258.workers.dev/?url=";
    console.log("📋 Video-Feed: Worker-Basis-URL:", workerBaseUrl);
    
    return `${workerBaseUrl}${encodeURIComponent(apiUrl)}`;
  }

  /**
   * API-Anfrage mit Retry-Logik
   */
  async fetchApi(url, retries = 2) {
    try {
      console.log("📋 Video-Feed: Anfrage an", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("📋 Video-Feed: API-Fehler", response.status, errorText);
        
        if (retries > 0) {
          console.log("📋 Video-Feed: Wiederhole Anfrage...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.fetchApi(url, retries - 1);
        }
        
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        console.log("📋 Video-Feed: Wiederhole nach Fehler...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchApi(url, retries - 1);
      }
      throw error;
    }
  }

  /**
   * User-Informationen anhand der Memberstack-ID abrufen
   */
  async getUserByMemberstackId(memberstackId) {
    if (!memberstackId) {
      throw new Error("Memberstack ID fehlt");
    }
    
    const cacheKey = `user_${memberstackId}`;
    const cachedUser = this.cache.get(cacheKey);
    
    if (cachedUser) {
      console.log("📋 Video-Feed: User aus Cache geladen", memberstackId);
      return cachedUser;
    }
    
    // Collection ID direkt verwenden, um Fehler zu vermeiden
    const memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID || "6448faf9c5a8a15f6cc05526";
    console.log("📋 Video-Feed: Member Collection ID:", memberCollectionId);
    
    // API-Anfrage
    const filterQuery = `{"memberstack-id":{"eq":"${memberstackId}"}}`;
    const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${memberCollectionId}/items?live=true&limit=1&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const data = await this.fetchApi(workerUrl);
      
      if (!data.items || data.items.length === 0) {
        console.warn("📋 Video-Feed: Kein User gefunden mit ID", memberstackId);
        return null;
      }
      
      const user = data.items[0];
      console.log("📋 Video-Feed: User gefunden", user.id);
      
      this.cache.set(cacheKey, user);
      return user;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen des Users", error);
      throw error;
    }
  }

  /**
   * Videos für einen bestimmten User abrufen
   */
  async getVideosByUserId(userId) {
    if (!userId) {
      throw new Error("User ID fehlt");
    }
    
    const cacheKey = `videos_${userId}`;
    const cachedVideos = this.cache.get(cacheKey);
    
    if (cachedVideos) {
      console.log("📋 Video-Feed: Videos aus Cache geladen", userId);
      return cachedVideos;
    }
    
    // Collection ID direkt verwenden, um Fehler zu vermeiden
    const videoCollectionId = window.WEBFLOW_API.VIDEO_COLLECTION_ID || "67d806e65cadcadf2f41e659";
    console.log("📋 Video-Feed: Video Collection ID:", videoCollectionId);
    
    // API-Anfrage
    const filterQuery = `{"user-id":{"eq":"${userId}"}}`;
    const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${videoCollectionId}/items?live=true&filter=${encodeURIComponent(filterQuery)}`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const data = await this.fetchApi(workerUrl);
      
      if (!data.items || data.items.length === 0) {
        console.log("📋 Video-Feed: Keine Videos gefunden für User", userId);
        return [];
      }
      
      // Videos extrahieren - mit ID
      const videos = data.items.map(item => ({
        "id": item.id, // Webflow Item ID hinzufügen
        "video-link": item.fieldData["video-link"],
        "video-name": item.fieldData["video-name"],
        "video-kategorie": item.fieldData["video-kategorie"]
      })).filter(video => video["video-link"]);
      
      console.log(`📋 Video-Feed: ${videos.length} Videos geladen`);
      
      this.cache.set(cacheKey, videos);
      return videos;
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Abrufen der Videos", error);
      throw error;
    }
  }

  /**
   * Bestimmt das Video-Limit basierend auf dem Mitgliedsstatus
   * Berücksichtigt die Memberstack-API-Struktur
   */
  getMembershipLimit(member) {
    // Direkte Limits als Fallback definieren
    const FREE_LIMIT = 1;
    const PAID_LIMIT = 12;
    
    if (!member || !member.data) {
      console.log("📋 Video-Feed: Kein Member-Objekt, verwende FREE_MEMBER_LIMIT", FREE_LIMIT);
      return FREE_LIMIT;
    }
    
    // Prüfen ob Paid-Member anhand der planConnections
    let isPaid = false;
    
    // Option 1: Prüfen auf planConnections Array
    if (member.data.planConnections && member.data.planConnections.length > 0) {
      // Iteriere durch alle Plan-Verbindungen
      for (const connection of member.data.planConnections) {
        // Prüfe, ob ein aktiver Plan existiert, der nicht FREE ist
        if (connection.status === "ACTIVE" && connection.type !== "FREE") {
          isPaid = true;
          console.log("📋 Video-Feed: Paid-Member erkannt über planConnections");
          break;
        }
      }
    }
    
    // Option 2: Fallback auf ältere Memberstack-Version
    if (!isPaid && (member.data.acl?.includes("paid") || member.data.status === "paid")) {
      isPaid = true;
      console.log("📋 Video-Feed: Paid-Member erkannt über acl/status");
    }
    
    const limit = isPaid ? PAID_LIMIT : FREE_LIMIT;
    console.log(`📋 Video-Feed: Mitglied (${isPaid ? 'PAID' : 'FREE'}) erhält Limit:`, limit);
    
    return limit;
  }

  /**
   * Aktualisiert den Upload-Counter auf der Seite
   */
  updateUploadCounter(videoCount, maxUploads) {
    if (!this.uploadCounter) return;
    
    this.uploadCounter.textContent = `${videoCount}/${maxUploads}`;
    
    // Wenn der Fortschrittsbalken existiert, aktualisieren
    if (this.uploadProgress) {
      const progressPercent = maxUploads > 0 ? (videoCount / maxUploads) * 100 : 0;
      this.uploadProgress.style.width = `${progressPercent}%`;
    }
  }

  /**
   * Erstellt einen "Erstes Video hochladen" Button, falls keine Videos vorhanden sind
   */
  createUploadButton() {
    if (!this.videoContainer) return;
    
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("db-upload-empty-state");
    
    const uploadButton = document.createElement("a");
    uploadButton.href = "#"; // Link zur Upload-Seite
    uploadButton.classList.add("db-button-medium-gradient-pink");
    uploadButton.textContent = "Lade dein erstes Video hoch";
    
    // Event-Listener für Upload-Button (kann an Upload-Modal oder Seite weiterleiten)
    uploadButton.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Weiterleitung zur Upload-Seite oder Öffnen eines Upload-Modals
      // Falls ein globaler Event-Handler existiert, diesen auslösen
      if (typeof window.openUploadModal === "function") {
        window.openUploadModal();
      } else {
        // Custom Event auslösen, das von anderen Skripten abgefangen werden kann
        const uploadEvent = new CustomEvent('videoUploadRequest');
        document.dispatchEvent(uploadEvent);
      }
    });
    
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
      console.log("📋 Video-Feed: Video-ID für Edit-Button:", videoId);
      
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
      
      console.log("📋 Video-Feed: Eingeloggter User mit ID", memberstackId);
      
      // Video-Limit basierend auf Membership bestimmen
      const maxUploads = this.getMembershipLimit(member);
      console.log("📋 Video-Feed: Maximale Uploads für User:", maxUploads);
      
      // User-Daten laden
      const user = await this.getUserByMemberstackId(memberstackId);
      this.currentUser = user;
      
      if (!user) {
        this.showError("User-Daten konnten nicht gefunden werden");
        return;
      }
      
      // Videos laden
      const userId = user.id;
      const videos = await this.getVideosByUserId(userId);
      this.userVideos = videos;
      
      // Upload-Counter aktualisieren
      this.updateUploadCounter(videos.length, maxUploads);
      
      // Videos anzeigen
      this.renderVideos(videos);
      
    } catch (error) {
      console.error("📋 Video-Feed: Fehler beim Laden der Videos", error);
      this.showError("Fehler beim Laden des Video-Feeds");
    }
  }

  /**
   * App initialisieren
   */
  init() {
    // Sofortige Initialisierung, um DOM-Ready-Probleme zu vermeiden
    const initApp = () => {
      // Container-ID direkt als String verwenden statt über Config, um Fehler zu vermeiden
      const containerId = "video-feed";
      console.log("📋 Video-Feed: Suche nach Container mit ID:", containerId);
      
      // Video-Container finden
      this.videoContainer = document.getElementById(containerId);
      
      if (!this.videoContainer) {
        console.error("📋 Video-Feed: Container-Element nicht gefunden! ID:", containerId);
        
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
      
      // Upload-Counter Element finden
      this.uploadCounter = document.getElementById("uploads-counter");
      if (this.uploadCounter) {
        console.log("📋 Video-Feed: Upload-Counter gefunden");
      } else {
        console.log("📋 Video-Feed: Kein Upload-Counter gefunden mit ID 'uploads-counter'");
      }
      
      // Upload-Fortschrittsbalken finden
      this.uploadProgress = document.getElementById("uploads-progress");
      if (this.uploadProgress) {
        console.log("📋 Video-Feed: Upload-Fortschrittsbalken gefunden");
      } else {
        console.log("📋 Video-Feed: Kein Fortschrittsbalken gefunden mit ID 'uploads-progress'");
      }
      
      // Event-Listener für Video-Feed-Updates
      document.addEventListener('videoFeedUpdate', () => {
        console.log("📋 Video-Feed: Update-Event empfangen, lade Feed neu");
        
        // Cache löschen und Daten neu laden
        if (this.currentUser) {
          const cacheKey = `videos_${this.currentUser.id}`;
          this.cache.items[cacheKey] = null;
        }
        
        this.loadUserVideos();
      });
      
      // Videos laden
      this.loadUserVideos();
    };
    
    // Event-Listener für Video-Feed-Updates
    document.addEventListener('videoFeedUpdate', () => {
      console.log("📋 Video-Feed: Update-Event empfangen, lade Feed neu");
      
      // Cache löschen und Daten neu laden
      if (this.currentUser) {
        const cacheKey = `videos_${this.currentUser.id}`;
        this.cache.items[cacheKey] = null;
      }
      
      this.loadUserVideos();
    });;
    
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

// App starten
try {
  const videoFeedApp = new VideoFeedApp();
  videoFeedApp.init();
  
  // Für Debug-Zwecke global zugänglich machen
  window.videoFeedApp = videoFeedApp;
} catch (error) {
  console.error("📋 Video-Feed: Kritischer Fehler beim Start", error);
}
