#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const api = require('./js/GitApi');
const { username, token: GITHUB_TOKEN } = require('./js/GitApi');

if (GITHUB_TOKEN) api.setToken(GITHUB_TOKEN);

const CATEGORIES = {};

function formatName(s) {
  return s
    .replace('nodejs', 'Node.js').replace('node.js', 'Node.js')
    .replace('vue.js', 'Vue.js')
    .replace('react.js', 'React').replace('html', 'HTML').replace('css', 'CSS')
    .charAt(0).toUpperCase() + s.slice(1);
}

function getTopItems(map, limit) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item.toLowerCase());
}

async function analyzeSkills(repos) {
  const languageCount = new Map();
  const topicCount = new Map();
  
  repos.forEach(repo => {
    if (repo.language) {
      const lang = repo.language.trim();
      languageCount.set(lang, (languageCount.get(lang) || 0) + 1);
    }
  });
  
  const recentRepos = repos
    .filter(r => !r.fork && !r.archived && !r.private)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 10);
  
  for (const repo of recentRepos) {
    try {
      const response = await api.get(`/repos/${repo.owner.login}/${repo.name}/topics`, {
        headers: { 'Accept': 'application/vnd.github.mercy-preview+json' }
      });
      const topics = response.names || [];
      topics.forEach(topic => {
        const t = topic.trim().toLowerCase();
        topicCount.set(t, (topicCount.get(t) || 0) + 1);
      });
    } catch (error) {
      // Continua mesmo se falhar
    }
  }
  
  const topLanguages = getTopItems(languageCount, 10);
  const topTopics = getTopItems(topicCount, 15);
  
  const result = {};
  Object.entries(CATEGORIES).forEach(([key, list]) => {
    const items = Array.from(new Set([
      ...topLanguages.filter(item => list.includes(item)),
      ...topTopics.filter(item => list.includes(item))
    ])).map(formatName);
    result[key] = items;
  });
  
  return result;
}

function updateSkillsInReadme(skills) {
  const labels = {
    backend: 'Backend',
    frontend: 'Frontend',
    devops: 'DevOps/Infra',
    database: 'Banco de dados'
  };
  
  const skillsLines = Object.entries(skills)
    .filter(([_, items]) => items.length > 0)
    .map(([key, items]) => `- ${labels[key]}: ${items.join(', ')}`);
  
  if (skillsLines.length === 0) {
    skillsLines.push('- Backend: Php, Javascript, Typescript');
    skillsLines.push('- Frontend: Javascript, Typescript, Html, Vue');
  }
  
  const readmePath = path.join(process.cwd(), 'README.md');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');
  const startMarker = '<!-- SKILLS:START -->';
  const endMarker = '<!-- SKILLS:END -->';
  const escapedStart = startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`);
  const newBlock = `${startMarker}\n${skillsLines.join('\n')}\n${endMarker}`;
  
  const updatedContent = pattern.test(readmeContent)
    ? readmeContent.replace(pattern, newBlock)
    : `${readmeContent.trim()}\n\n${newBlock}\n`;
  
  fs.writeFileSync(readmePath, updatedContent, 'utf8');
  console.log('README atualizado!');
  skillsLines.forEach(line => console.log(`  ${line}`));
}

async function main() {
  try {
    console.log(`Atualizando competências técnicas para ${username}...\n`);
    
    const repos = await api.getAllPaginated(`/users/${username}/repos`, {
      perPageParam: 'per_page',
      maxPages: 10
    });
    
    if (repos.length === 0) {
      console.warn('Nenhum repositório encontrado.');
      return;
    }
    
    const skills = await analyzeSkills(repos);
    updateSkillsInReadme(skills);
    
    console.log('Concluído!');
  } catch (error) {
    console.error('Erro:', error.message);
    if (error.url) console.error(`   URL: ${error.url}`);
    process.exit(1);
  }
}

main();
