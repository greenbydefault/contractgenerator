// 🌐 Webflow API Integration für Video-Feed
// Optimierte Version

/**
 * Erzwinge Standard-Konfigurationswerte - diese werden im globalen Scope gesetzt,
 * damit sie definitiv vor der Klassendefinition verfügbar sind
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

// Grundkonfiguration mit garantierten Werten
window.WEBFLOW_API.BASE_URL = window.WEBFLOW_API.BASE_URL || DEFAULT_BASE_URL;
window.WEBFLOW_API.WORKER_BASE_URL = window.WEBFLOW_API.WORKER_BASE_URL || DEFAULT_WORKER_BASE_URL;
window.WEBFLOW_API.MEMBER_COLLECTION_ID = window.WEBFLOW_API.MEMBER_COLLECTION_ID || DEFAULT_MEMBER_COLLECTION_ID;
window.WEBFLOW_API.VIDEO_COLLECTION_ID = window.WEBFLOW_API.VIDEO_COLLECTION_ID || DEFAULT_VIDEO_COLLECTION_ID;
window.WEBFLOW_API.FREE_MEMBER_LIMIT = window.WEBFLOW_API.FREE_MEMBER_LIMIT || DEFAULT_FREE_MEMBER_LIMIT;
window.WEBFLOW_API.PAID_MEMBER_LIMIT = window.WEBFLOW_API.PAID_MEMBER_LIMIT || DEFAULT_PAID_MEMBER_LIMIT;

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
  }

  get(key) {
    const item = this.items[key];
    if (!item) return null;
    
    // Prüfen ob abgelaufen
    if (Date.now() - item.timestamp > 5 * 60 * 1000) { // 5 Minuten
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
    console.log("📋 Video-Feed: Initialisiert");
  }

  /**
   * Worker-URL erstellen für Cross-Origin-Anfragen
   */
  buildWorkerUrl(apiUrl) {
    return `${window.WEBFLOW_API.WORKER_BASE_URL}${encodeURIComponent(apiUrl)}`;
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
    
    // Stelle sicher, dass wir eine gültige Collection-ID haben
    const memberCollectionId = window.WEBFLOW_API.MEMBER_COLLECTION_ID || DEFAULT_MEMBER_COLLECTION_ID;
    console.log("📋 Video-Feed: Verwende Member-Collection-ID:", memberCollectionId);
    
    // Direkter API-Aufruf mit der ID und /live Endpunkt für veröffentlichte Inhalte
    const apiUrl = `${window.WEBFLOW_API.BASE_URL}/${memberCollectionId}/items/${webflowId}/live`;
    const workerUrl = this.buildWorkerUrl(apiUrl);
    
    try {
      const user = await this.fetchApi(workerUrl);
      
      if (!user || !user.id) {
        console.warn("📋 Video-Feed: Kein User gefunden mit Webflow-ID", webflowId);
        return null;
      }
      
      console.log("📋 Video-Feed: User gefunden in Member-Collection:", user.id);
      
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
    if (!user || !user.fieldData || !user.fieldData["video-feed"]) {
      console.log("📋 Video-Feed: Keine Video-Referenzen im User-Profil gefunden");
      return [];
    }
    
    // Das video-feed Feld enthält die IDs der Videos im User-Profil
    const videoFeed = user.fieldData["video-feed"];
    
    // Detaillierte Debug-Informationen über das video-feed Feld
    console.log("📋 Video-Feed: Video-Feed-Typ:", Array.isArray(videoFeed) ? "Array" : typeof videoFeed);
    console.log("📋 Video-Feed: Video-Feed-Länge:", videoFeed.length);
    console.log("📋 Video-Feed: Erster Eintrag Typ:", videoFeed.length > 0 ? typeof videoFeed[0] : "Leer");
    
    if (!videoFeed || !Array.isArray(videoFeed) || videoFeed.length === 0) {
      console.log("📋 Video-Feed: Leerer Video-Feed im User-Profil");
      return [];
    }
    
    // Im Multi-Referenzfeld sind nur die IDs enthalten, nicht die vollständigen Video-Objekte
    // Wir müssen diese IDs verwenden, um die Videos direkt zu erstellen, ohne die Video-Collection abzufragen
    
    console.log(`📋 Video-Feed: ${videoFeed.length} Video-IDs im User-Feed gefunden`);
    
    // Wir erstellen direkt die Video-Objekte ohne weitere API-Abfragen
    // Das setzt voraus, dass die nötigen Daten bereits im Webflow-Editor eingetragen wurden
    const videos = videoFeed.map(videoId => ({
      "id": videoId,
      // Diese Felder können wir ohne zusätzliche API-Anfragen nicht füllen,
      // aber wir können sie leer lassen und die Daten werden später im UI nachgeladen
      "video-link": "",  // Wird vom Video-Element nachgeladen
      "video-name": "",  // Kann im UI angezeigt werden, sobald verfügbar
      "video-kategorie": ""  // Kann im UI angezeigt werden, sobald verfügbar
    }));
    
    console.log(`📋 Video-Feed: ${videos.length} Video-Objekte erstellt`);
    
    return videos;
  }

  /**
   * Bestimmt das Video-Limit basierend auf dem Mitgliedsstatus
   */
  getMembershipLimit(member) {
    if (!member || !member.data) {
      console.log("📋 Video-Feed: Kein Member-Objekt, verwende FREE_MEMBER_LIMIT");
      return window.WEBFLOW_API.FREE_MEMBER_LIMIT;
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
    if (!isPaid && (member.data.acl?.includes("paid") || member.data.status === "paid")) {
      isPaid = true;
      console.log("📋 Video-Feed: Paid-Member erkannt über acl/status");
    }
    
    const limit = isPaid ? window.WEBFLOW_API.PAID_MEMBER_LIMIT : window.WEBFLOW_API.FREE_MEMBER_LIMIT;
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
      // Prozentsatz berechnen
      const progressPercent = maxUploads > 0 ? (videoCount / maxUploads) * 100 : 0;
      
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
    const isLimitReached = videoCount >= maxUploads;
    
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
        console.log(`📋 Video-Feed: Kein Limit-Meldungs-Element mit ID '${window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID}' gefunden`);
        return;
      }
    }
    
    if (isLimitReached) {
      // Meldung anzeigen
      this.limitMessageEl.style.display = "block";
      this.limitMessageEl.textContent = "Upload-Limit erreicht";
      this.limitMessageEl.classList.add("limit-reached");
    } else {
      // Meldung ausblenden
      this.limitMessageEl.style.display = "none";
      this.limitMessageEl.classList.remove("limit-reached");
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
      // Keine Meldung im Feed anzeigen - nur in der separaten Limit-Message
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
      // Hier direkt den Rückgabewert in einer lokalen Variable speichern
      const maxUploads = this.getMembershipLimit(member);
      console.log("📋 Video-Feed: Maximale Uploads für User (nach Berechnung):", maxUploads);
      
      // 1. Webflow-ID aus den Custom Fields der Memberstack-Daten extrahieren
      let webflowMemberId = null;
      
      // Mögliche Orte für die Webflow-ID prüfen
      if (member.data.customFields && member.data.customFields["webflow-member-id"]) {
        webflowMemberId = member.data.customFields["webflow-member-id"];
        console.log("📋 Video-Feed: Webflow-Member-ID aus customFields gefunden:", webflowMemberId);
      } 
      else if (member.data.metaData && member.data.metaData["webflow-member-id"]) {
        webflowMemberId = member.data.metaData["webflow-member-id"];
        console.log("📋 Video-Feed: Webflow-Member-ID aus metaData gefunden:", webflowMemberId);
      }
      else {
        // Weitere mögliche Felder prüfen
        const possibleFields = ["webflow-id", "webflow_id", "webflowId"];
        for (const field of possibleFields) {
          if (member.data.customFields && member.data.customFields[field]) {
            webflowMemberId = member.data.customFields[field];
            console.log(`📋 Video-Feed: Webflow-Member-ID aus customFields["${field}"] gefunden:`, webflowMemberId);
            break;
          } 
          else if (member.data.metaData && member.data.metaData[field]) {
            webflowMemberId = member.data.metaData[field];
            console.log(`📋 Video-Feed: Webflow-Member-ID aus metaData["${field}"] gefunden:`, webflowMemberId);
            break;
          }
        }
      }
      
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
      
      // Upload-Counter aktualisieren - verwende hier die lokale Variable
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
      
      // Upload-Counter Element finden
      this.uploadCounter = document.getElementById(window.WEBFLOW_API.UPLOAD_COUNTER_ID);
      if (this.uploadCounter) {
        console.log("📋 Video-Feed: Upload-Counter gefunden");
      }
      
      // Upload-Fortschrittsbalken finden
      this.uploadProgress = document.getElementById(window.WEBFLOW_API.UPLOAD_PROGRESS_ID);
      if (this.uploadProgress) {
        console.log("📋 Video-Feed: Upload-Fortschrittsbalken gefunden");
      }
      
      // Upload-Limit-Meldungs-Element suchen
      this.limitMessageEl = document.getElementById(window.WEBFLOW_API.UPLOAD_LIMIT_MESSAGE_ID);
      if (this.limitMessageEl) {
        console.log("📋 Video-Feed: Upload-Limit-Meldungs-Element gefunden");
      }
      
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

// App starten
try {
  const videoFeedApp = new VideoFeedApp();
  videoFeedApp.init();
  
  // Für Debug-Zwecke global zugänglich machen
  window.videoFeedApp = videoFeedApp;
} catch (error) {
  console.error("📋 Video-Feed: Kritischer Fehler beim Start", error);
}
