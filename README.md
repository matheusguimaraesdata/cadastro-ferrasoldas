# Cadastro Ferrasoldas (CNPJ / CPF)

Formulário de cadastro de cliente da Ferrasoldas. Substitui o Google Forms usado
hoje pelo setor comercial. Cada envio válido vira um e-mail formatado entregue em
`pagamento@ferrasoldas.com.br`, com `Reply-To` apontando para o e-mail do cliente —
o financeiro responde direto da caixa de entrada.

Nada é gravado em banco de dados. O formulário transporta os dados e encerra.

## Como rodar

```bash
npm install
cp .env.local.example .env.local   # preencha as variáveis
npm run dev                        # http://localhost:3000
npm test                           # testes
```

## Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `EMAIL_DESTINO` | Caixa que recebe os cadastros |
| `EMAIL_REMETENTE` | Remetente no formato `Nome <endereco@dominio>` |
| `EMAIL_PROVEDOR` | `smtp` ou `resend` |
| `RESEND_API_KEY` | Só com `EMAIL_PROVEDOR=resend` |
| `SMTP_HOST`, `SMTP_PORTA`, `SMTP_SEGURO`, `SMTP_USUARIO`, `SMTP_SENHA` | Só com `EMAIL_PROVEDOR=smtp` |

### Escolhendo o provedor

**SMTP** usa a conta de e-mail que a empresa já tem. É o caminho mais curto quando
não há acesso ao DNS do domínio. Ponto de atenção: alguns provedores exigem que o
`EMAIL_REMETENTE` seja exatamente a conta autenticada em `SMTP_USUARIO`, senão o
envio é rejeitado.

**Resend** entrega melhor e dá visibilidade de logs e bounces, mas exige verificar
o domínio no painel (registros SPF e DKIM no DNS de `ferrasoldas.com.br`) antes de
enviar com um remetente `@ferrasoldas.com.br`. Trocar de um para o outro é só mudar
`EMAIL_PROVEDOR` e as credenciais — nenhum outro arquivo muda.

## Arquitetura

O caminho de um envio:

```
FormularioCadastro (cliente)
  └─ react-hook-form + zodResolver  ← valida para dar retorno imediato
       └─ POST /api/cadastro
            ├─ verificarLimite(IP)         → 429 se estourar
            ├─ schemaCadastro.safeParse()  → 400 com erro por campo
            ├─ honeypot preenchido         → 200 silencioso, sem enviar
            └─ enviarCadastro()            → 502 se o provedor falhar
                 └─ Resend ou Nodemailer
```

O mesmo schema Zod (`lib/schema.ts`) roda no cliente e no servidor. Validação de
cliente é experiência de uso; a de servidor é a que importa, porque a rota aceita
qualquer requisição, inclusive `curl`.

## Decisões que valem explicação

**CNPJ alfanumérico.** Desde julho de 2026 a Receita emite CNPJ com letras nas 12
primeiras posições (IN RFB 2.229/2024). O dígito verificador continua em módulo 11
com os pesos de sempre; muda só a conversão do caractere, que passa a ser
`ASCII(c) - 48`. Como `'0'` vale 48, os dígitos 0-9 mantêm seu valor e o algoritmo
segue validando todo CNPJ antigo. Consequência prática: o campo não pode ser
numérico e regex com `\d` nas 12 primeiras posições recusa documento válido.
A implementação está em `lib/validadores.ts` e é coberta pelo exemplo oficial
`12.ABC.345/01DE-35`.

**Máscara não é validação.** `lib/mascaras.ts` só formata enquanto a pessoa digita.
Quem decide se o documento existe é o dígito verificador.

**Anti-spam sem CAPTCHA.** Um campo honeypot fora da vista e do foco, mais limite de
5 envios por IP a cada 10 minutos. O honeypot preenchido responde 200 sem enviar
nada — bot que recebe erro tenta de novo, bot que recebe sucesso vai embora.

**Limite de envio em memória.** Em serverless o estado vive por instância, então o
limite reduz abuso casual mas não é uma barreira distribuída. Se o formulário virar
alvo, trocar o `Map` de `lib/rate-limit.ts` por Upstash Redis mantendo a mesma
assinatura de `verificarLimite` resolve sem tocar na rota.

**LGPD.** O formulário coleta CPF, RG e endereço, que são dado pessoal. A finalidade
está declarada na própria página e nada é persistido aqui — o dado só transita até a
caixa do financeiro, o que reduz a superfície de guarda. O que ficar na caixa de
e-mail passa a ser responsabilidade da política interna da empresa.

## Deploy na Vercel

1. Suba o repositório e importe o projeto na Vercel.
2. Em *Settings → Environment Variables*, cadastre as variáveis do `.env.local.example`
   em Production e Preview. Nenhuma delas tem prefixo `NEXT_PUBLIC_`, então nada vai
   para o navegador.
3. Faça o deploy e envie um cadastro de teste antes de divulgar o link.

Se o envio falhar em produção, a rota responde 502 e registra a mensagem do provedor
no log da função — é lá que aparece autenticação SMTP recusada ou domínio não
verificado no Resend.

## Testes

```
tests/validadores.test.ts   dígito verificador de CPF e CNPJ, telefone, CEP, referências
tests/mascaras.test.ts      formatação de documento, telefone, CEP, moeda
tests/schema.test.ts        campos obrigatórios, opcionais, mínimo de 3 referências, honeypot
tests/api-cadastro.test.ts  200, 400 por campo, 429, 502, corpo inválido
```
