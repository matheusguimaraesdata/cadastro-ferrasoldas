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

const { POST } = await import(
  '@/app/api/cadastro/route'
);

const referencias = (quantidade: number) =>
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
  razaoSocial: 'Metalurgica Exemplo Ltda',
  cnpj: '11.222.333/0001-81',
  inscricaoEstadual: 'ISENTO',
  situacaoContribuinte:
    'CONTRIBUINTE' as const,

  nome: '',
  cpf: '',
  rg: '',

  mercadoLivreNome: '',
  mercadoLivreCpf: '',
  mercadoLivreQuemRecebe: '',
  mercadoLivreReferencia: '',

  email: 'financeiro@empresa.com.br',
  telefone: '(31) 3333-4444',

  cep: '32000-000',
  endereco: 'Rua das Bigornas',
  numero: '120',
  complemento: '',
  bairro: 'Centro',
  cidade: 'Contagem',
  estado: 'MG',

  vendedor:
    'Leonardo Ferreira' as const,
  valorVenda: 'R$ 12.500,00',

  referenciasComerciais:
    referencias(3),

  website: '',
};

function criarRequest(
  dados: Record<string, unknown>,
) {
  return new Request(
    'http://localhost/api/cadastro',
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(dados),
    },
  );
}

describe(
  'POST /api/cadastro',
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
      reiniciarLimite();
    });

    it(
      'aceita um cadastro válido e envia o e-mail',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            sucesso: true,
          },
        );

        const request =
          criarRequest(base);

        const response =
          await POST(request as never);

        expect(
          response.status,
        ).toBe(200);

        const body =
          await response.json();

        expect(body).toEqual({
          mensagem:
            'Cadastro enviado com sucesso.',
        });

        expect(
          enviarCadastro,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'retorna 502 quando o provedor de e-mail falha',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            sucesso: false,
            erro: 'Falha ao enviar e-mail.',
          },
        );

        const request =
          criarRequest(base);

        const response =
          await POST(request as never);

        expect(
          response.status,
        ).toBe(502);

        const body =
          await response.json();

        expect(body).toEqual({
          mensagem:
            'Não foi possível enviar o cadastro.',
        });

        expect(
          enviarCadastro,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'retorna 429 quando o limite de requisições é excedido',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            sucesso: true,
          },
        );

        const primeira =
          await POST(
            criarRequest(
              base,
            ) as never,
          );

        const segunda =
          await POST(
            criarRequest(
              base,
            ) as never,
          );

        expect(
          primeira.status,
        ).toBe(200);

        expect(
          segunda.status,
        ).toBe(429);

        expect(
          enviarCadastro,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'retorna 400 quando o honeypot é preenchido',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            sucesso: true,
          },
        );

        const response =
          await POST(
            criarRequest({
              ...base,
              website:
                'http://spam.example',
            }) as never,
          );

        expect(
          response.status,
        ).toBe(400);

        const body =
          await response.json();

        expect(
          body.mensagem,
        ).toBe('Dados inválidos.');

        expect(
          enviarCadastro,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'retorna 400 quando os dados são inválidos',
      async () => {
        enviarCadastro.mockResolvedValue(
          {
            sucesso: true,
          },
        );

        const response =
          await POST(
            criarRequest({
              ...base,
              email: 'financeiro@',
            }) as never,
          );

        expect(
          response.status,
        ).toBe(400);

        const body =
          await response.json();

        expect(
          body.mensagem,
        ).toBe('Dados inválidos.');

        expect(
          enviarCadastro,
        ).not.toHaveBeenCalled();
      },
    );
  },
);