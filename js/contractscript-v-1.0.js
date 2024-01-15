console.log("Skript wird geladen....");

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("Dokument vollständig geladen und bereit.");
    
    // Überprüfung, ob jsPDF geladen ist
    if (typeof jsPDF === 'undefined') {
        console.error('jsPDF ist nicht geladen oder nicht definiert.');
        return; // Beendet die Ausführung, wenn jsPDF nicht vorhanden ist
    } else {
        console.log('jsPDF erfolgreich geladen.');
    }

    function generatePDF() {
        console.log('Starting PDF generation');

        // Try-catch Block für Fehlerbehandlung
        try {
            // Initialisierung von jsPDF

                    // Retrieve values from form elements
                    const brandName = document.getElementById('vertrag-brandname').value;
                    const brandStreet = document.getElementById('vertrag-brand-street').value;
                    const brandHouseNumber = document.getElementById('vertrag-brand-housenumber').value;
                    const brandPLZ = document.getElementById('vertrag-brand-plz').value;
                    const brandCity = document.getElementById('vertrag-brand-city').value;
                    const anzahlVideos = document.getElementById('vertrag-anzahl-video').value;
                    const videoDauer = document.getElementById('vertrag-video-dauer').value;
                    const abgabeScript = document.getElementById('vertrag-abgabe-script').value;
                    const abgabeContent = document.getElementById('vertrag-abgabe-content').value;
                    const abgabeKorrektur = document.getElementById('vertrag-abgabe-korrektrur').value;
                    const abgabeZweiteKorrektur = document.getElementById('vertrag-abgabe-zweite-korrektrur').value;
                    const jobBezahlung = document.getElementById('vertrag-job-bezahlung').value;
                    // ... retrieve other form values
                    console.log('Form values retrieved:', { brandName });

                    const doc = new jsPDF(); // Anpassung basierend auf der Einbindung von jsPDF
                    console.log('jsPDF instance created');
                    doc.setFont("helvetica");
                    doc.setFontSize(10);
                    // Define the static parts of the contract and insert dynamic values
                    const contractText = [
                    "1. Rechte und Pflichten des Creators",
                    "    1.1. Verpflichtung zur Erstellung von Content",
                    "        1.1.1. Der Creator verpflichtet sich, gemäß dem Briefing für das",
                    "               Unternehmen User-Generated-Content Videos zu erstellen.",
                    `        1.1.2. Die Anzahl der Videos beläuft sich auf: ${anzahlVideos} Videos mit einer`,
                    `               Länge von ${videoDauer} Sekunden.`,
                    `        1.1.3. Der Creator erhält eine Festpreisvergütung von ${jobBezahlung} € netto für die`,
                    "               genannten Leistungen.",
                    "        1.1.4. Der Content Creator erklärt sich damit einverstanden, sämtliche",
                    "               Kosten im Zusammenhang mit der Umsetzung des Videos",
                    "               eigenständig zu tragen, es sei denn, es wurde ausdrücklich und",
                    "               schriftlich etwas anderes vereinbart, z.B. über Mailverkehr.",
                    "        1.1.5. Der Creator erbringt seine Dienstleistungen selbst, kann aber",
                    "               Erfüllungsgehilfen beauftragen. Die Kosten dafür trägt der Creator",
                    "               selbst.",
                    "        1.1.6. Der Creator wird sich ausführlich mit dem Unternehmen und dessen",
                    "               Social-Media-Kanälen auseinandersetzen, um die Marke zu verstehen",
                    "               und sicherzustellen, dass der Content optimal mit den",
                    "               Social-Media-Strategien des Unternehmens harmoniert.",
                    "        1.1.7. Der Creator darf die User-Generated-Content-Videos auf seinem Kanal",
                    "               nur nach schriftlicher Freigabe durch das Unternehmen posten und als",
                    "               Referenz nutzen.",
                    "        1.1.8. Das Unternehmen haftet nicht für Schäden oder Verluste, die dem",
                    "               Creator während der Ausführung des Auftrags entstehen.",
                    "    1.2. Verpflichtung zur Einhaltung von Deadlines",
                    "        1.2.1. Der Creator verpflichtet sich alle Deadlines einzuhalten. Das",
                    "               Unternehmen kann die Zusammenarbeit fristlos beenden, wenn der",
                    "               Creator eine der genannten Deadlines nicht einhält und ist daraufhin",
                    "               nicht verpflichtet, für entstandene Kosten aufzukommen.",
                    "        1.2.1.1. Sollten die Deadlines aufgrund einer Verzögerung seitens des",
                    "                  Unternehmens nicht eingehalten werden können, so",
                    "                  verschieben sich die Deadlines in diesem Vertrag automatisch",
                    "                  um die Anzahl der Wochentage des verzögerten Zeitraums.",
                    "        1.2.2. Der Creator ist dazu verpflichtet, etwaige Verzögerungen seinerseits",
                    "               durch Urlaube oder andere Verhinderungen frühzeitig mitzuteilen.",
                    "        1.2.3. Folgende Deadlines sind einzuhalten:",
                    "        1.2.4. Abgabe des Skripts: ${abgabeScript} um 12:00 Uhr mittags",
                    "        1.2.5. Abgabe des Contents: ${abgabeContent} um 12:00 Uhr mittags",
                    "        1.2.6. Abgabe der Korrektur: ${abgabeKorrektur} um 12:00 Uhr mittags",
                    "        1.2.7. Abgabe der zweiten Korrektur: ${abgabeZweiteKorrektur} um 12:00 Uhr mittags",
                    "        1.2.8. Der Vertrag muss vom Creator innerhalb von 3 Tagen nach Erhalt",
                    "               unterschrieben werden, sonst kann das Unternehmen den Auftrag an",
                    "               einen anderen Creator vergeben.",
                    "    1.3. Verpflichtung zur Erstellung von Skripten",
                    "        1.3.1. Der Content Creator verpflichtet sich zur Erstellung eines detaillierten",
                    "               Skripts für die Videos unter Berücksichtigung der folgenden Punkte:",
                    "        1.3.2. Das Skript umfasst Setting, Hook, Hauptteil und Call-To-Action und",
                    "               wird eng an den Job-Informationen, dem Briefing des Unternehmens",
                    "               sowie den zu vermittelnden Botschaften orientiert sein.",
                    "        1.3.3. Das Skript umfasst eine klare und präzise Beschreibung des textlichen",
                    "               und bildlichen Umfelds, einschließlich relevanter Details zu einzelnen",
                    "               Szenen.",
                    "        1.3.4. Das Skript umfasst eine Integration von überzeugendem Storytelling",
                    "               und einer effektiven Dramaturgie, um die Aufmerksamkeit zu fesseln,",
                    "               die Botschaft zu vermitteln und gewünschte Aktionen zu fördern.",
                    "        1.3.5. Das Skript erfüllt alle Vorgaben, Anforderungen und Stilrichtlinien",
                    "               gemäß den bereitgestellten Job-Informationen und dem Briefing des",
                    "               Unternehmens.",
                    "        1.3.6. Sollte das erstellte Skript nicht den festgelegten Anforderungen des",
                    "               Unternehmens entsprechen, behält sich das Unternehmen das Recht",
                    "               vor, den Content Creator zur Anpassung des Skripts aufzufordern.",
                    "               Maximal jedoch zweimal. Sollte anschließend das Skript immer noch",
                    "               nicht den Anforderungen genügen, behält sich das Unternehmen das",
                    "               Recht vor, diesen Vertrag fristlos zu kündigen.",
                    "        1.3.7. Das Unternehmen behält sich das Recht vor, Anpassungen am Skript",
                    "               vor der Videoproduktion selbst vorzunehmen, die anschließend so",
                    "               vom Creator umgesetzt werden.",
                    "        1.3.8. Der Creator verpflichtet sich, die Videoproduktion erst zu starten,",
                    "               nachdem die Skripte final freigegeben wurden. Ansonsten müssen die",
                    "               Videos neu gedreht werden.",
                    "        1.3.9. Jegliche Änderungen vom Creator am Skript müssen in Absprache mit",
                    "               dem Unternehmen erfolgen und dürfen nicht im Widerspruch zu den",
                    "               Grundsätzen oder Zielen des Unternehmens stehen.",
                    "    1.4. Verpflichtung zur ordnungsgemäßen Bereitstellung der Videos",
                    "        1.4.1. Der Content Creator verpflichtet sich zur ordnungsgemäßen",
                    "               Bereitstellung der produzierten Videos unter Berücksichtigung",
                    "               folgender Bestimmungen:",
                    "        1.4.2. Der Creator produziert Videos mit einheitlichem Ton und",
                    "               höchstmöglicher Auflösung.",
                    "        1.4.3. Der Creator achtet auf die Platzierung von Untertiteln, Texten, Grafiken",
                    "               oder Buttons bei der Nutzung auf Social Media - sogenannte Safe",
                    "               Spaces.",
                    "        1.4.4. Die Bild- und Tonqualität gewährleisten eine adäquate Erfüllung der",
                    "               visuellen Anforderungen des Unternehmens.",
                    "        1.4.5. Die Videos werden ausschließlich über geeignete Plattformen wie z.B.",
                    "               “Google Drive” oder “WeTransfer” zur Verfügung gestellt, die eine",
                    "               sichere und effiziente Übertragung ermöglichen. Die Verwendung von",
                    "               Messaging-Diensten wie z.B. “WhatsApp” ist für diesen Zweck nicht",
                    "               gestattet. Die Übertragung muss per Mail erfolgen.",
                    "        1.4.6. Der Content Creator wird jedes abgelieferte Video nach dem",
                    "               folgenden Benennungsschema benennen und abgeben:",
                    "               'Unternehmen_Creator_Video_Nummer X des Videos_VersionY'",
                    "    1.5. Verpflichtung zur Bewahrung der Rechte Dritter",
                    "        1.5.1. Der Creator stellt sicher, dass in den Videos keine",
                    "               Persönlichkeitsrechte von Privatpersonen oder Markenrechte verletzt",
                    "               werden.",
                    "        1.5.2. Der Creator verpflichtet sich, in den erstellten Videos keine anderen",
                    "               Marken zu erwähnen oder darzustellen, es sei denn, dies wurde",
                    "               ausdrücklich schriftlich mit dem Unternehmen vereinbart.",
                    "        1.5.3. Der Creator gewährleistet, dass in den Videos keine Namen oder",
                    "               Darstellungen von Privatpersonen verwendet werden, deren Rechte",
                    "               ohne ausdrückliche Genehmigung verletzt werden.",
                    "        1.5.4. Sollte der Creator entgegen dieser Vereinbarung handeln und andere",
                    "               Markenrechte oder Persönlichkeitsrechte in den Videos verletzen,",
                    "               haftet der Creator für sämtliche daraus entstehenden Schäden.",
                    "        1.5.5. Der Creator verpflichtet sich, das Unternehmen unverzüglich zu",
                    "               informieren, falls er versehentlich gegen diese Klausel verstoßen hat,",
                    "               um gemeinsam eine Lösung zu finden.",
                    "        1.5.6. Verwendest du lizenzfreie Musik in deinen Videos, so bist du dazu",
                    "               verpflichtet, dem Unternehmen die jeweilige Quelle zur Verfügung zu",
                    "               stellen.",
                    "    1.6. Verpflichtung zur Anpassung am erstellten Inhalt",
                    "        1.6.1. Der Creator verpflichtet sich, Änderungen am erstellten Inhalt gemäß",
                    "               den berechtigten Anforderungen des Unternehmens vorzunehmen, um",
                    "               sicherzustellen, dass der Content den Qualitätsstandards und den",
                    "               spezifischen Anforderungen des Unternehmens entspricht. Das",
                    "               Unternehmen behält sich das Recht vor, den Vertrag zu kündigen,",
                    "               wenn der Creator wiederholt (zwei Korrekturen) die Qualitätsstandards",
                    "               nicht erfüllt. Die Feedbackschleife umfasst dabei folgende Punkte:",
                    "        1.6.2. Der Creator wird berechtigte Anfragen des Unternehmens",
                    "               berücksichtigen, die darauf abzielen, den Inhalt zu verbessern, ohne",
                    "               dabei die grundlegende Botschaft oder Idee zu verändern.",
                    "        1.6.3. Der Creator akzeptiert berechtigte Anpassungen am gesprochenen",
                    "               Text, vorausgesetzt, dass die vorab genehmigten Abschnitte im Skript",
                    "               unberührt bleiben.",
                    "        1.6.4. Der Creator wird Änderungen am Voice Over vornehmen, um",
                    "               sicherzustellen, dass der Ton und die Stimmung den Vorgaben des",
                    "               Unternehmens entsprechen.",
                    "        1.6.5. Der Creator wird alle Do’s & Dont’s, wie im vorher festgelegten Briefing",
                    "               vereinbart, beachten. Abweichungen müssen auf berechtigtes",
                    "               Anfordern des Unternehmens korrigiert werden, um einen",
                    "               Vertragsbruch zu vermeiden.",
                    "        1.6.6. Der Creator wird Anpassungen am Schnitt vornehmen, um eine",
                    "               bessere Erzählstruktur sicherzustellen.",
                    "        1.6.7. Der Creator wird berechtigte Anfragen des Unternehmens zur",
                    "               Verbesserung der Tonqualität umsetzen.",
                    "        1.6.8. Der Creator wird Anpassungen vornehmen, um die Bildqualität zu",
                    "               verbessern und sicherzustellen, dass das visuelle Material den",
                    "               Standards des Unternehmens entspricht.",
                    "        1.6.9. Der Creator wird berechtigte Anfragen des Unternehmens zur",
                    "               Anpassung der Videolänge umsetzen.",
                    "        1.6.10. Der Creator wird unverzüglich auf berechtigtes Feedback des",
                    "                Unternehmens reagieren und alle erforderlichen Korrekturen an",
                    "                Falschinformationen vornehmen.",
                    "        1.6.11. Der Creator wird berechtigte Anfragen des Unternehmens zur",
                    "                Verbesserung von Rechtschreibung, Grammatik und Interpunktion in",
                    "                den Untertiteln umsetzen.",
                    "        1.6.12. Der Creator wird die Inhalte neu aufnehmen oder schneiden, wenn die",
                    "                Videos beide identisch aufgenommen wurden (gleiches Setting,",
                    "                gleiche Klamotten). Dies gilt nicht, wenn der Dreh vor Ort ist oder",
                    "                anderweitige Vereinbarungen getroffen wurden.",
                    "    1.7. Verpflichtung zur ordnungsgemäßen Erstellung der Rechnung",
                    "        1.7.1. Der Creator erhält die vereinbarte Vergütung nach erfolgreicher",
                    "               Fertigstellung der Videos und deren Abnahme gemäß den im Vertrag",
                    "               festgelegten Informationen.",
                    "        1.7.2. Der Creator ist berechtigt, die Rechnung zu stellen, nachdem der",
                    "               Auftrag gemäß den Vertragsbedingungen erfolgreich abgewickelt",
                    "               wurde, die Videos abgenommen wurden und sämtliche Deadlines",
                    "               fristgerecht eingehalten wurden. Die Rechnung wird im PDF-Format",
                    "               übermittelt.",
                    "        1.7.3. Der Creator bestätigt hiermit, dass er gesetzlich dazu berechtigt ist,",
                    "               als Rechnungssteller aufzutreten und sämtliche rechtlichen",
                    "               Anforderungen für die Rechnungsstellung erfüllt.",
                    "                1.7.4. Der Creator verpflichtet sich, das Zahlungsziel von 30 Tagen auf die",
                    "               Rechnung zu schreiben.",
                    "2. Rechte und Pflichten des Unternehmens",
                    "    2.1. Das Unternehmen unterstützt den Creator mit allen erforderlichen",
                    "         Informationen für seine Tätigkeit und hat diese im Briefing verfasst.",
                    "    2.2. Falls das Unternehmen während der Zusammenarbeit Änderungen am",
                    "         Briefing oder Skript vornehmen möchte, müssen diese schriftlich festgehalten",
                    "         und von beiden Parteien genehmigt werden.",
                    "    2.3. Das Unternehmen verpflichtet sich, Änderungsanfragen des Creators in",
                    "         angemessener Frist zu prüfen und zu beantworten.",
                    "    2.4. Das Unternehmen stellt sicher, dass alle notwendigen Ressourcen, wie",
                    "         Materialien, Zugang zu Experten oder technische Unterstützung, zeitnah zur",
                    "         Verfügung stehen, um die Effizienz der Zusammenarbeit zu fördern.",
                    "    2.5. Die Rechnung wird binnen 30 Tagen nach Erhalt durch das Unternehmen fällig",
                    "         und wird innerhalb dieses Zeitraums beglichen.",
                    "    2.6. Das Unternehmen darf den Creator nicht rechtsgeschäftlich vertreten und",
                    "         respektiert die eigenständige juristische Identität des Creators.",
                    "3. Vertragsdauer, Beendigung, Nutzungsrecht",
                    "    3.1. Der Vertrag beginnt mit der beidseitigen Unterzeichnung und endet nach",
                    "         Abschluss der Content-Abnahme.",
                    "    3.2. Der Creator überträgt dem Unternehmen unwiderruflich, zeitlich und räumlich",
                    "         uneingeschränkte Nutzungsrechte am erstellten Inhalt.",
                    "    3.3. Das Unternehmen darf die erstellten Leistungen des Creators für eigene",
                    "         Werbezwecke nutzen, einschließlich Übersetzungen, Umgestaltungen oder",
                    "         Bearbeitungen.",
                    "    3.4. Bei Krankheit oder anderen wichtigen Gründen, die die Leistungserbringung",
                    "         beeinflussen, muss der Creator das Unternehmen innerhalb von zwei Tagen",
                    "         darüber informieren und die voraussichtliche Dauer der Verhinderung",
                    "         angeben.",
                    "    3.5. Der Creator muss die Leistungen nach Wegfall der Verhinderung umgehend",
                    "         nachholen, spätestens innerhalb einer Woche, sofern zweckmäßig.",
                    "         Andernfalls kann das Unternehmen den Vertrag auflösen.",
                    "    3.6. Der Creator gewährt dem Unternehmen das uneingeschränkte Recht, alle im",
                    "         Rahmen dieses Vertrags erstellten Inhalte, einschließlich Bilder und Videos,",
                    "         an den folgenden Kunden des Unternehmens zu übertragen:",
                    "         Name des Unternehmens",
                    "         Straße / Hausnummer",
                    "         PLZ / Stadt",
                    "         Land",
                    "    3.6.1. Die Übertragung dieser Rechte an den Kunden erfolgt unter der",
                    "           Bedingung, dass alle Verpflichtungen, Rechte und Pflichten, die sich",
                    "           aus diesem Vertrag ergeben, auf den Kunden in gleicher Weise",
                    "           übertragen werden, wie sie für das Unternehmen gelten. Insbesondere",
                    "           gilt dies für sämtliche geistigen Eigentumsrechte, Nutzungslizenzen",
                    "           und Haftungsbeschränkungen, die in diesem Vertrag festgelegt sind.",
                    "           Das Unternehmen stellt sicher, dass der Kunde die gleichen",
                    "           rechtlichen Verpflichtungen und Einschränkungen hinsichtlich der",
                    "           Verwendung und Verbreitung der Inhalte einhält, wie sie in diesem",
                    "           Vertrag für die Agentur festgelegt sind.",
                    "4. Vertraulichkeit, Geheimhaltung",
                    "    4.1. Beide Parteien müssen vertrauliche Informationen vertraulich behandeln, es",
                    "         sei denn, diese sind allgemein bekannt, wurden von einem Dritten mitgeteilt",
                    "         oder waren bereits vor der Übermittlung bekannt.",
                    "    4.2. Alle Rechte an den vertraulichen Informationen verbleiben bei der",
                    "         informierenden Partei.",
                    "    4.3. Geschäfts- und Betriebsunterlagen müssen ordnungsgemäß aufbewahrt",
                    "         werden, um Dritten den Zugriff zu verwehren.",
                    "5. Datenschutz",
                    "    5.1. Das Unternehmen erhebt, speichert und verwendet personenbezogene Daten",
                    "         des Creators gemäß DSGVO für die Vertragsdurchführung.",
                    "    5.2. Das Unternehmen gewährleistet die Einhaltung der DSGVO und verweist auf",
                    "         seine Datenschutzerklärung für weitere Informationen.",
                    "6. Sonstiges",
                    "    6.1. Weder das Unternehmen noch der Creator sind berechtigt, die andere Partei",
                    "         rechtsgeschäftlich zu vertreten oder in irgendeiner Weise zu verpflichten, es",
                    "         sei denn, es liegt eine ausdrückliche schriftliche Vollmacht vor.",
                    "    6.2. Unwirksame oder undurchführbare Bestimmungen werden durch gültige",
                    "         Regelungen ersetzt, die dem wirtschaftlichen Zweck am nächsten kommen.",
                    "    6.3. Nebenabreden bedürfen der Schriftform. Gesetzliche Formerfordernisse",
                    "         bleiben unberührt.",
                    "    6.4. Der Vertrag unterliegt dem deutschen Recht, und der Gerichtsstand ist",
                    "         STADT."
            ];
         
            const lines = doc.splitTextToSize(contractText, 280);
            let y = 10;

            lines.forEach(line => {
                doc.text(line, 10, y);
                y += 7;
                if (y > 280) {
                    doc.addPage();
                    y = 10;
                }
            });
            // Speichern des PDFs
            doc.save('contract.pdf');
            console.log('PDF saved successfully');
        } catch (error) {
            console.error('An error occurred during PDF generation:', error);
        }
    }
    // Event Listener für Formular-Submit hinzufügen
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
