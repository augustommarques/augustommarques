const GitApi = require('./js/GitApi');

GitApi.getRepos().then(repos => {
    console.log(repos);
});

GitApi.getRepositories().then(repositories => {
    console.log(repositories);
});

GitApi.getIssues().then(issues => {
    console.log(issues);
});