console.log('Das Script wurde geladen.');

const BASE_URL = 'https://admin.memberstack.com/members';  // Admin URL
const LIMIT = 100;  // Number of members per request
const RATE_LIMIT_DELAY = 1000 / 25;  // 25 requests per second

document.addEventListener('DOMContentLoaded', async function() {
    const button = document.getElementById('update-video-fields-button'); // Ensure your Webflow button has this ID

    if (!button) return;

    try {
        const configModule = await import('./config/config.js');
        const config = configModule.default;

        button.addEventListener('click', async function() {
            const API_KEY = config.apiKey;
            let totalAffectedUsers = 0;
            let hasMore = true;
            let endCursor = null;

            try {
                while (hasMore) {
                    const url = endCursor ? `${BASE_URL}?after=${endCursor}&limit=${LIMIT}` : `${BASE_URL}?limit=${LIMIT}`;

                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-API-KEY': API_KEY  // Memberstack expects this header
                        }
                    });

                    if (!response.ok) throw new Error('Failed to fetch members');

                    const { data: members, hasNextPage, endCursor: newEndCursor } = await response.json();

                    const filteredMembers = members.filter(member => 
                        member.customFields?.['is-user-a-brand'] === 'false' &&
                        member.customFields?.['plus-member'] === 'false' &&
                        member.customFields?.['user-video-2'] &&
                        member.customFields?.['user-video-3']
                    );

                    totalAffectedUsers += filteredMembers.length;

                    hasMore = hasNextPage;
                    endCursor = newEndCursor;

                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                    }
                }

                const confirmation = confirm(`Es wurden ${totalAffectedUsers} Nutzer gefunden, deren Felder gelöscht werden können. Möchtest du fortfahren?`);

                if (!confirmation) {
                    alert('Vorgang abgebrochen.');
                    return;
                }

                // Jetzt Felder bereinigen
                let cleanedUsers = 0;
                let failedUpdates = 0;
                let failedMemberIds = [];
                let hasMoreClean = true;
                let endCursorClean = null;

                while (hasMoreClean) {
                    const url = endCursorClean ? `${BASE_URL}?after=${endCursorClean}&limit=${LIMIT}` : `${BASE_URL}?limit=${LIMIT}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-API-KEY': API_KEY
                        }
                    });
                    
                    if (!response.ok) throw new Error('Failed to fetch members');
                    
                    const { data: members, hasNextPage, endCursor: newEndCursor } = await response.json();
                    
                    const filteredMembers = members.filter(member => 
                        member.customFields?.['is-user-a-brand'] === 'false' &&
                        member.customFields?.['plus-member'] === 'false' &&
                        member.customFields?.['user-video-2'] &&
                        member.customFields?.['user-video-3']
                    );
                    
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

                    console.log(`Batch complete. Total so far: Cleaned: ${cleanedUsers}, Failed: ${failedUpdates}`);
                    hasMoreClean = hasNextPage;
                    endCursorClean = newEndCursor;

                    if (hasMoreClean) {
                        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
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
