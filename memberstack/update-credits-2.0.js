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
            const targetUrl = `${BASE_URL}`;

            try {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers: {
                        'X-API-KEY': API_KEY  // Memberstack expects this header
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch members');

                const { data: members } = await response.json();

                const filteredMembers = members.filter(member => 
                    member.customFields?.['is-user-a-brand'] === 'false' && 
                    (!member.planConnections || member.planConnections.length === 0)
                );

                for (const member of filteredMembers) {
                    const newCredits = 3;  // Set credits to 3

                    const updateData = {
                        metaData: {
                            credits: newCredits
                        }
                    };

                    const updateResponse = await fetch(`${BASE_URL}/${member.id}`, {
                        method: 'PATCH',
                        headers: {
                            'X-API-KEY': API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateData)
                    });

                    if (!updateResponse.ok) throw new Error(`Failed to update user: ${member.auth.email}`);
                    console.log(`Updated credits for user: ${member.auth.email}`);
                }

                alert('Credits updated successfully for all eligible members!');
            } catch (error) {
                console.error('Error updating members:', error);
                alert('An error occurred while updating the members.');
            }
        });
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Config loading error.');
    }
});
