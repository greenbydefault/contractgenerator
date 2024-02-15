document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");

    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return;
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }
function addWatermark(doc) {
    const totalPages = doc.internal.getNumberOfPages();

    // Setze Schriftart und Größe für das Wasserzeichen
    doc.setFont('helvetica');
    doc.setFontSize(7);
    doc.setTextColor(130); // Graue Farbe für das Wasserzeichen

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        // Berechne die X- und Y-Position für das Wasserzeichen, um es in den unteren Ecken zu platzieren
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

        // Optional: Setze das Wasserzeichen auch in die untere rechte Ecke
        const watermarkTextWidth = doc.getTextWidth('Created with creatorjobs.com');
        doc.text('Created with creatorjobs.com', pageWidth - watermarkTextWidth - 10, pageHeight - 10);
    }
}
function addCoverPage(doc, brandName, brandStreet, brandHouseNumber, brandPLZ, brandCity, brandCountry, creatorName, creatorStreet, creatorHouseNumber, creatorPLZ, creatorCity, creatorCountry) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text('Kooperationsvertrag', 105, 80, null, null, 'center');
    doc.setFont("helvetica", "normal");	
    doc.setFontSize(12);
    doc.text('zwischen', 105, 90, null, null, 'center');
    // Unternehmen
    let y = 100;
    doc.text(brandName, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${brandStreet} ${brandHouseNumber}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${brandPLZ} ${brandCity}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(brandCountry, 105, y, null, null, 'center');
    y += 10;
    doc.text('- im Folgenden kurz "Unternehmen" genannt –', 105, y, null, null, 'center');
    y += 20;	
    doc.text('und', 105, y, null, null, 'center');
    // Creator
    y += 10;
    doc.text(creatorName, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${creatorStreet} ${creatorHouseNumber}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(`${creatorPLZ} ${creatorCity}`, 105, y, null, null, 'center');
    y += 6;
    doc.text(creatorCountry, 105, y, null, null, 'center');
    y += 20;
    doc.text('- im Folgenden kurz "Creator" genannt -', 105, y, null, null, 'center');
    
    // Nächste Seite für Inhaltsverzeichnis und Vertragstext
    doc.addPage();
}
 function addSignatureFields(doc) {
    // Stellen Sie sicher, dass wir am Ende des Dokuments arbeiten
    //doc.addPage(); // Fügen Sie diese Zeile hinzu, wenn Sie möchten, dass die Unterschriftenseite eine eigene Seite ist

    // Setzen der Y-Position für den Beginn der Unterschriftenfelder
    let y = doc.internal.pageSize.height - 160; // Beispiel: 90 Einheiten vom unteren Rand

    // Allgemeine Einstellungen für die Position
    const leftColumnX = 30; // X-Position für das linke Feld (Brand)
    const rightColumnX = doc.internal.pageSize.width / 2 + 20; // X-Position für das rechte Feld (Creator), basierend auf der Seitenbreite
    doc.setFontSize(9);
    // Text für das Brand
    doc.text("Ort:", leftColumnX, y);
    doc.text("Datum:", leftColumnX, y + 10);
    doc.text("Unterschrift:", leftColumnX, y + 20);
    // Linie für die Unterschrift des Brands
    doc.line(leftColumnX, y + 25, leftColumnX + 60, y + 25); // Unterschriftlinie

    // Text für den Creator
    doc.text("Ort:", rightColumnX, y);
    doc.text("Datum:", rightColumnX, y + 10);
    doc.text("Unterschrift:", rightColumnX, y + 20);
    // Linie für die Unterschrift des Creators
    doc.line(rightColumnX, y + 25, rightColumnX + 60, y + 25); // Unterschriftlinie
}

	
function addTableOfContents(doc, y) {
    y += 30;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Inhaltsverzeichnis", 30, y);
    y += 10;

    const contents = [
        "1. Rechte und Pflichten des Creators								         3",
            "	 1.1. Verpflichtung zur Erstellung von Content 						   3",
	    "	 1.2. Verpflichtung zur Erstellung von Content 						   3",
	    "	 1.3. Verpflichtung zur Einhaltung von Deadlines 					      4",
	    "	 1.4. Verpflichtung zur Erstellung von Skripten   					        4",
		    "	 1.5. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos                 5",
	    "	 1.6. Verpflichtung zur Anpassung am erstellten Inhalt 				      5",
	    "	 1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung	          6",
	 "2. Rechte und Pflichten des Unternehmens							        7",	
	 "3. Vertragsdauer, Beendigung, Nutzungsrecht							   7",   
	 "4. Vertraulichkeit, Geheimhaltung 								              8",
	 "5. Datenschutz 											                   8", 
         "6. Sonstiges												                8", 
    ];

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    contents.forEach(line => {
        doc.text(line, 30, y);
        y += 6;
    });
    return y;
}
	
    function generatePDF() {
        console.log('Starting PDF generation');
        try {
			const selectValue = document.getElementById('vertrag-type-select').value;
            		const brandName = document.getElementById('vertrag-brandname').value;
			const brandStreet = document.getElementById('vertrag-brand-street').value;
			const brandHouseNumber = document.getElementById('vertrag-brand-housenumber').value;
			const brandPLZ = document.getElementById('vertrag-brand-plz').value;
			const brandCity = document.getElementById('vertrag-brand-city').value;
			const brandCountry = document.getElementById('vertrag-brand-country').value;
			const anzahlVideos = document.getElementById('vertrag-anzahl-video').value;
			const videoDauer = document.getElementById('vertrag-video-dauer').value;
			const abgabeScript = document.getElementById('vertrag-abgabe-script').value;
			const abgabeContent = document.getElementById('vertrag-abgabe-content').value;
			const abgabeKorrektur = document.getElementById('vertrag-abgabe-korrektur').value;
			const abgabeZweiteKorrektur = document.getElementById('vertrag-abgabe-zweite-korrektur').value;
			const jobBezahlung = document.getElementById('vertrag-job-bezahlung').value;
			const jobDauer = document.getElementById('vertrag-video-nutzungsdauer').value;
		        // Creator Daten
			const creatorName = document.getElementById('vertrag-creator-name').value;
			const creatorStreet = document.getElementById('vertrag-creator-street').value;
			const creatorHouseNumber = document.getElementById('vertrag-creator-housenumber').value;
			const creatorPLZ = document.getElementById('vertrag-creator-plz').value;
			const creatorCity = document.getElementById('vertrag-creator-city').value;
			const creatorCountry = document.getElementById('vertrag-creator-country').value;
			//Adressdaten
			let contractualRightName, contractualRightsStreet, contractualRightsHouseNumber, contractualRightsPLZ, contractualRightsCity, contractualRightsCountry;
			if (selectValue === 'Ja') {
			        // Verwende die Daten von 'vertrag-kunde-' Feldern für den unteren Teil
			        contractualRightName = document.getElementById('vertrag-kunde-name').value;
			        contractualRightsStreet = document.getElementById('vertrag-kunde-street').value;
				contractualRightsNumber = document.getElementById('vertrag-kunde-housenumber').value;
				contractualRightsPLZ = document.getElementById('vertrag-kunde-plz').value;
				contractualRightsCity = document.getElementById('vertrag-kunde-city').value;
				contractualRightsCountry = document.getElementById('vertrag-kunde-country').value;
			        // ...setze dies fort für die anderen benötigten Felder
			} else {
			        // Verwende die gleichen Daten wie für das Deckblatt
			        contractualRightName = brandName;
				contractualRightsStreet = brandStreet
				contractualRightsHouseNumber = brandHouseNumber
				contractualRightsPLZ = brandPLZ
				contractualRightsCity = brandCity
				contractualRightsCountry = brandCountry
			        // ...setze dies fort für die anderen benötigten Felder
		  	  }
            // Fügen Sie hier alle weiteren Variablen ein, die Sie aus dem Formular holen möchten

            const doc = new jsPDF();
	    addCoverPage(doc, brandName, brandStreet, brandHouseNumber, brandPLZ, brandCity, brandCountry, creatorName, creatorStreet, creatorHouseNumber, creatorPLZ, creatorCity, creatorCountry, jobBezahlung);
            console.log('jsPDF instance created');
            doc.setFont("Helvetica");
            doc.setFontSize(10);
	    doc.setCharSpace(5);
	    let y = 10;
            y = addTableOfContents(doc, y);
            doc.addPage();
			// Define the static parts of the contract and insert dynamic values
			const contractText = [
				"1. Rechte und Pflichten des Creators",
				"1.1. Verpflichtung zur Erstellung von Content",
				"        1.1.1. Der Creator verpflichtet sich, gemäß dem Briefing für das",
				"                  Unternehmen User-Generated-Content Videos zu erstellen.",
				`        1.1.2. Die Anzahl der Videos beläuft sich auf: ${anzahlVideos} Videos mit einer`,
				`                  Länge von ${videoDauer} Sekunden.`,
				`        1.1.3. Der Creator erhält eine Festpreisvergütung von ${jobBezahlung} € netto für die`,
				"                  genannten Leistungen.",
				"        1.1.4. Der Content Creator erklärt sich damit einverstanden, sämtliche",
				"                  Kosten im Zusammenhang mit der Umsetzung des Videos",
				"                  eigenständig zu tragen, es sei denn, es wurde ausdrücklich und",
				"                  schriftlich etwas anderes vereinbart, z.B. über Mailverkehr.",
				"        1.1.5. Der Creator erbringt seine Dienstleistungen selbst, kann aber",
				"                  Erfüllungsgehilfen beauftragen. Die Kosten dafür trägt der Creator",
				"                  selbst.",
				"        1.1.6. Der Creator wird sich ausführlich mit dem Unternehmen und dessen",
				"                  Social-Media-Kanälen auseinandersetzen, um die Marke zu verstehen",
				"                  und sicherzustellen, dass der Content optimal mit den",
				"                  Social-Media-Strategien des Unternehmens harmoniert.",
				"        1.1.7. Der Creator darf die User-Generated-Content-Videos auf seinem Kanal",
				"                  nur nach schriftlicher Freigabe durch das Unternehmen posten und als",
				"                  Referenz nutzen.",
				"        1.1.8. Das Unternehmen haftet nicht für Schäden oder Verluste, die dem",
				"                  Creator während der Ausführung des Auftrags entstehen.",

				"1.2. Verpflichtung zur Einhaltung von Deadlines",

				"        1.2.1. Der Creator verpflichtet sich alle Deadlines einzuhalten. Das",
				"                  Unternehmen kann die Zusammenarbeit fristlos beenden, wenn der",
				"                  Creator eine der genannten Deadlines nicht einhält und ist daraufhin",
				"                  nicht verpflichtet, für entstandene Kosten aufzukommen.",
				"        1.2.1.1. Sollten die Deadlines aufgrund einer Verzögerung seitens des",
				"                  Unternehmens nicht eingehalten werden können, so",
				"                  verschieben sich die Deadlines in diesem Vertrag automatisch",
				"                  um die Anzahl der Wochentage des verzögerten Zeitraums.",
				"        1.2.2. Der Creator ist dazu verpflichtet, etwaige Verzögerungen seinerseits",
				"                  durch Urlaube oder andere Verhinderungen frühzeitig mitzuteilen.",
				"        1.2.3. Folgende Deadlines sind einzuhalten:",
				`        1.2.4. Abgabe des Skripts: ${abgabeScript} um 12:00 Uhr mittags`,
				`        1.2.5. Abgabe des Contents: ${abgabeContent} um 12:00 Uhr mittags`,
				`        1.2.6. Abgabe der Korrektur: ${abgabeKorrektur} um 12:00 Uhr mittags`,
				`        1.2.7. Abgabe der zweiten Korrektur: ${abgabeZweiteKorrektur} um 12:00 Uhr mittags`,
				"        1.2.8. Der Vertrag muss vom Creator innerhalb von 3 Tagen nach Erhalt",
				"                  unterschrieben werden, sonst kann das Unternehmen den Auftrag an",
				"                  einen anderen Creator vergeben.",

				"1.3. Verpflichtung zur Erstellung von Skripten",

				"        1.3.1. Der Content Creator verpflichtet sich zur Erstellung eines detaillierten",
				"                  Skripts für die Videos unter Berücksichtigung der folgenden Punkte:",
				"        1.3.2. Das Skript umfasst Setting, Hook, Hauptteil und Call-To-Action und",
				"                  wird eng an den Job-Informationen, dem Briefing des Unternehmens",
				"                  sowie den zu vermittelnden Botschaften orientiert sein.",
				"        1.3.3. Das Skript umfasst eine klare und präzise Beschreibung des textlichen",
				"                  und bildlichen Umfelds, einschließlich relevanter Details zu einzelnen",
				"                  Szenen.",
				"        1.3.4. Das Skript umfasst eine Integration von überzeugendem Storytelling",
				"                  und einer effektiven Dramaturgie, um die Aufmerksamkeit zu fesseln,",
				"                  die Botschaft zu vermitteln und gewünschte Aktionen zu fördern.",
				"        1.3.5. Das Skript erfüllt alle Vorgaben, Anforderungen und Stilrichtlinien",
				"                  gemäß den bereitgestellten Job-Informationen und dem Briefing des",
				"                  Unternehmens.",
				"        1.3.6. Sollte das erstellte Skript nicht den festgelegten Anforderungen des",
				"                  Unternehmens entsprechen, behält sich das Unternehmen das Recht",
				"                  vor, den Content Creator zur Anpassung des Skripts aufzufordern.",
				"                  Maximal jedoch zweimal. Sollte anschließend das Skript immer noch",
				"                  nicht den Anforderungen genügen, behält sich das Unternehmen das",
				"                  Recht vor, diesen Vertrag fristlos zu kündigen.",
				"        1.3.7. Das Unternehmen behält sich das Recht vor, Anpassungen am Skript",
				"                  vor der Videoproduktion selbst vorzunehmen, die anschließend so",
				"                  vom Creator umgesetzt werden.",
				"        1.3.8. Der Creator verpflichtet sich, die Videoproduktion erst zu starten,",
				"                  nachdem die Skripte final freigegeben wurden. Ansonsten müssen die",
				"                  Videos neu gedreht werden.",
				"        1.3.9. Jegliche Änderungen vom Creator am Skript müssen in Absprache mit",
				"                  dem Unternehmen erfolgen und dürfen nicht im Widerspruch zu den",
				"                  Grundsätzen oder Zielen des Unternehmens stehen.",

				"1.4. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos",

				"        1.4.1. Der Content Creator verpflichtet sich zur ordnungsgemäßen",
				"                  Bereitstellung der produzierten Videos unter Berücksichtigung",
				"                  folgender Bestimmungen:",
				"        1.4.2. Der Creator produziert Videos mit einheitlichem Ton und",
				"                  höchstmöglicher Auflösung.",
				"        1.4.3. Der Creator achtet auf die Platzierung von Untertiteln, Texten, Grafiken",
				"                  der Buttons bei der Nutzung auf Social Media - sogenannte Safe",
				"                  Spaces.",
				"        1.4.4. Die Bild- und Tonqualität gewährleisten eine adäquate Erfüllung der",
				"                  visuellen Anforderungen des Unternehmens.",
				"        1.4.5. Die Videos werden ausschließlich über geeignete Plattformen wie z.B.",
				"                  “Google Drive” oder “WeTransfer” zur Verfügung gestellt, die eine",
				"                  sichere und effiziente Übertragung ermöglichen. Die Verwendung von",
				"                  Messaging-Diensten wie z.B. “WhatsApp” ist für diesen Zweck nicht",
				"                  gestattet. Die Übertragung muss per Mail erfolgen.",
				"        1.4.6. Der Content Creator wird jedes abgelieferte Video nach dem",
				"                  folgenden Benennungsschema benennen und abgeben:",
				"                  'Unternehmen_Creator_Video_Nummer X des Videos_VersionY'",

				"1.5. Verpflichtung zur Bewahrung der Rechte Dritter",

				"        1.5.1. Der Creator stellt sicher, dass in den Videos keine",
				"                  Persönlichkeitsrechte von Privatpersonen oder Markenrechte verletzt",
				"                  werden.",
				"        1.5.2. Der Creator verpflichtet sich, in den erstellten Videos keine anderen",
				"                  Marken zu erwähnen oder darzustellen, es sei denn, dies wurde",
				"                  ausdrücklich schriftlich mit dem Unternehmen vereinbart.",
				"        1.5.3. Der Creator gewährleistet, dass in den Videos keine Namen oder",
				"                  Darstellungen von Privatpersonen verwendet werden, deren Rechte",
				"                  ohne ausdrückliche Genehmigung verletzt werden.",
				"        1.5.4. Sollte der Creator entgegen dieser Vereinbarung handeln und andere",
				"                  Markenrechte oder Persönlichkeitsrechte in den Videos verletzen,",
				"                  haftet der Creator für sämtliche daraus entstehenden Schäden.",
				"        1.5.5. Der Creator verpflichtet sich, das Unternehmen unverzüglich zu",
				"                  informieren, falls er versehentlich gegen diese Klausel verstoßen hat,",
				"                  um gemeinsam eine Lösung zu finden.",
				"        1.5.6. Verwendest du lizenzfreie Musik in deinen Videos, so bist du dazu",
				"                  verpflichtet, dem Unternehmen die jeweilige Quelle zur Verfügung zu",
				"                  stellen.",

				"1.6. Verpflichtung zur Anpassung am erstellten Inhalt",

				"        1.6.1. Der Creator verpflichtet sich, Änderungen am erstellten Inhalt gemäß",
				"                  den berechtigten Anforderungen des Unternehmens vorzunehmen, um",
				"                  sicherzustellen, dass der Content den Qualitätsstandards und den",
				"                  spezifischen Anforderungen des Unternehmens entspricht. Das",
				"                  Unternehmen behält sich das Recht vor, den Vertrag zu kündigen,",
				"                  wenn der Creator wiederholt (zwei Korrekturen) die Qualitätsstandards",
				"                  nicht erfüllt. Die Feedbackschleife umfasst dabei folgende Punkte:",
				"        1.6.2. Der Creator wird berechtigte Anfragen des Unternehmens",
				"                  berücksichtigen, die darauf abzielen, den Inhalt zu verbessern, ohne",
				"                  dabei die grundlegende Botschaft oder Idee zu verändern.",
				"        1.6.3. Der Creator akzeptiert berechtigte Anpassungen am gesprochenen",
				"                  Text, vorausgesetzt, dass die vorab genehmigten Abschnitte im Skript",
				"                  unberührt bleiben.",
				"        1.6.4. Der Creator wird Änderungen am Voice Over vornehmen, um",
				"                  sicherzustellen, dass der Ton und die Stimmung den Vorgaben des",
				"                  Unternehmens entsprechen.",
				"        1.6.5. Der Creator wird alle Do’s & Dont’s, wie im vorher festgelegten Briefing",
				"                  vereinbart, beachten. Abweichungen müssen auf berechtigtes",
				"                  Anfordern des Unternehmens korrigiert werden, um einen",
				"                  Vertragsbruch zu vermeiden.",
				"        1.6.6. Der Creator wird Anpassungen am Schnitt vornehmen, um eine",
				"                  bessere Erzählstruktur sicherzustellen.",
				"        1.6.7. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Verbesserung der Tonqualität umsetzen.",
				"        1.6.8. Der Creator wird Anpassungen vornehmen, um die Bildqualität zu",
				"                  verbessern und sicherzustellen, dass das visuelle Material den",
				"                  Standards des Unternehmens entspricht.",
				"        1.6.9. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Anpassung der Videolänge umsetzen.",
				"        1.6.10. Der Creator wird unverzüglich auf berechtigtes Feedback des",
				"                  Unternehmens reagieren und alle erforderlichen Korrekturen an",
				"                  Falschinformationen vornehmen.",
				"        1.6.11. Der Creator wird berechtigte Anfragen des Unternehmens zur",
				"                  Verbesserung von Rechtschreibung, Grammatik und Interpunktion in",
				"                  den Untertiteln umsetzen.",
				"        1.6.12. Der Creator wird die Inhalte neu aufnehmen oder schneiden, wenn die",
				"                  Videos beide identisch aufgenommen wurden (gleiches Setting,",
				"                  gleiche Klamotten). Dies gilt nicht, wenn der Dreh vor Ort ist oder",
				"                   nderweitige Vereinbarungen getroffen wurden.",

				"1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung",

				"        1.7.1. Der Creator erhält die vereinbarte Vergütung nach erfolgreicher",
				"                  Fertigstellung der Videos und deren Abnahme gemäß den im Vertrag",
				"                  festgelegten Informationen.",
				"        1.7.2. Der Creator ist berechtigt, die Rechnung zu stellen, nachdem der",
				"                  Auftrag gemäß den Vertragsbedingungen erfolgreich abgewickelt",
				"                  wurde, die Videos abgenommen wurden und sämtliche Deadlines",
				"                  fristgerecht eingehalten wurden. Die Rechnung wird im PDF-Format",
				"                  übermittelt.",
				"        1.7.3. Der Creator bestätigt hiermit, dass er gesetzlich dazu berechtigt ist,",
				"                  als Rechnungssteller aufzutreten und sämtliche rechtlichen",
				"                  Anforderungen für die Rechnungsstellung erfüllt.",
				"                1.7.4. Der Creator verpflichtet sich, das Zahlungsziel von 30 Tagen auf die",
				"                  Rechnung zu schreiben.",

				"2. Rechte und Pflichten des Unternehmens",

				"        2.1. Das Unternehmen unterstützt den Creator mit allen erforderlichen",
				"                  Informationen für seine Tätigkeit und hat diese im Briefing verfasst.",
				"        2.2. Falls das Unternehmen während der Zusammenarbeit Änderungen am",
				"                  Briefing oder Skript vornehmen möchte, müssen diese schriftlich festgehalten",
				"                  und von beiden Parteien genehmigt werden.",
				"        2.3. Das Unternehmen verpflichtet sich, Änderungsanfragen des Creators in",
				"                  angemessener Frist zu prüfen und zu beantworten.",
				"        2.4. Das Unternehmen stellt sicher, dass alle notwendigen Ressourcen, wie",
				"                  Materialien, Zugang zu Experten oder technische Unterstützung, zeitnah zur",
				"                  Verfügung stehen, um die Effizienz der Zusammenarbeit zu fördern.",
				"        2.5. Die Rechnung wird binnen 30 Tagen nach Erhalt durch das Unternehmen fällig",
				"                  und wird innerhalb dieses Zeitraums beglichen.",
				"        2.6. Das Unternehmen darf den Creator nicht rechtsgeschäftlich vertreten und",
				"                  respektiert die eigenständige juristische Identität des Creators.",

				"3. Vertragsdauer, Beendigung, Nutzungsrecht",

				"        3.1. Der Vertrag beginnt mit der beidseitigen Unterzeichnung und endet nach",
				"                  Abschluss der Content-Abnahme.",
				"        3.2. Der Creator überträgt dem Unternehmen unwiderruflich, zeitlich und räumlich",
				`                  uneingeschränkte Nutzungsrechte am erstellten Inhalt für ${jobDauer}.`,
				"        3.3. Das Unternehmen darf die erstellten Leistungen des Creators für eigene",
				"                  Werbezwecke nutzen, einschließlich Übersetzungen, Umgestaltungen oder",
				"                  Bearbeitungen.",
				"        3.4. Bei Krankheit oder anderen wichtigen Gründen, die die Leistungserbringung",
				"                  beeinflussen, muss der Creator das Unternehmen innerhalb von zwei Tagen",
				"                  darüber informieren und die voraussichtliche Dauer der Verhinderung",
				"                  angeben.",
				"        3.5. Der Creator muss die Leistungen nach Wegfall der Verhinderung umgehend",
				"                  nachholen, spätestens innerhalb einer Woche, sofern zweckmäßig.",
				"                  Andernfalls kann das Unternehmen den Vertrag auflösen.",
				"        3.6. Der Creator gewährt dem Unternehmen das uneingeschränkte Recht, alle im",
				"                  Rahmen dieses Vertrags erstellten Inhalte, einschließlich Bilder und Videos,",
				"                  an den folgenden Kunden des Unternehmens zu übertragen:",
				"                  ",
				`                  ${contractualRightName}`,
				`                  ${contractualRightsStreet} ${contractualRightsHouseNumber}`,
				`                  ${contractualRightsPLZ} ${contractualRightsCity}`,
				"                  ",
				"        3.6.1. Die Übertragung dieser Rechte an den Kunden erfolgt unter der",
				"                  edingung, dass alle Verpflichtungen, Rechte und Pflichten, die sich",
				"                  aus diesem Vertrag ergeben, auf den Kunden in gleicher Weise",
				"                  übertragen werden, wie sie für das Unternehmen gelten. Insbesondere",
				"                  gilt dies für sämtliche geistigen Eigentumsrechte, Nutzungslizenzen",
				"                  und Haftungsbeschränkungen, die in diesem Vertrag festgelegt sind.",
				"                  Das Unternehmen stellt sicher, dass der Kunde die gleichen",
				"                  rechtlichen Verpflichtungen und Einschränkungen hinsichtlich der",
				"                  Verwendung und Verbreitung der Inhalte einhält, wie sie in diesem",
				"                  Vertrag für die Agentur festgelegt sind.",

				"4. Vertraulichkeit, Geheimhaltung",

				"        4.1. Beide Parteien müssen vertrauliche Informationen vertraulich behandeln, es",
				"                 sei denn, diese sind allgemein bekannt, wurden von einem Dritten mitgeteilt",
				"                 oder waren bereits vor der Übermittlung bekannt.",
				"        4.2. Alle Rechte an den vertraulichen Informationen verbleiben bei der",
				"                 informierenden Partei.",
				"        4.3. Geschäfts- und Betriebsunterlagen müssen ordnungsgemäß aufbewahrt",
				"                 werden, um Dritten den Zugriff zu verwehren.",

				"5. Datenschutz",

				"        5.1. Das Unternehmen erhebt, speichert und verwendet personenbezogene Daten",
				"                 des Creators gemäß DSGVO für die Vertragsdurchführung.",
				"        5.2. Das Unternehmen gewährleistet die Einhaltung der DSGVO und verweist auf",
				"                 seine Datenschutzerklärung für weitere Informationen.",

				"6. Sonstiges",

				"        6.1. Weder das Unternehmen noch der Creator sind berechtigt, die andere Partei",
				"                 rechtsgeschäftlich zu vertreten oder in irgendeiner Weise zu verpflichten, es",
				"                 sei denn, es liegt eine ausdrückliche schriftliche Vollmacht vor.",
				"        6.2. Unwirksame oder undurchführbare Bestimmungen werden durch gültige",
				"                 Regelungen ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen.",
				"        6.3. Nebenabreden bedürfen der Schriftform. Gesetzliche Formerfordernisse",
				"                 bleiben unberührt.",
				"        6.4. Der Vertrag unterliegt dem deutschen Recht, und der Gerichtsstand ist",
				`                 ${brandCity}`
			];
			
		contractText.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 25;
                }
			const headlineTopPadding = 4; // Abstand über der Überschrift
			const headlineBottomPadding = 4; // Abstand unter der Überschrift

                // Formatierung für Überschriften
                if (line.startsWith('1. Rechte und Pflichten des Creators') || line.startsWith('2. Rechte und Pflichten des Unternehmens') || line.startsWith('3. Vertragsdauer, Beendigung, Nutzungsrecht') || line.startsWith('4. Vertraulichkeit, Geheimhaltung') || line.startsWith('5. Datenschutz') || line.startsWith('6. Sonstiges')) {
                    	y += 5;
			doc.setFontSize(14);
                    	doc.setFont("helvetica", "bold");
                }else if (line.startsWith('        1.1.1. Der Creator verpflichtet sich, gemäß dem Briefing für das') || line.startsWith('        1.2.1. Der Creator verpflichtet sich alle Deadlines einzuhalten. Das') || line.startsWith('        1.3.1. Der Content Creator verpflichtet sich zur Erstellung eines detaillierten') || line.startsWith('        1.4.1. Der Content Creator verpflichtet sich zur ordnungsgemäßen') || line.startsWith('        1.5.1. Der Creator stellt sicher, dass in den Videos keine') || line.startsWith('        1.6.1. Der Creator verpflichtet sich, Änderungen am erstellten Inhalt gemäß') || line.startsWith('        1.7.1. Der Creator erhält die vereinbarte Vergütung nach erfolgreicher') || line.startsWith('        2.1. Das Unternehmen unterstützt den Creator mit allen erforderlichen') || line.startsWith('        3.1. Der Vertrag beginnt mit der beidseitigen Unterzeichnung und endet nach') || line.startsWith('        4.1. Beide Parteien müssen vertrauliche Informationen vertraulich behandeln, es') || line.startsWith('        5.1. Das Unternehmen erhebt, speichert und verwendet personenbezogene Daten') || line.startsWith('        6.1. Weder das Unternehmen noch der Creator sind berechtigt, die andere Partei'))    {
    			y += 5; // Größeres Padding Top für spezifische Unterabschnitte
    			doc.setFontSize(10);
    			doc.setFont("helvetica", "normal");
    			// Kein zusätzliches y += 5 hier, da wir bereits einen größeren Abstand oben eingefügt haben
		} else if (line.startsWith('1.1. Verpflichtung zur Erstellung von Content') || line.startsWith('1.2. Verpflichtung zur Einhaltung von Deadlines') || line.startsWith('1.3. Verpflichtung zur Erstellung von Skripten') || line.startsWith('1.4. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos') || line.startsWith('1.5. Verpflichtung zur Bewahrung der Rechte Dritter') || line.startsWith('1.6. Verpflichtung zur Anpassung am erstellten Inhalt') || line.startsWith('1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung')) {
                    	y += 5;
			doc.setFontSize(11);
                    	doc.setFont("helvetica", "bold");
                } else {
                    // Standardformatierung
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                }

               doc.text(line, 30, y);
                y += 5;
		});
	    const imgData = 'data:image/png;base64,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';
            doc.addImage(imgData, 'JPEG', 15, 40, 180, 160);
	    addSignatureFields(doc);
	    addWatermark(doc);	
            doc.save('contract.pdf');
            console.log('PDF saved successfully');
        } catch (error) {
            console.error('An error occurred during PDF generation:', error);
        }
    }
    
    const form = document.getElementById('vertragsgenerator-v2');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submission intercepted');
	    
            generatePDF();
        });
    } else {
        console.error('Formular mit ID vertragsgenerator-v2 nicht gefunden.');
    }
});
