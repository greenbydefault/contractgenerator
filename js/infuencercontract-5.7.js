document.addEventListener('DOMContentLoaded', function() {
  // *** jsPDF-Check direkt am Anfang ***
  if (typeof window.jsPDF === 'undefined') {
    alert('WICHTIGER HINWEIS: Die PDF-Bibliothek (jsPDF) konnte nicht geladen werden. Die PDF-Generierung wird nicht funktionieren. Bitte stellen Sie sicher, dass die Bibliothek korrekt eingebunden ist und die Seite neu geladen wird.');
    console.error('jsPDF is not loaded on window. PDF functionality will be disabled.');
    const generateButton = document.getElementById('generate-contract');
    if (generateButton) {
      generateButton.disabled = true;
      generateButton.title = 'PDF-Generierung nicht möglich, da die jsPDF-Bibliothek fehlt.';
      generateButton.style.opacity = '0.5';
      generateButton.style.cursor = 'not-allowed';
    }
  }

  let currentStep = 1;
  let navigationInProgress = false;

  const contractTypeSelect = document.getElementById('contract-type');
  const clientInfoSection = document.getElementById('client-info-section');

  if (contractTypeSelect && clientInfoSection) {
    clientInfoSection.style.display = contractTypeSelect.value === 'client' ? 'block' : 'none';
    contractTypeSelect.addEventListener('change', function() {
      clientInfoSection.style.display = this.value === 'client' ? 'block' : 'none';
      updateProgress();
    });
  }

  // Plattform-Details ein-/ausblenden
  const platformCheckboxes = [
    { checkboxId: 'platform-instagram', detailsId: 'instagram-details' },
    { checkboxId: 'platform-tiktok', detailsId: 'tiktok-details' },
    { checkboxId: 'platform-youtube', detailsId: 'youtube-details' },
    { checkboxId: 'platform-other', detailsId: 'other-details' }
  ];
  platformCheckboxes.forEach(item => {
    const checkbox = document.getElementById(item.checkboxId);
    const details = document.getElementById(item.detailsId);
    if (checkbox && details) {
      details.classList.toggle('hidden', !checkbox.checked); // Initial state
      checkbox.addEventListener('change', function() {
        details.classList.toggle('hidden', !this.checked);
        updateProgress();
      });
    }
  });

  // Media Buyout Optionen
  const mediaBuyoutYes = document.getElementById('media-buyout-yes');
  const mediaBuyoutNo = document.getElementById('media-buyout-no');
  const mediaBuyoutDetails = document.getElementById('media-buyout-details');
  if (mediaBuyoutYes && mediaBuyoutNo && mediaBuyoutDetails) {
    mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked); // Initial state
    mediaBuyoutYes.addEventListener('change', function() {
      mediaBuyoutDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
    mediaBuyoutNo.addEventListener('change', function() {
      mediaBuyoutDetails.classList.add('hidden'); // Always hide if "No" is selected
      updateProgress();
    });
  }

  // Zusätzliche Vergütung
  const additionalYes = document.getElementById('additional-yes');
  const additionalNo = document.getElementById('additional-no');
  const additionalDetails = document.getElementById('additional-comp-details');
  if (additionalYes && additionalNo && additionalDetails) {
    additionalDetails.classList.toggle('hidden', !additionalYes.checked); // Initial state
    additionalYes.addEventListener('change', function() {
      additionalDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
    additionalNo.addEventListener('change', function() {
      additionalDetails.classList.add('hidden'); // Always hide if "No" is selected
      updateProgress();
    });
  }

  const progressSteps = document.querySelectorAll('.progress-step');
  const formSections = document.querySelectorAll('.form-section');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressMessage = document.getElementById('progress-message');

  progressSteps.forEach(step => {
    step.addEventListener('click', function() {
      if (navigationInProgress) return;
      navigationInProgress = true;
      const stepNum = parseInt(this.getAttribute('data-step'));
      if (stepNum === currentStep) {
        navigationInProgress = false;
        return;
      }
      if (stepNum < currentStep) {
        resetErrorsInCurrentStep();
        goToStep(stepNum);
        navigationInProgress = false;
        return;
      }
      let canProceed = true;
      for (let i = currentStep; i < stepNum; i++) {
        const intermediateStepSection = document.getElementById(`step-${i}`);
        if (intermediateStepSection) {
          const requiredFields = intermediateStepSection.querySelectorAll('[required]');
          let currentStepIsValid = true;
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              currentStepIsValid = false;
            }
          });
          if (!currentStepIsValid) {
            canProceed = false;
            goToStep(i);
            markInvalidFieldsInCurrentStep();
            showValidationError(`Bitte fülle alle Pflichtfelder in Schritt ${i} aus, um fortzufahren.`);
            break;
          }
        }
      }
      if (canProceed) {
        resetErrorsInCurrentStep();
        goToStep(stepNum);
      }
      navigationInProgress = false;
    });
  });

  nextButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (navigationInProgress) return;
      navigationInProgress = true;
      const nextStep = parseInt(this.getAttribute('data-next'));
      if (!validateCurrentStep()) {
        markInvalidFieldsInCurrentStep();
        showValidationError(`Bitte fülle alle markierten Pflichtfelder in Schritt ${currentStep} aus.`);
        navigationInProgress = false;
        return;
      }
      resetErrorsInCurrentStep();
      goToStep(nextStep);
      navigationInProgress = false;
    });
  });

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
    const fields = currentSection.querySelectorAll('.form-input-field, [required]');
    fields.forEach(field => {
      field.classList.remove('error', 'shake');
      field.style.borderColor = '';
    });
  }

  function showValidationError(message = 'Bitte fülle alle markierten Pflichtfelder aus.') {
    // Erwägen Sie, dies durch ein benutzerdefiniertes Modal für eine bessere UX zu ersetzen
    alert(message);
  }

  function markInvalidFieldsInCurrentStep() {
    const currentSection = document.getElementById(`step-${currentStep}`);
    if (!currentSection) return;
    const requiredFields = currentSection.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('error', 'shake');
        field.style.borderColor = 'red';
        setTimeout(() => field.classList.remove('shake'), 500);
      } else {
        field.classList.remove('error');
        field.style.borderColor = '';
      }
    });
  }

  function updateButtonState(button, isValid) {
    if (button) {
      button.disabled = !isValid;
      button.classList.toggle('btn-disabled', !isValid);
    }
  }

  function validateCurrentStep() {
    const currentSection = document.getElementById(`step-${currentStep}`);
    if (!currentSection) return true; // Sollte nicht passieren
    const nextButton = currentSection.querySelector('.next-step');
    const requiredFields = currentSection.querySelectorAll('[required]');
    let allValid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        allValid = false;
      }
    });
    // Sicherstellen, dass der "Weiter"-Button existiert, bevor sein Zustand aktualisiert wird
    if (nextButton) {
        updateButtonState(nextButton, allValid);
    }
    return allValid;
  }

  function goToStep(stepNumber) {
    currentStep = stepNumber;
    formSections.forEach(section => section.classList.add('hidden'));
    progressSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.toggle('active', stepNum === currentStep);
      step.classList.toggle('completed', stepNum < currentStep);
    });
    const targetSection = document.getElementById(`step-${stepNumber}`);
    if (targetSection) targetSection.classList.remove('hidden');
    updateProgress();
    // Den neuen aktuellen Schritt validieren, um den "Weiter"-Button zu aktivieren/deaktivieren
    validateCurrentStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    // Fallback, falls progressSteps leer ist
    const totalSteps = progressSteps.length || 9;
    const percentage = totalSteps > 0 ? Math.min(Math.floor(((currentStep - 1) / totalSteps) * 100), 100) : 0;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% ausgefüllt`;
    updateProgressMessage(currentStep);

    // Vorschau aktualisieren, wenn der letzte Schritt erreicht ist
    if (currentStep === totalSteps) {
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
    // Wenn keine Pflichtfelder vorhanden sind, ist der Fortschritt 100%
    if (allRequiredFields.length === 0) return 100;

    let filledRequiredFields = 0;
    allRequiredFields.forEach(field => {
        const section = field.closest('.form-section');
        const sectionStep = section ? parseInt(section.id.split('-')[1]) : 0;
        // Berücksichtige Felder in sichtbaren Abschnitten, bereits abgeschlossenen Schritten oder im letzten Schritt
        const isFinalStep = currentStep === (progressSteps.length || 9);
        if (section && (!section.classList.contains('hidden') || sectionStep < currentStep || isFinalStep)) {
            if ((field.type === 'checkbox' || field.type === 'radio') ? field.checked : field.value.trim()) {
                filledRequiredFields++;
            }
        }
    });
    return Math.floor((filledRequiredFields / allRequiredFields.length) * 100);
  }


  function updatePreview() {
    try {
      const getValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        return el && el.value ? el.value.trim() : defaultValue;
      };
      const isChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
      };

      const setPreviewText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      const setPreviewHTML = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value;
      };

      // Unternehmensdaten
      setPreviewText('preview-company-name', getValue('company-name', '[Name des Unternehmens]'));
      setPreviewText('preview-company-contact', getValue('company-contact', '[Ansprechpartner]'));
      setPreviewText('preview-company-street', getValue('company-street', '[Straße]'));
      setPreviewText('preview-company-number', getValue('company-number', '[Hausnummer]'));
      setPreviewText('preview-company-zip', getValue('company-zip', '[PLZ]'));
      setPreviewText('preview-company-city', getValue('company-city', '[Stadt]'));
      setPreviewText('preview-company-country', getValue('company-country', '[Land]'));

      // Influencer-Daten
      setPreviewText('preview-influencer-name', getValue('influencer-name', '[Name des Influencers]'));
      setPreviewText('preview-influencer-street', getValue('influencer-street', '[Straße]'));
      setPreviewText('preview-influencer-number', getValue('influencer-number', '[Hausnummer]'));
      setPreviewText('preview-influencer-zip', getValue('influencer-zip', '[PLZ]'));
      setPreviewText('preview-influencer-city', getValue('influencer-city', '[Stadt]'));
      setPreviewText('preview-influencer-country', getValue('influencer-country', '[Land]'));

      // Kundendaten (falls zutreffend)
      const isClientContract = getValue('contract-type') === 'client';
      const previewClientSection = document.getElementById('preview-client-section');
      if (previewClientSection) {
        previewClientSection.classList.toggle('hidden', !isClientContract);
        if (isClientContract) {
          setPreviewText('preview-client-name', getValue('client-name', '[Name des Kunden]'));
          setPreviewText('preview-client-street', getValue('client-street', '[Straße Kunde]'));
          setPreviewText('preview-client-number', getValue('client-number', '[Hausnummer Kunde]'));
          setPreviewText('preview-client-zip', getValue('client-zip', '[PLZ Kunde]'));
          setPreviewText('preview-client-city', getValue('client-city', '[Stadt Kunde]'));
          setPreviewText('preview-client-country', getValue('client-country', '[Land Kunde]'));
        }
      }

      // Plattformen
      let platformsHtml = '';
      if (isChecked('platform-instagram')) platformsHtml += `<p>✓ Instagram (Profil: ${getValue('instagram-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-tiktok')) platformsHtml += `<p>✓ TikTok (Profil: ${getValue('tiktok-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-youtube')) platformsHtml += `<p>✓ YouTube (Kanal: ${getValue('youtube-url', '[URL]')})</p>`;
      if (isChecked('platform-other')) platformsHtml += `<p>✓ Sonstiges: ${getValue('other-platform', '[Frei eintragen]')}</p>`;
      setPreviewHTML('preview-platforms', platformsHtml || '<p>Keine Plattformen ausgewählt</p>');

      // Inhaltstypen
      let contentTypesHtml = '';
      const storySlidesVal = getValue('story-slides', '0');
      const reelsTiktokVal = getValue('reels-tiktok', '0');
      const feedPostsVal = getValue('feed-posts', '0');
      const youtubeVideosVal = getValue('youtube-videos', '0');

      if (parseInt(storySlidesVal) > 0) contentTypesHtml += `<li>Story-Slides: ${storySlidesVal}</li>`;
      if (parseInt(reelsTiktokVal) > 0) contentTypesHtml += `<li>Instagram Reels / TikTok Videos: ${reelsTiktokVal}</li>`;
      if (parseInt(feedPostsVal) > 0) contentTypesHtml += `<li>Feed-Posts: ${feedPostsVal}</li>`;
      if (parseInt(youtubeVideosVal) > 0) contentTypesHtml += `<li>YouTube Videos: ${youtubeVideosVal}</li>`;
      setPreviewHTML('preview-content-types', contentTypesHtml || '<li>Keine Inhalte spezifiziert</li>');

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
      
      // Realen Fortschritt aktualisieren
      const realProgress = calculateRealProgress();
      if (progressFill) progressFill.style.width = `${realProgress}%`;
      if (progressText) progressText.textContent = `${realProgress}% ausgefüllt`;

    } catch (error) {
      console.error("Fehler bei der Aktualisierung der Vorschau:", error);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''; // Leeren String zurückgeben, wenn kein Datum vorhanden ist
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) { // Ungültiges Datum prüfen
            return dateString; // Originalstring zurückgeben, wenn Datum ungültig
        }
        return date.toLocaleDateString('de-DE'); // Deutsches Datumsformat
    } catch (e) {
        return dateString; // Originalstring bei Fehler zurückgeben
    }
  }
  
  // PDF Konstanten
  const PAGE_MARGIN = 20; // Seitenrand in mm
  const CONTENT_START_Y = 30; // Start Y-Position für Inhalt in mm
  const PAGE_HEIGHT = 297; // A4 Höhe in mm
  const PAGE_WIDTH = 210; // A4 Breite in mm
  const LINE_HEIGHT = 6; // Zeilenhöhe in mm
  const PARAGRAPH_SPACING = 4; // Abstand zwischen Absätzen in mm

  // Funktion zum Prüfen und Hinzufügen einer neuen Seite
  function checkAndAddPage(doc, currentY, spaceNeeded = LINE_HEIGHT * 2) {
      // Prüfen, ob der benötigte Platz den unteren Seitenrand überschreitet
      if (currentY + spaceNeeded > PAGE_HEIGHT - PAGE_MARGIN) { 
          doc.addPage();
          return CONTENT_START_Y; // Y-Position auf der neuen Seite zurücksetzen
      }
      return currentY; // Aktuelle Y-Position zurückgeben
  }

  // Funktion zum Hinzufügen eines Wasserzeichens
  function addWatermark(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Kleine Schriftgröße für Wasserzeichen
    doc.setTextColor(150); // Graue Farbe

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i); // Zur jeweiligen Seite wechseln
        const watermarkText = 'Created with creatorjobs.com';
        const watermarkTextWidth = doc.getTextWidth(watermarkText);
        // Wasserzeichen unten rechts platzieren
        doc.text(watermarkText, PAGE_WIDTH - watermarkTextWidth - 10, PAGE_HEIGHT - 10);
    }
    doc.setTextColor(0); // Farbe zurücksetzen
    doc.setFont('helvetica', 'normal'); // Schriftart zurücksetzen
  }

  // Funktion zum Hinzufügen eines Paragraphentitels
  function addParagraphTitle(doc, title, y) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12); // Schriftgröße für Titel
      doc.text(title, PAGE_MARGIN, y);
      doc.setFont("helvetica", "normal"); // Zurück zur normalen Schriftart
      doc.setFontSize(10); // Zurück zur normalen Schriftgröße
      return y + LINE_HEIGHT + PARAGRAPH_SPACING; // Neue Y-Position nach Titel und Abstand
  }

  // Funktion zum Hinzufügen des Inhaltsverzeichnisses - MODIFIZIERT: Fügt am Ende keine Seite hinzu
  function addTableOfContents(doc, tocEntries) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      let y = CONTENT_START_Y;
      doc.text('Inhaltsverzeichnis', PAGE_WIDTH / 2, y, { align: 'center' });
      y += LINE_HEIGHT * 2; // Abstand nach der Überschrift
      
      doc.setFontSize(10);
      doc.setLineWidth(0.1); // Dünne Linie für Punkte (optional)

      tocEntries.forEach(para => {
          y = checkAndAddPage(doc, y, LINE_HEIGHT); // Platz für eine Zeile prüfen
          
          const numberWidth = doc.getTextWidth(para.num) + 3; // Breite der Nummer + kleiner Abstand
          doc.setFont("helvetica", "bold");
          doc.text(para.num, PAGE_MARGIN, y + 0.2, { baseline: 'top' }); // Nummer, leicht nach unten für bessere Ausrichtung
          doc.setFont("helvetica", "normal");

          // Titelbreite berechnen, um Platz für Seitenzahl zu lassen
          const titleWidth = PAGE_WIDTH - (PAGE_MARGIN * 2) - numberWidth - 20; // 20 für Seitenzahl und Punkte
          const titleLines = doc.splitTextToSize(para.title, titleWidth);
          doc.text(titleLines, PAGE_MARGIN + numberWidth, y, { baseline: 'top' });
          
          // Seitenzahl, '-' wenn Seite 0 (z.B. wenn nicht gesetzt)
          const pageNumStr = para.page > 0 ? para.page.toString() : "-"; 
          doc.setFont("helvetica", "normal"); // Sicherstellen, dass die Schrift normal ist
          doc.text(pageNumStr, PAGE_WIDTH - PAGE_MARGIN - doc.getTextWidth(pageNumStr), y, { baseline: 'top' });

          y += (LINE_HEIGHT * titleLines.length) + (PARAGRAPH_SPACING / 2); // Y für nächsten Eintrag
      });
      // ENTFERNT: doc.addPage(); // Fügt keine neue Seite nach dem ToC hinzu
  }

  // Funktion zum Hinzufügen der Titelseite
  function addCoverPage(doc, data) {
      let y = 70; // Start Y-Position für Titelseite
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text('INFLUENCER-MARKETING-VERTRAG', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 20;
      doc.setFontSize(14);
      doc.text('Vertragspartner', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 25;

      doc.setFontSize(11); // Normale Schriftgröße für Details
      doc.setFont("helvetica", "bold");
      doc.text('Unternehmen (Auftraggeber):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${data.companyName}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Vertreten durch: ${data.companyContact}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Straße: ${data.companyStreet} Nr.: ${data.companyNumber}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`PLZ: ${data.companyZip}, Stadt: ${data.companyCity}, Land: ${data.companyCountry}`, PAGE_MARGIN + 5, y);
      y += LINE_HEIGHT * 2.5; // Größerer Abstand

      doc.setFont("helvetica", "bold");
      doc.text('Influencer (Creator):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${data.influencerName}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Straße: ${data.influencerStreet} Nr.: ${data.influencerNumber}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`PLZ: ${data.influencerZip}, Stadt: ${data.influencerCity}, Land: ${data.influencerCountry}`, PAGE_MARGIN + 5, y);
      
      doc.addPage(); // Neue Seite nach der Titelseite hinzufügen
      return CONTENT_START_Y; // Y-Position für die nächste Seite zurückgeben
  }

  // Funktion zum Hinzufügen der Unterschriftsfelder
  function addSignatureFields(doc, city, y) {
      const signatureBlockHeight = LINE_HEIGHT * 7; // Geschätzte Höhe des Unterschriftsblocks
      // Prüfen, ob genügend Platz vorhanden ist oder auf neue Seite verschieben
      if (y > PAGE_HEIGHT - PAGE_MARGIN - signatureBlockHeight) { 
          doc.addPage();
          y = CONTENT_START_Y;
      } else if (y < PAGE_HEIGHT - 90) { // Wenn noch viel Platz ist, nach unten schieben
        y = PAGE_HEIGHT - 90; // Feste Position vom unteren Rand
      }

      const today = new Date();
      const formattedDate = today.toLocaleDateString('de-DE');
      const leftColumnX = PAGE_MARGIN;
      const rightColumnX = PAGE_WIDTH / 2 + 10; // Rechte Spalte
      const signatureLineWidth = 70; // Breite der Unterschriftslinie

      doc.setFontSize(10);
      doc.text(`Ort: ${city}`, leftColumnX, y);
      doc.text(`Datum: ${formattedDate}`, leftColumnX, y + LINE_HEIGHT);
      doc.setLineWidth(0.3); // Linienstärke für Unterschrift
      doc.line(leftColumnX, y + LINE_HEIGHT * 2.5, leftColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); // Linie
      doc.text('(Unterschrift Unternehmen)', leftColumnX, y + LINE_HEIGHT * 3.5);

      doc.text("Ort:________________________", rightColumnX, y); // Platzhalter für Ort
      doc.text("Datum:_______________________", rightColumnX, y + LINE_HEIGHT); // Platzhalter für Datum
      doc.line(rightColumnX, y + LINE_HEIGHT * 2.5, rightColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); // Linie
      doc.text('(Unterschrift Influencer)', rightColumnX, y + LINE_HEIGHT * 3.5);
      
      return y + LINE_HEIGHT * 4; // Y-Position nach den Unterschriften
  }

  // Funktion zum Rendern einer Checkbox mit Text
  function renderCheckbox(doc, isChecked, text, x, yN /* yN ist currentYVal */, currentYVal) {
      let currentY = currentYVal; // Aktuelle Y-Position übernehmen
      const boxSize = 3.5; // Größe der Checkbox in mm
      const textXOffset = boxSize + 2; // Abstand zwischen Checkbox und Text
      // Maximale Breite für den Text berechnen
      const textMaxWidth = PAGE_WIDTH - x - textXOffset - PAGE_MARGIN;
      
      // Text ggf. umbrechen
      const textLines = doc.splitTextToSize(text, textMaxWidth);
      const textBlockHeight = textLines.length * LINE_HEIGHT * 0.9; // Höhe des Textblocks (leicht reduziert für engere Zeilen)
      // Benötigte Höhe für Checkbox und Text
      const neededHeight = Math.max(boxSize, textBlockHeight) + PARAGRAPH_SPACING / 2;

      currentY = checkAndAddPage(doc, currentY, neededHeight); // Seite prüfen und ggf. hinzufügen

      doc.setLineWidth(0.2); // Dünne Linie für Checkbox-Rahmen
      const boxTopY = currentY; // Y-Position der Oberkante der Box
      doc.rect(x, boxTopY, boxSize, boxSize); // Checkbox zeichnen
      
      if (isChecked) {
          doc.setFont("zapfdingbats"); // Schriftart für Häkchen
          // Häkchen ('4' in ZapfDingbats) zentriert in der Box platzieren
          doc.text("4", x + boxSize/2 - doc.getTextWidth("4")/2 , boxTopY + boxSize/2 + 1 /* leichte Anpassung für vertikale Zentrierung */); 
          doc.setFont("helvetica"); // Zurück zur Standardschriftart
      }
      
      // Text neben der Checkbox platzieren
      doc.text(textLines, x + textXOffset, currentY, { baseline: 'top' }); 
      return currentY + textBlockHeight + PARAGRAPH_SPACING / 2; // Neue Y-Position nach der Checkbox
  }


  function generatePDF() {
    console.log('Starting PDF generation');
    try {
      // Sicherstellen, dass jsPDF geladen ist
      if (typeof window.jsPDF === 'undefined') { 
        alert('Die PDF-Bibliothek (jsPDF) konnte nicht geladen werden. Bitte stellen Sie sicher, dass die Bibliothek korrekt eingebunden ist und versuchen Sie es erneut.');
        console.error('jsPDF is not loaded on window');
        return;
      }
      const PDFCreator = window.jsPDF; // jsPDF Konstruktor
      const doc = new PDFCreator({unit: 'mm', format: 'a4'}); // Neues PDF-Dokument erstellen
      
      let tocEntries = []; // Array für Inhaltsverzeichnis-Einträge
      let y = CONTENT_START_Y; // Initiale Y-Position für den Inhalt

      // Hilfsfunktion zum Abrufen von Werten aus Formularfeldern
      const getValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        if (el && el.type === 'radio') { // Spezielle Behandlung für Radio-Buttons
            const radioGroup = document.querySelectorAll(`input[name="${el.name}"]:checked`);
            return radioGroup.length > 0 ? radioGroup[0].value : defaultValue;
        }
        return el && el.value ? el.value.trim() : defaultValue;
      };
      // Hilfsfunktion zum Prüfen, ob eine Checkbox ausgewählt ist
      const isChecked = (id) => document.getElementById(id) ? document.getElementById(id).checked : false;
      
      // Hilfsfunktion zum Abrufen des Werts eines ausgewählten Radio-Buttons anhand des Namens
      const getSelectedRadioValue = (name, defaultValue = '') => {
        const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
        if (selectedRadio) {
            // Spezifische Logik für Dauer und Zahlungsziel basierend auf der ID
            if (selectedRadio.id.startsWith('duration-')) { 
                const val = selectedRadio.id.split('-')[1];
                if (val === 'unlimited') return 'Unbegrenzt';
                return `${val} Monate`;
            }
            if (selectedRadio.id.startsWith('term-')) { 
                return `${selectedRadio.id.split('-')[1]} Tage`;
            }
            return selectedRadio.value || defaultValue; // Fallback auf den Wert des Radio-Buttons
        }
        return defaultValue;
      };

      // Daten aus dem Formular sammeln
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
        adOtherText: getValue('ad-other-text', '[nicht spezifiziert]'), // Text für sonstige Ad-Plattform
        whitelisting: isChecked('whitelisting'),
        sparkAd: isChecked('spark-ad'),
        usageDuration: getSelectedRadioValue('usage-duration', '[Dauer nicht festgelegt]'), 
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
      
      // Titelseite hinzufügen und Y-Position für die nächste Seite erhalten
      y = addCoverPage(doc, data); // Deckblatt auf Seite 1, fügt Seite 2 hinzu. y ist CONTENT_START_Y für Seite 2.
      
      // Einträge für das Inhaltsverzeichnis definieren (Seitenzahlen werden später aktualisiert)
      tocEntries = [
            { num: "§1", title: "Vertragsgegenstand", page: 0 },
            { num: "§2", title: "Plattformen & Veröffentlichung", page: 0 },
            { num: "§3", title: "Nutzung für Werbung (Media Buyout)", page: 0 },
            { num: "§4", title: "Rechteübertragung", page: 0 },
            { num: "§5", title: "Produktion, Freigabe & Exklusivität", page: 0 },
            { num: "§6", title: "Vergütung", page: 0 },
            { num: "§7", title: "Qualität & Upload", page: 0 },
            { num: "§8", title: "Rechte Dritter & Musik", page: 0 },
            { num: "§9", title: "Werbekennzeichnung", page: 0 },
            { num: "§10", title: "Verbindlichkeit Briefing & Skript", page: 0 },
            { num: "§11", title: "Datenschutz & Vertraulichkeit", page: 0 },
            { num: "§12", title: "Schlussbestimmungen & Zus. Infos", page: 0 }
      ];

      // Alle Inhalte hinzufügen und Seitenzahlen für ToC sammeln
      // §1 Vertragsgegenstand
      tocEntries[0].page = doc.internal.getNumberOfPages(); // Aktuelle Seite für ToC speichern
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§1 Vertragsgegenstand", y);
      const p1Text = "Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.";
      const p1Lines = doc.splitTextToSize(p1Text, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(p1Lines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * p1Lines.length + PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      if (data.contractType === 'client') {
        const clientDetails = `Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden: ${data.clientName || '[Kundenname fehlt]'} (${data.clientStreet || '[Straße fehlt]'} ${data.clientNumber || '[Nr. fehlt]'}, ${data.clientZip || '[PLZ fehlt]'} ${data.clientCity || '[Stadt fehlt]'}, ${data.clientCountry || '[Land fehlt]'}). Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.`;
        const clientLines = doc.splitTextToSize(clientDetails, PAGE_WIDTH - 2 * PAGE_MARGIN);
        doc.text(clientLines, PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT * clientLines.length;
      } else {
        doc.text("Das Unternehmen handelt im eigenen Namen und auf eigene Rechnung.", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
      }
      y += PARAGRAPH_SPACING * 2; 

      // §2 Plattformen & Veröffentlichung
      tocEntries[1].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
      doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let platformY = y; 
      const platformIndent = PAGE_MARGIN + 5; // Einrückung für Plattform-Checkboxen
      if (data.instagramSelected) platformY = renderCheckbox(doc, true, `Instagram - Profil: ${data.instagramUsername || '[nicht angegeben]'}`, platformIndent, platformY, platformY);
      if (data.tiktokSelected)    platformY = renderCheckbox(doc, true, `TikTok - Profil: ${data.tiktokUsername || '[nicht angegeben]'}`, platformIndent, platformY, platformY);
      if (data.youtubeSelected)   platformY = renderCheckbox(doc, true, `YouTube - Kanal: ${data.youtubeUrl || '[nicht angegeben]'}`, platformIndent, platformY, platformY);
      if (data.otherSelected)     platformY = renderCheckbox(doc, true, `Sonstiges: ${data.otherPlatform || '[nicht angegeben]'}`, platformIndent, platformY, platformY);
      if (!data.instagramSelected && !data.tiktokSelected && !data.youtubeSelected && !data.otherSelected) {
          doc.text("Keine Plattformen ausgewählt.", platformIndent, platformY, {baseline: 'top'});
          platformY += LINE_HEIGHT;
      }
      y = platformY + PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let contentSpecified = false;
      const itemIndent = PAGE_MARGIN + 5; // Einrückung für Inhaltstypen
      if (parseInt(data.storySlides) > 0) { doc.text(`• Story-Slides: ${data.storySlides}`, itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.reelsTiktok) > 0) { doc.text(`• Reels / TikTok Videos: ${data.reelsTiktok}`, itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.feedPosts) > 0) { doc.text(`• Feed-Posts (Bild/Karussell): ${data.feedPosts}`, itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT; contentSpecified = true;}
      if (parseInt(data.youtubeVideos) > 0) { doc.text(`• YouTube Video: ${data.youtubeVideos}`, itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT; contentSpecified = true;}
      if (!contentSpecified) { doc.text("Keine spezifischen Inhalte vereinbart.", itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT;}
      y += PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      doc.text("Zusätzlich wird vereinbart:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let additionalY = y;
      let additionalAgreed = false;
      const additionalIndent = PAGE_MARGIN + 5; // Einrückung für zusätzliche Vereinbarungen
      if (data.collabPost) { additionalY = renderCheckbox(doc, true, "Co-Autoren-Post (Instagram Collab)", additionalIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.companyPublication) { additionalY = renderCheckbox(doc, true, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen eigenem Kanal", additionalIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.noCompanyPublication) { additionalY = renderCheckbox(doc, true, "Keine zusätzliche Veröffentlichung durch das Unternehmen", additionalIndent, additionalY, additionalY); additionalAgreed = true;}
      if (!additionalAgreed) { doc.text("Keine zusätzlichen Vereinbarungen getroffen.", additionalIndent, additionalY, {baseline: 'top'}); additionalY += LINE_HEIGHT;}
      y = additionalY + PARAGRAPH_SPACING * 2; 
      
      // §3 Nutzung für Werbung (Media Buyout)
      tocEntries[2].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
      doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let buyoutY = y;
      const buyoutItemIndent = PAGE_MARGIN + 5; // Einrückung für "Ja"/"Nein"
      const subOptionIndent = PAGE_MARGIN + 10; // Einrückung für Unteroptionen wie Kanäle, Whitelisting
      const channelIndent = PAGE_MARGIN + 15; // Einrückung für spezifische Kanäle

      if (data.mediaBuyoutYes) {
        buyoutY = renderCheckbox(doc, true, "Ja", buyoutItemIndent, buyoutY, buyoutY);
        buyoutY = checkAndAddPage(doc, buyoutY); 
        doc.text("– Kanäle:", subOptionIndent, buyoutY, {baseline: 'top'}); buyoutY += LINE_HEIGHT;
        let channelY = buyoutY; 
        if(data.adInstagram) channelY = renderCheckbox(doc, true, "Instagram", channelIndent, channelY, channelY);
        if(data.adFacebook) channelY = renderCheckbox(doc, true, "Facebook", channelIndent, channelY, channelY);
        if(data.adTiktok) channelY = renderCheckbox(doc, true, "TikTok", channelIndent, channelY, channelY);
        if(data.adOther) channelY = renderCheckbox(doc, true, `Sonstiges: ${data.adOtherText}`, channelIndent, channelY, channelY); 
        buyoutY = channelY; 
        
        // *** HIER SIND DIE ANGEPASSTEN CHECKS ***
        buyoutY = renderCheckbox(doc, data.whitelisting, "Whitelisting (Meta)", subOptionIndent, buyoutY, buyoutY);
        buyoutY = renderCheckbox(doc, data.sparkAd, "Spark Ad (TikTok)", subOptionIndent, buyoutY, buyoutY);
        // *****************************************

        buyoutY = checkAndAddPage(doc, buyoutY); // Sicherstellen, dass genug Platz ist
        doc.text(`– Nutzungsdauer: ${data.usageDuration || '[Nicht spezifiziert]'}`, subOptionIndent, buyoutY, {baseline: 'top'}); 
        buyoutY += LINE_HEIGHT;
      } else {
        buyoutY = renderCheckbox(doc, false, "Ja", buyoutItemIndent, buyoutY, buyoutY); // "Ja" ist nicht ausgewählt
        buyoutY = renderCheckbox(doc, true, "Nein. Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung genutzt werden.", buyoutItemIndent, buyoutY, buyoutY);
      }
      y = buyoutY + PARAGRAPH_SPACING * 2;

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
      const rightsLines = doc.splitTextToSize(rightsText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(rightsLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * rightsLines.length + PARAGRAPH_SPACING * 2; 

      // §5 Produktion, Freigabe & Exklusivität
      tocEntries[4].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§5 Produktion, Freigabe & Exklusivität", y);
      doc.text(`Briefing: Das Briefing wird vom Unternehmen bis ${data.briefingDate || '[Datum nicht festgelegt]'} bereitgestellt.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur Freigabe bis ${data.scriptDate || '[Datum nicht festgelegt]'} / ${data.scriptTime || '[Uhrzeit nicht festgelegt]'}.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Produktion: Die Produktion erfolgt im Zeitraum ${data.productionStart || '[von nicht festgelegt]'} – ${data.productionEnd || '[bis nicht festgelegt]'}. Produktionsort: ${data.productionLocation || '[Ort nicht festgelegt]'}.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Lieferung: Die Lieferung der finalen Inhalte erfolgt bis ${data.deliveryDate || '[Datum nicht festgelegt]'} / ${data.deliveryTime || '[Uhrzeit nicht festgelegt]'}.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Veröffentlichung: Die Veröffentlichung erfolgt am ${data.publicationDate || '[Datum nicht festgelegt]'}.`, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT; 
      y = checkAndAddPage(doc,y);
      if (data.exclusivity) {
        doc.setFont("helvetica", "bold"); 
        doc.text("Exklusivität:", PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const exclusivityLines = doc.splitTextToSize(data.exclusivity, PAGE_WIDTH - 2 * PAGE_MARGIN - 5); // -5 für Einrückung
        doc.text(exclusivityLines, PAGE_MARGIN + 5, y, {baseline: 'top'});
        y += LINE_HEIGHT * exclusivityLines.length;
      } else {
        doc.text("Es wurde keine spezifische Exklusivitätsvereinbarung getroffen.", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
      }
      y += PARAGRAPH_SPACING * 2;
      
      // §6 Vergütung
      tocEntries[5].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§6 Vergütung", y);
      doc.text(`Die Nettovergütung beträgt ${data.compensation || '[Betrag nicht festgelegt]'} €.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text(`Das Zahlungsziel beträgt ${data.paymentTerm || '[nicht festgelegt]'}.`, PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      if (data.additionalCompYes) {
        doc.text(`Eine zusätzliche Vergütung ist vereinbart: ${data.additionalCompText || '[Details nicht spezifiziert]'}`, PAGE_MARGIN, y, {baseline: 'top'});
      } else {
        doc.text("Eine zusätzliche Vergütung ist nicht vereinbart.", PAGE_MARGIN, y, {baseline: 'top'});
      }
      y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", PAGE_MARGIN, y, {baseline: 'top'});
      y += PARAGRAPH_SPACING * 2;

      // §7 Qualität & Upload
      tocEntries[6].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§7 Qualität & Upload", y);
      const qualityText = "Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive, WeTransfer oder E-Mail (kein Messenger). Dateibenennung: [Unternehmen_Creator_VideoX_VersionY]";
      const qualityLines = doc.splitTextToSize(qualityText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(qualityLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * qualityLines.length + PARAGRAPH_SPACING * 2;

      // §8 Rechte Dritter & Musik
      tocEntries[7].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§8 Rechte Dritter & Musik", y);
      const thirdPartyText = "Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.";
      const thirdPartyLines = doc.splitTextToSize(thirdPartyText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(thirdPartyLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * thirdPartyLines.length + PARAGRAPH_SPACING * 2;

      // §9 Werbekennzeichnung
      tocEntries[8].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§9 Werbekennzeichnung", y);
      const adText = 'Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung ("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die entstandenen Schäden.';
      const adLines = doc.splitTextToSize(adText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(adLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * adLines.length + PARAGRAPH_SPACING * 2;
      
      // §10 Verbindlichkeit Briefing & Skript
      tocEntries[9].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§10 Verbindlichkeit Briefing & Skript", y);
      const briefingText = "Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig einzuhalten. Bei Verstoß kann das Unternehmen: 1. Nachbesserung verlangen, 2. eine Neuproduktion auf eigene Kosten fordern, 3. bei wiederholtem Verstoß vom Vertrag zurücktreten. Vergütung entfällt bei Nichterfüllung.";
      const briefingLines = doc.splitTextToSize(briefingText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(briefingLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * briefingLines.length + PARAGRAPH_SPACING * 2;

      // §11 Datenschutz & Vertraulichkeit
      tocEntries[10].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§11 Datenschutz & Vertraulichkeit", y);
      const privacyText = "Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das Vertragsende hinaus.";
      const privacyLines = doc.splitTextToSize(privacyText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(privacyLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * privacyLines.length + PARAGRAPH_SPACING * 2;
      
      // §12 Schlussbestimmungen & Zusätzliche Informationen
      tocEntries[11].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§12 Schlussbestimmungen & Zusätzliche Informationen", y);
      const finalClauseText = `Änderungen bedürfen der Schriftform. Gerichtsstand ist ${data.companyCity || '[Stadt nicht festgelegt]'}. Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam.`;
      const finalClauseLines = doc.splitTextToSize(finalClauseText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(finalClauseLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * finalClauseLines.length + PARAGRAPH_SPACING;
      
      y = checkAndAddPage(doc,y); 
      if (data.extraInformation) {
        y = checkAndAddPage(doc, y, LINE_HEIGHT * 2); // Platz für Titel + erste Zeile Text
        doc.setFont("helvetica", "bold");
        doc.text("Zusätzliche Informationen:", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const extraInfoLines = doc.splitTextToSize(data.extraInformation, PAGE_WIDTH - 2 * PAGE_MARGIN);
        doc.text(extraInfoLines, PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT * extraInfoLines.length;
      }
      y += PARAGRAPH_SPACING * 2;

      // Unterschriftsfelder hinzufügen
      y = addSignatureFields(doc, data.companyCity || '[Stadt nicht festgelegt]', y);

      // KORREKTUR: Inhaltsverzeichnis Logik
      // 1. Seitenzahlen in tocEntries anpassen, da ToC auf Seite 2 eingefügt wird
      tocEntries.forEach(entry => {
        if (entry.page > 0) { // Nur gültige Seitenzahlen anpassen (nicht 0)
            entry.page += 1; // Da das ToC selbst eine Seite einnimmt (Seite 2)
        }
      });

      // 2. Neue Seite für ToC an Position 2 einfügen
      const tocTargetPage = 2;
      const totalPagesAfterContent = doc.internal.getNumberOfPages();
      doc.addPage(); // Fügt eine Seite am Ende hinzu
      // Verschiebt die neue (jetzt letzte) Seite an die Position 2
      doc.movePage(doc.internal.getNumberOfPages(), tocTargetPage); 

      // 3. Gehe zu Seite 2 und zeichne das ToC
      doc.setPage(tocTargetPage);
      addTableOfContents(doc, tocEntries); // Diese Funktion fügt KEINE Seite mehr hinzu

      // 4. Gehe zur letzten Seite des Dokuments für den Wasserzeichen-Loop
      // Die Gesamtseitenzahl ist jetzt totalPagesAfterContent + 1 (durch das Hinzufügen der ToC-Seite)
      doc.setPage(totalPagesAfterContent + 1); 
      addWatermark(doc); // Wasserzeichen auf allen Seiten hinzufügen

      // PDF speichern
      doc.save('influencer-marketing-vertrag-final.pdf');
      console.log('PDF saved successfully');

      // Erfolgsanimation anzeigen
      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) successAnimation.classList.remove('hidden');

    } catch (error) {
      console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
      alert('Beim Generieren des PDFs ist ein Fehler aufgetreten: ' + error.message + (error.stack ? `\nStack: ${error.stack}`: ''));
    }
  }

  // Event Listener für den "Vertrag generieren"-Button
  const generateButton = document.getElementById('generate-contract');
  if (generateButton) {
    generateButton.addEventListener('click', function() {
      // Erneuter jsPDF-Check vor der Generierung
      if (typeof window.jsPDF === 'undefined') {
          alert('Die PDF-Bibliothek (jsPDF) ist nicht geladen. PDF kann nicht generiert werden. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.');
          return;
      }
      // Validierung aller Schritte vor der Generierung
      let firstInvalidStep = -1;
      const totalStepsToValidate = progressSteps.length || 9; // Fallback
      for (let i = 1; i <= totalStepsToValidate ; i++) { // Validierung von Schritt 1 bis zum letzten Schritt
        const stepSection = document.getElementById(`step-${i}`);
        if (stepSection) { // Nur prüfen, wenn der Abschnitt existiert
          const requiredFields = stepSection.querySelectorAll('[required]');
          let stepIsValid = true;
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              stepIsValid = false;
            }
          });
          if (!stepIsValid) {
            firstInvalidStep = i;
            break; // Stoppe beim ersten ungültigen Schritt
          }
        }
      }

      if (firstInvalidStep !== -1) {
        goToStep(firstInvalidStep); // Zum ersten ungültigen Schritt navigieren
        markInvalidFieldsInCurrentStep(); // Ungültige Felder markieren
        showValidationError(`Bitte fülle alle Pflichtfelder in Schritt ${firstInvalidStep} aus, um den Vertrag zu generieren.`);
        return; // Generierung abbrechen
      }

      console.log('Vertrag wird generiert...');
      try {
        generatePDF();
      } catch (error) {
        console.error("Fehler bei der PDF-Generierung:", error);
        alert('Bei der Generierung des Vertrags ist ein Fehler aufgetreten: ' + error.message);
      }
    });
  }

  // Funktion zum Anzeigen der Erfolgsanimation (Beispiel)
  function showSuccessAnimation() {
    const successAnimation = document.getElementById('success-animation');
    if (successAnimation) {
      successAnimation.classList.remove('hidden');
      // Ggf. nach einiger Zeit wieder ausblenden
      // setTimeout(() => { successAnimation.classList.add('hidden'); }, 5000);
    }
  }

  // Event Listener für den Download-Button (falls vorhanden, um Animation zu schließen)
  const downloadButton = document.getElementById('download-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) {
        successAnimation.classList.add('hidden'); // Animation ausblenden
      }
    });
  }
  
  // Event Listener für Formularfelder zur Validierung und Fortschrittsaktualisierung
  document.querySelectorAll('[required], input, select, textarea').forEach(field => {
    // Passenden Event-Typ wählen (change für Checkboxen/Radios/Selects, input für Textfelder)
    const eventType = (field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT') ? 'change' : 'input';
    field.addEventListener(eventType, function() {
      // Fehlerstyling entfernen, wenn ein Pflichtfeld ausgefüllt wird
      if (this.hasAttribute('required') && this.value.trim()) {
        this.classList.remove('error');
        this.style.borderColor = ''; // Standard-Randfarbe wiederherstellen
      }
      validateCurrentStep(); // Aktuellen Schritt validieren (aktiviert/deaktiviert "Weiter"-Button)
      updateProgress(); // Fortschrittsbalken aktualisieren
    });
  });

  // Dynamisches Hinzufügen von Container- und Sidebar-Elementen, falls nicht vorhanden
  // Dies dient dazu, die Struktur für Sidebar (mit Fortschrittsbalken) und Hauptinhalt (Formular) zu erstellen
  const form = document.querySelector('.db-contact-generator-wrapper');
  if (form && !document.querySelector('.container')) { // Nur ausführen, wenn Formular existiert und Container noch nicht
    const parentElement = form.parentElement;
    const container = document.createElement('div');
    container.className = 'container'; // Hauptcontainer
    parentElement.appendChild(container);

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar'; // Sidebar für Fortschrittsanzeige
    container.appendChild(sidebar);

    const progressBar = document.querySelector('.progress-bar-container'); // Vorhandenen Fortschrittsbalken finden
    if (progressBar) {
      sidebar.appendChild(progressBar); // Fortschrittsbalken in die Sidebar verschieben
    }

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content'; // Hauptinhaltsbereich
    container.appendChild(mainContent);
    mainContent.appendChild(form); // Formular in den Hauptinhalt verschieben
  }

  // Initialisierung: Zum ersten Schritt gehen und Fortschritt aktualisieren
  goToStep(1); 
});
