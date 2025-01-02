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

            try {
                let hasMore = true;
                let endCursor = null;
                let count = 0;

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
                        (!member.planConnections || member.planConnections.length === 0)
                    );

                    count += filteredMembers.length;
                    console.log(`Current batch count: ${filteredMembers.length}, Total so far: ${count}`);

                    hasMore = hasNextPage;
                    endCursor = newEndCursor;

                    // Respect rate limit by adding a delay between requests
                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                    }
                }

                alert(`Total eligible members: ${count}`);
            } catch (error) {
                console.error('Error counting members:', error);
                alert('An error occurred while counting the members.');
            }
        });
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Config loading error.');
    }
});
