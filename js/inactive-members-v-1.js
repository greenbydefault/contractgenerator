import config from './config/config.js';

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('fetch-inactive-members');
    const inactiveMembersList = document.getElementById('inactive-member-list'); // The list where members will be displayed

    if (button) {
        button.addEventListener('click', async () => {
            try {
                // Fetch the inactive members
                const inactiveMembers = await fetchInactiveMembers();
                
                // Clear previous results
                inactiveMembersList.innerHTML = '';

                // Display the members in the list
                if (inactiveMembers.length > 0) {
                    inactiveMembers.forEach(member => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${member.name} (Email: ${member.email})`;
                        inactiveMembersList.appendChild(listItem);
                    });
                } else {
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No inactive members found.';
                    inactiveMembersList.appendChild(listItem);
                }
            } catch (error) {
                console.error('Error fetching inactive members:', error);
                const listItem = document.createElement('li');
                listItem.textContent = 'An error occurred while fetching members. Please try again.';
                inactiveMembersList.appendChild(listItem);
            }
        });
    }
});

async function fetchInactiveMembers() {
    // Date calculation for 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    try {
        const response = await fetch('https://api.memberstack.com/v1/members', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        
        // Filter members who haven't logged in for over 3 months
        return data.members.filter(member => {
            const lastLoginDate = new Date(member.lastLogin);
            return lastLoginDate < threeMonthsAgo;
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
    }
}
