document.addEventListener('DOMContentLoaded', function() {
  // Globale Variable für den aktuellen Schritt
  let currentStep = 1;

  // Globale Variable, um zu verhindern, dass mehrere Navigationen gleichzeitig stattfinden
  let navigationInProgress = false;

  // Event-Listener für die Vertragstyp-Auswahl
  const contractTypeSelect = document.getElementById('contract-type');
  const clientInfoSection = document.getElementById('client-info-section');

  if (contractTypeSelect && clientInfoSection) {
    // Initial Zustand setzen
    clientInfoSection.style.display = contractTypeSelect.value === 'client' ? 'block' : 'none';

    // Event-Listener für Änderungen
    contractTypeSelect.addEventListener('change', function() {
      clientInfoSection.style.display = this.value === 'client' ? 'block' : 'none';
      updateProgress(); // Fortschrittsanzeige aktualisieren
    });
  }

  // Plattform-Checkboxen und entsprechende Detail-Felder
  const platformInstagram = document.getElementById('platform-instagram');
  const instagramDetails = document.getElementById('instagram-details');

  const platformTikTok = document.getElementById('platform-tiktok');
  const tiktokDetails = document.getElementById('tiktok-details');

  const platformYoutube = document.getElementById('platform-youtube');
  const youtubeDetails = document.getElementById('youtube-details');

  const platformOther = document.getElementById('platform-other');
  const otherDetails = document.getElementById('other-details');

  // Event-Listener für Plattform-Checkboxen
  if (platformInstagram && instagramDetails) {
    platformInstagram.addEventListener('change', function() {
      instagramDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
  }

  if (platformTikTok && tiktokDetails) {
    platformTikTok.addEventListener('change', function() {
      tiktokDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
  }

  if (platformYoutube && youtubeDetails) {
    platformYoutube.addEventListener('change', function() {
      youtubeDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
  }

  if (platformOther && otherDetails) {
    platformOther.addEventListener('change', function() {
      otherDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
  }

  // Media Buyout Optionen
  const mediaBuyoutYes = document.getElementById('media-buyout-yes');
  const mediaBuyoutDetails = document.getElementById('media-buyout-details');

  if (mediaBuyoutYes && mediaBuyoutDetails) {
    // Initialen Zustand setzen
    mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked);

    // Event-Listener für Änderungen
    mediaBuyoutYes.addEventListener('change', function() {
      mediaBuyoutDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });

    // Auch für das "Nein" Radio-Button, um korrekt zu aktualisieren
    const mediaBuyoutNo = document.getElementById('media-buyout-no');
    if (mediaBuyoutNo) {
      mediaBuyoutNo.addEventListener('change', function() {
        mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked); // Show details if "Yes" is checked
        updateProgress();
      });
    }
  }

  // Zusätzliche Vergütung
  const additionalYes = document.getElementById('additional-yes');
  const additionalDetails = document.getElementById('additional-comp-details');

  if (additionalYes && additionalDetails) {
    // Initialen Zustand setzen
    additionalDetails.classList.toggle('hidden', !additionalYes.checked);

    // Event-Listener für Änderungen
    additionalYes.addEventListener('change', function() {
      additionalDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });

    // Auch für das "Nein" Radio-Button
    const additionalNo = document.getElementById('additional-no');
    if (additionalNo) {
      additionalNo.addEventListener('change', function() {
        additionalDetails.classList.toggle('hidden', !additionalYes.checked); // Show details if "Yes" is checked
        updateProgress();
      });
    }
  }

  // Fortschrittsleiste und Schritte
  const progressSteps = document.querySelectorAll('.progress-step');
  const formSections = document.querySelectorAll('.form-section');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressMessage = document.getElementById('progress-message');

  // Event-Listener für Klicks auf die Fortschrittsschritte hinzufügen (direkte Navigation)
  progressSteps.forEach(step => {
    step.addEventListener('click', function() {
      if (navigationInProgress) return; // Verhindere mehrfache Navigationen
      navigationInProgress = true;

      const stepNum = parseInt(this.getAttribute('data-step'));

      // Bei Klick auf aktiven Schritt nichts tun
      if (stepNum === currentStep) {
        navigationInProgress = false;
        return;
      }

      // Zu früheren Schritten kann man immer navigieren
      if (stepNum < currentStep) {
        // Alle Fehlermarkierungen im aktuellen Schritt zurücksetzen
        resetErrorsInCurrentStep();
        goToStep(stepNum);
        navigationInProgress = false;
        return;
      }

      // Für vorwärts: nur den aktuellen Schritt validieren
      // Allow navigation to any future step if current step is valid
      let canProceed = true;
      for (let i = currentStep; i < stepNum; i++) {
          const intermediateStepSection = document.getElementById(`step-${i}`);
          if (intermediateStepSection) {
              const requiredFields = intermediateStepSection.querySelectorAll('[required]');
              requiredFields.forEach(field => {
                  if (!field.value.trim()) {
                      canProceed = false;
                  }
              });
              if (!canProceed) {
                  goToStep(i); // Go to the first invalid step
                  markInvalidFieldsInCurrentStep();
                  showValidationError();
                  navigationInProgress = false;
                  return;
              }
          }
      }
        
      if (canProceed) {
        resetErrorsInCurrentStep(); // Reset errors from the current step before moving
        goToStep(stepNum);
      }
      navigationInProgress = false;
    });
  });

  // Event-Listener für "Weiter"-Buttons
  nextButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (navigationInProgress) return;
      navigationInProgress = true;

      const nextStep = parseInt(this.getAttribute('data-next'));

      if (!validateCurrentStep()) {
        markInvalidFieldsInCurrentStep();
        showValidationError();
        navigationInProgress = false;
        return;
      }

      resetErrorsInCurrentStep();
      goToStep(nextStep);
      navigationInProgress = false;
    });
  });

  // Event-Listener für "Zurück"-Buttons
  prevButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (navigationInProgress) return;
      navigationInProgress = true;

      const prevStep = parseInt(this.getAttribute('data-prev'));
      resetErrorsInCurrentStep();
      goToStep(prevStep);
      navigationInProgress = false;
    });
  });

  function resetErrorsInCurrentStep() {
    const currentSection = document.getElementById(`step-${currentStep}`);
    if (!currentSection) return;

    const fields = currentSection.querySelectorAll('.form-input-field, [required]'); // Include all relevant fields
    fields.forEach(field => {
      field.classList.remove('error');
      field.style.borderColor = '';
      field.classList.remove('shake');
    });
  }

  function showValidationError() {
    alert('Bitte fülle alle markierten Pflichtfelder im aktuellen Schritt aus, um fortzufahren.');
  }

  function markInvalidFieldsInCurrentStep() {
    const currentSection = document.getElementById(`step-${currentStep}`);
    if (!currentSection) return;

    const requiredFields = currentSection.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error');
        field.classList.add('shake');
        field.style.borderColor = 'red';

        setTimeout(() => {
          field.classList.remove('shake');
        }, 500);
      } else {
        field.classList.remove('error');
        field.style.borderColor = '';
      }
    });
  }

  function updateButtonState(button, isValid) {
    if (isValid) {
      button.disabled = false;
      button.classList.remove('btn-disabled');
    } else {
      button.disabled = true;
      button.classList.add('btn-disabled');
    }
  }

  function validateCurrentStep() {
    const currentSection = document.getElementById(`step-${currentStep}`);
    if (!currentSection) return true; 

    const nextButton = currentSection.querySelector('.next-step'); // Find button within the current step

    const requiredFields = currentSection.querySelectorAll('[required]');
    let allValid = true;

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        allValid = false;
      }
    });

    if (nextButton) {
      updateButtonState(nextButton, allValid);
    }

    return allValid;
  }

  function goToStep(stepNumber) {
    currentStep = stepNumber;

    formSections.forEach(section => {
      section.classList.add('hidden');
    });

    progressSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.toggle('active', stepNum === currentStep); // Only current step is active
      step.classList.toggle('completed', stepNum < currentStep);
    });

    const targetSection = document.getElementById(`step-${stepNumber}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    updateProgress();
    validateCurrentStep(); // Validate the new current step

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function updateProgress() {
    const totalSteps = progressSteps.length > 0 ? progressSteps.length : 9; // Fallback to 9 if not detected
    const percentage = Math.min(Math.floor(((currentStep -1) / totalSteps) * 100), 100); // More accurate percentage

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${percentage}% ausgefüllt`;
    }

    updateProgressMessage(currentStep);

    if (currentStep === totalSteps) { // Check against totalSteps
      updatePreview();
    }
  }

  function updateProgressMessage(stepNumber) {
    if (!progressMessage) return;

    const messages = [
      "Lass uns anfangen! Wähle den Vertragstyp.", // Step 1
      "Gut gemacht! Wer sind die Vertragspartner?", // Step 2
      "Perfekt! Auf welchen Plattformen wird veröffentlicht?", // Step 3
      "Super! Welche Inhalte sollen erstellt werden?", // Step 4
      "Prima! Gibt es zusätzliche Vereinbarungen?", // Step 5
      "Sehr gut! Klären wir die Rechte und Nutzung (Media Buyout).", // Step 6
      "Fast geschafft! Wie sieht der Zeitplan aus?", // Step 7
      "Letzte Details zur Vergütung.", // Step 8
      "Alles klar! Überprüfe den Vertrag und generiere ihn." // Step 9
    ];

    progressMessage.textContent = messages[stepNumber - 1] || "Weiter geht's!";
  }

  function calculateRealProgress() {
    const allRequiredFields = document.querySelectorAll('.form-section [required]');
    let filledRequiredFields = 0;

    allRequiredFields.forEach(field => {
        const section = field.closest('.form-section');
        // Only count fields in visible sections or sections before current, or if it's the preview step
        if (section && (!section.classList.contains('hidden') || parseInt(section.id.split('-')[1]) < currentStep || currentStep === (progressSteps.length > 0 ? progressSteps.length : 9) )) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                if (field.checked && field.value.trim()) filledRequiredFields++; // Consider checked and having a value
                else if (field.checked) filledRequiredFields++; // For simple yes/no checks
            } else if (field.value && field.value.trim() !== '') {
                filledRequiredFields++;
            }
        }
    });
    if (allRequiredFields.length === 0) return 100;
    return Math.floor((filledRequiredFields / allRequiredFields.length) * 100);
  }

  function updatePreview() {
    try {
      // Helper to get value or default
      const getValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        return el && el.value ? el.value.trim() : defaultValue;
      };
      const isChecked = (id) => document.getElementById(id) ? document.getElementById(id).checked : false;

      // Unternehmensdaten
      document.getElementById('preview-company-name').textContent = getValue('company-name', '[Name des Unternehmens]');
      document.getElementById('preview-company-contact').textContent = getValue('company-contact', '[Ansprechpartner]');
      document.getElementById('preview-company-street').textContent = getValue('company-street', '[Straße]');
      document.getElementById('preview-company-number').textContent = getValue('company-number', '[Hausnummer]');
      document.getElementById('preview-company-zip').textContent = getValue('company-zip', '[PLZ]');
      document.getElementById('preview-company-city').textContent = getValue('company-city', '[Stadt]');
      document.getElementById('preview-company-country').textContent = getValue('company-country', '[Land]');

      // Influencer-Daten
      document.getElementById('preview-influencer-name').textContent = getValue('influencer-name', '[Name des Influencers]');
      document.getElementById('preview-influencer-street').textContent = getValue('influencer-street', '[Straße]');
      document.getElementById('preview-influencer-number').textContent = getValue('influencer-number', '[Hausnummer]');
      document.getElementById('preview-influencer-zip').textContent = getValue('influencer-zip', '[PLZ]');
      document.getElementById('preview-influencer-city').textContent = getValue('influencer-city', '[Stadt]');
      document.getElementById('preview-influencer-country').textContent = getValue('influencer-country', '[Land]');

      // Kundensektion
      const isClientContract = getValue('contract-type') === 'client';
      const previewClientSection = document.getElementById('preview-client-section');
      previewClientSection.classList.toggle('hidden', !isClientContract);
      if (isClientContract) {
        document.getElementById('preview-client-name').textContent = getValue('client-name', '[Name des Kunden]');
        document.getElementById('preview-client-street').textContent = getValue('client-street', '[Straße Kunde]');
        document.getElementById('preview-client-number').textContent = getValue('client-number', '[Hausnummer Kunde]');
        document.getElementById('preview-client-zip').textContent = getValue('client-zip', '[PLZ Kunde]');
        document.getElementById('preview-client-city').textContent = getValue('client-city', '[Stadt Kunde]');
        document.getElementById('preview-client-country').textContent = getValue('client-country', '[Land Kunde]');
      }

      // Plattformen
      let platformsHtml = '';
      if (isChecked('platform-instagram')) platformsHtml += `<p>✓ Instagram (Profil: ${getValue('instagram-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-tiktok')) platformsHtml += `<p>✓ TikTok (Profil: ${getValue('tiktok-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-youtube')) platformsHtml += `<p>✓ YouTube (Kanal: ${getValue('youtube-url', '[URL]')})</p>`;
      if (isChecked('platform-other')) platformsHtml += `<p>✓ Sonstiges: ${getValue('other-platform', '[Frei eintragen]')})</p>`;
      document.getElementById('preview-platforms').innerHTML = platformsHtml || '<p>Keine Plattformen ausgewählt</p>';

      // Inhalte
      let contentTypesHtml = '';
      if (parseInt(getValue('story-slides', '0')) > 0) contentTypesHtml += `<li>Story-Slides: ${getValue('story-slides')}</li>`;
      if (parseInt(getValue('reels-tiktok', '0')) > 0) contentTypesHtml += `<li>Instagram Reels / TikTok Videos: ${getValue('reels-tiktok')}</li>`;
      if (parseInt(getValue('feed-posts', '0')) > 0) contentTypesHtml += `<li>Feed-Posts: ${getValue('feed-posts')}</li>`;
      if (parseInt(getValue('youtube-videos', '0')) > 0) contentTypesHtml += `<li>YouTube Videos: ${getValue('youtube-videos')}</li>`;
      document.getElementById('preview-content-types').innerHTML = contentTypesHtml || '<li>Keine Inhalte spezifiziert</li>';

      // Exklusivität
      const exclusivityValue = getValue('exklusiv');
      const previewExclusivityEl = document.getElementById('preview-exclusivity');
      if (previewExclusivityEl) {
        previewExclusivityEl.innerHTML = exclusivityValue ? `<p>Exklusivität: <strong>${exclusivityValue}</strong></p>` : '<p>Keine Exklusivität ausgewählt</p>';
      }

      // Zusätzliche Informationen
      const extraInformationValue = getValue('extra-information');
      const previewExtraInfoEl = document.getElementById('preview-extra-information');
      if (previewExtraInfoEl) {
        previewExtraInfoEl.innerHTML = extraInformationValue ? `<p>Zusätzliche Informationen: <br><em>${extraInformationValue.replace(/\n/g, '<br>')}</em></p>` : '<p>Keine zusätzlichen Informationen</p>';
      }
      
      const realProgress = calculateRealProgress();
      if (progressFill) progressFill.style.width = `${realProgress}%`;
      if (progressText) progressText.textContent = `${realProgress}% ausgefüllt`;

    } catch (error) {
      console.error("Fehler bei der Aktualisierung der Vorschau:", error);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        return date.toLocaleDateString('de-DE');
    } catch (e) {
        return dateString; // Return original if error
    }
  }
  
  // *** PDF-GENERIERUNG FUNKTIONEN ***
  const PAGE_MARGIN = 20;
  const CONTENT_START_Y = 30;
  const PAGE_HEIGHT = 297; // A4 height in mm
  const LINE_HEIGHT = 7; // Approximate line height

  function checkAndAddPage(doc, currentY, spaceNeeded = LINE_HEIGHT * 2) {
      if (currentY + spaceNeeded > PAGE_HEIGHT - PAGE_MARGIN) {
          doc.addPage();
          return CONTENT_START_Y;
      }
      return currentY;
  }

  function addWatermark(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150); 

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      const watermarkText = 'Created with creatorjobs.com';
      const watermarkTextWidth = doc.getTextWidth(watermarkText);
      doc.text(watermarkText, pageWidth - watermarkTextWidth - 10, pageHeight - 10);
    }
    doc.setTextColor(0); // Reset text color
  }

  function addParagraphTitle(doc, title, y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, PAGE_MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    return y + LINE_HEIGHT * 1.5; 
  }

  function addTableOfContents(doc, tocEntries) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    let y = CONTENT_START_Y;
    y = checkAndAddPage(doc, y, LINE_HEIGHT * (tocEntries.length + 4));

    doc.text('Inhaltsverzeichnis', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += LINE_HEIGHT * 2;

    doc.setFontSize(11);
    tocEntries.forEach(para => {
      y = checkAndAddPage(doc, y, LINE_HEIGHT);
      doc.setFont("helvetica", "bold");
      doc.text(para.num, PAGE_MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.text(para.title, PAGE_MARGIN + 15, y);
      doc.text(para.page.toString(), doc.internal.pageSize.getWidth() - PAGE_MARGIN - 10, y, {align: 'right'});
      y += LINE_HEIGHT * 1.2;
    });
    // doc.addPage(); // Removed, as the main content will start on this page or a new one if needed
    return CONTENT_START_Y; // Start Y for the next page (or current if space)
  }

  function addCoverPage(doc, data) {
    let y = 80;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('INFLUENCER-MARKETING-VERTRAG', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 20;

    doc.setFontSize(14);
    doc.text('Vertragspartner', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 20;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Unternehmen (Auftraggeber):', PAGE_MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${data.companyName}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT;
    doc.text(`Vertreten durch: ${data.companyContact}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT;
    doc.text(`Straße: ${data.companyStreet} Nr.: ${data.companyNumber}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT;
    doc.text(`PLZ: ${data.companyZip}, Stadt: ${data.companyCity}, Land: ${data.companyCountry}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT * 2;

    doc.setFont("helvetica", "bold");
    doc.text('Influencer (Creator):', PAGE_MARGIN, y);
    y += LINE_HEIGHT;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${data.influencerName}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT;
    doc.text(`Straße: ${data.influencerStreet} Nr.: ${data.influencerNumber}`, PAGE_MARGIN + 5, y);
    y += LINE_HEIGHT;
    doc.text(`PLZ: ${data.influencerZip}, Stadt: ${data.influencerCity}, Land: ${data.influencerCountry}`, PAGE_MARGIN + 5, y);
    
    doc.addPage(); // Page for Table of Contents
    return CONTENT_START_Y;
  }

  function addSignatureFields(doc, city, y) {
    y = checkAndAddPage(doc, y, LINE_HEIGHT * 7); // Ensure enough space for signatures
    if (y < PAGE_HEIGHT - 80) { 
        y = PAGE_HEIGHT - 80; // Push to bottom if not enough space, but ensure it's on the page
    } else if (y > PAGE_HEIGHT - PAGE_MARGIN - LINE_HEIGHT * 7) { // If it would overflow, add new page
        doc.addPage();
        y = CONTENT_START_Y;
    }


    const today = new Date();
    const formattedDate = today.toLocaleDateString('de-DE');
    const leftColumnX = PAGE_MARGIN;
    const rightColumnX = doc.internal.pageSize.getWidth() / 2 + 10;
    const signatureLineWidth = 70;

    doc.setFontSize(10);

    // Ort und Datum für Unternehmen
    doc.text(`Ort: ${city}`, leftColumnX, y);
    doc.text(`Datum: ${formattedDate}`, leftColumnX, y + LINE_HEIGHT);
    doc.line(leftColumnX, y + LINE_HEIGHT * 2.5, leftColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); // Unterschriftslinie
    doc.text('[Unterschrift Unternehmen]', leftColumnX, y + LINE_HEIGHT * 3.5);

    // Ort und Datum für Influencer (leer lassen für manuelle Eingabe)
    doc.text("Ort:________________________", rightColumnX, y);
    doc.text("Datum:_______________________", rightColumnX, y + LINE_HEIGHT);
    doc.line(rightColumnX, y + LINE_HEIGHT * 2.5, rightColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); // Unterschriftslinie
    doc.text('[Unterschrift Influencer]', rightColumnX, y + LINE_HEIGHT * 3.5);
    return y + LINE_HEIGHT * 4;
  }

  function renderCheckbox(doc, isChecked, text, x, y, currentY) {
    const boxSize = 3.5; 
    const textXOffset = boxSize + 2;
    // currentY = checkAndAddPage(doc, currentY, LINE_HEIGHT); // Check page before rendering anything

    doc.setLineWidth(0.2);
    doc.rect(x, currentY - boxSize + 1 , boxSize, boxSize); // Draw the box
    if (isChecked) {
      // Simple horizontal line for check, easier to render consistently
      doc.line(x + 0.5, currentY - boxSize/2 + 1, x + boxSize - 0.5, currentY - boxSize/2 + 1); 
    }
    const textLines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - x - textXOffset - PAGE_MARGIN);
    doc.text(textLines, x + textXOffset, currentY);
    return currentY + (textLines.length * LINE_HEIGHT * 0.8); // Return new Y position based on text lines
}


  function generatePDF() {
    console.log('Starting PDF generation');
    try {
      // Ensure jsPDF is loaded
      if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert('Die PDF-Bibliothek (jsPDF) konnte nicht geladen werden. Bitte stellen Sie sicher, dass die Bibliothek korrekt eingebunden ist und versuchen Sie es erneut.');
        console.error('jsPDF is not loaded on window.jspdf');
        return;
      }
      const { jsPDF } = window.jspdf;
      
      const doc = new jsPDF();
      let currentPage = 1; // Start with cover page as page 1
      let tocEntries = [];
      let y = CONTENT_START_Y;

      // Helper to get value or default
      const getValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        if (el && el.type === 'radio') {
            const radioGroup = document.querySelectorAll(`input[name="${el.name}"]:checked`);
            return radioGroup.length > 0 ? radioGroup[0].value : defaultValue;
        }
        return el && el.value ? el.value.trim() : defaultValue;
      };
      const isChecked = (id) => document.getElementById(id) ? document.getElementById(id).checked : false;
      
      const getSelectedRadioValue = (name, defaultValue = '') => {
        const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
        // Ensure the value is extracted, not the placeholder from the label
        if (selectedRadio) {
            // Example: if id is "duration-3", value might be "3 Monate"
            // This part needs to be robust based on how values are set in HTML
            if (selectedRadio.id.startsWith('duration-')) {
                const val = selectedRadio.id.split('-')[1];
                if (val === 'unlimited') return 'Unbegrenzt';
                return `${val} Monate`;
            }
             if (selectedRadio.id.startsWith('term-')) {
                return `${selectedRadio.id.split('-')[1]} Tage`;
            }
            return selectedRadio.value || defaultValue; // Fallback to element's value attribute
        }
        return defaultValue;
      };


      // Daten aus dem Formular extrahieren
      const data = {
        contractType: getValue('contract-type'),
        companyName: getValue('company-name', '[Name des Unternehmens]'),
        companyContact: getValue('company-contact', '[Ansprechpartner]'),
        companyStreet: getValue('company-street', '[Straße]'),
        companyNumber: getValue('company-number', '[Hausnummer]'),
        companyZip: getValue('company-zip', '[PLZ]'),
        companyCity: getValue('company-city', '[Stadt]'),
        companyCountry: getValue('company-country', '[Land]'),
        influencerName: getValue('influencer-name', '[Name des Influencers]'),
        influencerStreet: getValue('influencer-street', '[Straße Creator]'),
        influencerNumber: getValue('influencer-number', '[Hausnummer Creator]'),
        influencerZip: getValue('influencer-zip', '[PLZ Creator]'),
        influencerCity: getValue('influencer-city', '[Stadt Creator]'),
        influencerCountry: getValue('influencer-country', '[Land Creator]'),
        clientName: getValue('client-name', '[Name des Kunden]'),
        clientStreet: getValue('client-street', '[Straße Kunde]'),
        clientNumber: getValue('client-number', '[Hausnummer Kunde]'),
        clientZip: getValue('client-zip', '[PLZ Kunde]'),
        clientCity: getValue('client-city', '[Stadt Kunde]'),
        clientCountry: getValue('client-country', '[Land Kunde]'),
        instagramSelected: isChecked('platform-instagram'),
        instagramUsername: getValue('instagram-username', '[@nutzername]'),
        tiktokSelected: isChecked('platform-tiktok'),
        tiktokUsername: getValue('tiktok-username', '[@nutzername]'),
        youtubeSelected: isChecked('platform-youtube'),
        youtubeUrl: getValue('youtube-url', '[URL]'),
        otherSelected: isChecked('platform-other'),
        otherPlatform: getValue('other-platform', '[frei eintragen]'),
        storySlides: getValue('story-slides', '0'),
        reelsTiktok: getValue('reels-tiktok', '0'),
        feedPosts: getValue('feed-posts', '0'),
        youtubeVideos: getValue('youtube-videos', '0'),
        collabPost: isChecked('collab-post'),
        companyPublication: isChecked('company-publication'),
        noCompanyPublication: isChecked('no-company-publication'),
        mediaBuyoutYes: isChecked('media-buyout-yes'),
        adInstagram: isChecked('ad-instagram'),
        adFacebook: isChecked('ad-facebook'),
        adTiktok: isChecked('ad-tiktok'),
        adOther: isChecked('ad-other'),
        whitelisting: isChecked('whitelisting'),
        sparkAd: isChecked('spark-ad'),
        usageDuration: getSelectedRadioValue('duration', '[Dauer nicht festgelegt]'), 
        briefingDate: formatDate(getValue('briefing-date', '[Datum]')),
        scriptDate: formatDate(getValue('script-date', '[Datum]')),
        scriptTime: getValue('script-time', '12:00'),
        productionStart: formatDate(getValue('production-start', '[Datum]')),
        productionEnd: formatDate(getValue('production-end', '[Datum]')),
        productionLocation: getValue('production-location', '[Adresse]'),
        deliveryDate: formatDate(getValue('delivery-date', '[Datum]')),
        deliveryTime: getValue('delivery-time', '12:00'),
        publicationDate: formatDate(getValue('publication-date', '[Datum]')),
        compensation: getValue('compensation', '[€ Betrag]'),
        paymentTerm: getSelectedRadioValue('payment_term', '[Zahlungsziel nicht festgelegt]'), 
        additionalCompYes: isChecked('additional-yes'),
        additionalCompText: getValue('additional-comp-text', '[Textfeld falls ja]'),
        exclusivity: getValue('exklusiv', ''),
        extraInformation: getValue('extra-information', '')
      };
      
      // Deckblatt hinzufügen (Seite 1)
      y = addCoverPage(doc, data); // Returns start Y for next page
      currentPage = 2; 

      // TOC Einträge initialisieren
      tocEntries = [
            { num: "§1", title: "Vertragsgegenstand", page: 0 },
            { num: "§2", title: "Plattformen & Veröffentlichung", page: 0 },
            { num: "§3", title: "Nutzung für Werbung (Media Buyout)", page: 0 },
            { num: "§4", title: "Rechteübertragung", page: 0 },
            { num: "§5", title: "Produktion & Freigabe", page: 0 },
            { num: "§6", title: "Vergütung", page: 0 },
            { num: "§7", title: "Qualität & Upload", page: 0 },
            { num: "§8", title: "Rechte Dritter & Musik", page: 0 },
            { num: "§9", title: "Werbekennzeichnung & Exklusivität", page: 0 },
            { num: "§10", title: "Verbindlichkeit Briefing & Skript", page: 0 },
            { num: "§11", title: "Datenschutz & Vertraulichkeit", page: 0 },
            { num: "§12", title: "Schlussbestimmungen & Zus. Infos", page: 0 }
      ];
      
      // Inhaltsverzeichnis hinzufügen (Seite 2)
      // Die Funktion addTableOfContents fügt selbst eine neue Seite hinzu, wenn sie aufgerufen wird.
      // Sie sollte das y für den Start des Inhalts auf der *neuen* Seite zurückgeben.
      y = addTableOfContents(doc, tocEntries); 
      currentPage = 3; // Inhalt beginnt auf Seite 3


      // Vertragsinhalt - Seite 3 und folgende
      // §1 Vertragsgegenstand
      tocEntries[0].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§1 Vertragsgegenstand", y);
      doc.text("Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.", PAGE_MARGIN, y, { maxWidth: doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN });
      y += LINE_HEIGHT * 1.5; // Increased spacing
      y = checkAndAddPage(doc, y);
      if (data.contractType === 'client') {
        const clientDetails = `Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden: ${data.clientName || '[Kundenname fehlt]'} (${data.clientStreet || '[Straße fehlt]'} ${data.clientNumber || '[Nr. fehlt]'}, ${data.clientZip || '[PLZ fehlt]'} ${data.clientCity || '[Stadt fehlt]'}, ${data.clientCountry || '[Land fehlt]'}). Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.`;
        const clientLines = doc.splitTextToSize(clientDetails, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
        doc.text(clientLines, PAGE_MARGIN, y);
        y += LINE_HEIGHT * clientLines.length;
      } else {
        doc.text("Das Unternehmen handelt im eigenen Namen und auf eigene Rechnung.", PAGE_MARGIN, y);
        y += LINE_HEIGHT;
      }
      y += LINE_HEIGHT; // Extra space

      // §2 Plattformen & Veröffentlichung
      tocEntries[1].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
      doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", PAGE_MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      let platformY = y; // Start Y for this block of checkboxes
      if (data.instagramSelected) platformY = renderCheckbox(doc, true, `Instagram - Profil: ${data.instagramUsername || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.tiktokSelected)    platformY = renderCheckbox(doc, true, `TikTok - Profil: ${data.tiktokUsername || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.youtubeSelected)   platformY = renderCheckbox(doc, true, `YouTube - Kanal: ${data.youtubeUrl || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.otherSelected)     platformY = renderCheckbox(doc, true, `Sonstiges: ${data.otherPlatform || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (!data.instagramSelected && !data.tiktokSelected && !data.youtubeSelected && !data.otherSelected) {
          doc.text("Keine Plattformen ausgewählt.", PAGE_MARGIN + 5, platformY);
          platformY += LINE_HEIGHT;
      }
      y = platformY + LINE_HEIGHT * 0.5; // Update main y after checkbox block
      
      y = checkAndAddPage(doc, y);
      doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", PAGE_MARGIN, y);
      y += LINE_HEIGHT;
      let contentSpecified = false;
      if (parseInt(data.storySlides) > 0) { doc.text(`• Story-Slides: ${data.storySlides}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.reelsTiktok) > 0) { doc.text(`• Reels / TikTok Videos: ${data.reelsTiktok}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.feedPosts) > 0) { doc.text(`• Feed-Posts (Bild/Karussell): ${data.feedPosts}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.youtubeVideos) > 0) { doc.text(`• YouTube Video: ${data.youtubeVideos}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT; contentSpecified = true;}
      if (!contentSpecified) { doc.text("Keine spezifischen Inhalte vereinbart.", PAGE_MARGIN + 5, y); y += LINE_HEIGHT;}
      y += LINE_HEIGHT * 0.5;

      y = checkAndAddPage(doc, y);
      doc.text("Zusätzlich wird vereinbart:", PAGE_MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      let additionalY = y;
      let additionalAgreed = false;
      if (data.collabPost) { additionalY = renderCheckbox(doc, true, "Co-Autoren-Post (Instagram Collab)", PAGE_MARGIN + 5, additionalY, additionalY); additionalAgreed = true;}
      if (data.companyPublication) { additionalY = renderCheckbox(doc, true, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen eigenem Kanal", PAGE_MARGIN + 5, additionalY, additionalY); additionalAgreed = true;}
      if (data.noCompanyPublication) { additionalY = renderCheckbox(doc, true, "Keine zusätzliche Veröffentlichung durch das Unternehmen", PAGE_MARGIN + 5, additionalY, additionalY); additionalAgreed = true;}
      if (!additionalAgreed) { doc.text("Keine zusätzlichen Vereinbarungen getroffen.", PAGE_MARGIN + 5, additionalY); additionalY += LINE_HEIGHT;}
      y = additionalY + LINE_HEIGHT; 
      
      // §3 Nutzung für Werbung (Media Buyout)
      tocEntries[2].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
      doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", PAGE_MARGIN, y);
      y += LINE_HEIGHT * 0.8;
      let buyoutY = y;
      if (data.mediaBuyoutYes) {
        buyoutY = renderCheckbox(doc, true, "Ja", PAGE_MARGIN + 5, buyoutY, buyoutY);
        doc.text("– Kanäle:", PAGE_MARGIN + 10, buyoutY); buyoutY += LINE_HEIGHT;
        let channelY = buyoutY;
        if(data.adInstagram) channelY = renderCheckbox(doc, true, "Instagram", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adFacebook) channelY = renderCheckbox(doc, true, "Facebook", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adTiktok) channelY = renderCheckbox(doc, true, "TikTok", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adOther) channelY = renderCheckbox(doc, true, "Sonstiges", PAGE_MARGIN + 15, channelY, channelY);
        buyoutY = channelY + LINE_HEIGHT * 0.5;
        
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text("– Whitelisting (Meta):", PAGE_MARGIN + 10, buyoutY); 
        buyoutY = renderCheckbox(doc, data.whitelisting, "Ja", PAGE_MARGIN + 55, buyoutY - LINE_HEIGHT*0.05 , buyoutY); 
        
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text("– Spark Ad (TikTok):", PAGE_MARGIN + 10, buyoutY); 
        buyoutY = renderCheckbox(doc, data.sparkAd, "Ja", PAGE_MARGIN + 55, buyoutY - LINE_HEIGHT*0.05, buyoutY);
        
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text(`– Nutzungsdauer: ${data.usageDuration || '[Nicht spezifiziert]'}`, PAGE_MARGIN + 10, buyoutY); 
        buyoutY += LINE_HEIGHT;
      } else {
        buyoutY = renderCheckbox(doc, false, "Ja", PAGE_MARGIN + 5, buyoutY, buyoutY); 
        buyoutY = renderCheckbox(doc, true, "Nein. Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung genutzt werden.", PAGE_MARGIN + 5, buyoutY, buyoutY);
      }
      y = buyoutY + LINE_HEIGHT;

      // §4 Rechteübertragung
      tocEntries[3].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§4 Rechteübertragung", y);
      let rightsText = "";
      if (data.mediaBuyoutYes) {
          rightsText = `Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem Unternehmen für die gewählte Nutzungsdauer (${data.usageDuration || 'siehe §3'}) ein einfaches Nutzungsrecht an den erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist ${data.contractType === 'client' ? 'berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.' : 'alleiniger Berechtigter dieser Nutzungsrechte.'} Die Inhalte dürfen technisch angepasst und bearbeitet werden. Die Weitergabe an sonstige Dritte ist nicht gestattet. Nach Ablauf der Nutzungsdauer erlischt das Nutzungsrecht.`;
      } else {
          rightsText = "Da keine Zustimmung zur Nutzung für Werbung erteilt wurde (§3), erfolgt keine erweiterte Rechteübertragung. Die Inhalte verbleiben beim Influencer.";
      }
      const rightsLines = doc.splitTextToSize(rightsText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(rightsLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * rightsLines.length + LINE_HEIGHT; 

      // §5 Produktion & Freigabe
      tocEntries[4].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§5 Produktion & Freigabe", y);
      doc.text(`Briefing: Das Briefing wird vom Unternehmen bis ${data.briefingDate || '[Datum nicht festgelegt]'} bereitgestellt.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur Freigabe bis ${data.scriptDate || '[Datum nicht festgelegt]'} / ${data.scriptTime || '[Uhrzeit nicht festgelegt]'}.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Produktion: Die Produktion erfolgt im Zeitraum ${data.productionStart || '[von nicht festgelegt]'} – ${data.productionEnd || '[bis nicht festgelegt]'}. Produktionsort: ${data.productionLocation || '[Ort nicht festgelegt]'}.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Lieferung: Die Lieferung der finalen Inhalte erfolgt bis ${data.deliveryDate || '[Datum nicht festgelegt]'} / ${data.deliveryTime || '[Uhrzeit nicht festgelegt]'}.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Veröffentlichung: Die Veröffentlichung erfolgt am ${data.publicationDate || '[Datum nicht festgelegt]'}.`, PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      
      // §6 Vergütung
      tocEntries[5].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§6 Vergütung", y);
      doc.text(`Die Nettovergütung beträgt ${data.compensation || '[Betrag nicht festgelegt]'} €.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Das Zahlungsziel beträgt ${data.paymentTerm || '[nicht festgelegt]'}.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      if (data.additionalCompYes) {
        doc.text(`Eine zusätzliche Vergütung ist vereinbart: ${data.additionalCompText || '[Details nicht spezifiziert]'}`, PAGE_MARGIN, y);
      } else {
        doc.text("Eine zusätzliche Vergütung ist nicht vereinbart.", PAGE_MARGIN, y);
      }
      y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;

      // §7 Qualität & Upload
      tocEntries[6].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§7 Qualität & Upload", y);
      const qualityText = "Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive, WeTransfer oder E-Mail (kein Messenger). Dateibenennung: [Unternehmen_Creator_VideoX_VersionY]";
      const qualityLines = doc.splitTextToSize(qualityText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(qualityLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * qualityLines.length + LINE_HEIGHT;

      // §8 Rechte Dritter & Musik
      tocEntries[7].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§8 Rechte Dritter & Musik", y);
      const thirdPartyText = "Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.";
      const thirdPartyLines = doc.splitTextToSize(thirdPartyText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(thirdPartyLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * thirdPartyLines.length + LINE_HEIGHT;

      // §9 Werbekennzeichnung & Exklusivität
      tocEntries[8].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§9 Werbekennzeichnung & Exklusivität", y);
      const adText = 'Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung ("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die entstandenen Schäden.';
      const adLines = doc.splitTextToSize(adText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(adLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * adLines.length + LINE_HEIGHT * 0.5;
      y = checkAndAddPage(doc,y);
      if (data.exclusivity) {
        doc.text(`Exklusivität: ${data.exclusivity}`, PAGE_MARGIN, y);
      } else {
        doc.text("Es wurde keine spezifische Exklusivitätsvereinbarung getroffen.", PAGE_MARGIN, y);
      }
      y += LINE_HEIGHT * 1.5;
      
      // §10 Verbindlichkeit Briefing & Skript
      tocEntries[9].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§10 Verbindlichkeit Briefing & Skript", y);
      const briefingText = "Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig einzuhalten. Bei Verstoß kann das Unternehmen: 1. Nachbesserung verlangen, 2. eine Neuproduktion auf eigene Kosten fordern, 3. bei wiederholtem Verstoß vom Vertrag zurücktreten. Vergütung entfällt bei Nichterfüllung.";
      const briefingLines = doc.splitTextToSize(briefingText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(briefingLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * briefingLines.length + LINE_HEIGHT;

      // §11 Datenschutz & Vertraulichkeit
      tocEntries[10].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§11 Datenschutz & Vertraulichkeit", y);
      const privacyText = "Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das Vertragsende hinaus.";
      const privacyLines = doc.splitTextToSize(privacyText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(privacyLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * privacyLines.length + LINE_HEIGHT;
      
      // §12 Schlussbestimmungen & Zusätzliche Informationen
      tocEntries[11].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§12 Schlussbestimmungen & Zusätzliche Informationen", y);
      const finalClauseText = `Änderungen bedürfen der Schriftform. Gerichtsstand ist ${data.companyCity || '[Stadt nicht festgelegt]'}. Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam.`;
      const finalClauseLines = doc.splitTextToSize(finalClauseText, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
      doc.text(finalClauseLines, PAGE_MARGIN, y);
      y += LINE_HEIGHT * finalClauseLines.length + LINE_HEIGHT;
      
      y = checkAndAddPage(doc,y);
      if (data.extraInformation) {
        y = checkAndAddPage(doc, y, LINE_HEIGHT * 2); 
        doc.setFont("helvetica", "bold");
        doc.text("Zusätzliche Informationen:", PAGE_MARGIN, y);
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const extraInfoLines = doc.splitTextToSize(data.extraInformation, doc.internal.pageSize.getWidth() - 2 * PAGE_MARGIN);
        doc.text(extraInfoLines, PAGE_MARGIN, y);
        y += LINE_HEIGHT * extraInfoLines.length;
      }
      y += LINE_HEIGHT;


      // Unterschriftsfelder hinzufügen
      y = addSignatureFields(doc, data.companyCity || '[Stadt nicht festgelegt]', y);

      // Inhaltsverzeichnis mit korrekten Seitenzahlen neu erstellen
      // Speichere die aktuelle Seite, gehe zu Seite 2, zeichne TOC, dann zurück
      const endPage = doc.internal.getNumberOfPages();
      doc.setPage(2); 
      addTableOfContents(doc, tocEntries); 
      doc.setPage(endPage); // Gehe zurück zur letzten Seite, auf der der Inhalt endete

      // Wasserzeichen hinzufügen
      addWatermark(doc);

      // PDF speichern
      doc.save('influencer-marketing-vertrag-korrigiert.pdf');
      console.log('PDF saved successfully');

      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) successAnimation.classList.remove('hidden');

    } catch (error) {
      console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
      alert('Beim Generieren des PDFs ist ein Fehler aufgetreten: ' + error.message + (error.stack ? `\nStack: ${error.stack}`: ''));
    }
  }

  // Generieren-Button
  const generateButton = document.getElementById('generate-contract');
  if (generateButton) {
    generateButton.addEventListener('click', function() {
      let firstInvalidStep = -1;
      for (let i = 1; i <= (progressSteps.length || 9) ; i++) {
        const stepSection = document.getElementById(`step-${i}`);
        if (stepSection) {
          const requiredFields = stepSection.querySelectorAll('[required]');
          let stepIsValid = true;
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              stepIsValid = false;
            }
          });
          if (!stepIsValid) {
            firstInvalidStep = i;
            break; 
          }
        }
      }

      if (firstInvalidStep !== -1) {
        goToStep(firstInvalidStep);
        markInvalidFieldsInCurrentStep(); 
        showValidationError();
        return; 
      }
      
      console.log('Vertrag wird generiert...');
      try {
        generatePDF();
        // showSuccessAnimation(); // Animation should be shown after successful PDF generation inside generatePDF
      } catch (error) {
        console.error("Fehler bei der PDF-Generierung:", error);
        alert('Bei der Generierung des Vertrags ist ein Fehler aufgetreten: ' + error.message);
      }
    });
  }

  function showSuccessAnimation() {
    const successAnimation = document.getElementById('success-animation');
    if (successAnimation) {
      successAnimation.classList.remove('hidden');
    }
  }

  const downloadButton = document.getElementById('download-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) {
        successAnimation.classList.add('hidden');
      }
    });
  }

  document.querySelectorAll('[required], input, select, textarea').forEach(field => {
    const eventType = (field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT') ? 'change' : 'input';
    field.addEventListener(eventType, function() {
      if (this.hasAttribute('required') && this.value.trim()) {
        this.classList.remove('error');
        this.style.borderColor = '';
      }
      validateCurrentStep();
      updateProgress(); 
    });
  });

  const form = document.querySelector('.db-contact-generator-wrapper');
  if (form && !document.querySelector('.container')) {
    const parentElement = form.parentElement;
    const container = document.createElement('div');
    container.className = 'container'; 
    parentElement.appendChild(container);

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar'; 
    container.appendChild(sidebar);

    const progressBar = document.querySelector('.progress-bar-container'); 
    if (progressBar) {
      sidebar.appendChild(progressBar);
    }

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content'; 
    container.appendChild(mainContent);
    mainContent.appendChild(form);
  }

  // Initialisierung
  goToStep(1); 
});
