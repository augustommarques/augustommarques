/**
 * View para formatação de conteúdo do README
 */
class ReadmeView {
  /**
   * Formata lista de projetos em linhas markdown
   */
  formatProjects(repos) {
    return repos.map(r => 
      `- [${r.name}](${r.html_url}): ${r.description ? r.description.trim() : 'Sem descrição.'}`
    );
  }

  /**
   * Formata lista de issues abertas em linhas markdown
   */
  formatOpenIssues(repos) {
    if (repos.length === 0) {
      return ['- Nenhum projeto com issues abertas no momento.'];
    }
    return repos.map(r => 
      `- [${r.name}](${r.html_url}) — issues abertas: ${r.open_issues_count}`
    );
  }

  /**
   * Formata skills já processadas (recebe array de linhas)
   */
  formatSkills(skillsLines) {
    return skillsLines; // Já vem formatado do SkillsService
  }
}

module.exports = ReadmeView;


