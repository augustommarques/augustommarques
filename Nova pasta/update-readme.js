#!/usr/bin/env node

/**
 * Script para atualizar o README.md com dados da API do GitHub
 * Uso: node update-readme.js [--token seu-token]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const username = 'augustommarques';
const PAT = process.argv.includes('--token') 
  ? process.argv[process.argv.indexOf('--token') + 1] 
  : process.env.GITHUB_TOKEN || '';

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'gha-update-projects' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
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

async function fetchAllRepos(token) {
  let repos = [];
  
  if (token) {
    console.log('🔑 Usando token para acessar repositórios privados...');
    const base = `https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all&affiliation=owner`;
    let url = base;
    let pageNum = 1;
    
    while (url) {
      console.log(`📦 Buscando página ${pageNum}...`);
      const page = await fetchJson(url, token);
      repos = repos.concat(page);
      
      if (page.length < 100) break;
      
      pageNum++;
      url = `${base}&page=${pageNum}`;
    }
  } else {
    console.log('📦 Buscando repositórios públicos...');
    const base = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=all`;
    let url = base;
    let pageNum = 1;
    
    while (url) {
      console.log(`📦 Buscando página ${pageNum}...`);
      const page = await fetchJson(url, token);
      repos = repos.concat(page);
      
      if (page.length < 100) break;
      
      pageNum++;
      url = `${base}&page=${pageNum}`;
    }
  }
  
  return repos;
}

function replaceBlock(content, startMarker, endMarker, lines) {
  const pattern = new RegExp(`${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const newBlock = `${startMarker}\n${lines.join('\n')}\n${endMarker}`;
  
  if (pattern.test(content)) {
    return content.replace(pattern, newBlock);
  }
  return `${content.trim()}\n\n${newBlock}\n`;
}

async function fetchTopics(repo, token) {
  try {
    if (token) {
      const url = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/topics`;
      const data = await fetchJson(url, token);
      return data.names || [];
    } else {
      const url = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/topics`;
      const data = await fetchJson(url, token);
      return data.names || [];
    }
  } catch (e) {
    return [];
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando atualização do README...\n');
    
    // Buscar repositórios
    const repos = await fetchAllRepos(PAT);
    console.log(`✅ Encontrados ${repos.length} repositórios\n`);
    
    // Filtrar repositórios (não fork, não archived, não private)
    const filtered = repos
      .filter(r => !r.fork && !r.archived && !r.private)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 8);
    
    console.log(`📋 Top ${filtered.length} projetos:\n`);
    filtered.forEach(r => {
      console.log(`  - ${r.name}: ${r.description || 'Sem descrição'}`);
    });
    
    // Gerar linhas de projetos
    const lines = filtered.map(r => `- [${r.name}](${r.html_url}): ${r.description ? r.description.trim() : 'Sem descrição.'}`);
    
    // Ler README atual
    const readmePath = path.join(process.cwd(), 'README.md');
    const original = fs.readFileSync(readmePath, 'utf8');
    
    // Atualizar bloque de projetos
    let updated = replaceBlock(original, '<!-- PROJECTS:START -->', '<!-- PROJECTS:END -->', lines);
    
    // Buscar issues abertas
    const issuesOpen = repos
      .filter(r => !r.fork && !r.archived && !r.private && r.open_issues_count > 0)
      .sort((a, b) => b.open_issues_count - a.open_issues_count)
      .map(r => `- [${r.name}](${r.html_url}) — issues abertas: ${r.open_issues_count}`);
    
    updated = replaceBlock(updated, '<!-- ISSUES_OPEN:START -->', '<!-- ISSUES_OPEN:END -->', 
      issuesOpen.length ? issuesOpen : ['- Nenhum projeto com issues abertas no momento.']);
    
    // Buscar languages e topics para skills
    console.log('\n🛠️  Analisando skills...');
    const languageCount = new Map();
    for (const r of repos) {
      if (r.language) {
        const key = r.language.trim();
        languageCount.set(key, (languageCount.get(key) || 0) + 1);
      }
    }
    
    // Buscar topics
    const topicsPerRepo = [];
    for (const r of filtered) {
      const topics = await fetchTopics(r, PAT);
      topicsPerRepo.push(topics);
    }
    
    const topicCount = new Map();
    for (const arr of topicsPerRepo) {
      for (const t of arr) {
        const key = t.trim().toLowerCase();
        topicCount.set(key, (topicCount.get(key) || 0) + 1);
      }
    }
    
    function topN(map, n) {
      return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0, n).map(([k]) => k);
    }
    
    const backends = ['php','javascript','typescript','nodejs','node.js','go','python'];
    const frontends = ['javascript','typescript','html','css','vue','react','vue.js','react.js'];
    const devops = ['docker','kubernetes','vercel','apache','nginx','linux'];
    const databases = ['mongodb','mysql','postgresql','sqlite'];
    
    const langsTop = topN(languageCount, 8).map(s => s.toLowerCase());
    const topicsTop = topN(topicCount, 12);
    
    function hasAny(candidates, pool) {
      return candidates.filter(c => pool.includes(c));
    }
    
    const backendList = Array.from(new Set([
      ...hasAny(backends, langsTop), 
      ...hasAny(backends, topicsTop)
    ])).map(s => 
      s.replace('nodejs','Node.js')
       .replace('node.js','Node.js')
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    const frontendList = Array.from(new Set([
      ...hasAny(frontends, langsTop), 
      ...hasAny(frontends, topicsTop)
    ])).map(s => 
      s.replace('vue.js','Vue.js')
       .replace('react.js','React')
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    const devopsList = Array.from(new Set(hasAny(devops, topicsTop))).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const dbList = Array.from(new Set(hasAny(databases, topicsTop))).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
    let skillsLines = [
      `- Backend: ${backendList.length ? backendList.join(', ') : ''}`,
      `- Frontend: ${frontendList.length ? frontendList.join(', ') : ''}`,
      `- DevOps/Infra: ${devopsList.length ? devopsList.join(', ') : ''}`,
      `- Banco de dados: ${dbList.length ? dbList.join(', ') : ''}`,
    ].filter(line => !line.endsWith(': '));
    
    // Fallback estático
    if (skillsLines.length === 0) {
      const staticPath = path.join(process.cwd(), 'docs', 'skills_static.md');
      if (fs.existsSync(staticPath)) {
        const raw = fs.readFileSync(staticPath, 'utf8').split('\n').filter(l => l.trim().startsWith('- '));
        skillsLines = raw.length ? raw : ['- (defina competências em docs/skills_static.md)'];
      } else {
        skillsLines = ['- (defina competências em docs/skills_static.md)'];
      }
    }
    
    updated = replaceBlock(updated, '<!-- SKILLS:START -->', '<!-- SKILLS:END -->', skillsLines);
    
    // Salvar se houver mudanças
    if (updated !== original) {
      fs.writeFileSync(readmePath, updated, 'utf8');
      console.log('\n✅ README.md atualizado com sucesso!');
    } else {
      console.log('\nℹ️  README.md já estava atualizado.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

