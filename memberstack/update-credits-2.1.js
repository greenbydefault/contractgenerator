console.log('Das Update Credits Script wurde geladen.');

const testMemberId = 'mem_clpb097sl03cr0snweabfefx4'; // Use this ID for testing
const BASE_URL = 'https://admin.memberstack.com/members';  // Admin URL

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
                    const url = endCursor ? `${BASE_URL}?after=${endCursor}` : BASE_URL;

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
