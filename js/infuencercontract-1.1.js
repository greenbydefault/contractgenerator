document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Influencer Script vollständig geladen und bereit.");

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
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text('zwischen', 105, 90, null, null, 'center');
        
        // Unternehmen
        let y = 100;
        doc.text(companyName, 105, y, null, null, 'center');
        y += 6;
        doc.text(`Vertreten durch: ${companyContact}`, 105, y, null, null, 'center');
        y += 6;
        doc.text(`${companyStreet} ${companyNumber}`, 105, y, null, null, 'center');
        y += 6;
        doc.text(`${companyZip} ${companyCity}`, 105, y, null, null, 'center');
        y += 6;
        doc.text(companyCountry, 105, y, null, null, 'center');
        y += 10;
        doc.text('- im Folgenden kurz "Unternehmen" genannt –', 105, y, null, null, 'center');
        y += 20;
        doc.text('und', 105, y, null, null, 'center');
        
        // Influencer
        y += 10;
        doc.text(influencerName, 105, y, null, null, 'center');
        y += 6;
        doc.text(`${influencerStreet} ${influencerNumber}`, 105, y, null, null, 'center');
        y += 6;
        doc.text(`${influencerZip} ${influencerCity}`, 105, y, null, null, 'center');
        y += 6;
        doc.text(influencerCountry, 105, y, null, null, 'center');
        y += 20;
        doc.text('- im Folgenden kurz "Influencer" genannt -', 105, y, null, null, 'center');
        
        // Nächste Seite für Inhaltsverzeichnis und Vertragstext
        doc.addPage();
    }

    // Funktion zum Hinzufügen von Unterschriftenfeldern
    function addSignatureFields(doc) {
        // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
        let y = doc.internal.pageSize.height - 50; // 50 Einheiten vom unteren Rand

        // Allgemeine Einstellungen für die Position
        const leftColumnX = 30; // X-Position für das linke Feld (Unternehmen)
        const rightColumnX = doc.internal.pageSize.width / 2 + 20; // X-Position für das rechte Feld (Influencer)
        doc.setFontSize(9);
        
        // Text für das Unternehmen
        doc.text("Ort:", leftColumnX, y);
        doc.text("Datum:", leftColumnX, y + 10);
        doc.text("Unterschrift:", leftColumnX, y + 20);
        // Linie für die Unterschrift des Unternehmens
        doc.line(leftColumnX, y + 25, leftColumnX + 60, y + 25); // Unterschriftlinie

        // Text für den Influencer
        doc.text("Ort:", rightColumnX, y);
        doc.text("Datum:", rightColumnX, y + 10);
        doc.text("Unterschrift:", rightColumnX, y + 20);
        // Linie für die Unterschrift des Influencers
        doc.line(rightColumnX, y + 25, rightColumnX + 60, y + 25); // Unterschriftlinie
    }

    // Funktion zum Hinzufügen des Inhaltsverzeichnisses
    function addTableOfContents(doc, y) {
        y += 30;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Inhaltsverzeichnis", 30, y);
        y += 10;

        const contents = [
            "§1 Vertragsgegenstand                                                                 3",
            "§2 Plattformen & Veröffentlichung                                                    3",
            "§3 Nutzung für Werbung (Media Buyout)                                                4",
            "§4 Rechteübertragung                                                                 4",
            "§5 Produktion & Freigabe                                                             5",
            "§6 Vergütung                                                                         6",
            "§7 Qualität & Upload                                                                 6",
            "§8 Rechte Dritter & Musik                                                            7",
            "§9 Werbekennzeichnung & Exklusivität                                                 7",
            "§10 Verbindlichkeit Briefing & Skript                                                8",
            "§11 Datenschutz & Vertraulichkeit                                                    8",
            "§12 Schlussbestimmungen                                                              9"
        ];

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        contents.forEach(line => {
            doc.text(line, 30, y);
            y += 6;
        });
        return y;
    }

    // Hauptfunktion zum Generieren des PDFs
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
            // Daten aus dem Formular extrahieren
            // Unternehmen (Auftraggeber)
            const companyName = document.getElementById('company-name').value || '[Name des Unternehmens]';
            const companyContact = document.getElementById('company-contact').value || '[Ansprechpartner]';
            const companyStreet = document.getElementById('company-street').value || '[Straße]';
            const companyNumber = document.getElementById('company-number').value || '[Hausnummer]';
            const companyZip = document.getElementById('company-zip').value || '[PLZ]';
            const companyCity = document.getElementById('company-city').value || '[Stadt]';
            const companyCountry = document.getElementById('company-country').value || 'Deutschland';
            
            // Influencer (Creator)
            const influencerName = document.getElementById('influencer-name').value || '[Name des Influencers]';
            const influencerStreet = document.getElementById('influencer-street').value || '[Straße Creator]';
            const influencerNumber = document.getElementById('influencer-number').value || '[Hausnummer Creator]';
            const influencerZip = document.getElementById('influencer-zip').value || '[PLZ Creator]';
            const influencerCity = document.getElementById('influencer-city').value || '[Stadt Creator]';
            const influencerCountry = document.getElementById('influencer-country').value || 'Deutschland';
            
            // Kunde/Marke (falls vorhanden)
            const clientName = document.getElementById('client-name').value;
            const clientAddress = document.getElementById('client-address').value;
            
            // Plattformen
            const instagramSelected = document.getElementById('platform-instagram').checked;
            const instagramUsername = document.getElementById('instagram-username').value || '[@nutzername]';
            const tiktokSelected = document.getElementById('platform-tiktok').checked;
            const tiktokUsername = document.getElementById('tiktok-username').value || '[@nutzername]';
            const youtubeSelected = document.getElementById('platform-youtube').checked;
            const youtubeUrl = document.getElementById('youtube-url').value || '[URL]';
            const otherSelected = document.getElementById('platform-other').checked;
            const otherPlatform = document.getElementById('other-platform').value || '[frei eintragen]';
            
            // Inhalte
            const storySlides = document.getElementById('story-slides').value || '0';
            const reelsTiktok = document.getElementById('reels-tiktok').value || '0';
            const feedPosts = document.getElementById('feed-posts').value || '0';
            const youtubeVideos = document.getElementById('youtube-videos').value || '0';
            
            // Zusätzliche Vereinbarungen
            const collabPost = document.getElementById('collab-post').checked;
            const companyPublication = document.getElementById('company-publication').checked;
            const noCompanyPublication = document.getElementById('no-company-publication').checked;
            
            // Media Buyout
            const mediaBuyoutYes = document.getElementById('media-buyout-yes').checked;
            const mediaBuyoutNo = document.getElementById('media-buyout-no').checked;
            
            // Werbekanäle
            const adInstagram = document.getElementById('ad-instagram')?.checked;
            const adFacebook = document.getElementById('ad-facebook')?.checked;
            const adTiktok = document.getElementById('ad-tiktok')?.checked;
            const adOther = document.getElementById('ad-other')?.checked;
            
            // Werbeoptionen
            const whitelisting = document.getElementById('whitelisting')?.checked;
            const sparkAd = document.getElementById('spark-ad')?.checked;
            
            // Nutzungsdauer
            let usageDuration = '';
            if (document.getElementById('duration-3')?.checked) usageDuration = '3 Monate';
            else if (document.getElementById('duration-6')?.checked) usageDuration = '6 Monate';
            else if (document.getElementById('duration-12')?.checked) usageDuration = '12 Monate';
            else if (document.getElementById('duration-unlimited')?.checked) usageDuration = 'Unbegrenzt';
            
            // Zeitplan
            const briefingDate = formatDate(document.getElementById('briefing-date').value) || '[Datum]';
            const scriptDate = formatDate(document.getElementById('script-date').value) || '[Datum]';
            const scriptTime = document.getElementById('script-time').value || '12:00';
            const productionStart = formatDate(document.getElementById('production-start').value) || '[von]';
            const productionEnd = formatDate(document.getElementById('production-end').value) || '[bis]';
            const productionLocation = document.getElementById('production-location').value;
            const deliveryDate = formatDate(document.getElementById('delivery-date').value) || '[Datum]';
            const deliveryTime = document.getElementById('delivery-time').value || '12:00';
            const publicationDate = formatDate(document.getElementById('publication-date').value) || '[Datum]';
            
            // Vergütung
            const compensation = document.getElementById('compensation').value || '[€ Betrag]';
            let paymentTerm = '';
            if (document.getElementById('term-14').checked) paymentTerm = '14 Tage';
            else if (document.getElementById('term-30').checked) paymentTerm = '30 Tage';
            else if (document.getElementById('term-45').checked) paymentTerm = '45 Tage';
            
            const additionalCompYes = document.getElementById('additional-yes')?.checked;
            const additionalCompText = document.getElementById('additional-comp-text')?.value || '';

            // PDF erstellen
            const doc = new jsPDF();
            
            // Logo hinzufügen (optional, falls du ein Logo hast)
            // const imgData = 'data:image/jpeg;base64,...'; // Hier dein Logo als Base64-String
            // doc.addImage(imgData, 'JPEG', 88, 30, 32, 32);
            
            // Deckblatt hinzufügen
            addCoverPage(doc, companyName, companyContact, companyStreet, companyNumber, companyZip, companyCity, companyCountry, influencerName, influencerStreet, influencerNumber, influencerZip, influencerCity, influencerCountry);
            
            // Inhaltsverzeichnis
            let y = 10;
            y = addTableOfContents(doc, y);
            
            // Hauptteil des Vertrags
            doc.addPage();
            y = 20;
            
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
            if (clientName || clientAddress) {
                doc.text("Das Unternehmen handelt dabei als bevollmächtigte Agentur des Kunden " + 
                         clientName + (clientAddress ? ", " + clientAddress : "") + ".", 30, y);
                y += 6;
                doc.text("Alle Leistungen erfolgen im Namen und auf Rechnung des Unternehmens.", 30, y);
                y += 8;
            }
            
            // §2 Plattformen & Veröffentlichung
            doc.setFont("helvetica", "bold");
            doc.text("§2 Plattformen & Veröffentlichung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Veröffentlichung der Inhalte erfolgt auf folgenden Plattformen:", 30, y);
            y += 8;
            
            // Plattformen auflisten
            if (instagramSelected) {
                doc.text("☒ Instagram (Profil: " + instagramUsername + ")", 30, y);
            } else {
                doc.text("☐ Instagram", 30, y);
            }
            y += 6;
            
            if (tiktokSelected) {
                doc.text("☒ TikTok (Profil: " + tiktokUsername + ")", 30, y);
            } else {
                doc.text("☐ TikTok", 30, y);
            }
            y += 6;
            
            if (youtubeSelected) {
                doc.text("☒ YouTube (Profil: " + youtubeUrl + ")", 30, y);
            } else {
                doc.text("☐ YouTube", 30, y);
            }
            y += 6;
            
            if (otherSelected) {
                doc.text("☒ Sonstiges: " + otherPlatform, 30, y);
            } else {
                doc.text("☐ Sonstiges", 30, y);
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
                doc.text("☒ Co-Autoren-Post (Instagram Collab): Ja", 30, y);
            } else {
                doc.text("☐ Co-Autoren-Post (Instagram Collab): Nein", 30, y);
            }
            y += 6;
            
            if (companyPublication) {
                doc.text("☒ Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
                y += 6;
                doc.text("eigenem Kanal: Ja", 30, y);
            } else {
                doc.text("☐ Veröffentlichung des Contents durch das Unternehmen / den Kunden auf dessen", 30, y);
                y += 6;
                doc.text("eigenem Kanal: Nein", 30, y);
            }
            y += 6;
            
            if (noCompanyPublication) {
                doc.text("☒ Keine zusätzliche Veröffentlichung durch das Unternehmen: Ja", 30, y);
            } else {
                doc.text("☐ Keine zusätzliche Veröffentlichung durch das Unternehmen: Nein", 30, y);
            }
            y += 10;
            
            // Neue Seite für §3
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
            // §3 Nutzung für Werbung (Media Buyout)
            doc.setFont("helvetica", "bold");
            doc.text("§3 Nutzung für Werbung (Media Buyout)", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Darf der erstellte Content für Werbezwecke genutzt werden?", 30, y);
            y += 8;
            
            if (mediaBuyoutYes) {
                doc.text("☒ Ja", 30, y);
                y += 8;
                
                // Kanäle
                doc.text("– Kanäle:", 30, y);
                y += 6;
                doc.text(adInstagram ? "☒ Instagram" : "☐ Instagram", 40, y);
                doc.text(adFacebook ? "☒ Facebook" : "☐ Facebook", 90, y);
                doc.text(adTiktok ? "☒ TikTok" : "☐ TikTok", 140, y);
                y += 6;
                doc.text(adOther ? "☒ Sonstiges" : "☐ Sonstiges", 40, y);
                y += 8;
                
                // Whitelisting
                doc.text("– Whitelisting (Meta): " + (whitelisting ? "☒ Ja" : "☐ Ja"), 30, y);
                y += 6;
                
                // Spark Ad
                doc.text("– Spark Ad (TikTok): " + (sparkAd ? "☒ Ja" : "☐ Ja"), 30, y);
                y += 6;
                
                // Nutzungsdauer
                doc.text("– Nutzungsdauer: " + usageDuration, 30, y);
                y += 6;
            } else {
                doc.text("☒ Nein", 30, y);
                y += 8;
                doc.text("→ Inhalte verbleiben ausschließlich beim Influencer und dürfen nicht für Werbung", 30, y);
                y += 6;
                doc.text("genutzt werden.", 30, y);
                y += 6;
            }
            y += 8;
            
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
            y += 10;
            
            // Neue Seite für §5
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
            // §5 Produktion & Freigabe
            doc.setFont("helvetica", "bold");
            doc.text("§5 Produktion & Freigabe", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Briefing: Das Briefing wird vom Unternehmen bis " + briefingDate + " bereitgestellt.", 30, y);
            y += 8;
            
            if (scriptDate) {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis " + scriptDate + "/" + scriptTime + ".", 30, y);
            } else {
                doc.text("Skript: Sofern vereinbart, erstellt der Influencer ein Skript und übermittelt es zur", 30, y);
                y += 6;
                doc.text("Freigabe bis [Datum/Uhrzeit].", 30, y);
            }
            y += 8;
            
            doc.text("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd, 30, y);
            if (productionLocation) {
                doc.text(", ggf. am Produktionsort", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
                y += 6;
                doc.text(productionLocation + ".", 30, y);
            } else {
                doc.text(".", 30 + doc.getTextWidth("Produktion: Die Produktion erfolgt im Zeitraum " + productionStart + " – " + productionEnd), y);
            }
            y += 8;
            
            doc.text("Abgabe: Die finale Content-Abgabe erfolgt bis " + deliveryDate + "/" + deliveryTime + ".", 30, y);
            y += 8;
            
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
            y += 10;
            
            // Neue Seite für §6
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
            // §6 Vergütung
            doc.setFont("helvetica", "bold");
            doc.text("§6 Vergütung", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Die Nettovergütung beträgt € " + compensation + ".", 30, y);
            y += 8;
            
            doc.text("Die Rechnungsstellung erfolgt nach Veröffentlichung.", 30, y);
            y += 8;
            
            doc.text("Das Zahlungsziel beträgt " + paymentTerm + ".", 30, y);
            y += 8;
            
            if (additionalCompYes) {
                doc.text("Eine zusätzliche Vergütung ist vereinbart: " + additionalCompText, 30, y);
            } else {
                doc.text("Eine zusätzliche Vergütung ist nicht vereinbart.", 30, y);
            }
            y += 8;
            
            doc.text("Bei Nichterfüllung entfällt die Vergütungspflicht.", 30, y);
            y += 10;
            
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
            y += 10;
            
            // Neue Seite für §8
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
            
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
            y += 10;
            
            // §9 Werbekennzeichnung & Exklusivität
            doc.setFont("helvetica", "bold");
            doc.text("§9 Werbekennzeichnung & Exklusivität", 30, y);
            y += 10;
            doc.setFont("helvetica", "normal");
            doc.text("Der Influencer verpflichtet sich zur ordnungsgemäßen Werbekennzeichnung", 30, y);
            y += 6;
            doc.text("(„Werbung" / „Anzeige"). Bei einem Verstoß dagegen, haftet der Influencer für die", 30, y);
            y += 6;
            doc.text("entstandenen Schäden.", 30, y);
            y += 10;
            
            // Neue Seite für §10
            if (y > 240) {
                doc.addPage();
                y = 20;
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
            y += 10;
            
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
            y += 10;
            
            // Neue Seite für §12
            if (y > 240) {
                doc.addPage();
                y = 20;
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
            y += 20;
            
            // Unterschriftsfelder hinzufügen
            addSignatureFields(doc);
            
            // Wasserzeichen hinzufügen
            addWatermark(doc);
            
            // PDF speichern
            doc.save('influencer-marketing-vertrag.pdf');
            console.log('PDF saved successfully');
            
            // Erfolgsanzeige
            document.getElementById('success-animation').classList.remove('hidden');
            
        } catch (error) {
            console.error('Ein Fehler ist während der PDF-Generierung aufgetreten:', error);
        }
    }
    
    // Helfer-Funktion zum Formatieren von Datumsangaben
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    }
    
    // Event-Listener für den "Vertrag generieren"-Button
    document.getElementById('generate-contract').addEventListener('click', function() {
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
    
    // Event-Listener für den Download-Button
    document.getElementById('download-button').addEventListener('click', function() {
        document.getElementById('success-animation').classList.add('hidden');
    });
});
