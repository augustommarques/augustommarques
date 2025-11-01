/**
 * Model para processamento de dados de repositórios
 */
class RepositoryService {
  /**
   * Filtra e ordena repositórios
   */
  filterAndSortRepos(repos, options = {}) {
    const {
      excludeForks = true,
      excludeArchived = true,
      excludePrivate = true,
      sortBy = 'pushed_at',
      limit = null
    } = options;

    let filtered = repos.filter(r => {
      if (excludeForks && r.fork) return false;
      if (excludeArchived && r.archived) return false;
      if (excludePrivate && r.private) return false;
      return true;
    });

    if (sortBy === 'pushed_at') {
      filtered.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    } else if (sortBy === 'open_issues_count') {
      filtered.sort((a, b) => b.open_issues_count - a.open_issues_count);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Busca repositórios com issues abertas
   */
  getReposWithOpenIssues(repos) {
    return this.filterAndSortRepos(repos, {
      excludeForks: true,
      excludeArchived: true,
      excludePrivate: true,
      sortBy: 'open_issues_count'
    }).filter(r => r.open_issues_count > 0);
  }

  /**
   * Conta linguagens usadas nos repositórios
   */
  countLanguages(repos) {
    const languageCount = new Map();
    for (const r of repos) {
      if (r.language) {
        const key = r.language.trim();
        languageCount.set(key, (languageCount.get(key) || 0) + 1);
      }
    }
    return languageCount;
  }

  /**
   * Conta tópicos dos repositórios
   */
  countTopics(topicsArrays) {
    const topicCount = new Map();
    for (const arr of topicsArrays) {
      for (const t of arr) {
        const key = t.trim().toLowerCase();
        topicCount.set(key, (topicCount.get(key) || 0) + 1);
      }
    }
    return topicCount;
  }

  /**
   * Retorna os top N itens de um Map ordenado por valor
   */
  topN(map, n) {
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);
  }
}

module.exports = RepositoryService;

