console.log('Das Script wurde geladen.');

const BASE_URL = 'https://admin.memberstack.com/members';  // Admin URL
const LIMIT = 100;  // Number of members per request
const RATE_LIMIT_DELAY = 1000 / 25;  // 25 requests per second
const TEST_USER_ID = 'mem_clpb097sl03cr0snweabfefx4';  // Test User ID
const TEST_MODE = true;  // Umschalten zwischen Test- und Massenmodus

document.addEventListener('DOMContentLoaded', async function() {
    const button = document.getElementById('update-video-fields-button'); // Ensure your Webflow button has this ID

    if (!button) return;

    try {
        const configModule = await import('./config/config.js');
        const config = configModule.default;

        button.addEventListener('click', async function() {
            const API_KEY = config.apiKey;
            let totalAffectedUsers = 0;
            let members = [];

            try {
                if (TEST_MODE) {
                    // Einzelner Test-User abrufen
                    const url = `${BASE_URL}/${TEST_USER_ID}`;
                    console.log("DEBUG: Starte API-Anfrage für Test-User...");
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-API-KEY': API_KEY  
                        }
                    });
                    console.log("DEBUG: Antwort erhalten");

                    if (!response.ok) {
                        console.error("Fehlerhafte API-Antwort:", response.status, response.statusText);
                        return;
                    }

                    const testUser = await response.json();
                    console.log("DEBUG: Komplette API-Response für Test-User:", testUser);

                    if (!testUser || !testUser.data || !testUser.data.customFields) {
                        console.error("Fehler: Test-User hat keine customFields!");
                        return;
                    }

                    testUser.data.id = TEST_USER_ID; // ID aus API setzen
                    members = [testUser.data];
                } else {
                    // Alle User abrufen
                    let hasMore = true;
                    let endCursor = null;

                    while (hasMore) {
                        const url = endCursor ? `${BASE_URL}?after=${endCursor}&limit=${LIMIT}` : `${BASE_URL}?limit=${LIMIT}`;
                        console.log("DEBUG: Starte API-Anfrage...");
                        const response = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'X-API-KEY': API_KEY  
                            }
                        });
                        console.log("DEBUG: Antwort erhalten");

                        if (!response.ok) {
                            console.error("Fehlerhafte API-Antwort:", response.status, response.statusText);
                            return;
                        }

                        const { data, hasNextPage, endCursor: newEndCursor } = await response.json();
                        members = members.concat(data);
                        hasMore = hasNextPage;
                        endCursor = newEndCursor;

                        if (hasMore) {
                            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                        }
                    }
                }

                const filteredMembers = members.filter(member => {
                    console.log(`DEBUG: Prüfe Mitglied ${member.id || 'undefined'}`);
                    console.log(`- is-user-a-brand: ${member.customFields?.['is-user-a-brand'] || 'Fehlt!'}`);
                    console.log(`- plus-member: ${member.customFields?.['plus-member'] || 'Fehlt!'}`);
                    console.log(`- user-video-2: ${member.customFields?.['user-video-2'] || 'Fehlt!'}`);
                    console.log(`- user-video-3: ${member.customFields?.['user-video-3'] || 'Fehlt!'}`);
                    
                    return (
                        String(member.customFields?.['is-user-a-brand']) === 'false' &&
                        String(member.customFields?.['plus-member']) === 'false' &&
                        !!member.customFields?.['user-video-2'] &&
                        !!member.customFields?.['user-video-3'] &&
                        member.customFields?.['user-video-2'].trim().length > 0 &&
                        member.customFields?.['user-video-3'].trim().length > 0
                    );
                });

                totalAffectedUsers = filteredMembers.length;
                console.log(`DEBUG: Gefilterte Mitglieder: ${totalAffectedUsers}`);

                const confirmation = confirm(`Es wurden ${totalAffectedUsers} Nutzer gefunden, deren Felder gelöscht werden können. Möchtest du fortfahren?`);

                if (!confirmation) {
                    alert('Vorgang abgebrochen.');
                    return;
                }

                // Jetzt Felder bereinigen
                let cleanedUsers = 0;
                let failedUpdates = 0;
                let failedMemberIds = [];

                for (const member of filteredMembers) {
                    const updateData = {
                        customFields: {
                            'user-video-2': '',
                            'user-video-3': ''
                        }
                    };

                    try {
                        const updateResponse = await fetch(`${BASE_URL}/${member.id}`, {
                            method: 'PATCH',
                            headers: {
                                'X-API-KEY': API_KEY,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(updateData)
                        });

                        if (!updateResponse.ok) {
                            failedUpdates++;
                            failedMemberIds.push(member.id);
                            console.error(`Failed to update user: ${member.id}`);
                        } else {
                            cleanedUsers++;
                        }
                    } catch (error) {
                        failedUpdates++;
                        console.error(`Error updating user: ${member.id}`, error);
                    }
                }

                alert(`Bereinigung abgeschlossen. Erfolgreich bereinigt: ${cleanedUsers}, Fehlgeschlagen: ${failedUpdates}\nFehlgeschlagene Benutzer-IDs: ${failedMemberIds.join(', ')}`);
            } catch (error) {
                console.error('Error processing members:', error);
                alert('Ein Fehler ist aufgetreten.');
            }
        });
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Config loading error.');
    }
});
