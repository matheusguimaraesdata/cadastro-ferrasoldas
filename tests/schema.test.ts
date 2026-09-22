import { describe, expect, it } from 'vitest';
import { schemaCadastro } from '@/lib/schema';

const referencias = (quantidade: number) =>
  Array.from({ length: quantidade }, (_, i) => ({
    empresa: `Referencia ${i + 1}`,
    telefone: `(31) 3333-${String(1000 + i).slice(-4)}`,
  }));

const basePJ = {
  tipoCadastro: 'PJ' as const,
  tipoPessoa: 'PJ' as const,
  razaoSocial: 'Metalurgica Exemplo Ltda',
  cnpj: '11.222.333/0001-81',
  inscricaoEstadual: 'ISENTO',
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
  complemento: 'Galpao 3',
  bairro: 'Centro',
  cidade: 'Contagem',
  estado: 'MG',
  vendedor: 'Leonardo Ferreira' as const,
  valorVenda: 'R$ 12.500,00',
  referenciasComerciais: referencias(3),
  website: '',
};

const basePF = {
  ...basePJ,
  tipoCadastro: 'PF' as const,
  tipoPessoa: 'PF' as const,
  razaoSocial: '',
  cnpj: '',
  inscricaoEstadual: '',
  nome: 'Joao da Silva',
  cpf: '529.982.247-25',
  rg: 'MG-12.345.678',
};

const baseMercadoLivre = {
  ...basePJ,
  tipoCadastro: 'MERCADO_LIVRE' as const,
  tipoPessoa: 'PF' as const,

  razaoSocial: '',
  nome: '',
  cnpj: '',
  cpf: '',
  rg: '',
  inscricaoEstadual: '',

  mercadoLivreNome:
    'Nauber de Jesus Sousa Frazao',

  mercadoLivreCpf:
    '529.982.247-25',

  mercadoLivreQuemRecebe:
    'Jose de Ribamar dos Santos Araujo',

  mercadoLivreReferencia:
    'Na casa do Riba tocador',

  email: '',
  telefone: '',

  referenciasComerciais: [],
};

function erroDe(
  dados: Record<string, unknown>,
  campo: string,
): string | undefined {
  const resultado =
    schemaCadastro.safeParse(dados);

  if (resultado.success) {
    return undefined;
  }

  return resultado.error.issues.find(
    (issue) =>
      issue.path[0] === campo,
  )?.message;
}

describe(
  'schemaCadastro — Pessoa Jurídica',
  () => {
    it(
      'aceita um cadastro PJ completo e normaliza o CNPJ',
      () => {
        const resultado =
          schemaCadastro.safeParse(
            basePJ,
          );

        expect(
          resultado.success,
        ).toBe(true);

        if (resultado.success) {
          expect(
            resultado.data.cnpj,
          ).toBe(
            '11222333000181',
          );
        }
      },
    );

    it(
      'aceita o CNPJ alfanumérico do exemplo oficial da Receita',
      () => {
        const resultado =
          schemaCadastro.safeParse({
            ...basePJ,
            cnpj:
              '12.ABC.345/01DE-35',
          });

        expect(
          resultado.success,
        ).toBe(true);

        if (resultado.success) {
          expect(
            resultado.data.cnpj,
          ).toBe(
            '12ABC34501DE35',
          );
        }
      },
    );

    it(
      'recusa CNPJ com dígito verificador errado',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              cnpj:
                '11.222.333/0001-80',
            },
            'cnpj',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige razão social',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              razaoSocial: '',
            },
            'razaoSocial',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige inscrição estadual (aceita ISENTO)',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              inscricaoEstadual: '',
            },
            'inscricaoEstadual',
          ),
        ).toBeTruthy();

        expect(
          schemaCadastro.safeParse({
            ...basePJ,
            inscricaoEstadual:
              'ISENTO',
          }).success,
        ).toBe(true);
      },
    );
  },
);

