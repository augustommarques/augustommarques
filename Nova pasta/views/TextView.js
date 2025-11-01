/**
 * View para output de texto/console
 */
class TextView {
  /**
   * Mensagens de status
   */
  logStart() {
    console.log('🚀 Iniciando atualização do README...\n');
  }

  logUsingToken() {
    console.log('🔑 Usando token para acessar repositórios privados...');
  }

  logFetchingPublicRepos() {
    console.log('📦 Buscando repositórios públicos...');
  }

  logFetchingPage(pageNum) {
    console.log(`📦 Buscando página ${pageNum}...`);
  }

  logReposFound(count) {
    console.log(`✅ Encontrados ${count} repositórios\n`);
  }

  logTopProjects(repos) {
    console.log(`📋 Top ${repos.length} projetos:\n`);
    repos.forEach(r => {
      console.log(`  - ${r.name}: ${r.description || 'Sem descrição'}`);
    });
  }

  logAnalyzingSkills() {
    console.log('\n🛠️  Analisando skills...');
  }

  logSuccess() {
    console.log('\n✅ README.md atualizado com sucesso!');
  }

  logAlreadyUpdated() {
    console.log('\nℹ️  README.md já estava atualizado.');
  }

  logError(error) {
    console.error('❌ Erro:', error.message);
  }
}

module.exports = TextView;


