console.log('Das Update Credits Script wurde geladen.');

const testMemberId = 'mem_clpb097sl03cr0snweabfefx4'; // Use this ID for testing
const BASE_URL = 'https://admin.memberstack.com/members';  // Admin URL
const LIMIT = 100;  // Number of members per request
const RATE_LIMIT_DELAY = 1000 / 25;  // 25 requests per second

document.addEventListener('DOMContentLoaded', async function() {
    const button = document.getElementById('update-credits-button'); // Ensure your Webflow button has this ID

    if (!button) return;

    try {
        const configModule = await import('./config/config.js');
        const config = configModule.default;

        button.addEventListener('click', async function() {
            const API_KEY = config.apiKey;
            let updatedMembers = 0;
            let failedUpdates = 0;
            let failedMemberIds = []; // Track failed member IDs

            try {
                let hasMore = true;
                let endCursor = null;

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
                        member.customFields?.['is-user-a-brand'] === 'true' // Only include members identified as brands
                    );

                    for (const member of filteredMembers) {
                        const currentCredits = member.metaData?.credits || 0;
                        const newCredits = currentCredits < 3 ? 3 : currentCredits;  // Add 3 credits to the current amount

                        const updateData = {
                            metaData: {
                                credits: newCredits
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
                                console.error(`Failed to update brand: ${member.id}`);
                            } else {
                                updatedMembers++;
                            }
                        } catch (error) {
                            failedUpdates++;
                            console.error(`Error updating brand: ${member.id}`, error);
                        }
                    }

                    console.log(`Batch complete. Total so far: Updated: ${updatedMembers}, Failed: ${failedUpdates}`);

                    hasMore = hasNextPage;
                    endCursor = newEndCursor;

                    // Respect rate limit by adding a delay between requests
                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                    }
                }

                alert(`Process complete. Updated brands: ${updatedMembers}, Failed updates: ${failedUpdates}
Failed Brand IDs: ${failedMemberIds.join(', ')}`);
            } catch (error) {
                console.error('Error updating brands:', error);
                alert('An error occurred while updating the brands.');
            }
        });
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Config loading error.');
    }
});
