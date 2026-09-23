# Cadastro Ferrasoldas — CNPJ / CPF

Sistema de cadastro de clientes da **Ferrasoldas Comércio e Representações Ltda.**

O projeto substitui o formulário utilizado anteriormente pelo setor comercial e centraliza o processo de abertura de cadastro em uma aplicação web própria.

Cada cadastro válido é enviado por e-mail ao setor responsável. O endereço informado pelo cliente é configurado como `Reply-To`, permitindo que o financeiro responda diretamente ao cliente a partir da caixa de entrada.

O sistema **não utiliza banco de dados**. Os dados são validados, processados e encaminhados ao serviço de e-mail.

---

## Stack

* **Next.js** — aplicação web e API Routes
* **React** — interface do formulário
* **TypeScript** — tipagem e segurança durante o desenvolvimento
* **Zod** — validação e definição do schema dos dados
* **React Hook Form** — gerenciamento do formulário
* **Nodemailer** — envio via SMTP
* **Resend** — alternativa para envio transacional
* **Vitest** — testes automatizados
* **CSS** — interface responsiva e identidade visual
* **Vercel** — hospedagem e deploy

---

## Funcionalidades

* Cadastro de Pessoa Física e Pessoa Jurídica
* Validação de CPF
* Validação de CNPJ, incluindo o novo formato alfanumérico
* Validação de telefone e CEP
* Máscaras durante o preenchimento
* Cadastro de referências comerciais
* Validação no cliente e no servidor
* Proteção contra envios automatizados
* Limitação de requisições por IP
* Envio de e-mail em HTML
* Versão alternativa do e-mail em texto simples
* Logo da Ferrasoldas incorporado ao e-mail
* `Reply-To` direcionado ao e-mail informado pelo cliente
* Suporte a SMTP ou Resend
* Interface responsiva
* Testes automatizados das principais regras de negócio

---

## Como rodar

Instale as dependências:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.local.example .env.local
```

Preencha as variáveis de ambiente e execute:

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

Para executar os testes:

```bash
npm test
```

Para validar o build de produção:

```bash
npm run build
```

---

## Variáveis de ambiente

| Variável          | Descrição                            |
| ----------------- | ------------------------------------ |
| `EMAIL_DESTINO`   | Caixa que recebe os cadastros        |
| `EMAIL_REMETENTE` | Remetente do e-mail                  |
| `EMAIL_PROVEDOR`  | `smtp`                               |
| `SMTP_HOST`       | Servidor SMTP                        |
| `SMTP_PORTA`      | Porta do servidor SMTP               |
| `SMTP_SEGURO`     | Define se a conexão SMTP utiliza TLS |
| `SMTP_USUARIO`    | Usuário da conta SMTP                |
| `SMTP_SENHA`      | Senha da conta SMTP                  |

### Exemplo

```env
EMAIL_PROVEDOR=smtp

EMAIL_DESTINO=pagamento@ferrasoldas.com.br
EMAIL_REMETENTE=Ferrasoldas <seu-email@ferrasoldas.com.br>

SMTP_HOST=smtp.seu-provedor.com
SMTP_PORTA=465
SMTP_SEGURO=true
SMTP_USUARIO=seu-email@ferrasoldas.com.br
SMTP_SENHA=sua-senha
```

> As credenciais reais devem permanecer somente no ambiente local ou nas variáveis de ambiente da Vercel. Nunca devem ser versionadas no Git.

---

## Escolha do provedor de e-mail

### SMTP

Utiliza a conta de e-mail já existente na empresa.

É uma alternativa simples quando a estrutura de e-mail já está funcionando e não é necessário utilizar um serviço transacional externo.

Dependendo do provedor, o endereço definido em `EMAIL_REMETENTE` precisa corresponder à conta autenticada em `SMTP_USUARIO`.


---

## Arquitetura

O fluxo principal de um cadastro é:

```text
FormularioCadastro
        │
        ├── React Hook Form
        │
        └── Zod
             │
             ▼
       POST /api/cadastro
             │
             ├── Rate limit
             │
             ├── Validação do schema
             │
             ├── Honeypot
             │
             └── enviarCadastro()
                    │
                    ├── SMTP + Nodemailer
                    │
                    └── Resend
```

O mesmo schema definido em `lib/schema.ts` é utilizado no cliente e no servidor.

A validação no cliente melhora a experiência de preenchimento, mas a validação do servidor é a responsável por garantir que requisições externas também sejam verificadas.

Isso é importante porque a API pode ser chamada diretamente sem utilizar a interface do formulário.

---

## Organização do projeto

```text
cadastro-ferrasoldas/
│
├── app/
│   ├── api/
│   │   └── cadastro/
│   │       └── route.ts
│   │
│   └── ...
│
├── components/
│   └── FormularioCadastro.tsx
│
├── lib/
│   ├── email.ts
│   ├── mascaras.ts
│   ├── rate-limit.ts
│   ├── schema.ts
│   └── validadores.ts
│
├── public/
│   └── logo-ferrasoldas.png
│
├── tests/
│   ├── api-cadastro.test.ts
│   ├── mascaras.test.ts
│   ├── schema.test.ts
│   └── validadores.test.ts
│
├── .env.local.example
├── package.json
└── README.md
```

---

## Envio de e-mail

O e-mail enviado pelo sistema possui duas versões:

* HTML, para clientes de e-mail com suporte a conteúdo formatado;
* texto simples, utilizado como alternativa de compatibilidade.

O HTML utiliza a identidade visual da Ferrasoldas, com:

* amarelo `#f4e500`;
* preto `#111111`;
* grafite `#242424`;
* fundo claro;
* informações agrupadas por seção;
* referências comerciais em tabela;
* identificação do cliente;
* data e horário do recebimento.

