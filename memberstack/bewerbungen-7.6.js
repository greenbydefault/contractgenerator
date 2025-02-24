// 🌐 Optimierte Webflow API Integration für GitHub-Hosting

// Konstanten in separates Konfigurations-Objekt auslagern
const CONFIG = {
  API: {
    BASE_URL: "https://api.webflow.com/v2/collections",
    WORKER_URL: "https://bewerbungen.oliver-258.workers.dev/?url=",
    JOBS_PER_PAGE: 15
  },
  COLLECTIONS: {
    JOB: "6448faf9c5a8a17455c05525",
    USER: "6448faf9c5a8a15f6cc05526"
  },
  SELECTORS: {
    APP_CONTAINER: "#application-list",
    LOAD_MORE_CONTAINER: "#load-more-container"
  }
};

// State Management mit einer Klasse
class ApplicationState {
  constructor() {
    this.currentPage = 1;
    this.allJobResults = [];
    this.currentWebflowMemberId = null;
  }

  reset() {
    this.currentPage = 1;
    this.allJobResults = [];
  }
}

// API Service Klasse
class WebflowApiService {
  constructor(config) {
    this.config = config;
  }

  buildWorkerUrl(apiUrl) {
    return `${this.config.API.WORKER_URL}${encodeURIComponent(apiUrl)}`;
  }

  async fetchWithErrorHandling(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ API Fehler: ${error.message}`);
      return null;
    }
  }

  async fetchCollectionItem(collectionId, memberId) {
    const apiUrl = `${this.config.API.BASE_URL}/${collectionId}/items/${memberId}/live`;
    const response = await this.fetchWithErrorHandling(this.buildWorkerUrl(apiUrl));
    return response;
  }

  async fetchJobData(jobId) {
    const apiUrl = `${this.config.API.BASE_URL}/${this.config.COLLECTIONS.JOB}/items/${jobId}/live`;
    const response = await this.fetchWithErrorHandling(this.buildWorkerUrl(apiUrl));
    return response?.fieldData || {};
  }
}

// UI Renderer Klasse
class JobRenderer {
  constructor(config) {
    this.config = config;
  }

  calculateDeadlineCountdown(endDate) {
    const now = new Date();
    const deadline = new Date(endDate);
    const diff = deadline - now;

    if (diff <= 0) return "Abgelaufen";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `Endet in ${days} Tag(en)`;
    if (hours > 0) return `Endet in ${hours} Stunde(n)`;
    return `Endet in ${minutes} Minute(n)`;
  }

  createStatusElement(status, text) {
    const statusDiv = document.createElement("div");
    const statusText = document.createElement("span");
    statusDiv.classList.add("job-tag", `is-bg-light-${status}`);
    statusText.classList.add("db-job-tag-txt");
    statusText.textContent = text;
    statusDiv.appendChild(statusText);
    return statusDiv;
  }

  renderJobField(value, fieldKey, jobData, webflowMemberId) {
    const fieldDiv = document.createElement("div");
    fieldDiv.classList.add("db-table-row-item");

    switch (fieldKey) {
      case "job-payment":
        fieldDiv.textContent = value !== "Nicht verfügbar" ? `${value} €` : value;
        break;
      case "job-date-end":
        fieldDiv.textContent = value !== "Nicht verfügbar" ? 
          this.calculateDeadlineCountdown(value) : value;
        break;
      case "job-status":
        const isActive = new Date(jobData["job-date-end"]) > new Date();
        fieldDiv.appendChild(this.createStatusElement(
          isActive ? "green" : "red",
          isActive ? "Aktiv" : "Beendet"
        ));
        break;
      // ... weitere Feldtypen
    }

    return fieldDiv;
  }

  renderJobs(jobs, webflowMemberId, currentPage) {
    const appContainer = document.querySelector(this.config.SELECTORS.APP_CONTAINER);
    appContainer.innerHTML = "";

    const startIndex = (currentPage - 1) * this.config.API.JOBS_PER_PAGE;
    const endIndex = startIndex + this.config.API.JOBS_PER_PAGE;
    const jobsToShow = jobs.slice(0, endIndex);

    jobsToShow.forEach((job, index) => this.renderJob(job, index, webflowMemberId, appContainer));
    this.renderLoadMoreButton(jobs.length, endIndex);
  }

  // ... weitere UI Methoden
}

// Main Application Class
class ApplicationManager {
  constructor() {
    this.state = new ApplicationState();
    this.apiService = new WebflowApiService(CONFIG);
    this.renderer = new JobRenderer(CONFIG);
  }

  async initialize() {
    try {
      const member = await window.$memberstackDom.getCurrentMember();
      this.state.currentWebflowMemberId = member?.data?.customFields?.['webflow-member-id'];
      
      if (!this.state.currentWebflowMemberId) {
        throw new Error("Kein 'webflow-member-id' im Memberstack-Profil gefunden.");
      }

      await this.loadApplications();
    } catch (error) {
      console.error("Initialisierungsfehler:", error);
      this.handleError(error);
    }
  }

  async loadApplications() {
    const userData = await this.apiService.fetchCollectionItem(
      CONFIG.COLLECTIONS.USER, 
      this.state.currentWebflowMemberId
    );

    const applications = userData?.fieldData?.["abgeschlossene-bewerbungen"] || [];
    
    if (applications.length === 0) {
      this.showNoApplicationsMessage();
      return;
    }

    await this.loadJobData(applications);
  }

  // Error Handler
  handleError(error) {
    // Implementiere benutzerfreundliche Fehlerbehandlung
    const errorContainer = document.createElement("div");
    errorContainer.classList.add("error-message");
    errorContainer.textContent = `Ein Fehler ist aufgetreten: ${error.message}`;
    document.querySelector(CONFIG.SELECTORS.APP_CONTAINER).appendChild(errorContainer);
  }
}

// Anwendungsstart
document.addEventListener("DOMContentLoaded", () => {
  const app = new ApplicationManager();
  app.initialize();
});
