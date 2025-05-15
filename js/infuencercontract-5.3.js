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
            if (!field.value.trim()) currentStepIsValid = false;
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
      if (!field.value.trim()) allValid = false;
    });
    if (nextButton) updateButtonState(nextButton, allValid);
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
    if (currentStep === totalSteps) updatePreview();
  }

  function updateProgressMessage(stepNumber) {
    if (!progressMessage) return;
    const messages = [
      "Lass uns anfangen! Wähle den Vertragstyp.", "Gut gemacht! Wer sind die Vertragspartner?", 
      "Perfekt! Auf welchen Plattformen wird veröffentlicht?", "Super! Welche Inhalte sollen erstellt werden?", 
      "Prima! Gibt es zusätzliche Vereinbarungen?", "Sehr gut! Klären wir die Rechte und Nutzung (Media Buyout).", 
      "Fast geschafft! Wie sieht der Zeitplan aus?", "Letzte Details zur Vergütung.", 
      "Alles klar! Überprüfe den Vertrag und generiere ihn."];
    progressMessage.textContent = messages[stepNumber - 1] || "Weiter geht's!";
  }

  function calculateRealProgress() {
    const allRequiredFields = document.querySelectorAll('.form-section [required]');
    if (allRequiredFields.length === 0) return 100;
    let filledRequiredFields = 0;
    allRequiredFields.forEach(field => {
      const section = field.closest('.form-section');
      const sectionStep = section ? parseInt(section.id.split('-')[1]) : 0;
      if (section && (!section.classList.contains('hidden') || sectionStep < currentStep || currentStep === (progressSteps.length || 9))) {
        if ((field.type === 'checkbox' || field.type === 'radio') ? field.checked : field.value.trim()) {
          filledRequiredFields++;
        }
      }
    });
    return Math.floor((filledRequiredFields / allRequiredFields.length) * 100);
  }

  function updatePreview() {
    try {
      const getValue = (id, defaultValue = '') => (document.getElementById(id) && document.getElementById(id).value ? document.getElementById(id).value.trim() : defaultValue);
      const isChecked = (id) => (document.getElementById(id) ? document.getElementById(id).checked : false);
      const setPreviewText = (id, value) => { if (document.getElementById(id)) document.getElementById(id).textContent = value; };
      const setPreviewHTML = (id, value) => { if (document.getElementById(id)) document.getElementById(id).innerHTML = value; };

      setPreviewText('preview-company-name', getValue('company-name', '[Name des Unternehmens]'));
      // ... (rest of preview updates, ensure all preview element IDs are correct) ...
      const isClientContract = getValue('contract-type') === 'client';
      const previewClientSection = document.getElementById('preview-client-section');
      if (previewClientSection) { /* ... */ }
      let platformsHtml = '';
      if (isChecked('platform-instagram')) platformsHtml += `<p>✓ Instagram (Profil: ${getValue('instagram-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-tiktok')) platformsHtml += `<p>✓ TikTok (Profil: ${getValue('tiktok-username', '[@nutzername]')})</p>`;
      if (isChecked('platform-youtube')) platformsHtml += `<p>✓ YouTube (Kanal: ${getValue('youtube-url', '[URL]')})</p>`;
      if (isChecked('platform-other')) platformsHtml += `<p>✓ Sonstiges: ${getValue('other-platform', '[Frei eintragen]')}</p>`;
      setPreviewHTML('preview-platforms', platformsHtml || '<p>Keine Plattformen ausgewählt</p>');
      // ... (rest of content types, exclusivity, extra info) ...
      const realProgress = calculateRealProgress();
      if (progressFill) progressFill.style.width = `${realProgress}%`;
      if (progressText) progressText.textContent = `${realProgress}% ausgefüllt`;
    } catch (error) { console.error("Fehler bei der Aktualisierung der Vorschau:", error); }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('de-DE');
    } catch (e) { return dateString; }
  }
  
  const PAGE_MARGIN = 20; const CONTENT_START_Y = 30; const PAGE_HEIGHT = 297; 
  const PAGE_WIDTH = 210; const LINE_HEIGHT = 6; const PARAGRAPH_SPACING = 4;

  function checkAndAddPage(doc, currentY, spaceNeeded = LINE_HEIGHT * 2) {
      if (currentY + spaceNeeded > PAGE_HEIGHT - PAGE_MARGIN) {
          doc.addPage(); return CONTENT_START_Y;
      } return currentY;
  }

  function addWatermark(doc) { /* ... (no changes needed here) ... */ }
  function addParagraphTitle(doc, title, y) { /* ... (no changes needed here) ... */ }

  function addTableOfContents(doc, tocEntries) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    let y = CONTENT_START_Y;
    doc.text('Inhaltsverzeichnis', PAGE_WIDTH / 2, y, { align: 'center' });
    y += LINE_HEIGHT * 2;
    doc.setFontSize(10); 
    tocEntries.forEach(para => {
      y = checkAndAddPage(doc, y, LINE_HEIGHT); 
      const numberWidth = doc.getTextWidth(para.num) + 3; 
      doc.setFont("helvetica", "bold");
      doc.text(para.num, PAGE_MARGIN, y); // Removed baseline: 'top'
      doc.setFont("helvetica", "normal");
      const titleWidth = PAGE_WIDTH - (PAGE_MARGIN * 2) - numberWidth - 20; 
      const titleLines = doc.splitTextToSize(para.title, titleWidth);
      doc.text(titleLines, PAGE_MARGIN + numberWidth, y); // Removed baseline: 'top'
      const pageNumStr = para.page > 0 ? para.page.toString() : "-"; 
      doc.setFont("helvetica", "normal"); 
      doc.text(pageNumStr, PAGE_WIDTH - PAGE_MARGIN - doc.getTextWidth(pageNumStr) -2 , y); // Removed baseline: 'top'
      y += (LINE_HEIGHT * titleLines.length) + (PARAGRAPH_SPACING / 2);
    });
    doc.addPage(); return CONTENT_START_Y; 
  }

  function addCoverPage(doc, data) { /* ... (no changes needed here) ... */ }
  function addSignatureFields(doc, city, y) { /* ... (no changes needed here) ... */ }

  // Checkbox rendering function - simplified for [BOX] Text alignment
  function renderCheckbox(doc, isChecked, text, x, yBaseline) {
    const boxSize = 3.5; // mm
    const gap = 2; // mm
    const textX = x + boxSize + gap;
    const textMaxWidth = PAGE_WIDTH - textX - PAGE_MARGIN;

    const textLines = doc.splitTextToSize(text, textMaxWidth);
    const textBlockHeight = textLines.length * LINE_HEIGHT;
    const itemHeightForPageCheck = Math.max(boxSize, textBlockHeight) + PARAGRAPH_SPACING;
    
    let currentYBaseline = checkAndAddPage(doc, yBaseline, itemHeightForPageCheck);
    if (currentYBaseline !== yBaseline && currentYBaseline === CONTENT_START_Y) { 
        yBaseline = currentYBaseline;
    } else if (currentYBaseline !== yBaseline) { 
         yBaseline = currentYBaseline;
    }

    const fontSizeMm = doc.getFontSize() / (72 / 25.4); 
    const boxTop = yBaseline - fontSizeMm * 0.75 + 0.5 ; // Adjusted slightly up for better visual alignment

    doc.setLineWidth(0.2);
    doc.rect(x, boxTop, boxSize, boxSize);

    if (isChecked) {
        doc.setFont("zapfdingbats");
        const checkmarkFontSize = 10; 
        doc.setFontSize(checkmarkFontSize);
        const zapfCharMetricsW = doc.getTextWidth("4");
        const zapfCharMetricsH = doc.getTextDimensions("4", {fontSize: checkmarkFontSize}).h; // Use current font size for metrics

        doc.text("4",
            x + (boxSize - zapfCharMetricsW) / 2, 
            boxTop + boxSize - (boxSize - zapfCharMetricsH) / 2 - 0.7 // Adjusted for better vertical centering
        );
        doc.setFont("helvetica"); 
        doc.setFontSize(10); 
    }
    doc.text(textLines, textX, yBaseline); 
    return yBaseline + (textLines.length -1) * LINE_HEIGHT + LINE_HEIGHT; 
}

  // Function to draw a label, then a checkbox, then a text (e.g., "Ja") on the same line
  function drawLabelledCheckboxOption(doc, labelText, isChecked, optionText, xLabel, yBaseline, xBox, xOptionText) {
    yBaseline = checkAndAddPage(doc, yBaseline, LINE_HEIGHT * 1.5); // Check for page break before drawing
    doc.text(labelText, xLabel, yBaseline);
    
    const boxSize = 3.5;
    const fontSizeMm = doc.getFontSize() / (72 / 25.4);
    const boxTop = yBaseline - fontSizeMm * 0.75 + 0.5;

    doc.setLineWidth(0.2);
    doc.rect(xBox, boxTop, boxSize, boxSize);
    if (isChecked) {
        doc.setFont("zapfdingbats");
        const checkmarkFontSize = 10;
        doc.setFontSize(checkmarkFontSize);
        const zapfCharMetricsW = doc.getTextWidth("4");
        const zapfCharMetricsH = doc.getTextDimensions("4", {fontSize: checkmarkFontSize}).h;
        doc.text("4", xBox + (boxSize - zapfCharMetricsW) / 2, boxTop + boxSize - (boxSize - zapfCharMetricsH) / 2 - 0.7);
        doc.setFont("helvetica");
        doc.setFontSize(10);
    }
    if (optionText) {
        doc.text(optionText, xOptionText, yBaseline);
    }
    return yBaseline + LINE_HEIGHT; // Return Y for the next line
  }


  function generatePDF() {
    console.log('Starting PDF generation');
    try {
      if (typeof window.jsPDF === 'undefined') { 
        alert('Die PDF-Bibliothek (jsPDF) konnte nicht geladen werden...'); console.error('jsPDF is not loaded on window'); return;
      }
      const PDFCreator = window.jsPDF; 
      const doc = new PDFCreator({unit: 'mm', format: 'a4'}); 
      
      let tocEntries = []; let y = CONTENT_START_Y;

      const getValue = (id, dV = '') => (document.getElementById(id) && document.getElementById(id).value ? document.getElementById(id).value.trim() : dV);
      const isChk = (id) => (document.getElementById(id) ? document.getElementById(id).checked : false);
      const getRadio = (n, dV = '') => { const r = document.querySelector(`input[name="${n}"]:checked`); if (r) { if (r.id.startsWith('duration-')) { const v = r.id.split('-')[1]; return v === 'unlimited' ? 'Unbegrenzt' : `${v} Monate`; } if (r.id.startsWith('term-')) return `${r.id.split('-')[1]} Tage`; return r.value || dV; } return dV; };

      const data = {
        contractType: getValue('contract-type'), companyName: getValue('company-name', '[N/A]'), companyContact: getValue('company-contact', '[N/A]'),
        companyStreet: getValue('company-street', '[N/A]'), companyNumber: getValue('company-number', '[N/A]'), companyZip: getValue('company-zip', '[N/A]'),
        companyCity: getValue('company-city', '[N/A]'), companyCountry: getValue('company-country', '[N/A]'),
        influencerName: getValue('influencer-name', '[N/A]'), influencerStreet: getValue('influencer-street', '[N/A]'),
        influencerNumber: getValue('influencer-number', '[N/A]'), influencerZip: getValue('influencer-zip', '[N/A]'),
        influencerCity: getValue('influencer-city', '[N/A]'), influencerCountry: getValue('influencer-country', '[N/A]'),
        clientName: getValue('client-name', '[N/A]'), clientStreet: getValue('client-street', '[N/A]'), clientNumber: getValue('client-number', '[N/A]'),
        clientZip: getValue('client-zip', '[N/A]'), clientCity: getValue('client-city', '[N/A]'), clientCountry: getValue('client-country', '[N/A]'),
        instagramSelected: isChk('platform-instagram'), instagramUsername: getValue('instagram-username', '[@N/A]'),
        tiktokSelected: isChk('platform-tiktok'), tiktokUsername: getValue('tiktok-username', '[@N/A]'),
        youtubeSelected: isChk('platform-youtube'), youtubeUrl: getValue('youtube-url', 'https://en.wikipedia.org/wiki/N/A'),
        otherSelected: isChk('platform-other'), otherPlatform: getValue('other-platform', '[N/A]'),
        storySlides: getValue('story-slides', '0'), reelsTiktok: getValue('reels-tiktok', '0'), feedPosts: getValue('feed-posts', '0'), youtubeVideos: getValue('youtube-videos', '0'),
        collabPost: isChk('collab-post'), companyPublication: isChk('company-publication'), noCompanyPublication: isChk('no-company-publication'),
        mediaBuyoutYes: isChk('media-buyout-yes'), adInstagram: isChk('ad-instagram'), adFacebook: isChk('ad-facebook'),
        adTiktok: isChk('ad-tiktok'), adOther: isChk('ad-other'), whitelisting: isChk('whitelisting'), sparkAd: isChk('spark-ad'),
        usageDuration: getRadio('duration', '[N/A]'), briefingDate: formatDate(getValue('briefing-date', '[N/A]')),
        scriptDate: formatDate(getValue('script-date', '[N/A]')), scriptTime: getValue('script-time', '12:00'),
        productionStart: formatDate(getValue('production-start', '[N/A]')), productionEnd: formatDate(getValue('production-end', '[N/A]')),
        productionLocation: getValue('production-location', '[N/A]'), deliveryDate: formatDate(getValue('delivery-date', '[N/A]')),
        deliveryTime: getValue('delivery-time', '12:00'), publicationDate: formatDate(getValue('publication-date', '[N/A]')),
        compensation: getValue('compensation', '[N/A]'), paymentTerm: getRadio('payment_term', '[N/A]'), 
        additionalCompYes: isChk('additional-yes'), additionalCompText: getValue('additional-comp-text', '[N/A]'),
        exclusivity: getValue('exklusiv', ''), extraInformation: getValue('extra-information', '')
      };
      
      y = addCoverPage(doc, data); 
      tocEntries = [ /* ... (wie in der vorigen Version, Titel für §5 und §9 angepasst) ... */
            { num: "§1", title: "Vertragsgegenstand", page: 0 },
            { num: "§2", title: "Plattformen & Veröffentlichung", page: 0 },
            { num: "§3", title: "Nutzung für Werbung (Media Buyout)", page: 0 },
            { num: "§4", title: "Rechteübertragung", page: 0 },
            { num: "§5", title: "Produktion, Freigabe & Exklusivität", page: 0 }, // Angepasst
            { num: "§6", title: "Vergütung", page: 0 },
            { num: "§7", title: "Qualität & Upload", page: 0 },
            { num: "§8", title: "Rechte Dritter & Musik", page: 0 },
            { num: "§9", title: "Werbekennzeichnung", page: 0 }, // Angepasst
            { num: "§10", title: "Verbindlichkeit Briefing & Skript", page: 0 },
            { num: "§11", title: "Datenschutz & Vertraulichkeit", page: 0 },
            { num: "§12", title: "Schlussbestimmungen & Zus. Infos", page: 0 }
      ];
      y = addTableOfContents(doc, tocEntries); 

      // §1
      tocEntries[0].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§1 Vertragsgegenstand", y);
      const p1L = doc.splitTextToSize("Der Influencer verpflichtet sich...", PAGE_WIDTH - 2 * PAGE_MARGIN); doc.text(p1L, PAGE_MARGIN, y); y += LINE_HEIGHT * p1L.length + PARAGRAPH_SPACING;
      y = checkAndAddPage(doc, y);
      if (data.contractType === 'client') { /* ... */ } else { /* ... */ } y += PARAGRAPH_SPACING * 2; 

      // §2
      tocEntries[1].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§2 Plattformen & Veröffentlichung", y);
      doc.text("Die Veröffentlichung...", PAGE_MARGIN, y); y += LINE_HEIGHT;
      let platY = y; const itemIndent = PAGE_MARGIN + 5;
      if (data.instagramSelected) platY = renderCheckbox(doc, true, `Instagram - Profil: ${data.instagramUsername}`, itemIndent, platY);
      // ... (restliche Plattformen) ...
      y = platY + PARAGRAPH_SPACING;
      // ... (Inhalte und zusätzliche Vereinbarungen) ...
      y += PARAGRAPH_SPACING * 2;
      
      // §3 Media Buyout
      tocEntries[2].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
      doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", PAGE_MARGIN, y); y += LINE_HEIGHT;
      let buyoutY = y;
      const labelIndent = PAGE_MARGIN + 10;
      const optionBoxX = PAGE_MARGIN + 50; // Angepasste X-Position für die Box
      const optionTextX = optionBoxX + 3.5 + 2;

      if (data.mediaBuyoutYes) {
        buyoutY = renderCheckbox(doc, true, "Ja", itemIndent, buyoutY); 
        buyoutY += PARAGRAPH_SPACING; 
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text("– Kanäle:", labelIndent, buyoutY); buyoutY += LINE_HEIGHT;
        let channelX = labelIndent + 5; 
        if(data.adInstagram) buyoutY = renderCheckbox(doc, true, "Instagram", channelX, buyoutY);
        if(data.adFacebook)  buyoutY = renderCheckbox(doc, true, "Facebook", channelX, buyoutY);
        if(data.adTiktok)    buyoutY = renderCheckbox(doc, true, "TikTok", channelX, buyoutY);
        if(data.adOther)     buyoutY = renderCheckbox(doc, true, "Sonstiges", channelX, buyoutY);
        buyoutY += PARAGRAPH_SPACING;

        buyoutY = drawLabelledCheckboxOption(doc, "– Whitelisting (Meta):", data.whitelisting, "Ja", labelIndent, buyoutY, optionBoxX, optionTextX);
        buyoutY = drawLabelledCheckboxOption(doc, "– Spark Ad (TikTok):", data.sparkAd, "Ja", labelIndent, buyoutY, optionBoxX, optionTextX);
        
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text(`– Nutzungsdauer: ${data.usageDuration || '[Nicht spezifiziert]'}`, labelIndent, buyoutY); 
        buyoutY += LINE_HEIGHT;
      } else {
        buyoutY = renderCheckbox(doc, false, "Ja", itemIndent, buyoutY); 
        buyoutY = renderCheckbox(doc, true, "Nein. Inhalte verbleiben ausschließlich beim Influencer...", itemIndent, buyoutY);
      }
      y = buyoutY + PARAGRAPH_SPACING * 2;

      // §4
      tocEntries[3].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§4 Rechteübertragung", y); /* ... */ y += PARAGRAPH_SPACING * 2; 

      // §5 Produktion, Freigabe & Exklusivität
      tocEntries[4].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§5 Produktion, Freigabe & Exklusivität", y);
      // ... (Produktion und Freigabe Text) ...
      doc.text(`Veröffentlichung: ${data.publicationDate || '[N/A]'}.`, PAGE_MARGIN, y); y += LINE_HEIGHT;
      y = checkAndAddPage(doc,y);
      if (data.exclusivity) {
        doc.setFont("helvetica", "bold"); 
        doc.text("Exklusivität:", PAGE_MARGIN, y); y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const exLines = doc.splitTextToSize(data.exclusivity, PAGE_WIDTH - 2 * PAGE_MARGIN - 5);
        doc.text(exLines, PAGE_MARGIN + 5, y); y += LINE_HEIGHT * exLines.length;
      } else { /* ... */ } y += PARAGRAPH_SPACING * 2;
      
      // ... (Restliche Paragraphen §6 bis §12) ...
      // §9 Werbekennzeichnung (ohne Exklusivität)
      tocEntries[8].page = doc.internal.getNumberOfPages(); y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§9 Werbekennzeichnung", y);
      const adL = doc.splitTextToSize('Der Influencer verpflichtet sich...', PAGE_WIDTH - 2 * PAGE_MARGIN);
      doc.text(adL, PAGE_MARGIN, y); y += LINE_HEIGHT * adL.length + PARAGRAPH_SPACING * 2;

      // ... (Finalisierung, Unterschriften, Wasserzeichen, Speichern) ...
      const endPage = doc.internal.getNumberOfPages();
      doc.setPage(2); addTableOfContents(doc, tocEntries); 
      if (endPage >=3) doc.setPage(endPage);
      addWatermark(doc); doc.save('influencer-marketing-vertrag-final.pdf');
      if (document.getElementById('success-animation')) document.getElementById('success-animation').classList.remove('hidden');
    } catch (error) { /* ... */ }
  }

  const generateButton = document.getElementById('generate-contract');
  if (generateButton) { /* ... (no changes needed here) ... */ }
  function showSuccessAnimation() { /* ... */ }
  const downloadButton = document.getElementById('download-button');
  if (downloadButton) { /* ... */ }
  document.querySelectorAll('[required], input, select, textarea').forEach(field => { /* ... */ });
  const form = document.querySelector('.db-contact-generator-wrapper');
  if (form && !document.querySelector('.container')) { /* ... */ }
  goToStep(1); 
});
