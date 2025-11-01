# 📝 Como usar o update-readme.js

## Descrição
Script Node.js para atualizar localmente o README.md com dados da API do GitHub, sem precisar executar o GitHub Actions.

## Uso Básico (Apenas repositórios públicos)

```bash
node update-readme.js
```

## Uso com Token (Incluindo repositórios privados)

```bash
node update-readme.js --token ghp_seu_token_aqui
```

## O que o script faz?

✅ Busca seus repositórios do GitHub (públicos ou todos com token)  
✅ Preenche a seção **Projetos em Destaque** (top 8 mais recentes)  
✅ Preenche a seção **Projetos com Issues Abertas**  
✅ Atualiza as **Competências Técnicas** baseado nas linguagens e topics  
✅ Salva automaticamente no README.md  

## Como obter um token do GitHub?

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione o escopo `public_repo` ou `repo` (para repositórios privados)
4. Copie o token gerado (começa com `ghp_`)
5. Use: `node update-readme.js --token ghp_seu_token`

## Exemplo de Saída

```
🚀 Iniciando atualização do README...

📦 Buscando repositórios públicos...
📦 Buscando página 1...
✅ Encontrados 22 repositórios

📋 Top 8 projetos:

  - augustommarques: Sem descrição
  - ambiente-homolog: Sem descrição
  - Shell: Script linux
  ...

🛠️  Analisando skills...

✅ README.md atualizado com sucesso!
```

## Diferença do GitHub Actions

| Característica | GitHub Actions | Script Local |
|---------------|----------------|--------------|
| **Execução** | No GitHub, automaticamente | No seu computador, manualmente |
| **Frequência** | Diária (schedule) ou manual | Sob demanda |
| **Token** | Usa GITHUB_TOKEN automaticamente | Opcional (via argumento) |
| **Commit** | Faz commit automaticamente | Apenas atualiza o arquivo |
| **Requisitos** | Nenhum (no GitHub) | Node.js instalado |

## Dependências

- Node.js instalado (v12+)
- Conexão com internet
- Token do GitHub (opcional, para repositórios privados)

