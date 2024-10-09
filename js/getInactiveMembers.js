const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    try {
        const response = await fetch('https://api.memberstack.com/v1/members', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer YOUR_MEMBERSTACK_API_KEY`, // Replace with your actual API key
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to fetch members' }),
            };
        }

        const members = await response.json();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Filter inactive members
        const inactiveMembers = members.filter(member => {
            const lastLoginDate = new Date(member.lastLogin); // Adjust based on the actual field name
            return lastLoginDate < threeMonthsAgo;
        });

        return {
            statusCode: 200,
            body: JSON.stringify(inactiveMembers),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
        };
    }
};
