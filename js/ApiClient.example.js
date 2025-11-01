/**
 * Exemplo de uso da biblioteca genérica de API
 */

const { ApiClient } = require('./GitApi');

// Exemplo 1: Cliente genérico para qualquer API REST
const customApi = new ApiClient({
  baseURL: 'https://api.exemplo.com',
  token: 'seu-token-aqui',
  headers: {
    'X-Custom-Header': 'valor'
  },
  timeout: 5000
});

// Fazer requisições
async function exemplo() {
  // GET
  const dados = await customApi.get('/endpoint');
  
  // POST
  const resultado = await customApi.post('/endpoint', { data: 'valor' });
  
  // Com paginação automática
  const todosOsDados = await customApi.getAllPaginated('/endpoint', {
    perPage: 50,
    maxPages: 5
  });
}

// Exemplo 2: Criar cliente para outra API
const anotherApi = new ApiClient({
  baseURL: 'https://outra-api.com/v1',
  token: 'token',
  tokenHeader: 'X-API-Key', // Cabeçalho customizado para token
  tokenPrefix: '' // Sem prefixo (ex: "Bearer")
});

// Exemplo 3: Usar o cliente do GitHub
const { createGitHubClient } = require('./GitApi');
const github = createGitHubClient('meu-token-github');

const repos = await github.get('/user/repos');

