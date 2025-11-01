const axios = require('axios');

const GitApi = {
    getRepos: async () => {
        const response = await axios.get('https://api.github.com/users/augustommarques/repos');
        return response.data;
    },
    getRepositories: async () => {
        const response = await axios.get('https://api.github.com/users/augustommarques/repos');
        return response.data;
    },
    getIssues: async () => {
        const response = await axios.get('https://api.github.com/search/issues?q=author:augustommarques+state:open');
        return response.data.items || [];
    }
};

module.exports = GitApi;