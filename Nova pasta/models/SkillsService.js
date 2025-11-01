const fs = require('fs');
const path = require('path');

/**
 * Model para processamento de skills/competências
 */
class SkillsService {
  constructor(repositoryService) {
    this.repositoryService = repositoryService;
  }

  /**
   * Categorias de tecnologias
   */
  getCategories() {
    return {
      backends: ['php', 'javascript', 'typescript', 'nodejs', 'node.js', 'go', 'python'],
      frontends: ['javascript', 'typescript', 'html', 'css', 'vue', 'react', 'vue.js', 'react.js'],
      devops: ['docker', 'kubernetes', 'vercel', 'apache', 'nginx', 'linux'],
      databases: ['mongodb', 'mysql', 'postgresql', 'sqlite']
    };
  }

  /**
   * Verifica quais candidatos estão no pool
   */
  hasAny(candidates, pool) {
    return candidates.filter(c => pool.includes(c));
  }

  /**
   * Formata nome de tecnologia
   */
  formatTechName(name) {
    return name
      .replace('nodejs', 'Node.js')
      .replace('node.js', 'Node.js')
      .replace('vue.js', 'Vue.js')
      .replace('react.js', 'React')
      .replace(/^./, match => match.toUpperCase());
  }

  /**
   * Processa skills a partir de linguagens e tópicos
   */
  processSkills(languageCount, topicCount, topLanguagesCount = 8, topTopicsCount = 12) {
    const categories = this.getCategories();
    const langsTop = this.repositoryService.topN(languageCount, topLanguagesCount)
      .map(s => s.toLowerCase());
    const topicsTop = this.repositoryService.topN(topicCount, topTopicsCount);

    const backendList = Array.from(new Set([
      ...this.hasAny(categories.backends, langsTop),
      ...this.hasAny(categories.backends, topicsTop)
    ])).map(s => this.formatTechName(s));

    const frontendList = Array.from(new Set([
      ...this.hasAny(categories.frontends, langsTop),
      ...this.hasAny(categories.frontends, topicsTop)
    ])).map(s => this.formatTechName(s));

    const devopsList = Array.from(new Set(
      this.hasAny(categories.devops, topicsTop)
    )).map(s => this.formatTechName(s));

    const dbList = Array.from(new Set(
      this.hasAny(categories.databases, topicsTop)
    )).map(s => this.formatTechName(s));

    return {
      backend: backendList,
      frontend: frontendList,
      devops: devopsList,
      database: dbList
    };
  }

  /**
   * Gera linhas de skills formatadas
   */
  generateSkillsLines(skills) {
    const lines = [
      skills.backend.length ? `- Backend: ${skills.backend.join(', ')}` : null,
      skills.frontend.length ? `- Frontend: ${skills.frontend.join(', ')}` : null,
      skills.devops.length ? `- DevOps/Infra: ${skills.devops.join(', ')}` : null,
      skills.database.length ? `- Banco de dados: ${skills.database.join(', ')}` : null
    ].filter(line => line !== null);

    return lines.length > 0 ? lines : this.getFallbackSkills();
  }

  /**
   * Fallback para skills estáticas
   */
  getFallbackSkills() {
    const staticPath = path.join(process.cwd(), 'docs', 'skills_static.md');
    if (fs.existsSync(staticPath)) {
      const raw = fs.readFileSync(staticPath, 'utf8')
        .split('\n')
        .filter(l => l.trim().startsWith('- '));
      return raw.length ? raw : ['- (defina competências em docs/skills_static.md)'];
    }
    return ['- (defina competências em docs/skills_static.md)'];
  }
}

module.exports = SkillsService;


