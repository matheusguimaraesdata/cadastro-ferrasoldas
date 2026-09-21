import nodemailer from 'nodemailer';
import path from 'node:path';
import type { DadosCadastro } from './schema';
import { tipoDocumento } from './validadores';

export type ResultadoEnvio =
  | { ok: true; id?: string }
  | { ok: false; erro: string };

const LOGO_CID = 'logo-ferrasoldas@ferrasoldas';

function exigir(variavel: string): string {
  const valor = process.env[variavel];

  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${variavel}`);
  }

  return valor;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatarDocumento(documento: string): string {
  const somenteNumeros = documento.replace(/\D/g, '');

  if (somenteNumeros.length === 11) {
    return somenteNumeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    );
  }

  if (somenteNumeros.length === 14) {
    return somenteNumeros.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  return documento;
}

function formatarValorVenda(valor: string): string {
  return valor?.trim() || 'Não informado';
}

function obterIdentificacao(dados: DadosCadastro): string {
  return dados.tipoPessoa === 'PJ' ? dados.razaoSocial : dados.nome;
}

function obterDocumento(dados: DadosCadastro): {
  rotulo: string;
  valor: string;
} {
  if (dados.tipoPessoa === 'PJ') {
    return {
      rotulo: 'CNPJ',
      valor: formatarDocumento(dados.cnpj),
    };
  }

  return {
    rotulo: 'CPF',
    valor: formatarDocumento(dados.cpf),
  };
}

function obterDocumentoSecundario(dados: DadosCadastro): {
  rotulo: string;
  valor: string;
} {
  if (dados.tipoPessoa === 'PJ') {
    return {
      rotulo: 'Inscrição Estadual',
      valor: dados.inscricaoEstadual,
    };
  }

  return {
    rotulo: 'RG',
    valor: dados.rg,
  };
}

export function montarAssunto(dados: DadosCadastro): string {
  const documento =
    tipoDocumento(
      dados.tipoPessoa === 'PJ' ? dados.cnpj : dados.cpf,
    ) ?? dados.tipoPessoa;

  const identificacao = obterIdentificacao(dados);

  return `Novo Cadastro ${documento} - ${identificacao} - Vendedor ${dados.vendedor}`;
}

export function montarTextoSimples(dados: DadosCadastro): string {
  const identificacao = obterIdentificacao(dados);
  const documento = obterDocumento(dados);
  const documentoSecundario = obterDocumentoSecundario(dados);

  const linhas = [
    'FERRASOLDAS COMÉRCIO E REPRESENTAÇÕES LTDA.',
    'NOVO CADASTRO DE CLIENTE',
    '',
    '========================================',
    'DADOS CADASTRAIS',
    '========================================',
    `Tipo de pessoa: ${
      dados.tipoPessoa === 'PJ'
        ? 'Pessoa Jurídica'
        : 'Pessoa Física'
    }`,
    `Nome / Razão Social: ${identificacao}`,
    `${documento.rotulo}: ${documento.valor}`,
    `${documentoSecundario.rotulo}: ${documentoSecundario.valor}`,
    '',
    '========================================',
    'CONTATO',
    '========================================',
    `E-mail: ${dados.email}`,
    `Telefone: ${dados.telefone}`,
    '',
    '========================================',
    'ENDEREÇO',
    '========================================',
    `Endereço: ${dados.endereco}, ${dados.numero}`,
    ...(dados.complemento
      ? [`Complemento: ${dados.complemento}`]
      : []),
    `Bairro: ${dados.bairro}`,
    `Município: ${dados.cidade}`,
    `Estado: ${dados.estado}`,
    `CEP: ${dados.cep}`,
    '',
    '========================================',
    'INFORMAÇÕES COMERCIAIS',
    '========================================',
    `Vendedor: ${dados.vendedor}`,
    `Valor da Venda: ${formatarValorVenda(dados.valorVenda)}`,
    '',
    '========================================',
    'REFERÊNCIAS COMERCIAIS',
    '========================================',
    ...dados.referenciasComerciais.map(
      (ref, index) =>
        `${String(index + 1).padStart(2, '0')} - ${ref.empresa} | ${ref.telefone}`,
    ),
    '',
    '========================================',
    'Este cadastro foi recebido pelo formulário online da Ferrasoldas.',
  ];

  return linhas.join('\n');
}

function criarLinha(
  rotulo: string,
  valor: string | undefined | null,
): string {
  return `
    <tr>
      <td
        style="
          padding:12px 0;
          border-bottom:1px solid #eaecf0;
          width:38%;
          vertical-align:top;
          font-family:Arial,Helvetica,sans-serif;
          font-size:13px;
          line-height:20px;
          font-weight:600;
          color:#667085;
        "
      >
        ${escapar(rotulo)}
      </td>

      <td
        style="
          padding:12px 0 12px 18px;
          border-bottom:1px solid #eaecf0;
          vertical-align:top;
          font-family:Arial,Helvetica,sans-serif;
          font-size:14px;
          line-height:20px;
          font-weight:500;
          color:#101828;
          word-break:break-word;
        "
      >
        ${escapar(String(valor ?? ''))}
      </td>
    </tr>
  `;
}

function criarSecao(
  titulo: string,
  conteudo: string,
  icone: string,
): string {
  return `
    <tr>
      <td style="padding:0 0 18px 0;">
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            border:1px solid #eaecf0;
            border-radius:10px;
            background:#ffffff;
          "
        >
          <tr>
            <td style="padding:18px 20px 0 20px;">
              <table
                role="presentation"
                cellpadding="0"
                cellspacing="0"
              >
                <tr>
                  <td
                    style="
                      width:34px;
                      height:34px;
                      border-radius:8px;
                      background:#fff9a8;
                      text-align:center;
                      vertical-align:middle;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:16px;
                    "
                  >
                    ${icone}
                  </td>

                  <td
                    style="
                      padding-left:10px;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:16px;
                      line-height:22px;
                      font-weight:700;
                      color:#111111;
                    "
                  >
                    ${escapar(titulo)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 20px 18px 20px;">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
              >
                ${conteudo}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function montarHtml(dados: DadosCadastro): string {
  const identificacao = obterIdentificacao(dados);
  const documento = obterDocumento(dados);
  const documentoSecundario = obterDocumentoSecundario(dados);

  const recebidoEm = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const dadosCadastrais = [
    criarLinha(
      'Tipo de pessoa',
      dados.tipoPessoa === 'PJ'
        ? 'Pessoa Jurídica'
        : 'Pessoa Física',
    ),
    criarLinha('Nome / Razão Social', identificacao),
    criarLinha(documento.rotulo, documento.valor),
    criarLinha(
      documentoSecundario.rotulo,
      documentoSecundario.valor,
    ),
  ].join('');

  const contato = [
    criarLinha('E-mail', dados.email),
    criarLinha('Telefone', dados.telefone),
  ].join('');

  const endereco = [
    criarLinha(
      'Endereço',
      `${dados.endereco}, ${dados.numero}`,
    ),
    ...(dados.complemento
      ? [criarLinha('Complemento', dados.complemento)]
      : []),
    criarLinha('Bairro', dados.bairro),
    criarLinha('Município', dados.cidade),
    criarLinha('Estado', dados.estado),
    criarLinha('CEP', dados.cep),
  ].join('');

  const comercial = [
    criarLinha('Vendedor', dados.vendedor),
    criarLinha(
      'Valor da Venda',
      formatarValorVenda(dados.valorVenda),
    ),
  ].join('');

  const referencias =
    dados.referenciasComerciais.length > 0
      ? dados.referenciasComerciais
          .map(
            (ref, index) => `
              <tr>
                <td
                  style="
                    padding:11px 8px 11px 0;
                    border-bottom:1px solid #eaecf0;
                    width:35px;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:13px;
                    color:#667085;
                    vertical-align:top;
                  "
                >
                  ${String(index + 1).padStart(2, '0')}
                </td>

                <td
                  style="
                    padding:11px 8px;
                    border-bottom:1px solid #eaecf0;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    color:#101828;
                    vertical-align:top;
                  "
                >
                  ${escapar(ref.empresa)}
                </td>

                <td
                  style="
                    padding:11px 0 11px 8px;
                    border-bottom:1px solid #eaecf0;
                    font-family:Arial,Helvetica,sans-serif;
                    font-size:14px;
                    color:#101828;
                    vertical-align:top;
                    white-space:nowrap;
                  "
                >
                  ${escapar(ref.telefone)}
                </td>
              </tr>
            `,
          )
          .join('')
      : `
          <tr>
            <td
              style="
                padding:12px 0;
                font-family:Arial,Helvetica,sans-serif;
                font-size:14px;
                color:#667085;
              "
            >
              Nenhuma referência comercial informada.
            </td>
          </tr>
        `;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Novo Cadastro de Cliente</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f5f6f8;
    font-family:Arial,Helvetica,sans-serif;
  "
>
  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="width:100%;background:#f5f6f8;"
  >
    <tr>
      <td
        align="center"
        style="padding:32px 16px;"
      >

        <table
          role="presentation"
          width="680"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            max-width:680px;
            background:#ffffff;
            border:1px solid #e4e7ec;
            border-radius:14px;
            overflow:hidden;
          "
        >

          <!-- CABEÇALHO -->
          <tr>
            <td
              style="
                background:#111111;
                border-bottom:5px solid #f4e500;
                padding:24px 28px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
              >
                <tr>

                  <td
                    align="left"
                    valign="middle"
                  >
                    <img
                      src="cid:${LOGO_CID}"
                      alt="Ferrasoldas Comércio e Representações Ltda."
                      width="190"
                      style="
                        display:block;
                        width:190px;
                        max-width:100%;
                        height:auto;
                        border:0;
                      "
                    >
                  </td>

                  <td
                    align="right"
                    valign="middle"
                    style="
                      font-family:Arial,Helvetica,sans-serif;
                    "
                  >
                    <div
                      style="
                        font-size:12px;
                        line-height:18px;
                        color:#d0d5dd;
                      "
                    >
                      CADASTRO ONLINE
                    </div>

                    <div
                      style="
                        font-size:12px;
                        line-height:18px;
                        color:#ffffff;
                        font-weight:600;
                      "
                    >
                      ${escapar(recebidoEm)}
                    </div>
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- TÍTULO -->
          <tr>
            <td
              style="
                padding:30px 28px 10px 28px;
              "
            >
              <div
                style="
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:24px;
                  line-height:32px;
                  font-weight:700;
                  color:#111111;
                "
              >
                Novo Cadastro de Cliente
              </div>

              <div
                style="
                  margin-top:7px;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:14px;
                  line-height:22px;
                  color:#667085;
                "
              >
                Um novo cadastro foi recebido através do formulário
                online da Ferrasoldas.
              </div>
            </td>
          </tr>

          <!-- IDENTIFICAÇÃO RÁPIDA -->
          <tr>
            <td style="padding:18px 28px 24px 28px;">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background:#fff9a8;
                  border:1px solid #f4e500;
                  border-radius:10px;
                "
              >
                <tr>
                  <td style="padding:16px 18px;">

                    <div
                      style="
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:12px;
                        line-height:18px;
                        color:#5a371b;
                        font-weight:700;
                        text-transform:uppercase;
                        letter-spacing:.4px;
                      "
                    >
                      Cliente
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:18px;
                        line-height:26px;
                        color:#111111;
                        font-weight:700;
                      "
                    >
                      ${escapar(identificacao)}
                    </div>

                    <div
                      style="
                        margin-top:3px;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:13px;
                        line-height:20px;
                        color:#5a371b;
                      "
                    >
                      ${escapar(documento.rotulo)}:
                      ${escapar(documento.valor)}
                    </div>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CONTEÚDO -->
          <tr>
            <td style="padding:0 28px 12px 28px;">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
              >

                ${criarSecao(
                  'Dados cadastrais',
                  dadosCadastrais,
                  '▣',
                )}

                ${criarSecao(
                  'Contato',
                  contato,
                  '✉',
                )}

                ${criarSecao(
                  'Endereço',
                  endereco,
                  '⌂',
                )}

                ${criarSecao(
                  'Informações comerciais',
                  comercial,
                  'R$',
                )}

                <!-- REFERÊNCIAS -->
                <tr>
                  <td style="padding:0 0 18px 0;">

                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        border:1px solid #eaecf0;
                        border-radius:10px;
                        background:#ffffff;
                      "
                    >

                      <tr>
                        <td
                          style="
                            padding:18px 20px 10px 20px;
                          "
                        >
                          <table
                            role="presentation"
                            cellpadding="0"
                            cellspacing="0"
                          >
                            <tr>

                              <td
                                style="
                                  width:34px;
                                  height:34px;
                                  border-radius:8px;
                                  background:#fff9a8;
                                  text-align:center;
                                  vertical-align:middle;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:16px;
                                "
                              >
                                #
                              </td>

                              <td
                                style="
                                  padding-left:10px;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:16px;
                                  line-height:22px;
                                  font-weight:700;
                                  color:#111111;
                                "
                              >
                                Referências comerciais
                              </td>

                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:4px 20px 20px 20px;">

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                          >

                            <tr>
                              <th
                                align="left"
                                style="
                                  padding:8px 8px 8px 0;
                                  border-bottom:1px solid #d0d5dd;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:11px;
                                  color:#667085;
                                  text-transform:uppercase;
                                "
                              >
                                #
                              </th>

                              <th
                                align="left"
                                style="
                                  padding:8px;
                                  border-bottom:1px solid #d0d5dd;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:11px;
                                  color:#667085;
                                  text-transform:uppercase;
                                "
                              >
                                Empresa
                              </th>

                              <th
                                align="left"
                                style="
                                  padding:8px 0 8px 8px;
                                  border-bottom:1px solid #d0d5dd;
                                  font-family:Arial,Helvetica,sans-serif;
                                  font-size:11px;
                                  color:#667085;
                                  text-transform:uppercase;
                                "
                              >
                                Telefone
                              </th>
                            </tr>

                            ${referencias}

                          </table>

                        </td>
                      </tr>

                    </table>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- AVISO DE RESPOSTA -->
          <tr>
            <td style="padding:4px 28px 28px 28px;">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background:#f9fafb;
                  border:1px solid #eaecf0;
                  border-radius:8px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:14px 16px;
                      font-family:Arial,Helvetica,sans-serif;
                      font-size:12px;
                      line-height:19px;
                      color:#667085;
                    "
                  >
                    <strong style="color:#344054;">
                      Responder este e-mail
                    </strong>
                    enviará a resposta diretamente para
                    <span style="color:#111111;">
                      ${escapar(dados.email)}
                    </span>.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td
              style="
                background:#242424;
                border-top:4px solid #f4e500;
                padding:22px 28px;
              "
            >

              <div
                style="
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:13px;
                  line-height:20px;
                  font-weight:700;
                  color:#ffffff;
                "
              >
                FERRASOLDAS COMÉRCIO E REPRESENTAÇÕES LTDA.
              </div>

              <div
                style="
                  margin-top:4px;
                  font-family:Arial,Helvetica,sans-serif;
                  font-size:11px;
                  line-height:18px;
                  color:#98a2b3;
                "
              >
                Cadastro recebido pelo formulário online.
              </div>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function obterCaminhoLogo(): string {
  return path.join(
    process.cwd(),
    'public',
    'logo-ferrasoldas.png',
  );
}

function obterAnexoLogoNodemailer() {
  return {
    filename: 'logo-ferrasoldas.png',
    path: obterCaminhoLogo(),
    cid: LOGO_CID,
    contentType: 'image/png',
  };
}

async function enviarComResend(
  assunto: string,
  html: string,
  texto: string,
  responderPara: string,
): Promise<ResultadoEnvio> {
  const { Resend } = await import('resend');

  const resend = new Resend(exigir('RESEND_API_KEY'));

  const caminhoLogo = obterCaminhoLogo();

  const fs = await import('node:fs/promises');
  const logo = await fs.readFile(caminhoLogo);

  const { data, error } = await resend.emails.send({
    from: exigir('EMAIL_REMETENTE'),
    to: exigir('EMAIL_DESTINO'),
    replyTo: responderPara,
    subject: assunto,
    html,
    text: texto,
    attachments: [
      {
        filename: 'logo-ferrasoldas.png',
        content: logo.toString('base64'),
        contentType: 'image/png',
        contentId: LOGO_CID,
      },
    ],
  });

  if (error) {
    return {
      ok: false,
      erro: error.message,
    };
  }

  return {
    ok: true,
    id: data?.id,
  };
}

async function enviarComSmtp(
  assunto: string,
  html: string,
  texto: string,
  responderPara: string,
): Promise<ResultadoEnvio> {
  const transporte = nodemailer.createTransport({
    host: exigir('SMTP_HOST'),

    port: Number(
      process.env.SMTP_PORTA ?? 465,
    ),

    secure:
      process.env.SMTP_SEGURO
        ? process.env.SMTP_SEGURO === 'true'
        : true,

    auth: {
      user: exigir('SMTP_USUARIO'),
      pass: exigir('SMTP_SENHA'),
    },
  });

  const info = await transporte.sendMail({
    from: exigir('EMAIL_REMETENTE'),
    to: exigir('EMAIL_DESTINO'),
    replyTo: responderPara,
    subject: assunto,
    text: texto,
    html,

    attachments: [
      obterAnexoLogoNodemailer(),
    ],
  });

  return {
    ok: true,
    id: info.messageId,
  };
}

export async function enviarCadastro(
  dados: DadosCadastro,
): Promise<ResultadoEnvio> {
  const assunto = montarAssunto(dados);
  const html = montarHtml(dados);
  const texto = montarTextoSimples(dados);

  const provedor = (
    process.env.EMAIL_PROVEDOR ?? 'smtp'
  ).toLowerCase();

  try {
    if (provedor === 'resend') {
      return await enviarComResend(
        assunto,
        html,
        texto,
        dados.email,
      );
    }

    return await enviarComSmtp(
      assunto,
      html,
      texto,
      dados.email,
    );
  } catch (erro) {
    return {
      ok: false,
      erro:
        erro instanceof Error
          ? erro.message
          : 'Falha desconhecida no envio.',
    };
  }
}