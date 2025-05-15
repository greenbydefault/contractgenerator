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
      details.classList.toggle('hidden', !checkbox.checked);
      checkbox.addEventListener('change', function() {
        details.classList.toggle('hidden', !this.checked);
        updateProgress();
      });
    }
  });

  const mediaBuyoutYes = document.getElementById('media-buyout-yes');
  const mediaBuyoutNo = document.getElementById('media-buyout-no');
  const mediaBuyoutDetails = document.getElementById('media-buyout-details');
  if (mediaBuyoutYes && mediaBuyoutNo && mediaBuyoutDetails) {
    mediaBuyoutDetails.classList.toggle('hidden', !mediaBuyoutYes.checked);
    mediaBuyoutYes.addEventListener('change', function() {
      mediaBuyoutDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
    mediaBuyoutNo.addEventListener('change', function() {
      mediaBuyoutDetails.classList.add('hidden');
      updateProgress();
    });
  }

  const additionalYes = document.getElementById('additional-yes');
  const additionalNo = document.getElementById('additional-no');
  const additionalDetails = document.getElementById('additional-comp-details');
  if (additionalYes && additionalNo && additionalDetails) {
    additionalDetails.classList.toggle('hidden', !additionalYes.checked);
    additionalYes.addEventListener('change', function() {
      additionalDetails.classList.toggle('hidden', !this.checked);
      updateProgress();
    });
    additionalNo.addEventListener('change', function() {
      additionalDetails.classList.add('hidden');
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
    if (!currentSection) return true;
    const nextButton = currentSection.querySelector('.next-step');
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
    formSections.forEach(section => section.classList.add('hidden'));
    progressSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.toggle('active', stepNum === currentStep);
      step.classList.toggle('completed', stepNum < currentStep);
    });
    const targetSection = document.getElementById(`step-${stepNumber}`);
    if (targetSection) targetSection.classList.remove('hidden');
    updateProgress();
    validateCurrentStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    const totalSteps = progressSteps.length || 9;
    const percentage = totalSteps > 0 ? Math.min(Math.floor(((currentStep - 1) / totalSteps) * 100), 100) : 0;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% ausgefüllt`;
    updateProgressMessage(currentStep);

    if (currentStep === totalSteps) { 
        updatePreview();
    }
  }

  function updateProgressMessage(stepNumber) {
    if (!progressMessage) return;
    const messages = [
      "Lass uns anfangen! Wähle den Vertragstyp.",
      "Gut gemacht! Wer sind die Vertragspartner?",
      "Perfekt! Auf welchen Plattformen wird veröffentlicht?",
      "Super! Welche Inhalte sollen erstellt werden?",
      "Prima! Gibt es zusätzliche Vereinbarungen?",
      "Sehr gut! Klären wir die Rechte und Nutzung (Media Buyout).",
      "Fast geschafft! Wie sieht der Zeitplan aus?",
      "Letzte Details zur Vergütung.",
      "Alles klar! Überprüfe den Vertrag und generiere ihn."
    ];
    progressMessage.textContent = messages[stepNumber - 1] || "Weiter geht's!";
  }

  function calculateRealProgress() {
    const allRequiredFields = document.querySelectorAll('.form-section [required]');
    if (allRequiredFields.length === 0) return 100; 

    let filledRequiredFields = 0;
    allRequiredFields.forEach(field => {
        const section = field.closest('.form-section');
        const sectionStep = section ? parseInt(section.id.split('-')[1]) : 0;
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

      setPreviewText('preview-company-name', getValue('company-name', '[Name des Unternehmens]'));
      setPreviewText('preview-company-contact', getValue('company-contact', '[Ansprechpartner]'));
      setPreviewText('preview-company-street', getValue('company-street', '[Straße]'));
      setPreviewText('preview-company-number', getValue('company-number', '[Hausnummer]'));
      setPreviewText('preview-company-zip', getValue('company-zip', '[PLZ]'));
      setPreviewText('preview-company-city', getValue('company-city', '[Stadt]'));
      setPreviewText('preview-company-country', getValue('company-country', '[Land]'));

      setPreviewText('preview-influencer-name', getValue('influencer-name', '[Name des Influencers]'));
      setPreviewText('preview-influencer-street', getValue('influencer-street', '[Straße]'));
      setPreviewText('preview-influencer-number', getValue('influencer-number', '[Hausnummer]'));
      setPreviewText('preview-influencer-zip', getValue('influencer-zip', '[PLZ]'));
      setPreviewText('preview-influencer-city', getValue('influencer-city', '[Stadt]'));
      setPreviewText('preview-influencer-country', getValue('influencer-country', '[Land]'));

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

      let platformsHtml = '';
      if (isChecked('platform-instagram')) platformsHtml += `<p>✓ Instagram (Profil: ${getValue('instagram-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-tiktok')) platformsHtml += `<p>✓ TikTok (Profil: ${getValue('tiktok-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-youtube')) platformsHtml += `<p>✓ YouTube (Kanal: ${getValue('youtube-url', '[URL]')})</p>`;
      if (isChecked('platform-other')) platformsHtml += `<p>✓ Sonstiges: ${getValue('other-platform', '[Frei eintragen]')}</p>`;
      setPreviewHTML('preview-platforms', platformsHtml || '<p>Keine Plattformen ausgewählt</p>');

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

      const exclusivityValue = getValue('exklusiv'); 
      const previewExclusivityEl = document.getElementById('preview-exclusivity');
      if (previewExclusivityEl) {
          previewExclusivityEl.innerHTML = exclusivityValue ? `<p>Exklusivität: <strong>${exclusivityValue}</strong></p>` : '<p>Keine Exklusivität ausgewählt</p>';
      }

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
        if (isNaN(date.getTime())) {
            return dateString; 
        }
        return date.toLocaleDateString('de-DE'); 
    } catch (e) {
        return dateString; 
    }
  }
  
  const PAGE_MARGIN = 20; 
  const CONTENT_START_Y = 30; 
  const PAGE_HEIGHT = 297; 
  const PAGE_WIDTH = 210; 
  const LINE_HEIGHT = 6; 
  const PARAGRAPH_SPACING = 4; // Standard paragraph spacing
  const TITLE_SPACING_AFTER = LINE_HEIGHT + PARAGRAPH_SPACING; // Space after a paragraph title
  const SECTION_SPACING_BEFORE_TITLE = PARAGRAPH_SPACING * 2; // Extra space before a new section title

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
        const watermarkText = 'Created with creatorjobs.com';
        const watermarkTextWidth = doc.getTextWidth(watermarkText);
        doc.text(watermarkText, PAGE_WIDTH - watermarkTextWidth - 10, PAGE_HEIGHT - 10);
    }
    doc.setTextColor(0); 
    doc.setFont('helvetica', 'normal'); 
  }

  function addParagraphTitle(doc, title, y) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12); 
      doc.text(title, PAGE_MARGIN, y);
      doc.setFont("helvetica", "normal"); 
      doc.setFontSize(10); 
      return y + TITLE_SPACING_AFTER; 
  }

  // NEUE Hilfsfunktion für Text mit fettgedruckten Variablen
  function addTextWithBoldVariables(doc, textParts, x, currentY, options = {}) {
    const { maxWidth = PAGE_WIDTH - 2 * PAGE_MARGIN, lineSpacing = 0 } = options;
    let y = currentY;
    let currentX = x;
    let accumulatedHeight = 0;

    // Funktion zum Messen und Aufteilen von Textteilen
    function processPart(partText, isBold) {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(partText, maxWidth - (currentX - x));
        lines.forEach((line, index) => {
            if (index > 0 || currentX === x) { // Neue Zeile im PDF oder erster Teil einer neuen Zeile
                if (index > 0) { // Nur für echte Zeilenumbrüche innerhalb eines Teils
                    y += LINE_HEIGHT + lineSpacing;
                    accumulatedHeight += LINE_HEIGHT + lineSpacing;
                }
                currentX = x; // Reset X für neue Zeile
                y = checkAndAddPage(doc, y, LINE_HEIGHT); // Seitenumbruch prüfen
            }
            doc.text(line, currentX, y, { baseline: 'top' });
            currentX += doc.getTextWidth(line);
        });
    }

    textParts.forEach(part => {
        if (typeof part === 'string') {
            processPart(part, false);
        } else if (part && part.text) {
            processPart(part.text, part.bold);
        }
    });
    
    y += LINE_HEIGHT + lineSpacing; // Höhe der letzten Zeile hinzufügen
    accumulatedHeight += LINE_HEIGHT + lineSpacing;

    // Sicherstellen, dass y mindestens die Höhe des verarbeiteten Textes widerspiegelt
    return currentY + accumulatedHeight - (LINE_HEIGHT + lineSpacing); // Korrektur, um nicht doppelt zu addieren
}


  function addTableOfContents(doc, tocEntries) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      let y = CONTENT_START_Y;
      doc.text('Inhaltsverzeichnis', PAGE_WIDTH / 2, y, { align: 'center' });
      y += LINE_HEIGHT * 2; 
      
      doc.setFontSize(10);
      doc.setLineWidth(0.1); 

      tocEntries.forEach(para => {
          y = checkAndAddPage(doc, y, LINE_HEIGHT); 
          
          const numberWidth = doc.getTextWidth(para.num) + 3; 
          doc.setFont("helvetica", "bold");
          doc.text(para.num, PAGE_MARGIN, y + 0.2, { baseline: 'top' }); 
          doc.setFont("helvetica", "normal");

          const titleWidth = PAGE_WIDTH - (PAGE_MARGIN * 2) - numberWidth - 20; 
          const titleLines = doc.splitTextToSize(para.title, titleWidth);
          doc.text(titleLines, PAGE_MARGIN + numberWidth, y, { baseline: 'top' });
          
          const pageNumStr = para.page > 0 ? para.page.toString() : "-"; 
          doc.setFont("helvetica", "normal"); 
          doc.text(pageNumStr, PAGE_WIDTH - PAGE_MARGIN - doc.getTextWidth(pageNumStr), y, { baseline: 'top' });

          y += (LINE_HEIGHT * titleLines.length) + (PARAGRAPH_SPACING / 2); 
      });
  }

  function addCoverPage(doc, data) {
      let y = 70; 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text('INFLUENCER-MARKETING-VERTRAG', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 20;
      doc.setFontSize(14);
      doc.text('Vertragspartner', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 25;

      doc.setFontSize(11); 
      doc.setFont("helvetica", "bold");
      doc.text('Unternehmen (Auftraggeber):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      y = addTextWithBoldVariables(doc, ["Name: ", {text: data.companyName, bold: true}], PAGE_MARGIN + 5, y);
      y = addTextWithBoldVariables(doc, ["Vertreten durch: ", {text: data.companyContact, bold: true}], PAGE_MARGIN + 5, y);
      y = addTextWithBoldVariables(doc, ["Straße: ", {text: data.companyStreet, bold: true}, " Nr.: ", {text: data.companyNumber, bold: true}], PAGE_MARGIN + 5, y);
      y = addTextWithBoldVariables(doc, ["PLZ: ", {text: data.companyZip, bold: true}, ", Stadt: ", {text: data.companyCity, bold: true}, ", Land: ", {text: data.companyCountry, bold: true}], PAGE_MARGIN + 5, y);
      y += LINE_HEIGHT * 1.5; // Extra spacing

      doc.setFont("helvetica", "bold");
      doc.text('Influencer (Creator):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      y = addTextWithBoldVariables(doc, ["Name: ", {text: data.influencerName, bold: true}], PAGE_MARGIN + 5, y);
      y = addTextWithBoldVariables(doc, ["Straße: ", {text: data.influencerStreet, bold: true}, " Nr.: ", {text: data.influencerNumber, bold: true}], PAGE_MARGIN + 5, y);
      y = addTextWithBoldVariables(doc, ["PLZ: ", {text: data.influencerZip, bold: true}, ", Stadt: ", {text: data.influencerCity, bold: true}, ", Land: ", {text: data.influencerCountry, bold: true}], PAGE_MARGIN + 5, y);
      
      doc.addPage(); 
      return CONTENT_START_Y; 
  }

  function addSignatureFields(doc, city, y) {
      const signatureBlockHeight = LINE_HEIGHT * 8; // Increased height slightly for safety
      const fixedBottomY = PAGE_HEIGHT - PAGE_MARGIN - signatureBlockHeight;

      // If current y is already on a new page (CONTENT_START_Y) and there's not enough space,
      // it means this is the *only* content on this page, so it's fine.
      // Otherwise, force it to bottom or new page.
      if (y > fixedBottomY && y !== CONTENT_START_Y) {
          doc.addPage();
          y = fixedBottomY; // Place at bottom of new page
      } else if (y !== CONTENT_START_Y) { // If not start of page, force to bottom
          y = fixedBottomY;
      } else { // If it's CONTENT_START_Y, check if it fits, otherwise it's fine as is
          y = Math.max(y, fixedBottomY); // Ensure it's at least at fixedBottomY if it's the start
      }


      const today = new Date();
      const formattedDate = today.toLocaleDateString('de-DE');
      const leftColumnX = PAGE_MARGIN;
      const rightColumnX = PAGE_WIDTH / 2 + 10; 
      const signatureLineWidth = 70; 

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal"); // Ensure normal font for these labels

      // Unternehmen Signature
      y = addTextWithBoldVariables(doc, ["Ort: ", {text: city, bold: true}], leftColumnX, y);
      let lineY = y; // Save y before date for line alignment
      y = addTextWithBoldVariables(doc, ["Datum: ", {text: formattedDate, bold: true}], leftColumnX, lineY + LINE_HEIGHT);
      doc.setLineWidth(0.3); 
      doc.line(leftColumnX, y + LINE_HEIGHT * 1.5, leftColumnX + signatureLineWidth, y + LINE_HEIGHT * 1.5); 
      doc.text('(Unterschrift Unternehmen)', leftColumnX, y + LINE_HEIGHT * 2.5);

      // Influencer Signature
      // Use current y from company signature for alignment if on same "row" conceptually
      let influencerY = fixedBottomY; // Start at the same conceptual height as company sig
      influencerY = addTextWithBoldVariables(doc, ["Ort: ", {text: "________________________", bold: false}], rightColumnX, influencerY);
      lineY = influencerY;
      influencerY = addTextWithBoldVariables(doc, ["Datum: ", {text: "_______________________", bold: false}], rightColumnX, lineY + LINE_HEIGHT);
      doc.line(rightColumnX, influencerY + LINE_HEIGHT * 1.5, rightColumnX + signatureLineWidth, influencerY + LINE_HEIGHT * 1.5); 
      doc.text('(Unterschrift Influencer)', rightColumnX, influencerY + LINE_HEIGHT * 2.5);
      
      return Math.max(y, influencerY) + LINE_HEIGHT * 3.5; // Return Y after the taller signature block
  }

  function renderCheckbox(doc, isChecked, text, x, yVal, currentYVal) {
      let currentY = currentYVal; 
      const boxSize = 3.5; 
      const textXOffset = boxSize + 2; 
      const textMaxWidth = PAGE_WIDTH - x - textXOffset - PAGE_MARGIN;
      
      const textLines = doc.splitTextToSize(text, textMaxWidth);
      const textBlockHeight = textLines.length * LINE_HEIGHT * 0.9; 
      const neededHeight = Math.max(boxSize, textBlockHeight) + PARAGRAPH_SPACING / 2;

      currentY = checkAndAddPage(doc, currentY, neededHeight); 

      doc.setLineWidth(0.2);
      const boxTopY = currentY;
      doc.rect(x, boxTopY, boxSize, boxSize); 
      
      if (isChecked) {
          doc.setFont("zapfdingbats"); 
          doc.text("4", x + boxSize/2 - doc.getTextWidth("4")/2 , boxTopY + boxSize/2 + 1 ); 
          doc.setFont("helvetica"); 
      }
      
      doc.setFont("helvetica", "normal"); // Ensure normal font for checkbox label
      doc.text(textLines, x + textXOffset, currentY, { baseline: 'top' }); 
      return currentY + textBlockHeight + PARAGRAPH_SPACING / 2; 
  }


  function generatePDF() {
    console.log('Starting PDF generation');
    try {
      if (typeof window.jsPDF === 'undefined') { 
        alert('Die PDF-Bibliothek (jsPDF) konnte nicht geladen werden. Bitte stellen Sie sicher, dass die Bibliothek korrekt eingebunden ist und versuchen Sie es erneut.');
        console.error('jsPDF is not loaded on window');
        return;
      }
      const PDFCreator = window.jsPDF; 
      const doc = new PDFCreator({unit: 'mm', format: 'a4'}); 
      
      let tocEntries = [];
      let y = CONTENT_START_Y; 

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
        if (selectedRadio) {
            if (selectedRadio.id.startsWith('duration-')) { 
                const val = selectedRadio.id.split('-')[1];
                if (val === 'unlimited') return 'Unbegrenzt';
                return `${val} Monate`;
            }
            if (selectedRadio.id.startsWith('term-')) { 
                return `${selectedRadio.id.split('-')[1]} Tage`;
            }
            return selectedRadio.value || defaultValue; 
        }
        return defaultValue;
      };

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
        adOtherText: getValue('ad-other-text', '[nicht spezifiziert]'), // For the text of "ad-other"
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
      
      y = addCoverPage(doc, data); 
      
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

      // §1 Vertragsgegenstand
      tocEntries[0].page = doc.internal.getNumberOfPages(); 
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE); // Ensure space before title
      y = addParagraphTitle(doc, "§1 Vertragsgegenstand", y);
      const p1Text = "Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.";
      const p1Lines = doc.splitTextToSize(p1Text, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(p1Lines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * p1Lines.length + PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      if (data.contractType === 'client') {
        const clientP1 = "Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden: ";
        const clientP2 = ` (${data.clientStreet || '[Straße fehlt]'} ${data.clientNumber || '[Nr. fehlt]'}, ${data.clientZip || '[PLZ fehlt]'} ${data.clientCity || '[Stadt fehlt]'}, ${data.clientCountry || '[Land fehlt]'}). Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.`;
        y = addTextWithBoldVariables(doc, [clientP1, {text: data.clientName || '[Kundenname fehlt]', bold: true}, clientP2], PAGE_MARGIN, y);
      } else {
        doc.text("Das Unternehmen handelt im eigenen Namen und auf eigene Rechnung.", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
      }
      y += PARAGRAPH_SPACING; 

      // §2 Plattformen & Veröffentlichung
      tocEntries[1].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
      doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let platformY = y; 
      if (data.instagramSelected) platformY = renderCheckbox(doc, true, `Instagram - Profil: ${data.instagramUsername || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.tiktokSelected)    platformY = renderCheckbox(doc, true, `TikTok - Profil: ${data.tiktokUsername || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.youtubeSelected)   platformY = renderCheckbox(doc, true, `YouTube - Kanal: ${data.youtubeUrl || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (data.otherSelected)     platformY = renderCheckbox(doc, true, `Sonstiges: ${data.otherPlatform || '[nicht angegeben]'}`, PAGE_MARGIN + 5, platformY, platformY);
      if (!data.instagramSelected && !data.tiktokSelected && !data.youtubeSelected && !data.otherSelected) {
          doc.text("Keine Plattformen ausgewählt.", PAGE_MARGIN + 5, platformY, {baseline: 'top'});
          platformY += LINE_HEIGHT;
      }
      y = platformY + PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let contentSpecified = false;
      const itemIndent = PAGE_MARGIN + 5;
      if (parseInt(data.storySlides) > 0) { y = addTextWithBoldVariables(doc, ["• Story-Slides: ", {text: data.storySlides, bold: true}], itemIndent, y); contentSpecified = true;}
      if (parseInt(data.reelsTiktok) > 0) { y = addTextWithBoldVariables(doc, ["• Reels / TikTok Videos: ", {text: data.reelsTiktok, bold: true}], itemIndent, y); contentSpecified = true;}
      if (parseInt(data.feedPosts) > 0) { y = addTextWithBoldVariables(doc, ["• Feed-Posts (Bild/Karussell): ", {text: data.feedPosts, bold: true}], itemIndent, y); contentSpecified = true;}
      if (parseInt(data.youtubeVideos) > 0) { y = addTextWithBoldVariables(doc, ["• YouTube Video: ", {text: data.youtubeVideos, bold: true}], itemIndent, y); contentSpecified = true;}
      if (!contentSpecified) { doc.text("Keine spezifischen Inhalte vereinbart.", itemIndent, y, {baseline: 'top'}); y += LINE_HEIGHT;}
      y += PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      doc.text("Zusätzlich wird vereinbart:", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let additionalY = y;
      let additionalAgreed = false;
      if (data.collabPost) { additionalY = renderCheckbox(doc, true, "Co-Autoren-Post (Instagram Collab)", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.companyPublication) { additionalY = renderCheckbox(doc, true, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen eigenem Kanal", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.noCompanyPublication) { additionalY = renderCheckbox(doc, true, "Keine zusätzliche Veröffentlichung durch das Unternehmen", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (!additionalAgreed) { doc.text("Keine zusätzlichen Vereinbarungen getroffen.", itemIndent, additionalY, {baseline: 'top'}); additionalY += LINE_HEIGHT;}
      y = additionalY + PARAGRAPH_SPACING; 
      
      // §3 Nutzung für Werbung (Media Buyout)
      tocEntries[2].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
      doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let buyoutY = y;
      if (data.mediaBuyoutYes) {
        buyoutY = renderCheckbox(doc, true, "Ja", itemIndent, buyoutY, buyoutY);
        buyoutY = checkAndAddPage(doc, buyoutY); 
        doc.text("– Kanäle:", PAGE_MARGIN + 10, buyoutY, {baseline: 'top'}); buyoutY += LINE_HEIGHT;
        let channelY = buyoutY; 
        if(data.adInstagram) channelY = renderCheckbox(doc, true, "Instagram", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adFacebook) channelY = renderCheckbox(doc, true, "Facebook", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adTiktok) channelY = renderCheckbox(doc, true, "TikTok", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adOther) channelY = renderCheckbox(doc, true, `Sonstiges: ${data.adOtherText}`, PAGE_MARGIN + 15, channelY, channelY); 
        buyoutY = channelY; 
        
        // KORREKTUR für Whitelisting & SparkAd Checkbox-Darstellung
        buyoutY = checkAndAddPage(doc, buyoutY, LINE_HEIGHT / 2); // Kleiner Abstand
        buyoutY = renderCheckbox(doc, data.whitelisting, "Whitelisting (Meta)", PAGE_MARGIN + 10, buyoutY, buyoutY);
        buyoutY = renderCheckbox(doc, data.sparkAd, "Spark Ad (TikTok)", PAGE_MARGIN + 10, buyoutY, buyoutY);
        
        buyoutY = checkAndAddPage(doc, buyoutY);
        buyoutY = addTextWithBoldVariables(doc, ["– Nutzungsdauer: ", {text: data.usageDuration, bold: true}], PAGE_MARGIN + 10, buyoutY);
      } else {
        buyoutY = renderCheckbox(doc, false, "Ja", itemIndent, buyoutY, buyoutY); 
        buyoutY = renderCheckbox(doc, true, "Nein. Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung genutzt werden.", itemIndent, buyoutY, buyoutY);
      }
      y = buyoutY + PARAGRAPH_SPACING;

      // §4 Rechteübertragung
      tocEntries[3].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§4 Rechteübertragung", y);
      if (data.mediaBuyoutYes) {
          const rightsP1 = "Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem Unternehmen für die gewählte Nutzungsdauer (";
          const rightsP2 = ") ein einfaches Nutzungsrecht an den erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist ";
          const rightsP3 = data.contractType === 'client' ? 'berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.' : 'alleiniger Berechtigter dieser Nutzungsrechte.';
          const rightsP4 = " Die Inhalte dürfen technisch angepasst und bearbeitet werden. Die Weitergabe an sonstige Dritte ist nicht gestattet. Nach Ablauf der Nutzungsdauer erlischt das Nutzungsrecht.";
          y = addTextWithBoldVariables(doc, [rightsP1, {text: data.usageDuration || 'siehe §3', bold: true}, rightsP2, {text: rightsP3, bold: false}, rightsP4], PAGE_MARGIN, y);
      } else {
          doc.text("Da keine Zustimmung zur Nutzung für Werbung erteilt wurde (§3), erfolgt keine erweiterte Rechteübertragung. Die Inhalte verbleiben beim Influencer.", PAGE_MARGIN, y, {baseline: 'top'});
          y += LINE_HEIGHT * doc.splitTextToSize("Da keine Zustimmung...", PAGE_WIDTH - 2*PAGE_MARGIN).length;
      }
      y += PARAGRAPH_SPACING; 

      // §5 Produktion, Freigabe & Exklusivität
      tocEntries[4].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§5 Produktion, Freigabe & Exklusivität", y);
      y = addTextWithBoldVariables(doc, ["Briefing: Das Briefing wird vom Unternehmen bis ", {text: data.briefingDate, bold: true}, " bereitgestellt."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      y = addTextWithBoldVariables(doc, ["Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur Freigabe bis ", {text: data.scriptDate, bold: true}, " / ", {text: data.scriptTime, bold: true}, "."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      y = addTextWithBoldVariables(doc, ["Produktion: Die Produktion erfolgt im Zeitraum ", {text: data.productionStart, bold: true}, " – ", {text: data.productionEnd, bold: true}, ". Produktionsort: ", {text: data.productionLocation, bold: true}, "."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      y = addTextWithBoldVariables(doc, ["Lieferung: Die Lieferung der finalen Inhalte erfolgt bis ", {text: data.deliveryDate, bold: true}, " / ", {text: data.deliveryTime, bold: true}, "."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      y = addTextWithBoldVariables(doc, ["Veröffentlichung: Die Veröffentlichung erfolgt am ", {text: data.publicationDate, bold: true}, "."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y, LINE_HEIGHT); // Space before exclusivity
      if (data.exclusivity) {
        doc.setFont("helvetica", "bold"); 
        doc.text("Exklusivität:", PAGE_MARGIN, y, {baseline: 'top'}); y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        y = addTextWithBoldVariables(doc, [{text: data.exclusivity, bold: true}], PAGE_MARGIN + 5, y); // Exclusivity text itself bold
      } else {
        doc.text("Es wurde keine spezifische Exklusivitätsvereinbarung getroffen.", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
      }
      y += PARAGRAPH_SPACING;
      
      // §6 Vergütung
      tocEntries[5].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§6 Vergütung", y);
      y = addTextWithBoldVariables(doc, ["Die Nettovergütung beträgt ", {text: data.compensation, bold: true}, " €."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      y = addTextWithBoldVariables(doc, ["Das Zahlungsziel beträgt ", {text: data.paymentTerm, bold: true}, "."], PAGE_MARGIN, y);
      y = checkAndAddPage(doc,y);
      if (data.additionalCompYes) {
        y = addTextWithBoldVariables(doc, ["Eine zusätzliche Vergütung ist vereinbart: ", {text: data.additionalCompText, bold: true}], PAGE_MARGIN, y);
      } else {
        doc.text("Eine zusätzliche Vergütung ist nicht vereinbart.", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
      }
      y = checkAndAddPage(doc,y);
      doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT + PARAGRAPH_SPACING; // Added extra PARAGRAPH_SPACING

      // §7 Qualität & Upload
      tocEntries[6].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE + PARAGRAPH_SPACING); // KORREKTUR: Mehr Abstand
      y = addParagraphTitle(doc, "§7 Qualität & Upload", y);
      const qualityText = "Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive, WeTransfer oder E-Mail (kein Messenger). Dateibenennung: [Unternehmen_Creator_VideoX_VersionY]";
      const qualityLines = doc.splitTextToSize(qualityText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(qualityLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * qualityLines.length + PARAGRAPH_SPACING;

      // §8 Rechte Dritter & Musik
      tocEntries[7].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§8 Rechte Dritter & Musik", y);
      const thirdPartyText = "Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.";
      const thirdPartyLines = doc.splitTextToSize(thirdPartyText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(thirdPartyLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * thirdPartyLines.length + PARAGRAPH_SPACING;

      // §9 Werbekennzeichnung
      tocEntries[8].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§9 Werbekennzeichnung", y);
      const adText = 'Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung ("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die entstandenen Schäden.';
      const adLines = doc.splitTextToSize(adText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(adLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * adLines.length + PARAGRAPH_SPACING;
      
      // §10 Verbindlichkeit Briefing & Skript
      tocEntries[9].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§10 Verbindlichkeit Briefing & Skript", y);
      const briefingText = "Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig einzuhalten. Bei Verstoß kann das Unternehmen: 1. Nachbesserung verlangen, 2. eine Neuproduktion auf eigene Kosten fordern, 3. bei wiederholtem Verstoß vom Vertrag zurücktreten. Vergütung entfällt bei Nichterfüllung.";
      const briefingLines = doc.splitTextToSize(briefingText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(briefingLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * briefingLines.length + PARAGRAPH_SPACING;

      // §11 Datenschutz & Vertraulichkeit
      tocEntries[10].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§11 Datenschutz & Vertraulichkeit", y);
      const privacyText = "Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das Vertragsende hinaus.";
      const privacyLines = doc.splitTextToSize(privacyText, PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(privacyLines, PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT * privacyLines.length + PARAGRAPH_SPACING;
      
      // §12 Schlussbestimmungen & Zusätzliche Informationen
      tocEntries[11].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y, SECTION_SPACING_BEFORE_TITLE);
      y = addParagraphTitle(doc, "§12 Schlussbestimmungen & Zusätzliche Informationen", y);
      y = addTextWithBoldVariables(doc, ["Änderungen bedürfen der Schriftform. Gerichtsstand ist ", {text: data.companyCity || '[Stadt nicht festgelegt]', bold: true}, ". Es gilt das Recht der Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der Vertrag im Übrigen wirksam."], PAGE_MARGIN, y);
      
      y = checkAndAddPage(doc,y, LINE_HEIGHT); 
      if (data.extraInformation) {
        y = checkAndAddPage(doc, y, LINE_HEIGHT); 
        doc.setFont("helvetica", "bold");
        doc.text("Zusätzliche Informationen:", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const extraInfoLines = doc.splitTextToSize(data.extraInformation, PAGE_WIDTH - 2 * PAGE_MARGIN);
        doc.text(extraInfoLines, PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT * extraInfoLines.length;
      }
      y += PARAGRAPH_SPACING;

      y = addSignatureFields(doc, data.companyCity || '[Stadt nicht festgelegt]', y);

      tocEntries.forEach(entry => {
        if (entry.page > 0) { 
            entry.page += 1; 
        }
      });

      const tocTargetPage = 2;
      const totalPagesAfterContent = doc.internal.getNumberOfPages();
      doc.addPage(); 
      doc.movePage(doc.internal.getNumberOfPages(), tocTargetPage); 

      doc.setPage(tocTargetPage);
      addTableOfContents(doc, tocEntries); 

      doc.setPage(totalPagesAfterContent + 1); 
      addWatermark(doc); 

      doc.save('influencer-marketing-vertrag-final.pdf');
      console.log('PDF saved successfully');

      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) successAnimation.classList.remove('hidden');

    } catch (error) {
      console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
      alert('Beim Generieren des PDFs ist ein Fehler aufgetreten: ' + error.message + (error.stack ? `\nStack: ${error.stack}`: ''));
    }
  }

  const generateButton = document.getElementById('generate-contract');
  if (generateButton) {
    generateButton.addEventListener('click', function() {
      if (typeof window.jsPDF === 'undefined') {
          alert('Die PDF-Bibliothek (jsPDF) ist nicht geladen. PDF kann nicht generiert werden. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.');
          return;
      }
      let firstInvalidStep = -1;
      const totalStepsToValidate = progressSteps.length || 9; 
      for (let i = 1; i <= totalStepsToValidate ; i++) { 
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
        showValidationError(`Bitte fülle alle Pflichtfelder in Schritt ${firstInvalidStep} aus, um den Vertrag zu generieren.`);
        return; 
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

  goToStep(1); 
});