describe(
  'schemaCadastro — Pessoa Física',
  () => {
    it(
      'aceita um cadastro PF completo',
      () => {
        const resultado =
          schemaCadastro.safeParse(
            basePF,
          );

        expect(
          resultado.success,
        ).toBe(true);

        if (resultado.success) {
          expect(
            resultado.data.cpf,
          ).toBe(
            '52998224725',
          );
        }
      },
    );

    it(
      'recusa CPF com dígito verificador errado',
      () => {
        expect(
          erroDe(
            {
              ...basePF,
              cpf:
                '111.111.111-11',
            },
            'cpf',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige nome completo',
      () => {
        expect(
          erroDe(
            {
              ...basePF,
              nome: '',
            },
            'nome',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige RG para pessoa física',
      () => {
        expect(
          erroDe(
            {
              ...basePF,
              rg: '',
            },
            'rg',
          ),
        ).toBeTruthy();
      },
    );
  },
);

describe(
  'schemaCadastro — Mercado Livre',
  () => {
    it(
      'aceita um cadastro do Mercado Livre sem referências comerciais',
      () => {
        const resultado =
          schemaCadastro.safeParse(
            baseMercadoLivre,
          );

        expect(
          resultado.success,
        ).toBe(true);
      },
    );

    it(
      'exige nome do comprador',
      () => {
        expect(
          erroDe(
            {
              ...baseMercadoLivre,
              mercadoLivreNome: '',
            },
            'mercadoLivreNome',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige CPF válido do comprador',
      () => {
        expect(
          erroDe(
            {
              ...baseMercadoLivre,
              mercadoLivreCpf:
                '111.111.111-11',
            },
            'mercadoLivreCpf',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige quem receberá o pedido',
      () => {
        expect(
          erroDe(
            {
              ...baseMercadoLivre,
              mercadoLivreQuemRecebe:
                '',
            },
            'mercadoLivreQuemRecebe',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'exige referência para o endereço',
      () => {
        expect(
          erroDe(
            {
              ...baseMercadoLivre,
              mercadoLivreReferencia:
                '',
            },
            'mercadoLivreReferencia',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'não exige e-mail, telefone ou referências comerciais',
      () => {
        const resultado =
          schemaCadastro.safeParse({
            ...baseMercadoLivre,
            email: '',
            telefone: '',
            referenciasComerciais:
              [],
          });

        expect(
          resultado.success,
        ).toBe(true);
      },
    );
  },
);

describe(
  'schemaCadastro — campos comuns',
  () => {
    it(
      'exige o vendedor',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              vendedor: '',
            },
            'vendedor',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'recusa CEP fora do padrão',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              cep: '3200000',
            },
            'cep',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'recusa estado que não seja a sigla de 2 letras',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              estado: 'MGX',
            },
            'estado',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'recusa e-mail inválido',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              email: 'financeiro@',
            },
            'email',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'recusa telefone sem DDD',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              telefone: '33334444',
            },
            'telefone',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'marca o honeypot preenchido como inválido',
      () => {
        expect(
          erroDe(
            {
              ...basePJ,
              website:
                'http://spam',
            },
            'website',
          ),
        ).toBeTruthy();
      },
    );
  },
);

describe(
  'schemaCadastro — referências comerciais',
  () => {
    it(
      'exige no mínimo 3 referências para PJ',
      () => {
        const resultado =
          schemaCadastro.safeParse({
            ...basePJ,
            referenciasComerciais:
              referencias(2),
          });

        expect(
          resultado.success,
        ).toBe(false);

        if (!resultado.success) {
          const erro =
            resultado.error.issues.find(
              (issue) =>
                issue.path[0] ===
                'referenciasComerciais',
            );

          expect(
            erro?.message,
          ).toMatch(
            /pelo menos 3/i,
          );
        }
      },
    );

    it(
      'aceita até 6 referências',
      () => {
        expect(
          schemaCadastro.safeParse({
            ...basePJ,
            referenciasComerciais:
              referencias(6),
          }).success,
        ).toBe(true);
      },
    );

    it(
      'recusa mais de 6 referências',
      () => {
        const resultado =
          schemaCadastro.safeParse({
            ...basePJ,
            referenciasComerciais:
              referencias(7),
          });

        expect(
          resultado.success,
        ).toBe(false);

        if (!resultado.success) {
          const erro =
            resultado.error.issues.find(
              (issue) =>
                issue.path[0] ===
                'referenciasComerciais',
            );

          expect(
            erro?.message,
          ).toMatch(
            /limite é de 6/i,
          );
        }
      },
    );

    it(
      'recusa referência sem nome da empresa',
      () => {
        const refs =
          referencias(3);

        refs[0].empresa = '';

        const resultado =
          schemaCadastro.safeParse({
            ...basePJ,
            referenciasComerciais:
              refs,
          });

        expect(
          resultado.success,
        ).toBe(false);

        if (!resultado.success) {
          const erro =
            resultado.error.issues.find(
              (issue) =>
                issue.path[0] ===
                  'referenciasComerciais' &&
                issue.path[1] === 0 &&
                issue.path[2] ===
                  'empresa',
            );

          expect(
            erro,
          ).toBeTruthy();
        }
      },
    );

    it(
      'recusa referência com telefone inválido',
      () => {
        const refs =
          referencias(3);

        refs[1].telefone = '123';

        const resultado =
          schemaCadastro.safeParse({
            ...basePJ,
            referenciasComerciais:
              refs,
          });

        expect(
          resultado.success,
        ).toBe(false);

        if (!resultado.success) {
          const erro =
            resultado.error.issues.find(
              (issue) =>
                issue.path[0] ===
                  'referenciasComerciais' &&
                issue.path[1] === 1 &&
                issue.path[2] ===
                  'telefone',
            );

          expect(
            erro,
          ).toBeTruthy();
        }
      },
    );

    it(
      'não exige referências comerciais para Mercado Livre',
      () => {
        const resultado =
          schemaCadastro.safeParse({
            ...baseMercadoLivre,
            referenciasComerciais:
              [],
          });

        expect(
          resultado.success,
        ).toBe(true);
      },
    );
  },
);