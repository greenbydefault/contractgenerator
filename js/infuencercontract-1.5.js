document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }

    // Funktion zum Hinzufügen eines Wasserzeichens
    function addWatermark(doc) {
        const totalPages = doc.internal.getNumberOfPages();

        // Setze Schriftart und Größe für das Wasserzeichen
        doc.setFont('helvetica');
        doc.setFontSize(7);
        doc.setTextColor(130); // Graue Farbe für das Wasserzeichen

        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            // Berechne die X- und Y-Position für das Wasserzeichen
            const pageSize = doc.internal.pageSize;
            const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

            // Wasserzeichen in die untere rechte Ecke
            const watermarkTextWidth = doc.getTextWidth('Created with creatorjobs.com');
            doc.text('Created with creatorjobs.com', pageWidth - watermarkTextWidth - 10, pageHeight - 10);
        }
    }

    // Funktion zum Hinzufügen einer Titelseite
    function addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text('INFLUENCER-MARKETING-VERTRAG', 105, 80, null, null, 'center');
        
        doc.setFontSize(14);
        doc.text('Vertragspartner', 105, 120, null, null, 'center');
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('Unternehmen (Auftraggeber):', 30, 150);
        doc.setFont("helvetica", "normal");
        doc.text('Name: ' + companyName, 30, 160);
        doc.text('Vertreten durch: ' + companyContact, 30, 170);
        doc.text('Straße: ' + companyStreet + ', Nr.: ' + companyNumber, 30, 180);
        doc.text('PLZ: ' + companyZip + ', Stadt: ' + companyCity + ', Land: ' + companyCountry, 30, 190);
        
        doc.setFont("helvetica", "bold");
        doc.text('Influencer (Creator):', 30, 210);
        doc.setFont("helvetica", "normal");
        doc.text('Name: ' + influencerName, 30, 220);
        doc.text('Straße: ' + influencerStreet + ', Nr.: ' + influencerNumber, 30, 230);
        doc.text('PLZ: ' + influencerZip + ', Stadt: ' + influencerCity + ', Land: ' + influencerCountry, 30, 240);
        
        // Nächste Seite
        doc.addPage();
    }

    // Funktion zum Hinzufügen von Unterschriftenfeldern
    function addSignatureFields(doc) {
        // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
        let y = doc.internal.pageSize.height - 50; // 50 Einheiten vom unteren Rand

        doc.text("Ort, Datum", 30, y);
        doc.text("Ort, Datum", 120, y);
        y += 20;
        
        // Unterschriftslinien
        doc.line(30, y, 90, y); // Linie für Unternehmen
        doc.line(120, y, 180, y); // Linie für Influencer
        y += 10;
        
        doc.text("[Unterschrift Unternehmen]", 30, y);
        doc.text("[Unterschrift Influencer]", 120, y);
    }

    // Verbesserte Funktion zum Anzeigen von Checkbox-Optionen
    function renderCheckbox(doc, isChecked, text, x, y) {
        const checkboxSymbol = isChecked ? "☒" : "☐";
        doc.text(checkboxSymbol, x, y);
        doc.text(text, x + 6, y); // 6 Punkte Abstand für bessere Lesbarkeit
        return y;
    }

    // Hauptfunktion zum Generieren des PDFs
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            // Daten aus dem Formular extrahieren
            // Unternehmen (Auftraggeber)
            const companyNameEl = document.getElementById('company-name');
            const companyName = companyNameEl ? companyNameEl.value : '[Name des Unternehmens]';
            
            const companyContactEl = document.getElementById('company-contact');
            const companyContact = companyContactEl ? companyContactEl.value : '[Ansprechpartner]';
            
            const companyStreetEl = document.getElementById('company-street');
            const companyStreet = companyStreetEl ? companyStreetEl.value : '[Straße]';
            
            const companyNumberEl = document.getElementById('company-number');
            const companyNumber = companyNumberEl ? companyNumberEl.value : '[Hausnummer]';
            
            const companyZipEl = document.getElementById('company-zip');
            const companyZip = companyZipEl ? companyZipEl.value : '[PLZ]';
            
            const companyCityEl = document.getElementById('company-city');
            const companyCity = companyCityEl ? companyCityEl.value : '[Stadt]';
            
            const companyCountryEl = document.getElementById('company-country');
            const companyCountry = companyCountryEl ? companyCountryEl.value : '[Land]';
            
            // Influencer (Creator)
            const influencerNameEl = document.getElementById('influencer-name');
            const influencerName = influencerNameEl ? influencerNameEl.value : '[Name des Influencers]';
            
            const influencerStreetEl = document.getElementById('influencer-street');
            const influencerStreet = influencerStreetEl ? influencerStreetEl.value : '[Straße Creator]';
            
            const influencerNumberEl = document.getElementById('influencer-number');
            const influencerNumber = influencerNumberEl ? influencerNumberEl.value : '[Hausnummer Creator]';
            
            const influencerZipEl = document.getElementById('influencer-zip');
            const influencerZip = influencerZipEl ? influencerZipEl.value : '[PLZ Creator]';
            
            const influencerCityEl = document.getElementById('influencer-city');
            const influencerCity = influencerCityEl ? influencerCityEl.value : '[Stadt Creator]';
            
            const influencerCountryEl = document.getElementById('influencer-country');
            const influencerCountry = influencerCountryEl ? influencerCountryEl.value : '[Land Creator]';
            
            // Kunde/Marke (falls vorhanden)
            const clientNameEl = document.getElementById('client-name');
            const clientName = clientNameEl ? clientNameEl.value : '[Name / Marke, Adresse]';
            
            const clientAddressEl = document.getElementById('client-address');
            const clientAddress = clientAddressEl ? clientAddressEl.value : '';
            
            // Plattformen
            const instagramSelectedEl = document.getElementById('platform-instagram');
            const instagramSelected = instagramSelectedEl ? instagramSelectedEl.checked : false;
            
            const instagramUsernameEl = document.getElementById('instagram-username');
            const instagramUsername = instagramUsernameEl ? instagramUsernameEl.value : '[@nutzername]';
            
            const tiktokSelectedEl = document.getElementById('platform-tiktok');
            const tiktokSelected = tiktokSelectedEl ? tiktokSelectedEl.checked : false;
            
            const tiktokUsernameEl = document.getElementById('tiktok-username');
            const tiktokUsername = tiktokUsernameEl ? tiktokUsernameEl.value : '[@nutzername]';
            
            const youtubeSelectedEl = document.getElementById('platform-youtube');
            const youtubeSelected = youtubeSelectedEl ? youtubeSelectedEl.checked : false;
            
            const youtubeUrlEl = document.getElementById('youtube-url');
            const youtubeUrl = youtubeUrlEl ? youtubeUrlEl.value : '[URL]';
            
            const otherSelectedEl = document.getElementById('platform-other');
            const otherSelected = otherSelectedEl ? otherSelectedEl.checked : false;
            
            const otherPlatformEl = document.getElementById('other-platform');
            const otherPlatform = otherPlatformEl ? otherPlatformEl.value : '[frei eintragen]';
            
            // Inhalte
            const storySlidesEl = document.getElementById('story-slides');
            const storySlides = storySlidesEl ? storySlidesEl.value : '[Anzahl]';
            
            const reelsTiktokEl = document.getElementById('reels-tiktok');
            const reelsTiktok = reelsTiktokEl ? reelsTiktokEl.value : '[Anzahl]';
            
            const feedPostsEl = document.getElementById('feed-posts');
            const feedPosts = feedPostsEl ? feedPostsEl.value : '[Anzahl]';
            
            const youtubeVideosEl = document.getElementById('youtube-videos');
            const youtubeVideos = youtubeVideosEl ? youtubeVideosEl.value : '[Anzahl]';
            
            // Zusätzliche Vereinbarungen
            const collabPostEl = document.getElementById('collab-post');
            const collabPost = collabPostEl ? collabPostEl.checked : false;
            
            const companyPublicationEl = document.getElementById('company-publication');
            const companyPublication = companyPublicationEl ? companyPublicationEl.checked : false;
            
            const noCompanyPublicationEl = document.getElementById('no-company-publication');
            const noCompanyPublication = noCompanyPublicationEl ? noCompanyPublicationEl.checked : false;
            
            // Media Buyout
            const mediaBuyoutYesEl = document.getElementById('media-buyout-yes');
            const mediaBuyoutYes = mediaBuyoutYesEl ? mediaBuyoutYesEl.checked : false;
            
            const mediaBuyoutNoEl = document.getElementById('media-buyout-no');
            const mediaBuyoutNo = mediaBuyoutNoEl ? mediaBuyoutNoEl.checked : false;
            
            // Werbekanäle
            const adInstagramEl = document.getElementById('ad-instagram');
            const adInstagram = adInstagramEl ? adInstagramEl.checked : false;
            
            const adFacebookEl = document.getElementById('ad-facebook');
            const adFacebook = adFacebookEl ? adFacebookEl.checked : false;
            
            const adTiktokEl = document.getElementById('ad-tiktok');
            const adTiktok = adTiktokEl ? adTiktokEl.checked : false;
            
            const adOtherEl = document.getElementById('ad-other');
            const adOther = adOtherEl ? adOtherEl.checked : false;
            
            // Werbeoptionen
            const whitelistingEl = document.getElementById('whitelisting');
            const whitelisting = whitelistingEl ? whitelistingEl.checked : false;
            
            const sparkAdEl = document.getElementById('spark-ad');
            const sparkAd = sparkAdEl ? sparkAdEl.checked : false;
            
            // Nutzungsdauer
            let usageDuration = '';
            const duration3El = document.getElementById('duration-3');
            const duration6El = document.getElementById('duration-6');
            const duration12El = document.getElementById('duration-12');
            const durationUnlimitedEl = document.getElementById('duration-unlimited');
            
            if (duration3El && duration3El.checked) usageDuration = '3 Monate';
            else if (duration6El && duration6El.checked) usageDuration = '6 Monate';
            else if (duration12El && duration12El.checked) usageDuration = '12 Monate';
            else if (durationUnlimitedEl && durationUnlimitedEl.checked) usageDuration = 'Unbegrenzt';
            else usageDuration = ''; // Wenn nichts ausgewählt ist
            
            // Zeitplan
            const briefingDateEl = document.getElementById('briefing-date');
            const briefingDate = formatDate(briefingDateEl ? briefingDateEl.value : '') || '[Datum]';
            
            const scriptDateEl = document.getElementById('script-date');
            const scriptDate = formatDate(scriptDateEl ? scriptDateEl.value : '') || '[Datum/Uhrzeit]';
            
            const scriptTimeEl = document.getElementById('script-time');
            const scriptTime = scriptTimeEl ? scriptTimeEl.value : '12:00';
            
            const productionStartEl = document.getElementById('production-start');
            const productionStart = formatDate(productionStartEl ? productionStartEl.value : '') || '[von]';
            
            const productionEndEl = document.getElementById('production-end');
            const productionEnd = formatDate(productionEndEl ? productionEndEl.value : '') || '[bis]';
            
            const productionLocationEl = document.getElementById('production-location');
            const productionLocation = productionLocationEl ? productionLocationEl.value : '[Adresse]';
            
            const deliveryDateEl = document.getElementById('delivery-date');
            const deliveryDate = formatDate(deliveryDateEl ? deliveryDateEl.value : '') || '[Datum]';
            
            const deliveryTimeEl = document.getElementById('delivery-time');
            const deliveryTime = deliveryTimeEl ? deliveryTimeEl.value : '12:00';
            
            const publicationDateEl = document.getElementById('publication-date');
            const publicationDate = formatDate(publicationDateEl ? publicationDateEl.value : '') || '[Datum]';
            
            // Vergütung
            const compensationEl = document.getElementById('compensation');
            const compensation = compensationEl ? compensationEl.value : '[€ Betrag]';
            
            let paymentTerm = '';
            const term14El = document.getElementById('term-14');
            const term30El = document.getElementById('term-30');
            const term45El = document.getElementById('term-45');
            
            if (term14El && term14El.checked) paymentTerm = '14 Tage';
            else if (term30El && term30El.checked) paymentTerm = '30 Tage';
            else if (term45El && term45El.checked) paymentTerm = '45 Tage';
            else paymentTerm = '';
            
            const additionalCompYesEl = document.getElementById('additional-yes');
            const additionalCompYes = additionalCompYesEl ? additionalCompYesEl.checked : false;
            
            const additionalCompNoEl = document.getElementById('additional-no');
            const additionalCompNo = additionalCompNoEl ? additionalCompNoEl.checked : false;
            
            const additionalCompTextEl = document.getElementById('additional-comp-text');
            const additionalCompText = additionalCompTextEl ? additionalCompTextEl.value : '[Textfeld falls ja]';

            // PDF erstellen
            const doc = new jsPDF();
            
            // Deckblatt hinzufügen
            addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry);
            
            // Vertragsinhalt
            let y = 30;
            
            // §1 Vertragsgegenstand
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("§1 Vertragsgegenstand", 30, y);
            y += 10;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich zur Erstellung und Veröffentlichung werblicher Inhalte", 30, y);
            y += 6;
            doc.text("zugunsten des Unternehmens bzw. einer vom Unternehmen vertretenen Marke.", 30, y);
            y += 8;
            
            // Client info falls vorhanden
            const clientInfo = clientAddress ? clientName + ", " + clientAddress : clientName;
            doc.text("Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden " + clientInfo + ".", 30, y);
            y += 6;
            doc.text("Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.", 30, y);
            y += 12;
            
            // §2 Plattformen & Veröffentlichung
            doc.setFont("helvetica", "bold");
            doc.text("§2 Plattformen & Veröffentlichung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", 30, y);
            y += 8;
            
            // Plattformen auflisten - verbesserter Ansatz ohne Unicode-Spacing-Probleme
            if (instagramSelected) {
                doc.text("✓", 30, y);
                doc.text("Instagram (Profil: " + instagramUsername + ")", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("Instagram (Profil: " + instagramUsername + ")", 36, y);
            }
            y += 6;
            
            if (tiktokSelected) {
                doc.text("✓", 30, y);
                doc.text("TikTok (Profil: " + tiktokUsername + ")", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("TikTok (Profil: " + tiktokUsername + ")", 36, y);
            }
            y += 6;
            
            if (youtubeSelected) {
                doc.text("✓", 30, y);
                doc.text("YouTube (Profil: " + youtubeUrl + ")", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("YouTube (Profil: " + youtubeUrl + ")", 36, y);
            }
            y += 6;
            
            if (otherSelected) {
                doc.text("✓", 30, y);
                doc.text("Sonstiges: " + otherPlatform, 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("Sonstiges: " + otherPlatform, 36, y);
            }
            y += 10;
            
            // Inhalte
            doc.text("Folgende Inhalte werden erstellt und veröffentlicht:", 30, y);
            y += 8;
            doc.text("• Story-Slides: " + storySlides, 30, y);
            y += 6;
            doc.text("• Reels / TikTok Videos: " + reelsTiktok, 30, y);
            y += 6;
            doc.text("• Feed-Posts (Bild/Karussell): " + feedPosts, 30, y);
            y += 6;
            doc.text("• YouTube Video: " + youtubeVideos, 30, y);
            y += 10;
            
            // Zusätzliche Vereinbarungen
            doc.text("Zusätzlich wird vereinbart:", 30, y);
            y += 8;
            
            if (collabPost) {
                doc.text("✓", 30, y);
                doc.text("Co-Autoren-Post (Instagram Collab): Ja", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("Co-Autoren-Post (Instagram Collab): Ja", 36, y);
            }
            y += 6;
            
            if (companyPublication) {
                doc.text("✓", 30, y);
                doc.text("Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 36, y);
                y += 6;
                doc.text("eigenem Kanal: Ja", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 36, y);
                y += 6;
                doc.text("eigenem Kanal: Ja", 36, y);
            }
            y += 6;
            
            if (noCompanyPublication) {
                doc.text("✓", 30, y);
                doc.text("Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 36, y);
            } else {
                doc.text("□", 30, y);
                doc.text("Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 36, y);
            }
            
            // Neue Seite für §3
            doc.addPage();
            y = 30;
            
            // §3 Nutzung für Werbung (Media Buyout)
            doc.setFont("helvetica", "bold");
            doc.text("§3 Nutzung für Werbung (Media Buyout)", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", 30, y);
            y += 8;
            
            if (mediaBuyoutYes) {
                doc.text("✓", 30, y);
                doc.text("Ja", 36, y);
                y += 8;
                
                // Kanäle
                doc.text("– Kanäle:", 30, y);
                if (adInstagram) {
                    doc.text("✓", 70, y);
                    doc.text("Instagram", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("Instagram", 76, y);
                }
                
                if (adFacebook) {
                    doc.text("✓", 110, y);
                    doc.text("Facebook", 116, y);
                } else {
                    doc.text("□", 110, y);
                    doc.text("Facebook", 116, y);
                }
                
                if (adTiktok) {
                    doc.text("✓", 150, y);
                    doc.text("TikTok", 156, y);
                } else {
                    doc.text("□", 150, y);
                    doc.text("TikTok", 156, y);
                }
                y += 6;
                
                if (adOther) {
                    doc.text("✓", 70, y);
                    doc.text("Sonstiges", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("Sonstiges", 76, y);
                }
                y += 8;
                
                // Whitelisting
                doc.text("– Whitelisting (Meta):", 30, y);
                if (whitelisting) {
                    doc.text("✓", 70, y);
                    doc.text("Ja", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("Ja", 76, y);
                }
                y += 6;
                
                // Spark Ad
                doc.text("– Spark Ad (TikTok):", 30, y);
                if (sparkAd) {
                    doc.text("✓", 70, y);
                    doc.text("Ja", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("Ja", 76, y);
                }
                y += 6;
                
                // Nutzungsdauer
                doc.text("– Nutzungsdauer:", 30, y);
                if (usageDuration === "3 Monate") {
                    doc.text("✓", 70, y);
                    doc.text("3 Monate", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("3 Monate", 76, y);
                }
                
                if (usageDuration === "6 Monate") {
                    doc.text("✓", 110, y);
                    doc.text("6 Monate", 116, y);
                } else {
                    doc.text("□", 110, y);
                    doc.text("6 Monate", 116, y);
                }
                
                if (usageDuration === "12 Monate") {
                    doc.text("✓", 150, y);
                    doc.text("12 Monate", 156, y);
                } else {
                    doc.text("□", 150, y);
                    doc.text("12 Monate", 156, y);
                }
                y += 6;
                
                if (usageDuration === "Unbegrenzt") {
                    doc.text("✓", 70, y);
                    doc.text("Unbegrenzt", 76, y);
                } else {
                    doc.text("□", 70, y);
                    doc.text("Unbegrenzt", 76, y);
                }
                
            } else {
                doc.text("□", 30, y);
                doc.text("Ja", 36, y);
                y += 8;
                doc.text("✓", 30, y);
                doc.text("Nein", 36, y);
                y += 6;
                doc.text("→ Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung", 30, y);
                y += 6;
                doc.text("genutzt werden.", 30, y);
            }
            y += 12;
            
            // §4 Rechteübertragung
            doc.setFont("helvetica", "bold");
            doc.text("§4 Rechteübertragung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Nur bei Zustimmung zur Nutzung für Werbung (§3) überträgt der Influencer dem", 30, y);
            y += 6;
            doc.text("Unternehmen für die gewählte Nutzungsdauer ein einfaches Nutzungsrecht an den", 30, y);
            y += 6;
            doc.text("erstellten Inhalten zur Verwendung in den vereinbarten Kanälen. Das Unternehmen ist", 30, y);
            y += 6;
            doc.text("berechtigt, die Inhalte dem benannten Kunden zur Nutzung zu überlassen.", 30, y);
            y += 8;
            doc.text("Die Inhalte dürfen technisch angepasst und bearbeitet werden. Die Weitergabe an", 30, y);
            y += 6;
            doc.text("sonstige Dritte ist nicht gestattet. Nach Ablauf der Nutzungsdauer erlischt das", 30, y);
            y += 6;
            doc.text("Nutzungsrecht.", 30, y);
            y += 12;
            
            // §5 Produktion & Freigabe
            doc.setFont("helvetica", "bold");
            doc.text("§5 Produktion & Freigabe", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Briefing: Das Briefing wird vom Unternehmen bis " + briefingDate + " bereitgestellt.", 30, y);
            y += 8;
            
            if (scriptDate && scriptDate !== '[Datum/Uhrzeit]') {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis " + scriptDate + "/" + scriptTime + ".", 30, y);
            } else {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis [Datum/Uhrzeit].", 30, y);
            }
            y += 8;
            
            // Produktion
            doc.text("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd, 30, y);
            if (productionLocation && productionLocation !== '[Adresse]') {
                doc.text(", ggf. am Produktionsort", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
                y += 6;
                doc.text(productionLocation + ".", 30, y);
            } else {
                doc.text(".", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
            }
            y += 8;
            
            // Überprüfen, ob wir eine neue Seite benötigen
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // Abgabe
            doc.text("Abgabe: Die finale Content-Abgabe erfolgt bis " + deliveryDate + "/" + deliveryTime + ".", 30, y);
            y += 8;
            
            // Veröffentlichung
            doc.text("Veröffentlichung: Geplanter Veröffentlichungstermin: " + publicationDate, 30, y);
            y += 8;
            
            doc.text("Maximal zwei Korrekturschleifen sind vereinbart. Eine Produktion darf erst nach", 30, y);
            y += 6;
            doc.text("Freigabe durch das Unternehmen erfolgen.", 30, y);
            y += 8;
            
            doc.text("Exklusivität am Tag der Veröffentlichung:", 30, y);
            y += 6;
            doc.text("Der Creator verpflichtet sich am Tag der Veröffentlichung für keine andere Marke", 30, y);
            y += 6;
            doc.text("Werbung auf dem Kanal zu platzieren.", 30, y);
            y += 12;
            
            // §6 Vergütung
            doc.setFont("helvetica", "bold");
            doc.text("§6 Vergütung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Nettovergütung beträgt " + compensation + ".", 30, y);
            y += 8;
            
            doc.text("Die Rechnungsstellung erfolgt nach Veröffentlichung.", 30, y);
            y += 8;
            
            // Zahlungsziel
            doc.text("Das Zahlungsziel beträgt ", 30, y);
            if (paymentTerm === "14 Tage") {
                doc.text("✓ 14 Tage ", 160, y, null, null, "right");
            } else {
                doc.text("□ 14 Tage ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (paymentTerm === "30 Tage") {
                doc.text("✓ 30 Tage ", 160, y, null, null, "right");
            } else {
                doc.text("□ 30 Tage ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (paymentTerm === "45 Tage") {
                doc.text("✓ 45 Tage.", 160, y, null, null, "right");
            } else {
                doc.text("□ 45 Tage.", 160, y, null, null, "right");
            }
            y += 8;
            
            // Zusätzliche Vergütung
            doc.text("Eine zusätzliche Vergütung ", 30, y);
            if (additionalCompNo) {
                doc.text("✓ ist nicht ", 160, y, null, null, "right");
            } else {
                doc.text("□ ist nicht ", 160, y, null, null, "right");
            }
            
            y += 6;
            if (additionalCompYes) {
                doc.text("✓ ist vereinbart: " + additionalCompText, 160, y, null, null, "right");
            } else {
                doc.text("□ ist vereinbart: " + additionalCompText, 160, y, null, null, "right");
            }
            y += 8;
            
            doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §7 Qualität & Upload
            doc.setFont("helvetica", "bold");
            doc.text("§7 Qualität & Upload", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Inhalte sind in hochwertiger Bild- und Tonqualität zu erstellen. Untertitel und", 30, y);
            y += 6;
            doc.text("Grafiken sind korrekt zu platzieren. Der Upload erfolgt ausschließlich via Drive,", 30, y);
            y += 6;
            doc.text("WeTransfer oder E-Mail (kein Messenger). Dateibenennung:", 30, y);
            y += 6;
            doc.text("[Unternehmen_Creator_VideoX_VersionY]", 30, y);
            y += 12;
            
            // §8 Rechte Dritter & Musik
            doc.setFont("helvetica", "bold");
            doc.text("§8 Rechte Dritter & Musik", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer darf keine fremden Marken, Logos oder Namen ohne Zustimmung", 30, y);
            y += 6;
            doc.text("verwenden. Persönlichkeitsrechte Dritter dürfen nicht verletzt werden. Bei Nutzung", 30, y);
            y += 6;
            doc.text("lizenzfreier Musik ist die Quelle anzugeben. Für alle Verstöße haftet der Influencer.", 30, y);
            y += 12;
            
            // §9 Werbekennzeichnung & Exklusivität
            doc.setFont("helvetica", "bold");
            doc.text("§9 Werbekennzeichnung & Exklusivität", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung", 30, y);
            y += 6;
            // Reguläre Anführungszeichen für die Darstellung
            doc.text('("Werbung" / "Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die', 30, y);
            y += 6;
            doc.text("entstandenen Schäden.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §10 Verbindlichkeit Briefing & Skript
            doc.setFont("helvetica", "bold");
            doc.text("§10 Verbindlichkeit Briefing & Skript", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich, die im Briefing festgelegten Do's and Don'ts sowie alle", 30, y);
            y += 6;
            doc.text("sonstigen schriftlichen Vorgaben und das ggf. freigegebene Skript vollständig", 30, y);
            y += 6;
            doc.text("einzuhalten.", 30, y);
            y += 8;
            
            doc.text("Bei Verstoß kann das Unternehmen:", 30, y);
            y += 6;
            doc.text("1. Nachbesserung verlangen", 30, y);
            y += 6;
            doc.text("2. eine Neuproduktion auf eigene Kosten fordern", 30, y);
            y += 6;
            doc.text("3. bei wiederholtem Verstoß vom Vertrag zurücktreten", 30, y);
            y += 8;
            
            doc.text("Vergütung entfällt bei Nichterfüllung.", 30, y);
            y += 12;
            
            // §11 Datenschutz & Vertraulichkeit
            doc.setFont("helvetica", "bold");
            doc.text("§11 Datenschutz & Vertraulichkeit", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Beide Parteien verpflichten sich zur Einhaltung der DSGVO. Daten werden", 30, y);
            y += 6;
            doc.text("ausschließlich zur Vertragserfüllung genutzt. Vertraulichkeit gilt auch über das", 30, y);
            y += 6;
            doc.text("Vertragsende hinaus.", 30, y);
            y += 12;
            
            // Neue Seite wenn nötig
            if (y > 250) {
                doc.addPage();
                y = 30;
            }
            
            // §12 Schlussbestimmungen
            doc.setFont("helvetica", "bold");
            doc.text("§12 Schlussbestimmungen", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Änderungen bedürfen der Schriftform. Gerichtsstand ist " + companyCity + ". Es gilt das Recht der", 30, y);
            y += 6;
            doc.text("Bundesrepublik Deutschland. Sollte eine Bestimmung unwirksam sein, bleibt der", 30, y);
            y += 6;
            doc.text("Vertrag im Übrigen wirksam.", 30, y);
            y += 30;
            
            // Unterschriftsfelder hinzufügen
            addSignatureFields(doc);
            
            // Wasserzeichen hinzufügen
            addWatermark(doc);
            
            // PDF speichern
            doc.save('influencer-marketing-vertrag.pdf');
            console.log('PDF saved successfully');
            
            // Erfolgsanzeige - mit Null-Check
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.remove('hidden');
            } else {
                console.log("Element 'success-animation' nicht gefunden. Erfolgsanimation kann nicht angezeigt werden.");
            }
            
        } catch (error) {
            console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
            alert('Beim Generieren des PDFs ist ein Fehler aufgetreten: ' + error.message);
        }
    }
    
    // Helfer-Funktion zum Formatieren von Datumsangaben
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }
    
    // Event-Listener für den "Vertrag generieren"-Button
    const generateContractButton = document.getElementById('generate-contract');
    if (generateContractButton) {
        generateContractButton.addEventListener('click', function() {
            console.log('Generate contract button clicked');
            
            // Prüfen, ob Pflichtfelder ausgefüllt sind
            const requiredFields = document.querySelectorAll('.form-input-field[required]');
            let allFilled = true;
            
            requiredFields.forEach(field => {
                if (field.value.trim() === '') {
                    allFilled = false;
                    field.classList.add('error');
                }
            });
            
            if (!allFilled) {
                alert('Bitte fülle alle erforderlichen Felder aus, bevor du den Vertrag generierst.');
                return;
            }
            
            generatePDF();
        });
    } else {
        console.log("Element 'generate-contract' nicht gefunden. Button-Ereignisbehandlung konnte nicht hinzugefügt werden.");
    }
    
    // Event-Listener für den Download-Button
    const downloadButton = document.getElementById('download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            const successAnimation = document.getElementById('success-animation');
            if (successAnimation) {
                successAnimation.classList.add('hidden');
            }
        });
    } else {
        console.log("Element 'download-button' nicht gefunden. Button-Ereignisbehandlung konnte nicht hinzugefügt werden.");
    }
});
