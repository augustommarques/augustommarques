# Estrutura MVC do Script update-readme

Esta é a versão refatorada do script `update-readme.js` seguindo o padrão **MVC (Model-View-Controller)**.

## 📁 Estrutura de Diretórios

```
.
├── models/              # Camada de dados e lógica de negócio
│   ├── GitHubApi.js           # Comunicação com API do GitHub
│   ├── RepositoryService.js   # Processamento de repositórios
│   └── SkillsService.js       # Processamento de skills/competências
│
├── views/               # Camada de apresentação
│   ├── ReadmeView.js          # Formatação de conteúdo do README
│   └── TextView.js            # Mensagens de console/output
│
├── controllers/         # Camada de controle/orquestração
│   └── ReadmeController.js    # Controller principal
│
└── update-readme-mvc.js # Ponto de entrada
```

## 🔍 Componentes

### Models (Modelos)

#### `GitHubApi.js`
Responsável por todas as interações com a API do GitHub:
- `fetchJson(url)` - Faz requisições HTTP GET
- `fetchAllRepos(username)` - Busca todos os repositórios com paginação
- `fetchTopics(repo)` - Busca tópicos de um repositório

#### `RepositoryService.js`
Processa dados de repositórios:
- `filterAndSortRepos()` - Filtra e ordena repositórios
- `getReposWithOpenIssues()` - Busca repositórios com issues abertas
- `countLanguages()` - Conta linguagens usadas
- `countTopics()` - Conta tópicos
- `topN()` - Retorna top N itens de um Map

#### `SkillsService.js`
Processa e categoriza skills/competências:
- `processSkills()` - Processa linguagens e tópicos em categorias
- `generateSkillsLines()` - Gera linhas formatadas para o README
- `getFallbackSkills()` - Retorna skills estáticas como fallback

### Views (Visualizações)

#### `ReadmeView.js`
Formata conteúdo para o README em markdown:
- `formatProjects()` - Formata lista de projetos
- `formatOpenIssues()` - Formata lista de issues abertas
- `formatSkills()` - Formata skills

#### `TextView.js`
Gerencia output no console:
- Métodos para log de status, progresso, erros e sucesso

### Controllers (Controladores)

#### `ReadmeController.js`
Orquestra todo o fluxo:
- Inicializa todos os services e views
- Coordena busca de dados
- Processa e formata informações
- Atualiza o README.md

## 🚀 Uso

```bash
# Sem token (apenas repositórios públicos)
node update-readme-mvc.js

# Com token (repositórios privados também)
node update-readme-mvc.js --token seu-token-github

# Ou usando variável de ambiente
GITHUB_TOKEN=seu-token node update-readme-mvc.js
```

## ✨ Benefícios da Arquitetura MVC

1. **Separação de Responsabilidades**: Cada componente tem uma responsabilidade clara
2. **Manutenibilidade**: Código mais fácil de entender e modificar
3. **Testabilidade**: Cada componente pode ser testado independentemente
4. **Reutilização**: Services podem ser reutilizados em outros contextos
5. **Escalabilidade**: Fácil adicionar novas funcionalidades sem modificar código existente

## 🔄 Diferenças da Versão Original

- ✅ Código organizado em camadas
- ✅ Lógica de negócio separada da apresentação
- ✅ Facilita testes unitários
- ✅ Mais fácil de estender e manter
- ✅ Mantém a mesma funcionalidade do script original


