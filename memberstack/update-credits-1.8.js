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
            const targetUrl = `${BASE_URL}/${testMemberId}`;

            try {
                const response = await fetch(targetUrl, {
                    method: 'GET',
                    headers: {
                        'X-API-KEY': API_KEY  // Memberstack expects this header
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch member');

                const user = await response.json();
                const newCredits = user.metaData && user.metaData.credits ? user.metaData.credits + 10 : 10;

                const updateData = {
                    metaData: {
                        credits: newCredits
                    }
                };

                const updateResponse = await fetch(targetUrl, {
                    method: 'PATCH',
                    headers: {
                        'X-API-KEY': API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) throw new Error('Failed to update user');
                const userEmail = user.auth && user.auth.email ? user.auth.email : 'Email not available';
                console.log(`Updated credits for user: ${userEmail}`);

                alert(`Test member credits updated successfully for ${userEmail}!`);
            } catch (error) {
                console.error('Error updating test member:', error);
                alert('An error occurred while updating the test member.');
            }
        });
    } catch (error) {
        console.error('Failed to load config:', error);
        alert('Config loading error.');
    }
});

