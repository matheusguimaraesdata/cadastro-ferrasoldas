import { NextRequest, NextResponse } from 'next/server';
import { schemaCadastro } from '@/lib/schema';
import { enviarCadastro } from '@/lib/email';
import { verificarLimite } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function identificarOrigem(req: NextRequest): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  if (encaminhado) return encaminhado.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'desconhecido';
}

export async function POST(req: NextRequest) {
  const limite = verificarLimite(identificarOrigem(req));
  if (!limite.permitido) {
    return NextResponse.json(
      {
        mensagem: `Muitos envios seguidos. Tente de novo em ${Math.ceil(
          limite.segundosRestantes / 60,
        )} minutos.`,
      },
      { status: 429, headers: { 'Retry-After': String(limite.segundosRestantes) } },
    );
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json(
      { mensagem: 'Não foi possível ler os dados enviados.' },
      { status: 400 },
    );
  }

  const resultado = schemaCadastro.safeParse(corpo);
  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? 'formulario');
      if (!erros[campo]) erros[campo] = problema.message;
    }
    return NextResponse.json(
      { mensagem: 'Confira os campos destacados.', erros },
      { status: 400 },
    );
  }

  // O honeypot só é conhecido depois da validação: bot preenchido cai aqui.
  if (resultado.data.website) {
    return NextResponse.json({ mensagem: 'Cadastro recebido.' }, { status: 200 });
  }

  const envio = await enviarCadastro(resultado.data);
  if (!envio.ok) {
    console.error('Falha ao enviar cadastro:', envio.erro);
    return NextResponse.json(
      {
        mensagem:
          'O cadastro foi preenchido, mas o envio falhou. Tente de novo em alguns minutos ou fale com o vendedor.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ mensagem: 'Cadastro enviado.' }, { status: 200 });
}
