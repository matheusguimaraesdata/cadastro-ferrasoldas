import nodemailer from 'nodemailer';
import path from 'node:path';

import type { DadosCadastro } from './schema';
import { tipoDocumento } from './validadores';

export type ResultadoEnvio =
  | { sucesso: true; id?: string }
  | { sucesso: false; erro: string };

const LOGO_CID = 'logo-ferrasoldas@ferrasoldas';

type AnexoResend = {
  filename: string;
  content: string;
  contentType: string;
  contentId: string;
};

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

function ehMercadoLivre(dados: DadosCadastro): boolean {
  return dados.tipoCadastro === 'MERCADO_LIVRE';
}

function obterIdentificacao(dados: DadosCadastro): string {
  if (ehMercadoLivre(dados)) {
    return (
      dados.mercadoLivreNome?.trim() ||
      (dados.mercadoLivreTipoPessoa === 'PJ'
        ? 'Empresa Mercado Livre'
        : 'Cliente Mercado Livre')
    );
  }

  return dados.tipoPessoa === 'PJ'
    ? dados.razaoSocial ?? ''
    : dados.nome ?? '';
}

function obterDocumento(dados: DadosCadastro): {
  rotulo: string;
  valor: string;
} {
  if (ehMercadoLivre(dados)) {
    const doc = dados.mercadoLivreCpf ?? '';

    if (dados.mercadoLivreTipoPessoa === 'PJ') {
      return {
        rotulo: 'CNPJ',
        valor: formatarDocumento(doc),
      };
    }

    return {
      rotulo: 'CPF',
      valor: formatarDocumento(doc),
    };
  }

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

function obterTipoCadastro(dados: DadosCadastro): string {
  if (ehMercadoLivre(dados)) {
    return dados.mercadoLivreTipoPessoa === 'PJ'
      ? 'Mercado Livre - CNPJ'
      : 'Mercado Livre - CPF';
  }

  return dados.tipoPessoa === 'PJ'
    ? 'Pessoa Jurídica'
    : 'Pessoa Física';
}

export function montarAssunto(dados: DadosCadastro): string {
  const identificacao = obterIdentificacao(dados);

  if (ehMercadoLivre(dados)) {
    return `Novo Cadastro Mercado Livre - ${identificacao} - Vendedor Mercado Livre`;
  }

  const documento =
    tipoDocumento(dados.tipoPessoa === 'PJ' ? dados.cnpj : dados.cpf) ??
    dados.tipoPessoa;

  return `Novo Cadastro ${documento} - ${identificacao} - Vendedor ${dados.vendedor}`;
}

export function montarTextoSimples(dados: DadosCadastro): string {
  const identificacao = obterIdentificacao(dados);
  const documento = obterDocumento(dados);

  const linhas: string[] = [
    'FERRASOLDAS COMÉRCIO E REPRESENTAÇÕES LTDA.',
    ehMercadoLivre(dados)
      ? 'NOVO CADASTRO MERCADO LIVRE'
      : 'NOVO CADASTRO DE CLIENTE',
    '',
    '========================================',
    'DADOS CADASTRAIS',
    '========================================',
    `Tipo de cadastro: ${obterTipoCadastro(dados)}`,
    `Nome / Razão Social: ${identificacao}`,
    `${documento.rotulo}: ${documento.valor}`,
  ];

  if (ehMercadoLivre(dados) && dados.mercadoLivreTipoPessoa === 'PJ') {
    linhas.push(
      `Situação do contribuinte: ${
        dados.situacaoContribuinte === 'CONTRIBUINTE'
          ? 'Contribuinte'
          : 'Não contribuinte'
      }`,
    );

    if (dados.situacaoContribuinte === 'CONTRIBUINTE') {
      linhas.push(`Inscrição Estadual: ${dados.inscricaoEstadual}`);
    }
  }

  linhas.push(
    '',
    '========================================',
    'ENDEREÇO',
    '========================================',
    `CEP: ${dados.cep}`,
    `Rua / Logradouro: ${dados.endereco}`,
    `Número: ${dados.numero}`,
    `Bairro: ${dados.bairro}`,
    ...(dados.complemento ? [`Complemento: ${dados.complemento}`] : []),
    `Município: ${dados.cidade}`,
    `Estado: ${dados.estado}`,
  );

  if (!ehMercadoLivre(dados)) {
    linhas.push(
      '',
      '========================================',
      'CONTATO',
      '========================================',
      `E-mail: ${dados.email}`,
      `Telefone: ${dados.telefone}`,
    );
  }

  linhas.push(
    '',
    '========================================',
    'INFORMAÇÕES COMERCIAIS',
    '========================================',
    `Vendedor: ${ehMercadoLivre(dados) ? 'Mercado Livre' : dados.vendedor}`,
  );

  if (!ehMercadoLivre(dados)) {
    linhas.push(`Valor da Venda: ${dados.valorVenda}`);
  }

  if (!ehMercadoLivre(dados)) {
    linhas.push(
      '',
      '========================================',
      'REFERÊNCIAS COMERCIAIS',
      '========================================',
      ...dados.referenciasComerciais.map(
        (ref, index) =>
          `${String(index + 1).padStart(2, '0')} - ${ref.empresa} | ${ref.telefone}`,
      ),
    );
  }

  linhas.push(
    '',
    '========================================',
    'Este cadastro foi recebido pelo formulário online da Ferrasoldas.',
  );

  return linhas.join('\n');
}

function criarLinha(
  rotulo: string,
  valor: string | undefined | null,
): string {
  return `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #eaecf0;width:38%;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;font-weight:600;color:#667085;">
        ${escapar(rotulo)}
      </td>
      <td style="padding:11px 0 11px 18px;border-bottom:1px solid #eaecf0;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:500;color:#101828;word-break:break-word;">
        ${escapar(String(valor ?? ''))}
      </td>
    </tr>`;
}

function criarSecao(titulo: string, linhas: string): string {
  return `
    <tr>
      <td style="padding:0 0 18px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eaecf0;border-radius:10px;background:#ffffff;">
          <tr>
            <td style="padding:18px 20px 8px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:700;color:#111111;">
              ${escapar(titulo)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${linhas}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function montarHtml(dados: DadosCadastro): string {
  const mercadoLivre = ehMercadoLivre(dados);
  const identificacao = obterIdentificacao(dados);
  const documento = obterDocumento(dados);
  const recebidoEm = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const cadastrais = [
    criarLinha('Tipo de cadastro', obterTipoCadastro(dados)),
    criarLinha('Nome / Razão Social', identificacao),
    criarLinha(documento.rotulo, documento.valor),
  ];

  if (mercadoLivre && dados.mercadoLivreTipoPessoa === 'PJ') {
    cadastrais.push(
      criarLinha(
        'Situação do contribuinte',
        dados.situacaoContribuinte === 'CONTRIBUINTE'
          ? 'Contribuinte'
          : 'Não contribuinte',
      ),
    );

    if (dados.situacaoContribuinte === 'CONTRIBUINTE') {
      cadastrais.push(
        criarLinha('Inscrição Estadual', dados.inscricaoEstadual),
      );
    }
  }

  const endereco = [
    criarLinha('CEP', dados.cep),
    criarLinha('Rua / Logradouro', dados.endereco),
    criarLinha('Número', dados.numero),
    criarLinha('Bairro', dados.bairro),
    ...(dados.complemento
      ? [criarLinha('Complemento', dados.complemento)]
      : []),
    criarLinha('Município', dados.cidade),
    criarLinha('Estado', dados.estado),
  ];

  const secoes = [
    criarSecao('Dados cadastrais', cadastrais.join('')),
    criarSecao('Endereço', endereco.join('')),
    criarSecao(
      'Informações comerciais',
      [
        criarLinha(
          'Vendedor',
          mercadoLivre ? 'Mercado Livre' : dados.vendedor,
        ),
        ...(!mercadoLivre
          ? [criarLinha('Valor da Venda', dados.valorVenda)]
          : []),
      ].join(''),
    ),
  ];

  if (!mercadoLivre) {
    secoes.push(
      criarSecao(
        'Contato',
        [
          criarLinha('E-mail', dados.email),
          criarLinha('Telefone', dados.telefone),
        ].join(''),
      ),
    );

    secoes.push(
      criarSecao(
        'Referências comerciais',
        dados.referenciasComerciais
          .map((ref, index) =>
            criarLinha(
              `Referência ${String(index + 1).padStart(2, '0')}`,
              `${ref.empresa} | ${ref.telefone}`,
            ),
          )
          .join(''),
      ),
    );
  }

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapar(mercadoLivre ? 'Novo Cadastro Mercado Livre' : 'Novo Cadastro de Cliente')}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f5f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#111111;border-bottom:5px solid #f4e500;padding:24px 28px;">
              <img src="cid:${LOGO_CID}" alt="Ferrasoldas" width="190" style="display:block;width:190px;max-width:100%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 10px;">
              <div style="font-size:24px;line-height:32px;font-weight:700;color:#111111;">
                ${escapar(mercadoLivre ? 'Novo Cadastro Mercado Livre' : 'Novo Cadastro de Cliente')}
              </div>
              <div style="margin-top:7px;font-size:14px;line-height:22px;color:#667085;">
                Recebido em ${escapar(recebidoEm)}.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff9a8;border:1px solid #f4e500;border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:12px;line-height:18px;color:#5a371b;font-weight:700;text-transform:uppercase;letter-spacing:.4px;">
                      ${escapar(mercadoLivre ? 'Cadastro Mercado Livre' : 'Cliente')}
                    </div>
                    <div style="margin-top:3px;font-size:18px;line-height:26px;color:#111111;font-weight:700;">
                      ${escapar(identificacao)}
                    </div>
                    <div style="margin-top:3px;font-size:13px;line-height:20px;color:#5a371b;">
                      ${escapar(documento.rotulo)}: ${escapar(documento.valor)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${secoes.join('')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#242424;border-top:4px solid #f4e500;padding:22px 28px;">
              <div style="font-size:13px;line-height:20px;font-weight:700;color:#ffffff;">
                FERRASOLDAS COMÉRCIO E REPRESENTAÇÕES LTDA.
              </div>
              <div style="margin-top:4px;font-size:11px;line-height:18px;color:#98a2b3;">
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
  return path.join(process.cwd(), 'public', 'logo-ferrasoldas.png');
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
  responderPara?: string,
): Promise<ResultadoEnvio> {
  const { Resend } = await import('resend');
  const resend = new Resend(exigir('RESEND_API_KEY'));
  const fs = await import('node:fs/promises');
  const logo = await fs.readFile(obterCaminhoLogo());

  const anexoLogo: AnexoResend = {
    filename: 'logo-ferrasoldas.png',
    content: logo.toString('base64'),
    contentType: 'image/png',
    contentId: LOGO_CID,
  };

  const { data, error } = await resend.emails.send({
    from: exigir('EMAIL_REMETENTE'),
    to: exigir('EMAIL_DESTINO'),
    ...(responderPara ? { replyTo: responderPara } : {}),
    subject: assunto,
    html,
    text: texto,
    attachments: [anexoLogo],
  });

  if (error) {
    return {
      sucesso: false,
      erro: error.message,
    };
  }

  return {
    sucesso: true,
    id: data?.id,
  };
}

async function enviarComSmtp(
  assunto: string,
  html: string,
  texto: string,
  responderPara?: string,
): Promise<ResultadoEnvio> {
  const transporte = nodemailer.createTransport({
    host: exigir('SMTP_HOST'),
    port: Number(process.env.SMTP_PORTA ?? 465),
    secure: process.env.SMTP_SEGURO
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
    ...(responderPara ? { replyTo: responderPara } : {}),
    subject: assunto,
    text: texto,
    html,
    attachments: [obterAnexoLogoNodemailer()],
  });

  return {
    sucesso: true,
    id: info.messageId,
  };
}

export async function enviarCadastro(
  dados: DadosCadastro,
): Promise<ResultadoEnvio> {
  const assunto = montarAssunto(dados);
  const html = montarHtml(dados);
  const texto = montarTextoSimples(dados);
  const provedor = (process.env.EMAIL_PROVEDOR ?? 'smtp').toLowerCase();
  const responderPara = dados.email?.trim() || undefined;

  try {
    if (provedor === 'resend') {
      return await enviarComResend(
        assunto,
        html,
        texto,
        responderPara,
      );
    }

    return await enviarComSmtp(
      assunto,
      html,
      texto,
      responderPara,
    );
  } catch (erro) {
    return {
      sucesso: false,
      erro:
        erro instanceof Error
          ? erro.message
          : 'Falha desconhecida no envio.',
    };
  }
}