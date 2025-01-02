// script.js - Hosted on GitHub

console.log('Das Update Credits Script wurde geladen.');

const testMemberId = 'mem_clpb097sl03cr0snweabfefx4'; // Use this ID for testing
const PROXY_URL = 'https://api.allorigins.win/get?url=';
const BASE_URL = 'https://api.memberstack.io/v1';

document.addEventListener('DOMContentLoaded', async function() {
    const button = document.getElementById('update-credits-button'); // Ensure your Webflow button has this ID

    if (!button) return;

    try {
        const configModule = await import('./config/config.js');
        const config = configModule.default;

        button.addEventListener('click', async function() {
            const API_KEY = config.apiKey;
            const targetUrl = `${BASE_URL}/members/${testMemberId}`;

            try {
                const response = await fetch(`${PROXY_URL}${encodeURIComponent(targetUrl)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch member');

                const data = await response.json();
                const user = JSON.parse(data.contents);  // Parse the returned JSON string

                const newCredits = user.credits ? user.credits + 10 : 10;

                const updateResponse = await fetch(`${PROXY_URL}${encodeURIComponent(`${BASE_URL}/members/${testMemberId}`)}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ credits: newCredits })
                });

                if (!updateResponse.ok) throw new Error(`Failed to update user: ${user.email}`);
                console.log(`Updated credits for user: ${user.email}`);

                alert('Test member credits updated successfully!');
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
