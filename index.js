#!/usr/bin/env node

// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const username = process.env.GITHUB_USERNAME || 'augustommarques';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';






const api = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'github-skills-updater'
  }
});

// Adicionar token de autenticação se disponível
if (GITHUB_TOKEN) {
  api.defaults.headers.common['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
}

/**
 * Busca todos os repositórios do usuário
 */
async function fetchAllRepos(token) {
  let repos = [];
  
  try {
    if (token) {
      console.log('🔑 Usando token para acessar repositórios privados...');
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await api.get('/user/repos', {
          params: {
            per_page: 100,
            page: page,
            sort: 'updated',
            visibility: 'all',
            affiliation: 'owner'
          }
        });
        
        repos = repos.concat(response.data);
        hasMore = response.data.length === 100;
        page++;
        
        if (page > 10) break; // Limite de segurança
      }
    } else {
      if (!username) {
        throw new Error('Username não definido. Defina GITHUB_USERNAME ou use o valor padrão.');
      }
      
      console.log(`📦 Buscando repositórios públicos de ${username}...`);
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await api.get(`/users/${username}/repos`, {
          params: {
            per_page: 100,
            page: page,
            sort: 'updated',
            type: 'all'
          }
        });
        
        repos = repos.concat(response.data);
        hasMore = response.data.length === 100;
        page++;
        
        if (page > 10) break; // Limite de segurança
      }
    }
    
    console.log(`✅ Encontrados ${repos.length} repositórios`);
    return repos;
  } catch (error) {
    console.error('❌ Erro ao buscar repositórios:', error.message);
    throw error;
  }
}

/**
 * Busca topics de um repositório
 */
async function fetchTopics(owner, repo, token) {
  try {
    const config = token ? {
      headers: { 'Authorization': `Bearer ${token}` }
    } : {};
    
    const response = await api.get(`/repos/${owner}/${repo}/topics`, {
      ...config,
      headers: {
        ...config.headers,
        'Accept': 'application/vnd.github.mercy-preview+json'
      }
    });
    
    return response.data.names || [];
  } catch (error) {
    return [];
  }
}

/**
 * Analisa os repositórios e extrai as competências técnicas
 */
async function analyzeSkills(repos, token) {
  console.log('\n🛠️  Analisando competências técnicas...');
  
  const languageCount = new Map();
  const topicCount = new Map();
  
  // Contar linguagens dos repositórios
  for (const repo of repos) {
    if (repo.language) {
      const lang = repo.language.trim();
      languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
    }
  }
  
  // Buscar topics dos repositórios mais recentes
  const recentRepos = repos
    .filter(r => !r.fork && !r.archived && !r.private)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 10);
  
  for (const repo of recentRepos) {
    const topics = await fetchTopics(repo.owner.login, repo.name, token);
    for (const topic of topics) {
      const t = topic.trim().toLowerCase();
      topicCount.set(t, (topicCount.get(t) || 0) + 1);
    }
  }
  
  // Categorias de tecnologias
  const backends = ['php', 'javascript', 'typescript', 'nodejs', 'node.js', 'go', 'python', 'java', 'csharp', 'ruby'];
  const frontends = ['javascript', 'typescript', 'html', 'css', 'vue', 'react', 'vue.js', 'react.js', 'angular', 'svelte'];
  const devops = ['docker', 'kubernetes', 'vercel', 'apache', 'nginx', 'linux', 'github-actions', 'ci-cd'];
  const databases = ['mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'mariadb'];
  
  // Pegar top linguagens e topics
  const topLanguages = [...languageCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang]) => lang.toLowerCase());
  
  const topTopics = [...topicCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([topic]) => topic);
  
  // Extrair competências por categoria
  const backendList = Array.from(new Set([
    ...topLanguages.filter(lang => backends.includes(lang)),
    ...topTopics.filter(topic => backends.includes(topic))
  ])).map(s => {
    return s
      .replace('nodejs', 'Node.js')
      .replace('node.js', 'Node.js')
      .replace('csharp', 'C#')
      .charAt(0).toUpperCase() + s.slice(1);
  });
  
  const frontendList = Array.from(new Set([
    ...topLanguages.filter(lang => frontends.includes(lang)),
    ...topTopics.filter(topic => frontends.includes(topic))
  ])).map(s => {
    return s
      .replace('vue.js', 'Vue.js')
      .replace('react.js', 'React')
      .replace('html', 'HTML')
      .replace('css', 'CSS')
      .charAt(0).toUpperCase() + s.slice(1);
  });
  
  const devopsList = Array.from(new Set(
    topTopics.filter(topic => devops.includes(topic))
  )).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  
  const dbList = Array.from(new Set(
    topTopics.filter(topic => databases.includes(topic))
  )).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  
  return {
    backend: backendList,
    frontend: frontendList,
    devops: devopsList,
    database: dbList
  };
}

/**
 * Atualiza a seção de competências no README
 */
function updateSkillsInReadme(skills) {
  const readmePath = path.join(process.cwd(), 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  
  const skillsLines = [];
  if (skills.backend.length > 0) {
    skillsLines.push(`- Backend: ${skills.backend.join(', ')}`);
  }
  if (skills.frontend.length > 0) {
    skillsLines.push(`- Frontend: ${skills.frontend.join(', ')}`);
  }
  if (skills.devops.length > 0) {
    skillsLines.push(`- DevOps/Infra: ${skills.devops.join(', ')}`);
  }
  if (skills.database.length > 0) {
    skillsLines.push(`- Banco de dados: ${skills.database.join(', ')}`);
  }
  
  // Fallback se não encontrar competências
  if (skillsLines.length === 0) {
    skillsLines.push('- Backend: Php, Javascript, Typescript');
    skillsLines.push('- Frontend: Javascript, Typescript, Html, Vue');
  }
  
  // Substituir o bloco de skills
  const startMarker = '<!-- SKILLS:START -->';
  const endMarker = '<!-- SKILLS:END -->';
  const pattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  
  const newBlock = `${startMarker}\n${skillsLines.join('\n')}\n${endMarker}`;
  
  let updatedContent;
  if (pattern.test(readmeContent)) {
    updatedContent = readmeContent.replace(pattern, newBlock);
  } else {
    updatedContent = `${readmeContent.trim()}\n\n${newBlock}\n`;
  }
  
  fs.writeFileSync(readmePath, updatedContent, 'utf8');
  console.log('\n✅ README.md atualizado com competências técnicas!');
  console.log('\n📋 Competências encontradas:');
  skillsLines.forEach(line => console.log(`  ${line}`));
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando atualização de competências técnicas...\n');
    
    // Buscar repositórios
    const repos = await fetchAllRepos(GITHUB_TOKEN);
    
    // Analisar competências
    const skills = await analyzeSkills(repos, GITHUB_TOKEN);
    
    // Atualizar README
    updateSkillsInReadme(skills);
    
    console.log('\n✨ Processo concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao atualizar competências:', error.message);
    process.exit(1);
  }
}

// Executar
main();

