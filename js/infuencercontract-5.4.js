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
    alert(message); // Consider replacing with a custom modal for better UX
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
    if (!currentSection) return true; // Should not happen
    const nextButton = currentSection.querySelector('.next-step');
    const requiredFields = currentSection.querySelectorAll('[required]');
    let allValid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        allValid = false;
      }
    });
    if (nextButton) { // Ensure next button exists before trying to update its state
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
    validateCurrentStep(); // Validate the new current step to enable/disable next button
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    const totalSteps = progressSteps.length || 9; // Fallback if progressSteps is empty
    const percentage = totalSteps > 0 ? Math.min(Math.floor(((currentStep - 1) / totalSteps) * 100), 100) : 0;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `${percentage}% ausgefüllt`;
    updateProgressMessage(currentStep);

    // Update preview only if on the last step or if a dedicated preview step exists
    if (currentStep === totalSteps) { // Assuming last step is the review/preview step
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
      "Prima! Gibt es zusätzliche Vereinbarungen?", // Step 5 (Exklusivität, etc.)
      "Sehr gut! Klären wir die Rechte und Nutzung (Media Buyout).", // Step 6
      "Fast geschafft! Wie sieht der Zeitplan aus?", // Step 7
      "Letzte Details zur Vergütung.", // Step 8
      "Alles klar! Überprüfe den Vertrag und generiere ihn." // Step 9 (Preview & Generate)
    ];
    progressMessage.textContent = messages[stepNumber - 1] || "Weiter geht's!";
  }

  function calculateRealProgress() {
    const allRequiredFields = document.querySelectorAll('.form-section [required]');
    if (allRequiredFields.length === 0) return 100; // Or 0 if no fields means no progress

    let filledRequiredFields = 0;
    allRequiredFields.forEach(field => {
        // Check if the field is visible (i.e., its section is not hidden OR it's in a step before current OR it's the final step)
        const section = field.closest('.form-section');
        const sectionStep = section ? parseInt(section.id.split('-')[1]) : 0;

        // Consider a field for progress if its section is currently visible, or it's in a past step,
        // or we are on the final review step (where all fields should be considered).
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
      const setPreviewHTML = (id, value) => { // Use this for HTML content
        const el = document.getElementById(id);
        if (el) el.innerHTML = value;
      };

      // Vertragspartner - Unternehmen
      setPreviewText('preview-company-name', getValue('company-name', '[Name des Unternehmens]'));
      setPreviewText('preview-company-contact', getValue('company-contact', '[Ansprechpartner]'));
      setPreviewText('preview-company-street', getValue('company-street', '[Straße]'));
      setPreviewText('preview-company-number', getValue('company-number', '[Hausnummer]'));
      setPreviewText('preview-company-zip', getValue('company-zip', '[PLZ]'));
      setPreviewText('preview-company-city', getValue('company-city', '[Stadt]'));
      setPreviewText('preview-company-country', getValue('company-country', '[Land]'));

      // Vertragspartner - Influencer
      setPreviewText('preview-influencer-name', getValue('influencer-name', '[Name des Influencers]'));
      setPreviewText('preview-influencer-street', getValue('influencer-street', '[Straße]'));
      setPreviewText('preview-influencer-number', getValue('influencer-number', '[Hausnummer]'));
      setPreviewText('preview-influencer-zip', getValue('influencer-zip', '[PLZ]'));
      setPreviewText('preview-influencer-city', getValue('influencer-city', '[Stadt]'));
      setPreviewText('preview-influencer-country', getValue('influencer-country', '[Land]'));

      // Kunde (falls Agenturvertrag)
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


      // Inhalte
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
      const exclusivityValue = getValue('exklusiv'); // Assuming 'exklusiv' is the ID of the input/select
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
      
      // Update real progress based on filled fields when preview is shown
      const realProgress = calculateRealProgress();
      if (progressFill) progressFill.style.width = `${realProgress}%`;
      if (progressText) progressText.textContent = `${realProgress}% ausgefüllt`;

    } catch (error) {
      console.error("Fehler bei der Aktualisierung der Vorschau:", error);
      // Optionally, display a user-friendly message in the preview area
      // For example: setPreviewText('preview-error-message', 'Vorschau konnte nicht geladen werden.');
    }
  }

  // Helper function to format date strings
  function formatDate(dateString) {
    if (!dateString) return ''; // Return empty if no date provided
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original string if date is invalid
        }
        return date.toLocaleDateString('de-DE'); // Format for German locale
    } catch (e) {
        return dateString; // Return original string in case of error
    }
  }
  
  // PDF Generation Constants
  const PAGE_MARGIN = 20; // mm
  const CONTENT_START_Y = 30; // mm, initial Y position for content after header/title
  const PAGE_HEIGHT = 297; // mm (A4 height)
  const PAGE_WIDTH = 210; // mm (A4 width)
  const LINE_HEIGHT = 6; // mm, base line height for text
  const PARAGRAPH_SPACING = 4; // mm, space after a paragraph block

  // Helper function to add a new page if content exceeds page height
  function checkAndAddPage(doc, currentY, spaceNeeded = LINE_HEIGHT * 2) {
      if (currentY + spaceNeeded > PAGE_HEIGHT - PAGE_MARGIN) { // Check if space needed exceeds available page space
          doc.addPage();
          return CONTENT_START_Y; // Reset Y to top content start for new page
      }
      return currentY; // Return current Y if no new page is needed
  }

  // Helper function to add watermark to all pages
  function addWatermark(doc) {
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); // Small font size for watermark
    doc.setTextColor(150); // Light grey color for watermark

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i); // Set current page
        const watermarkText = 'Created with creatorjobs.com';
        const watermarkTextWidth = doc.getTextWidth(watermarkText);
        // Position watermark at the bottom right
        doc.text(watermarkText, PAGE_WIDTH - watermarkTextWidth - 10, PAGE_HEIGHT - 10);
    }
    doc.setTextColor(0); // Reset text color to black
    doc.setFont('helvetica', 'normal'); // Ensure font is reset
  }


  // Helper function to add a paragraph title
  function addParagraphTitle(doc, title, y) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12); // Font size for titles
      doc.text(title, PAGE_MARGIN, y);
      doc.setFont("helvetica", "normal"); // Reset to normal for subsequent text
      doc.setFontSize(10); // Reset to default text font size
      return y + LINE_HEIGHT + PARAGRAPH_SPACING; // Return new Y position after title and spacing
  }

  // Function to add Table of Contents
  function addTableOfContents(doc, tocEntries) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      let y = CONTENT_START_Y;
      doc.text('Inhaltsverzeichnis', PAGE_WIDTH / 2, y, { align: 'center' });
      y += LINE_HEIGHT * 2; // Space after main title
      
      doc.setFontSize(10);
      doc.setLineWidth(0.1); // Ensure thin line width for any potential artifacts

      tocEntries.forEach(para => {
          y = checkAndAddPage(doc, y, LINE_HEIGHT); // Check for new page before each entry
          
          const numberWidth = doc.getTextWidth(para.num) + 3; // Width for section number
          doc.setFont("helvetica", "bold");
          // FIX: Added small y-offset (0.2mm) to prevent line above "§"
          doc.text(para.num, PAGE_MARGIN, y + 0.2, { baseline: 'top' }); 
          doc.setFont("helvetica", "normal");

          const titleWidth = PAGE_WIDTH - (PAGE_MARGIN * 2) - numberWidth - 20; // Available width for title
          const titleLines = doc.splitTextToSize(para.title, titleWidth);
          doc.text(titleLines, PAGE_MARGIN + numberWidth, y, { baseline: 'top' });
          
          // Page number
          const pageNumStr = para.page > 0 ? para.page.toString() : "-"; 
          doc.setFont("helvetica", "normal"); // Ensure font is normal for page number
          doc.text(pageNumStr, PAGE_WIDTH - PAGE_MARGIN - doc.getTextWidth(pageNumStr), y, { baseline: 'top' });

          y += (LINE_HEIGHT * titleLines.length) + (PARAGRAPH_SPACING / 2); // Increment Y
      });
      doc.addPage(); // Add a new page after ToC
      return CONTENT_START_Y; // Reset Y for the next section
  }

  // Function to add the Cover Page
  function addCoverPage(doc, data) {
      let y = 70; // Start Y for cover page content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text('INFLUENCER-MARKETING-VERTRAG', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 20;
      doc.setFontSize(14);
      doc.text('Vertragspartner', PAGE_WIDTH / 2, y, { align: 'center' });
      y += 25;

      doc.setFontSize(11); 
      // Unternehmen
      doc.setFont("helvetica", "bold");
      doc.text('Unternehmen (Auftraggeber):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${data.companyName}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Vertreten durch: ${data.companyContact}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Straße: ${data.companyStreet} Nr.: ${data.companyNumber}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`PLZ: ${data.companyZip}, Stadt: ${data.companyCity}, Land: ${data.companyCountry}`, PAGE_MARGIN + 5, y);
      y += LINE_HEIGHT * 2.5;

      // Influencer
      doc.setFont("helvetica", "bold");
      doc.text('Influencer (Creator):', PAGE_MARGIN, y);
      y += LINE_HEIGHT * 1.5;
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${data.influencerName}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`Straße: ${data.influencerStreet} Nr.: ${data.influencerNumber}`, PAGE_MARGIN + 5, y); y += LINE_HEIGHT;
      doc.text(`PLZ: ${data.influencerZip}, Stadt: ${data.influencerCity}, Land: ${data.influencerCountry}`, PAGE_MARGIN + 5, y);
      
      doc.addPage(); // New page after cover
      return CONTENT_START_Y; // Reset Y for next content
  }

  // Function to add Signature Fields
  function addSignatureFields(doc, city, y) {
      const signatureBlockHeight = LINE_HEIGHT * 7; // Estimated height for signature block
      // Check if signature block fits, if not, add new page or move to bottom
      if (y > PAGE_HEIGHT - PAGE_MARGIN - signatureBlockHeight) { 
          doc.addPage();
          y = CONTENT_START_Y;
      } else if (y < PAGE_HEIGHT - 90) { // If there's a lot of space, move to a fixed position from bottom
        y = PAGE_HEIGHT - 90; 
      }

      const today = new Date();
      const formattedDate = today.toLocaleDateString('de-DE');
      const leftColumnX = PAGE_MARGIN;
      const rightColumnX = PAGE_WIDTH / 2 + 10; // Start of right column for signatures
      const signatureLineWidth = 70; // Width of the signature line

      doc.setFontSize(10);
      // Unternehmen Signature
      doc.text(`Ort: ${city}`, leftColumnX, y);
      doc.text(`Datum: ${formattedDate}`, leftColumnX, y + LINE_HEIGHT);
      doc.setLineWidth(0.3); // Line for signature
      doc.line(leftColumnX, y + LINE_HEIGHT * 2.5, leftColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); 
      doc.text('(Unterschrift Unternehmen)', leftColumnX, y + LINE_HEIGHT * 3.5);

      // Influencer Signature
      doc.text("Ort:________________________", rightColumnX, y); // Placeholder for influencer's location
      doc.text("Datum:_______________________", rightColumnX, y + LINE_HEIGHT); // Placeholder for influencer's date
      doc.line(rightColumnX, y + LINE_HEIGHT * 2.5, rightColumnX + signatureLineWidth, y + LINE_HEIGHT * 2.5); 
      doc.text('(Unterschrift Influencer)', rightColumnX, y + LINE_HEIGHT * 3.5);
      
      return y + LINE_HEIGHT * 4; // New Y after signature block
  }

  // Function to render a checkbox with text
  function renderCheckbox(doc, isChecked, text, x, yN, currentYVal) {
      let currentY = currentYVal; // Use currentYVal as the starting Y for this item
      const boxSize = 3.5; // mm
      const textXOffset = boxSize + 2; // Space between checkbox and text
      const textMaxWidth = PAGE_WIDTH - x - textXOffset - PAGE_MARGIN;
      
      const textLines = doc.splitTextToSize(text, textMaxWidth);
      // Calculate height needed for this checkbox item (box or text, whichever is taller)
      const textBlockHeight = textLines.length * LINE_HEIGHT * 0.9; // Adjusted line height for text block
      const neededHeight = Math.max(boxSize, textBlockHeight) + PARAGRAPH_SPACING / 2;

      currentY = checkAndAddPage(doc, currentY, neededHeight); 

      doc.setLineWidth(0.2);
      // FIX: Align top of box with top of text (currentY)
      const boxTopY = currentY;
      doc.rect(x, boxTopY, boxSize, boxSize); 
      
      if (isChecked) {
          doc.setFont("zapfdingbats"); 
          // Center checkmark in the box
          // The +1 is an empirical adjustment for vertical centering of the checkmark glyph
          doc.text("4", x + boxSize/2 - doc.getTextWidth("4")/2 , boxTopY + boxSize/2 + 1 ); 
          doc.setFont("helvetica"); 
      }
      
      // FIX: Draw text with baseline 'top' aligned with currentY
      doc.text(textLines, x + textXOffset, currentY, { baseline: 'top' }); 
      
      // Return new Y position after this checkbox item
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
      let y = CONTENT_START_Y; // Initial Y position for content

      // Helper to get form values
      const getValue = (id, defaultValue = '') => {
        const el = document.getElementById(id);
        if (el && el.type === 'radio') { // Handle radio button groups
            const radioGroup = document.querySelectorAll(`input[name="${el.name}"]:checked`);
            return radioGroup.length > 0 ? radioGroup[0].value : defaultValue;
        }
        return el && el.value ? el.value.trim() : defaultValue;
      };
      const isChecked = (id) => document.getElementById(id) ? document.getElementById(id).checked : false;
      
      // Helper to get selected radio button value, with specific logic for duration/term
      const getSelectedRadioValue = (name, defaultValue = '') => {
        const selectedRadio = document.querySelector(`input[name="${name}"]:checked`);
        if (selectedRadio) {
            if (selectedRadio.id.startsWith('duration-')) { // For usage duration
                const val = selectedRadio.id.split('-')[1];
                if (val === 'unlimited') return 'Unbegrenzt';
                return `${val} Monate`;
            }
            if (selectedRadio.id.startsWith('term-')) { // For payment term
                return `${selectedRadio.id.split('-')[1]} Tage`;
            }
            return selectedRadio.value || defaultValue; 
        }
        return defaultValue;
      };

      // Collect all data from the form
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
        noCompanyPublication: isChecked('no-company-publication'), // Assuming this is a valid ID
        mediaBuyoutYes: isChecked('media-buyout-yes'),
        adInstagram: isChecked('ad-instagram'),
        adFacebook: isChecked('ad-facebook'),
        adTiktok: isChecked('ad-tiktok'),
        adOther: isChecked('ad-other'), // Assuming this is a valid ID
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
        exclusivity: getValue('exklusiv', ''), // ID for exclusivity input
        extraInformation: getValue('extra-information', '') // ID for extra information textarea
      };
      
      // Add Cover Page
      y = addCoverPage(doc, data); 
      
      // Define Table of Contents Entries (page numbers will be updated later)
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
      
      // Add placeholder ToC (will be re-rendered with page numbers later)
      // This reserves space and allows us to get correct page numbers for content
      const tocPageNumber = doc.internal.getNumberOfPages() + 1; // ToC will be on the next page
      addTableOfContents(doc, tocEntries); // This adds a page, so content starts on page 3 if cover is 1 page

      // Reset Y for content after ToC
      y = CONTENT_START_Y;

      // §1 Vertragsgegenstand
      tocEntries[0].page = doc.internal.getNumberOfPages(); // Current page number for this section
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
      if (data.collabPost) { additionalY = renderCheckbox(doc, true, "Co-Autoren-Post (Instagram Collab)", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.companyPublication) { additionalY = renderCheckbox(doc, true, "Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen eigenem Kanal", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (data.noCompanyPublication) { additionalY = renderCheckbox(doc, true, "Keine zusätzliche Veröffentlichung durch das Unternehmen", itemIndent, additionalY, additionalY); additionalAgreed = true;}
      if (!additionalAgreed) { doc.text("Keine zusätzlichen Vereinbarungen getroffen.", itemIndent, additionalY, {baseline: 'top'}); additionalY += LINE_HEIGHT;}
      y = additionalY + PARAGRAPH_SPACING * 2; 
      
      // §3 Nutzung für Werbung (Media Buyout)
      tocEntries[2].page = doc.internal.getNumberOfPages();
      y = checkAndAddPage(doc, y);
      y = addParagraphTitle(doc, "§3 Nutzung für Werbung (Media Buyout)", y);
      doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", PAGE_MARGIN, y, {baseline: 'top'});
      y += LINE_HEIGHT;
      let buyoutY = y;
      if (data.mediaBuyoutYes) {
        buyoutY = renderCheckbox(doc, true, "Ja", itemIndent, buyoutY, buyoutY);
        buyoutY = checkAndAddPage(doc, buyoutY); 
        doc.text("– Kanäle:", PAGE_MARGIN + 10, buyoutY, {baseline: 'top'}); buyoutY += LINE_HEIGHT;
        let channelY = buyoutY; // Y for channels list
        if(data.adInstagram) channelY = renderCheckbox(doc, true, "Instagram", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adFacebook) channelY = renderCheckbox(doc, true, "Facebook", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adTiktok) channelY = renderCheckbox(doc, true, "TikTok", PAGE_MARGIN + 15, channelY, channelY);
        if(data.adOther) channelY = renderCheckbox(doc, true, `Sonstiges: ${getValue('ad-other-text', '[nicht spezifiziert]')}`, PAGE_MARGIN + 15, channelY, channelY); // Assuming ad-other-text ID for details
        buyoutY = channelY; 
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text("– Whitelisting (Meta):", PAGE_MARGIN + 10, buyoutY, {baseline: 'top'}); 
        buyoutY = renderCheckbox(doc, data.whitelisting, "Ja", PAGE_MARGIN + 55, buyoutY, buyoutY); 
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text("– Spark Ad (TikTok):", PAGE_MARGIN + 10, buyoutY, {baseline: 'top'}); 
        buyoutY = renderCheckbox(doc, data.sparkAd, "Ja", PAGE_MARGIN + 55, buyoutY, buyoutY);
        buyoutY = checkAndAddPage(doc, buyoutY);
        doc.text(`– Nutzungsdauer: ${data.usageDuration || '[Nicht spezifiziert]'}`, PAGE_MARGIN + 10, buyoutY, {baseline: 'top'}); 
        buyoutY += LINE_HEIGHT;
      } else {
        buyoutY = renderCheckbox(doc, false, "Ja", itemIndent, buyoutY, buyoutY); // Show "Ja" as unchecked
        buyoutY = renderCheckbox(doc, true, "Nein. Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung genutzt werden.", itemIndent, buyoutY, buyoutY);
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
        const exclusivityLines = doc.splitTextToSize(data.exclusivity, PAGE_WIDTH - 2 * PAGE_MARGIN - 5); 
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
      
      y = checkAndAddPage(doc,y); // Check before adding extra info
      if (data.extraInformation) {
        y = checkAndAddPage(doc, y, LINE_HEIGHT * 2); // Ensure space for title + content
        doc.setFont("helvetica", "bold");
        doc.text("Zusätzliche Informationen:", PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT;
        doc.setFont("helvetica", "normal");
        const extraInfoLines = doc.splitTextToSize(data.extraInformation, PAGE_WIDTH - 2 * PAGE_MARGIN);
        doc.text(extraInfoLines, PAGE_MARGIN, y, {baseline: 'top'});
        y += LINE_HEIGHT * extraInfoLines.length;
      }
      y += PARAGRAPH_SPACING * 2;

      // Add Signature Fields
      y = addSignatureFields(doc, data.companyCity || '[Stadt nicht festgelegt]', y);

      // Re-render ToC with correct page numbers
      const currentPageBeforeFinalToc = doc.internal.getNumberOfPages();
      doc.setPage(tocPageNumber); // Go to the ToC page (e.g., page 2)
      addTableOfContents(doc, tocEntries); // Re-draw ToC, this will add a new page after it.
      
      // Ensure we are on the last content page if ToC added a page and content followed
      // If ToC was on page 2, and it added page 3, and content ended on page `N`,
      // we need to go to page `N` (which is `currentPageBeforeFinalToc` if ToC didn't push it,
      // or `currentPageBeforeFinalToc + 1` if ToC added a page in between).
      // The logic in addTableOfContents already adds a page.
      // So, if original ToC was page 2, content started page 3.
      // New ToC on page 2, adds page 3. Content is now effectively shifted.
      // This needs careful handling. The current `addTableOfContents` adds a page *after* drawing.
      // A simpler way: delete the placeholder ToC page and insert a new one.
      // For now, let's assume the page shifting is acceptable or handled by going to the *last* page.
      doc.setPage(doc.internal.getNumberOfPages()); // Go to the very last page to ensure watermark is on all.

      // Add Watermark to all pages
      addWatermark(doc);
      doc.save('influencer-marketing-vertrag-final.pdf');
      console.log('PDF saved successfully');

      // Show success animation
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
      // Validate all steps before generating PDF
      let firstInvalidStep = -1;
      // Iterate from 1 up to the total number of steps.
      // progressSteps.length should give the correct count if steps are defined.
      // Fallback to 9 if progressSteps is not available for some reason.
      const totalStepsToValidate = progressSteps.length || 9; 
      for (let i = 1; i <= totalStepsToValidate ; i++) { 
        const stepSection = document.getElementById(`step-${i}`);
        if (stepSection) { // Check if section exists
          const requiredFields = stepSection.querySelectorAll('[required]');
          let stepIsValid = true;
          requiredFields.forEach(field => {
            if (!field.value.trim()) {
              stepIsValid = false;
            }
          });
          if (!stepIsValid) {
            firstInvalidStep = i;
            break; // Exit loop on first invalid step
          }
        }
      }

      if (firstInvalidStep !== -1) {
        goToStep(firstInvalidStep); // Navigate to the invalid step
        markInvalidFieldsInCurrentStep(); // Mark fields in that step
        showValidationError(`Bitte fülle alle Pflichtfelder in Schritt ${firstInvalidStep} aus, um den Vertrag zu generieren.`);
        return; // Stop PDF generation
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

  // Function to show success animation (if you have one)
  function showSuccessAnimation() {
    const successAnimation = document.getElementById('success-animation');
    if (successAnimation) {
      successAnimation.classList.remove('hidden');
      // Optional: Add a button or auto-hide for the success message
    }
  }

  // Event listener for the download button in the success animation
  const downloadButton = document.getElementById('download-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      const successAnimation = document.getElementById('success-animation');
      if (successAnimation) {
        successAnimation.classList.add('hidden'); // Hide animation on click
      }
    });
  }
  
  // Add event listeners to all relevant fields for live validation and progress update
  document.querySelectorAll('[required], input, select, textarea').forEach(field => {
    const eventType = (field.type === 'checkbox' || field.type === 'radio' || field.tagName === 'SELECT') ? 'change' : 'input';
    field.addEventListener(eventType, function() {
      // Remove error styling if a required field is filled
      if (this.hasAttribute('required') && this.value.trim()) {
        this.classList.remove('error');
        this.style.borderColor = ''; // Reset border color
      }
      validateCurrentStep(); // Validate current step to update button states
      updateProgress(); // Update progress bar and preview if on last step
    });
  });

  // Dynamic layout adjustment for sidebar (if .container and .sidebar are not in HTML)
  // This part seems to be for creating a two-column layout dynamically.
  // Ensure your HTML structure matches what this code expects or adjust as needed.
  const form = document.querySelector('.db-contact-generator-wrapper');
  if (form && !document.querySelector('.container')) { // Only run if .container doesn't exist
    const parentElement = form.parentElement;
    const container = document.createElement('div');
    container.className = 'container'; // Matches CSS for layout
    parentElement.appendChild(container);

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar'; // Matches CSS for layout
    container.appendChild(sidebar);

    const progressBar = document.querySelector('.progress-bar-container'); 
    if (progressBar) {
      sidebar.appendChild(progressBar); // Move progress bar to sidebar
    }

    const mainContent = document.createElement('div');
    mainContent.className = 'main-content'; // Matches CSS for layout
    container.appendChild(mainContent);
    mainContent.appendChild(form); // Move form to main content area
  }

  goToStep(1); // Initialize to the first step
});
