# Product Requirements Document (PRD) - LMS Corporativo Local

## 1. Visão Geral do Projeto
Um Sistema de Gestão de Aprendizagem (LMS) corporativo focado em treinamento de colaboradores, projetado para rodar em infraestrutura local (On-Premise). O foco é performance, simplicidade e capacidade de rodar offline/intranet.

## 2. Stack Tecnológica (Obrigatória)
- **Frontend:** React (usando Vite), Tailwind CSS (para estilização rápida), React Router.
- **Backend:** Node.js com Fastify.
- **Banco de Dados:** PostgreSQL.
- **ORM:** Prisma.
- **Linguagem:** TypeScript (Fullstack).
- **Armazenamento de Arquivos:** Sistema de arquivos local (Local Filesystem) para vídeos e PDFs, servidos via rota estática do Fastify.

## 3. Funcionalidades Principais (MVP)

### 3.1. Autenticação & Perfis
- Login com E-mail/Senha.
- Dois níveis de acesso (Roles):
  - **Admin/RH:** Cria cursos, gerencia usuários, vê relatórios.
  - **Colaborador:** Assiste aulas, acompanha progresso.

### 3.2. Gestão de Cursos (Admin)
- Criar/Editar/Excluir Cursos (Título, Descrição, Capa).
- Adicionar Módulos e Aulas.
- Upload de materiais (Vídeo .mp4 e PDF).

### 3.3. Área do Aluno (Colaborador)
- Dashboard com "Meus Cursos" e progresso (%).
- Player de vídeo para assistir às aulas.
- Marcação automática de "Aula Concluída" ao terminar o vídeo.

## 4. Estrutura do Banco de Dados (Sugestão para Prisma)

O sistema deve ter, no mínimo, as seguintes entidades relacionais:

- **User:** id, name, email, password_hash, role (ADMIN, STUDENT).
- **Course:** id, title, description, cover_url, created_at.
- **Module:** id, title, course_id.
- **Lesson:** id, title, video_url, content_text, module_id, duration.
- **Enrollment:** user_id, course_id, enrolled_at, completed_at.
- **Progress:** user_id, lesson_id, is_completed.

## 5. Roteiro de Implementação (Fases para o Agente)

### Fase 1: Setup Inicial & Infraestrutura
- Inicializar projeto Monorepo ou pastas separadas (`/server` e `/web`).
- Configurar Fastify com TypeScript.
- Configurar React com Vite e Tailwind.
- Configurar Docker Compose para levantar o PostgreSQL localmente.
- Configurar Prisma e criar a primeira Migration com o Schema acima.

### Fase 2: Backend Core (API)
- Criar rotas de Autenticação (JWT) no Fastify.
- Criar CRUD de Cursos e Módulos.
- Implementar upload de arquivos (multipart) salvando na pasta local `/uploads` e servindo estaticamente.

### Fase 3: Frontend - Estrutura e Auth
- Criar telas de Login e Layout base (Sidebar, Header).
- Configurar proteção de rotas (Private Routes) baseada no JWT.
- Integração com API de Login.

### Fase 4: Frontend - Funcionalidades de Curso
- Tela de Dashboard (Listagem de cursos).
- Tela de Criação de Curso (Upload de vídeo).
- Tela de Player de Aula (Consumindo o vídeo local).

### Fase 5: Refinamento
- Implementar lógica de cálculo de progresso (%).
- Testes básicos de fluxo.