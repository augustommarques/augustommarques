const fs = require('fs');
const path = require('path');
const GitHubApi = require('../models/GitHubApi');
const RepositoryService = require('../models/RepositoryService');
const SkillsService = require('../models/SkillsService');
const ReadmeView = require('../views/ReadmeView');
const TextView = require('../views/TextView');

/**
 * Controller principal - orquestra o fluxo de atualização do README
 */
class ReadmeController {
  constructor(username, token) {
    this.username = username;
    this.token = token;
    this.githubApi = new GitHubApi(token);
    this.repositoryService = new RepositoryService();
    this.skillsService = new SkillsService(this.repositoryService);
    this.readmeView = new ReadmeView();
    this.textView = new TextView();
  }

  /**
   * Substitui um bloco de conteúdo no README entre marcadores
   */
  replaceBlock(content, startMarker, endMarker, lines) {
    const pattern = new RegExp(
      `${startMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${endMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
    );
    const newBlock = `${startMarker}\n${lines.join('\n')}\n${endMarker}`;
    
    if (pattern.test(content)) {
      return content.replace(pattern, newBlock);
    }
    return `${content.trim()}\n\n${newBlock}\n`;
  }

  /**
   * Busca todos os repositórios com feedback de progresso
   */
  async fetchAllRepos() {
    if (this.token) {
      this.textView.logUsingToken();
    } else {
      this.textView.logFetchingPublicRepos();
    }
    
    // Usa o método do GitHubApi que já gerencia paginação internamente
    // Para feedback de progresso, precisamos fazer manualmente
    let repos = [];
    let pageNum = 1;
    const base = this.token
      ? `https://api.github.com/user/repos?per_page=100&sort=updated&visibility=all&affiliation=owner`
      : `https://api.github.com/users/${this.username}/repos?per_page=100&sort=updated&type=all`;
    
    while (true) {
      this.textView.logFetchingPage(pageNum);
      const url = pageNum === 1 ? base : `${base}&page=${pageNum}`;
      const page = await this.githubApi.fetchJson(url);
      
      if (page.length === 0) break;
      
      repos = repos.concat(page);
      
      if (page.length < 100) break;
      
      pageNum++;
    }
    
    return repos;
  }

  /**
   * Processa e atualiza o README
   */
  async updateReadme() {
    try {
      this.textView.logStart();
      
      // Buscar repositórios
      const repos = await this.fetchAllRepos();
      this.textView.logReposFound(repos.length);
      
      // Filtrar top projetos
      const filtered = this.repositoryService.filterAndSortRepos(repos, {
        excludeForks: true,
        excludeArchived: true,
        excludePrivate: true,
        sortBy: 'pushed_at',
        limit: 8
      });
      
      this.textView.logTopProjects(filtered);
      
      // Gerar linhas de projetos
      const projectLines = this.readmeView.formatProjects(filtered);
      
      // Ler README atual
      const readmePath = path.join(process.cwd(), 'README.md');
      const original = fs.readFileSync(readmePath, 'utf8');
      
      // Atualizar bloco de projetos
      let updated = this.replaceBlock(
        original,
        '<!-- PROJECTS:START -->',
        '<!-- PROJECTS:END -->',
        projectLines
      );
      
      // Buscar issues abertas
      const reposWithIssues = this.repositoryService.getReposWithOpenIssues(repos);
      const issuesLines = this.readmeView.formatOpenIssues(reposWithIssues);
      
      updated = this.replaceBlock(
        updated,
        '<!-- ISSUES_OPEN:START -->',
        '<!-- ISSUES_OPEN:END -->',
        issuesLines
      );
      
      // Processar skills
      this.textView.logAnalyzingSkills();
      const languageCount = this.repositoryService.countLanguages(repos);
      
      // Buscar topics dos projetos filtrados
      const topicsPerRepo = [];
      for (const r of filtered) {
        const topics = await this.githubApi.fetchTopics(r);
        topicsPerRepo.push(topics);
      }
      
      const topicCount = this.repositoryService.countTopics(topicsPerRepo);
      const skills = this.skillsService.processSkills(languageCount, topicCount);
      const skillsLines = this.skillsService.generateSkillsLines(skills);
      
      updated = this.replaceBlock(
        updated,
        '<!-- SKILLS:START -->',
        '<!-- SKILLS:END -->',
        skillsLines
      );
      
      // Salvar se houver mudanças
      if (updated !== original) {
        fs.writeFileSync(readmePath, updated, 'utf8');
        this.textView.logSuccess();
      } else {
        this.textView.logAlreadyUpdated();
      }
      
    } catch (error) {
      this.textView.logError(error);
      process.exit(1);
    }
  }
}

module.exports = ReadmeController;

