import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { reiniciarLimite } from '@/lib/rate-limit';

const enviarCadastro = vi.fn();

vi.mock('@/lib/email', () => ({
  enviarCadastro: (
    ...args: unknown[]
  ) => enviarCadastro(...args),
}));

const { POST } =
  await import(
    '@/app/api/cadastro/route'
  );

const referencias = (
  quantidade: number,
) =>
  Array.from(
    { length: quantidade },
    (_, i) => ({
      empresa: `Referencia ${i + 1}`,
      telefone: `(31) 3333-${String(
        1000 + i,
      ).slice(-4)}`,
    }),
  );

const base = {
  tipoCadastro: 'PJ' as const,
  tipoPessoa: 'PJ' as const,

  razaoSocial:
    'Metalurgica Exemplo Ltda',

  cnpj:
    '11.222.333/0001-81',

  inscricaoEstadual:
    'ISENTO',

  nome: '',
  cpf: '',
  rg: '',

  mercadoLivreNome: '',
  mercadoLivreCpf: '',
  mercadoLivreQuemRecebe: '',
  mercadoLivreReferencia: '',

  email:
    'financeiro@empresa.com.br',

  telefone:
    '(31) 3333-4444',

  cep: '32000-000',

  endereco:
    'Rua das Bigornas',

  numero: '120',

  complemento: '',

  bairro: 'Centro',

  cidade: 'Contagem',

  estado: 'MG',

  vendedor:
    'Leonardo Ferreira',

  valorVenda:
    'R$ 12.500,00',

  referenciasComerciais:
    referencias(3),

  website: '',
};

function requisicao(
  corpo: unknown,
  ip = '200.0.0.1',
): Request {
  return new Request(
    'http://localhost/api/cadastro',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify(corpo),
    },
  );
}

describe(
  'POST /api/cadastro',
  () => {
    beforeEach(() => {
      reiniciarLimite();

      enviarCadastro.mockReset();

      enviarCadastro.mockResolvedValue({
        ok: true,
        id: 'msg-1',
      });
    });

    it(
      'aceita um cadastro valido e dispara o envio',
      async () => {
        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(base) as any,
          );

        expect(
          resposta.status,
        ).toBe(200);

        expect(
          enviarCadastro,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      'devolve 400 com erro por campo quando o CNPJ e invalido',
      async () => {
        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao({
              ...base,
              cnpj:
                '11.222.333/0001-80',
            }) as any,
          );

        expect(
          resposta.status,
        ).toBe(400);

        const corpo =
          await resposta.json();

        expect(
          corpo.erros.cnpj,
        ).toBeTruthy();

        expect(
          enviarCadastro,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'devolve 400 quando faltam referencias comerciais',
      async () => {
        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(
              {
                ...base,
                referenciasComerciais:
                  referencias(2),
              },
              '200.0.0.5',
            ) as any,
          );

        expect(
          resposta.status,
        ).toBe(400);

        const corpo =
          await resposta.json();

        expect(
          corpo.erros
            .referenciasComerciais,
        ).toBeTruthy();
      },
    );

    it(
      'descarta silenciosamente o envio com honeypot preenchido',
      async () => {
        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(
              {
                ...base,
                website:
                  'http://spam',
              },
              '200.0.0.9',
            ) as any,
          );

        expect(
          resposta.status,
        ).toBe(200);

        expect(
          enviarCadastro,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'devolve 502 quando o provedor de e-mail falha',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            ok: false,
            erro: 'SMTP fora do ar',
          },
        );

        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(
              base,
              '200.0.0.2',
            ) as any,
          );

        expect(
          resposta.status,
        ).toBe(502);
      },
    );

    it(
      'devolve 429 depois de cinco envios do mesmo IP',
      async () => {
        for (
          let i = 0;
          i < 5;
          i++
        ) {
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(
              base,
              '200.0.0.3',
            ) as any,
          );
        }

        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            requisicao(
              base,
              '200.0.0.3',
            ) as any,
          );

        expect(
          resposta.status,
        ).toBe(429);

        expect(
          resposta.headers.get(
            'Retry-After',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'devolve 400 quando o corpo nao e JSON',
      async () => {
        const req =
          new Request(
            'http://localhost/api/cadastro',
            {
              method: 'POST',
              headers: {
                'x-forwarded-for':
                  '200.0.0.4',
              },
              body:
                'isto nao e json',
            },
          );

        const resposta =
          await POST(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            req as any,
          );

        expect(
          resposta.status,
        ).toBe(400);
      },
    );
  },
);