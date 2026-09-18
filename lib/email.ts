import nodemailer from 'nodemailer';
import type { DadosCadastro } from './schema';
import { ROTULOS } from './schema';
import { tipoDocumento } from './validadores';

export type ResultadoEnvio = { ok: true; id?: string } | { ok: false; erro: string };

function exigir(variavel: string): string {
  const valor = process.env[variavel];
  if (!valor) throw new Error(`Variável de ambiente ausente: ${variavel}`);
  return valor;
}

function formatarDocumento(documento: string): string {
  if (documento.length === 11) {
    return documento.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})\$/, '\$1.\$2.\$3-\$4');
  }
  return documento.replace(
    /^(.{2})(.{3})(.{3})(.{4})(.{2})\$/,
    '\$1.\$2.\$3/\$4-\$5',
  );
}

const CAMPOS_NA_ORDEM: (keyof DadosCadastro)[] = [
  'nome',
  'documento',
  'inscricaoEstadual',
  'rg',
  'email',
  'telefone',
  'endereco',
  'cidade',
  'estado',
  'cep',
  'vendedor',
  'valorVenda',
  'referenciasComerciais',
];

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function montarAssunto(dados: DadosCadastro): string {
  const tipo = tipoDocumento(dados.documento) ?? 'Cadastro';
  return `Cadastro ${tipo} - ${dados.nome} - vendedor ${dados.vendedor}`;
}

export function montarTextoSimples(dados: DadosCadastro): string {
  const linhas = CAMPOS_NA_ORDEM.map((campo) => {
    const valor = campo === 'documento'
      ? formatarDocumento(dados.documento)
      : (dados[campo] ?? '');
    return `${ROTULOS[campo]}: ${valor || '(não informado)'}`;
  });
  return linhas.join('\n');
}

export function montarHtml(dados: DadosCadastro): string {
  const linhas = CAMPOS_NA_ORDEM.map((campo) => {
    const bruto = campo === 'documento'
      ? formatarDocumento(dados.documento)
      : String(dados[campo] ?? '');
    const valor = bruto
      ? escapar(bruto).replace(/\n/g, '<br>')
      : '<span style="color:#8a8a8a">não informado</span>';
    return `<tr>
      <th align="left" style="padding:10px 16px 10px 0;border-bottom:1px solid #E4E1DA;font:500 13px/1.4 Arial,sans-serif;color:#5A6069;white-space:nowrap;vertical-align:top">${ROTULOS[campo]}</th>
      <td style="padding:10px 0;border-bottom:1px solid #E4E1DA;font:400 15px/1.5 Arial,sans-serif;color:#1C1F22">${valor}</td>
    </tr>`;
  }).join('');

  const recebidoEm = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#F2F1ED;padding:24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E1DA">
    <tr><td style="background:#1C1F22;padding:20px 24px;border-bottom:4px solid #D7CA28">
      <div style="font:600 17px/1.3 Arial,sans-serif;color:#FFFFFF">Novo cadastro recebido</div>
      <div style="font:400 13px/1.4 Arial,sans-serif;color:#A9AEB4;margin-top:4px">${recebidoEm}</div>
    </td></tr>
    <tr><td style="padding:8px 24px 24px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linhas}</table>
      <p style="font:400 12px/1.5 Arial,sans-serif;color:#6C727A;margin:20px 0 0">
        Responder este e-mail envia a mensagem direto para ${escapar(dados.email)}.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

async function enviarComResend(
  assunto: string,
  html: string,
  texto: string,
  responderPara: string,
): Promise<ResultadoEnvio> {
  const { Resend } = await import('resend');
  const resend = new Resend(exigir('RESEND_API_KEY'));

  const { data, error } = await resend.emails.send({
    from: exigir('EMAIL_REMETENTE'),
    to: exigir('EMAIL_DESTINO'),
    replyTo: responderPara,
    subject: assunto,
    html,
    text: texto,
  });

  if (error) return { ok: false, erro: error.message };
  return { ok: true, id: data?.id };
}

async function enviarComSmtp(
  assunto: string,
  html: string,
  texto: string,
  responderPara: string,
): Promise<ResultadoEnvio> {
  // CORREÇÃO: Utilizando a instância importada no topo do arquivo de forma limpa
  const transporte = nodemailer.createTransport({
    host: exigir('SMTP_HOST'),
    port: Number(process.env.SMTP_PORTA ?? 465),
    secure: true, // Mantido SSL/TLS para porta 465 conforme seu padrão
    auth: {
      user: exigir('SMTP_USUARIO'),
      pass: exigir('SMTP_SENHA'),
    },
    // CORREÇÃO CRUCIAL: Ignora problemas com handshake TLS local/corporativo da Locaweb
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporte.sendMail({
    from: exigir('EMAIL_REMETENTE'),
    to: exigir('EMAIL_DESTINO'),
    replyTo: responderPara,
    subject: assunto,
    html,
    text: texto,
  });

  return { ok: true, id: info.messageId };
}

// CORREÇÃO: Garantindo que a função está exportada explicitamente por nome para a rota ler
export async function enviarCadastro(
  dados: DadosCadastro,
): Promise<ResultadoEnvio> {
  const assunto = montarAssunto(dados);
  const html = montarHtml(dados);
  const texto = montarTextoSimples(dados);
  const provedor = (process.env.EMAIL_PROVEDOR ?? 'smtp').toLowerCase();

  try {
    if (provedor === 'resend') {
      return await enviarComResend(assunto, html, texto, dados.email);
    }
    return await enviarComSmtp(assunto, html, texto, dados.email);
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof Error ? erro.message : 'Falha desconhecida no envio.',
    };
  }
}
