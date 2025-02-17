console.log('Das Script wurde geladen.');

const BASE_URL = 'https://admin.memberstack.com/members';  // Admin URL
const LIMIT = 100;  // Number of members per request
const RATE_LIMIT_DELAY = 1000 / 25;  // 25 requests per second
const TEST_USER_ID = 'mem_clpb097sl03cr0snweabfefx4';  // Test User ID
const TEST_MODE = false;  // Umschalten zwischen Test- und Massenmodus

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
            let exclusionCounts = {
                brand: 0,
                plusMember: 0,
                video2: 0,
                video3: 0
            };
            let plusMemberSamples = [];

            try {
                if (TEST_MODE) {
                    const url = `${BASE_URL}/${TEST_USER_ID}`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-API-KEY': API_KEY  
                        }
                    });
                    if (!response.ok) return;
                    const testUser = await response.json();
                    if (!testUser || !testUser.data || !testUser.data.customFields) return;
                    testUser.data.id = TEST_USER_ID;
                    members = [testUser.data];
                } else {
                    let hasMore = true;
                    let endCursor = null;
                    while (hasMore) {
                        const url = endCursor ? `${BASE_URL}?after=${endCursor}&limit=${LIMIT}` : `${BASE_URL}?limit=${LIMIT}`;
                        const response = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'X-API-KEY': API_KEY  
                            }
                        });
                        if (!response.ok) return;
                        const { data, hasNextPage, endCursor: newEndCursor } = await response.json();
                        members = members.concat(data);
                        hasMore = hasNextPage;
                        endCursor = newEndCursor;
                        if (hasMore) await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                    }
                }

                console.log(`DEBUG: Gesamtzahl der abgerufenen Mitglieder: ${members.length}`);
                
                const filteredMembers = members.filter(member => {
                    const brandCheck = String(member.customFields?.['is-user-a-brand']) === 'false';
                    const plusMemberValue = member.customFields?.['plus-member'];
                    const plusMemberCheck = plusMemberValue === '' || plusMemberValue === null || plusMemberValue === undefined || plusMemberValue === false;
                    const video2Check = !!member.customFields?.['user-video-2'] && member.customFields?.['user-video-2'].trim().length > 0;
                    const video3Check = !!member.customFields?.['user-video-3'] && member.customFields?.['user-video-3'].trim().length > 0;
                    
                    if (!brandCheck) exclusionCounts.brand++;
                    if (!plusMemberCheck) {
                        exclusionCounts.plusMember++;
                        if (plusMemberSamples.length < 10) plusMemberSamples.push(plusMemberValue);
                    }
                    if (!video2Check) exclusionCounts.video2++;
                    if (!video3Check) exclusionCounts.video3++;
                    
                    return brandCheck && plusMemberCheck && video2Check && video3Check;
                });

                totalAffectedUsers = filteredMembers.length;
                console.log(`Gefundene Mitglieder: ${totalAffectedUsers}`);
                console.log(`DEBUG: Ausschlussgründe:`);
                console.log(`- is-user-a-brand nicht "false": ${exclusionCounts.brand}`);
                console.log(`- plus-member gesetzt (nicht leer, undefined oder false): ${exclusionCounts.plusMember}`);
                console.log(`- user-video-2 fehlt oder leer: ${exclusionCounts.video2}`);
                console.log(`- user-video-3 fehlt oder leer: ${exclusionCounts.video3}`);
                console.log(`DEBUG: Beispielwerte von 'plus-member':`, plusMemberSamples);

                if (!confirm(`Es wurden ${totalAffectedUsers} Nutzer gefunden, deren Felder gelöscht werden können. Möchtest du fortfahren?`)) {
                    return;
                }

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
                        } else {
                            cleanedUsers++;
                        }
                    } catch (error) {
                        failedUpdates++;
                    }
                }

                alert(`Bereinigung abgeschlossen. Erfolgreich bereinigt: ${cleanedUsers}, Fehlgeschlagen: ${failedUpdates}\nFehlgeschlagene Benutzer-IDs: ${failedMemberIds.join(', ')}`);
            } catch (error) {
                alert('Ein Fehler ist aufgetreten.');
            }
        });
    } catch (error) {
        alert('Config loading error.');
    }
});
