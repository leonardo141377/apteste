# HA Automation Builder — Escopo e andamento

## 1. Objetivo
Plataforma web responsiva, multiusuário e multi-Home Assistant, para administrar projetos de clientes e criar/importar automações e scripts sem exigir edição manual de YAML. Acesso por navegador, sem publicação nas lojas de aplicativos.

## 2. Módulos previstos

### ADMIN GERAL — acesso exclusivo da empresa
- Clientes, usuários, permissões, instalações e servidores Home Assistant.
- Inventário por cliente/instalação: ambientes, dispositivos, entidades, protocolos (Zigbee, Wi-Fi, Matter etc.), configurações e diagnósticos.
- Mapas de rede/Wi-Fi, manuais, imagens, documentação, observações, etiquetas, prioridades e cópias de configurações.
- Acompanhamento da implantação pelo cliente (etapas, pendências e progresso).
- Importação/sincronização de dados do Home Assistant; YAML pode ser importado, mas não fornece sozinho todo o inventário.
- Auditoria, histórico, backups/versionamento e proteção de credenciais.

### CONSTRUTOR DE AUTOMAÇÕES E SCRIPTS
- Assistente sequencial: cliente → instalação → ambiente → dispositivo/entidade → gatilhos → condições → ações → revisão.
- Formulários dinâmicos a partir das entidades e capacidades reais de cada instalação.
- Suporte a lógica AND/OR, múltiplos gatilhos e ações, atrasos, variáveis e modelos reutilizáveis.
- Geração e prévia de YAML, validação, rascunhos, versionamento e importação controlada.
- Consulta de erros e rastros de execução quando disponibilizados pelo Home Assistant.

## 3. Arquitetura escolhida
- **Wix App / Wix CLI for Apps:** aplicação e interface web de testes, sem publicar no site Premium nesta fase.
- **Claude Code + Wix MCP:** desenvolvimento assistido.
- **GitHub:** versionamento do código.
- **Backend/conector seguro por instalação:** sincronizar inventário, validar e importar configurações para diferentes Home Assistants. Implementação ainda não iniciada.
- Estrutura lógica: **Cliente → Instalação → Ambiente → Dispositivo → Entidade**.

## 4. O que já foi feito
- Ambiente Windows 11 Pro verificado: **Node.js 26.10.0**, **npm 11.19.1**, **Git 2.56.1**, **VS Code 1.146.0**.
- Pasta global do npm corrigida; **Wix CLI 1.2.14** instalada e executando.
- Repositório Git local em `C:\Users\Administrador\Desktop\APP-HA`, com remoto `github.com/leonardo141377/apteste` e push inicial realizado.
- Assistente `npm create @wix/new@latest app` iniciado; opções **Create a new Wix app** e **Create a basic app** selecionadas.
- **Claude Code** selecionado como opção de configuração do **Wix MCP**.
- Wix confirmou: **“My Custom app has been registered”**.
- Valores exibidos no assistente: nome **My Custom app**, pasta **my-custom-app**, namespace **app_ha**.
- Última tela mostrada: solicitação do **code identifier**; foi orientado `app_ha`, **sem confirmação de conclusão na conversa**.

## 5. Pendências imediatas
1. Concluir o assistente e conferir a pasta/identificador efetivamente gerados.
2. Validar autenticação e funcionamento do Wix MCP no Claude Code.
3. Abrir o projeto, executar testes locais/Wix Dev Site e conferir a estrutura Git antes do próximo push.
4. Implementar os módulos e, depois, o conector seguro para Home Assistant.

**Status:** estrutura inicial registrada na Wix; aplicação funcional, integração e publicação **ainda não confirmadas**.
