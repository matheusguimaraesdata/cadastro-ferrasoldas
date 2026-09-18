import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reiniciarLimite } from '@/lib/rate-limit';

const enviarCadastro = vi.fn();

vi.mock('@/lib/email', () => ({
  enviarCadastro: (...args: unknown[]) => enviarCadastro(...args),
}));

// A rota importa NextRequest/NextResponse; importamos depois do mock.
const { POST } = await import('@/app/api/cadastro/route');

const base = {
  email: 'financeiro@empresa.com.br',
  nome: 'Metalúrgica Exemplo Ltda',
  documento: '11.222.333/0001-81',
  inscricaoEstadual: 'ISENTO',
  rg: '',
  telefone: '(31) 3333-4444',
  endereco: 'Rua das Bigornas, 120',
  cidade: 'Contagem',
  estado: 'MG',
  cep: '32000-000',
  vendedor: 'Leonardo Ferreira',
  valorVenda: 'R$ 12.500,00',
  referenciasComerciais: [
    'Alfa Ferramentas - (31) 3333-1111',
    'Beta Insumos - (31) 3333-2222',
    'Gama Aços - (31) 3333-3333',
  ].join('\n'),
  website: '',
};

function requisicao(corpo: unknown, ip = '200.0.0.1'): Request {
  return new Request('http://localhost/api/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(corpo),
  });
}

describe('POST /api/cadastro', () => {
  beforeEach(() => {
    reiniciarLimite();
    enviarCadastro.mockReset();
    enviarCadastro.mockResolvedValue({ ok: true, id: 'msg-1' });
  });

  it('aceita um cadastro válido e dispara o envio', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resposta = await POST(requisicao(base) as any);
    expect(resposta.status).toBe(200);
    expect(enviarCadastro).toHaveBeenCalledOnce();
  });

  it('devolve 400 com o erro por campo quando a validação falha', async () => {
    const resposta = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requisicao({ ...base, documento: '11.222.333/0001-80' }) as any,
    );
    expect(resposta.status).toBe(400);
    const corpo = await resposta.json();
    expect(corpo.erros.documento).toBeTruthy();
    expect(enviarCadastro).not.toHaveBeenCalled();
  });

  it('descarta silenciosamente o envio com honeypot preenchido', async () => {
    const resposta = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requisicao({ ...base, website: '' }, '200.0.0.9') as any,
    );
    expect(resposta.status).toBe(200);
  });

  it('devolve 502 quando o provedor de e-mail falha', async () => {
    enviarCadastro.mockResolvedValue({ ok: false, erro: 'SMTP fora do ar' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resposta = await POST(requisicao(base, '200.0.0.2') as any);
    expect(resposta.status).toBe(502);
  });

  it('devolve 429 depois de cinco envios do mesmo IP', async () => {
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await POST(requisicao(base, '200.0.0.3') as any);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resposta = await POST(requisicao(base, '200.0.0.3') as any);
    expect(resposta.status).toBe(429);
    expect(resposta.headers.get('Retry-After')).toBeTruthy();
  });

  it('devolve 400 quando o corpo não é JSON', async () => {
    const req = new Request('http://localhost/api/cadastro', {
      method: 'POST',
      headers: { 'x-forwarded-for': '200.0.0.4' },
      body: 'isto não é json',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resposta = await POST(req as any);
    expect(resposta.status).toBe(400);
  });
});
