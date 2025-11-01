#!/usr/bin/env node

/**
 * Script para atualizar o README.md com dados da API do GitHub (versão MVC)
 * Uso: node update-readme-mvc.js [--token seu-token]
 */

const ReadmeController = require('./controllers/ReadmeController');

const username = 'augustommarques';
const PAT = process.argv.includes('--token') 
  ? process.argv[process.argv.indexOf('--token') + 1] 
  : process.env.GITHUB_TOKEN || '';

const controller = new ReadmeController(username, PAT);
controller.updateReadme();