O logo é incorporado ao e-mail utilizando uma imagem inline (`CID`), evitando dependência de uma URL pública da aplicação.

Isso permite que o e-mail funcione mesmo antes da publicação do sistema em um domínio próprio.

---

## Assunto dos e-mails

O assunto é gerado automaticamente de acordo com o tipo de cadastro.

Exemplo:

```text
Novo Cadastro CNPJ - Ferrasoldas Comércio Ltda. - Vendedor João
```

O endereço informado pelo cliente é utilizado no campo:

```text
Reply-To
```

Dessa forma, ao clicar em **Responder**, o financeiro pode responder diretamente ao cliente.

---

Validação de documentos
CPF

O CPF é validado utilizando seus dígitos verificadores.

A máscara utilizada durante o preenchimento é independente da validação. A máscara apenas melhora a apresentação do documento enquanto o usuário digita.

CNPJ

O sistema também considera o novo formato de CNPJ alfanumérico.

A partir de julho de 2026, novos CNPJs podem utilizar letras nas primeiras posições do identificador, mantendo o cálculo dos dígitos verificadores pelo algoritmo de módulo 11.

A implementação está concentrada em:

lib/validadores.ts

O formato utilizado nos testes inclui:

12.ABC.345/01DE-35

A aplicação não trata o CNPJ como um número. O documento é manipulado como string para permitir tanto os formatos tradicionais quanto os alfanuméricos.

Máscaras e validação

A aplicação separa formatação de validação.

O arquivo:

lib/mascaras.ts

é responsável apenas pela apresentação dos dados durante a digitação.

Já:

lib/validadores.ts

contém as regras responsáveis por verificar os documentos e demais dados.

Essa separação evita que uma máscara seja confundida com uma validação real.

Proteção contra spam

O formulário utiliza duas camadas simples de proteção.

Honeypot

Existe um campo oculto que não deve ser preenchido por usuários reais.

Quando esse campo é preenchido, a API retorna uma resposta de sucesso sem realizar o envio do e-mail.

Isso evita fornecer ao bot uma resposta explícita indicando que o envio foi bloqueado.

Rate limit

A API limita a quantidade de envios por endereço IP.

A configuração atual é:

5 envios
10 minutos

Quando o limite é excedido, a API responde com:

HTTP 429

O controle atual utiliza memória da instância.

Em ambientes serverless, isso significa que o limite não é distribuído globalmente entre todas as instâncias.

Para um cenário de maior exposição, a implementação pode ser substituída por Redis/Upstash mantendo a mesma interface de verificarLimite().

LGPD

O formulário coleta dados pessoais necessários para o processo de cadastro comercial, incluindo informações como:

CPF/CNPJ;
RG ou Inscrição Estadual;
endereço;
telefone;
e-mail;
referências comerciais.

O sistema não possui banco de dados próprio e não mantém uma cópia dos cadastros.

Os dados são recebidos pela aplicação, validados e encaminhados ao serviço de e-mail configurado.

A retenção posterior dos dados ocorre na caixa de e-mail da empresa e deve seguir as políticas internas de segurança, acesso e retenção de informações.

Deploy na Vercel

O projeto foi estruturado para execução em ambiente serverless e pode ser publicado na Vercel.

Fluxo recomendado:

GitHub
   │
   ▼
Vercel
   │
   ▼
Next.js
   │
   └── /api/cadastro
          │
          ▼
       E-mail
Configuração
Suba o projeto para o GitHub.
Importe o repositório na Vercel.
Configure as variáveis de ambiente em:
Project Settings
└── Environment Variables
Cadastre as variáveis necessárias para o provedor escolhido.
Faça o deploy.
Realize um cadastro de teste.
Confirme o recebimento do e-mail.
Teste o botão Responder.
Verifique os logs da função caso ocorra alguma falha.

Nenhuma variável utilizada pelo servidor possui prefixo:

NEXT_PUBLIC_

Portanto, as credenciais e configurações de e-mail não são expostas ao navegador.

Testes

Os testes automatizados estão organizados por responsabilidade:

tests/
│
├── validadores.test.ts
│   └── CPF, CNPJ, telefone, CEP e referências
│
├── mascaras.test.ts
│   └── documentos, telefone, CEP e moeda
│
├── schema.test.ts
│   └── campos obrigatórios, opcionais,
│       referências e honeypot
│
└── api-cadastro.test.ts
    └── respostas 200, 400, 429 e 502

Executar:

npm test

Para validar o projeto antes do deploy:

npm run build
Git

O desenvolvimento é organizado utilizando branches para alterações específicas.

Exemplo:

main
 │
 └── feat/modernizacao-cadastro

Após validação e testes, a branch de funcionalidade pode ser integrada à main, que é a branch utilizada para produção.

Exemplo:

git checkout main
git pull origin main
git merge feat/modernizacao-cadastro
git push origin main
Status

Em desenvolvimento / preparação para produção.

O próximo passo é concluir a validação do build, integrar a branch de modernização à main e realizar o primeiro deploy na Vercel. 
