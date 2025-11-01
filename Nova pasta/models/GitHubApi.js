const https = require('https');

/**
 * Model para interação com a API do GitHub
 */
class GitHubApi {
  constructor(token) {
    this.token = token;
  }

  /**
   * Faz uma requisição HTTP GET e retorna JSON
   */
  fetchJson(url) {
    return new Promise((resolve, reject) => {
      const headers = { 'User-Agent': 'gha-update-projects' };
      if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
      headers['Accept'] = 'application/vnd.github+json';
      
      https.get(url, { headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { 
              resolve(JSON.parse(data)); 
            } catch (e) { 
              reject(e); 
            }
          } else {
            reject(new Error(`GET ${url} -> ${res.statusCode}: ${data}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Busca todos os repositórios do usuário (com paginação)
   */
  async fetchAllRepos(username) {
    let repos = [];
    
    if (this.token) {
      const base = `https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all&affiliation=owner`;
      let url = base;
      let pageNum = 1;
      
      while (url) {
        const page = await this.fetchJson(url);
        repos = repos.concat(page);
        
        if (page.length < 100) break;
        
        pageNum++;
        url = `${base}&page=${pageNum}`;
      }
    } else {
      const base = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=all`;
      let url = base;
      let pageNum = 1;
      
      while (url) {
        const page = await this.fetchJson(url);
        repos = repos.concat(page);
        
        if (page.length < 100) break;
        
        pageNum++;
        url = `${base}&page=${pageNum}`;
      }
    }
    
    return repos;
  }

  /**
   * Busca os tópicos de um repositório
   */
  async fetchTopics(repo) {
    try {
      const url = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/topics`;
      const data = await this.fetchJson(url);
      return data.names || [];
    } catch (e) {
      return [];
    }
  }
}

module.exports = GitHubApi;

