import { z } from 'zod';

import {
  validarCep,
  validarCnpj,
  validarCpf,
  validarTelefone,
} from './validadores';

export const VENDEDORES = [
  'Guilherme Resende',
  'Paulo Ferraz',
  'Otávio Oliveira',
  'João Paulo',
  'Leonardo Ferreira',
  'Anderson Lopes',
  'Marcos Paulo Ferraz',
  'Ezequiel Lopes',
  'Ferrasoldas / Balcão',
] as const;

export const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const;

const campoTextoOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''));

const documentoCpf = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .default('')
  .transform((valor) => valor.replace(/\D/g, ''));

const normalizarCnpj = (valor: string): string =>
  valor
    .trim()
    .toUpperCase()
    .replace(/[\s./-]/g, '');

const documentoCnpj = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .default('')
  .transform(normalizarCnpj);

const referenciaSchema = z.object({
  empresa: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal('')),

  telefone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});

export const schemaCadastro = z
  .object({
    tipoCadastro: z.enum([
      'PJ',
      'PF',
      'MERCADO_LIVRE',
    ]),

    tipoPessoa: z
      .enum(['PF', 'PJ'])
      .default('PJ'),

    mercadoLivreTipoPessoa: z
      .enum(['PF', 'PJ'])
      .optional()
      .or(z.literal('')),

    situacaoContribuinte: z
      .union([
        z.enum([
          'CONTRIBUINTE',
          'NAO_CONTRIBUINTE',
        ]),
        z.literal(''),
      ])
      .default(''),

    razaoSocial: campoTextoOpcional,

    nome: campoTextoOpcional,

    cnpj: documentoCnpj,

    cpf: documentoCpf,

    rg: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),

    inscricaoEstadual: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),

    mercadoLivreNome: campoTextoOpcional,

    mercadoLivreCpf: documentoCpf,

    mercadoLivreQuemRecebe: campoTextoOpcional,

    mercadoLivreReferencia: campoTextoOpcional,

    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254)
      .optional()
      .or(z.literal('')),

    telefone: campoTextoOpcional,

    cep: z
      .string()
      .trim()
      .refine(
        validarCep,
        'CEP deve ter 8 dígitos.',
      ),

    endereco: campoTextoOpcional,

    numero: campoTextoOpcional,

    complemento: campoTextoOpcional,

    bairro: campoTextoOpcional,

    estado: z.string().trim(),

    cidade: campoTextoOpcional,

    vendedor: z.union([
      z.enum(VENDEDORES),
      z.literal('Mercado Livre'),
      z.literal(''),
    ]),

    valorVenda: campoTextoOpcional,

    referenciasComerciais: z
      .array(referenciaSchema)
      .max(
        6,
        'O limite é de 6 referências.',
      ),

    website: z
      .string()
      .max(0)
      .optional()
      .or(z.literal('')),
  })
  .superRefine((dados, ctx) => {
    if (
      dados.tipoCadastro ===
      'MERCADO_LIVRE'
    ) {
      if (!dados.mercadoLivreTipoPessoa) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'mercadoLivreTipoPessoa',
          ],
          message:
            'Selecione o tipo de pessoa.',
        });
      }

      if (
        dados.mercadoLivreTipoPessoa ===
        'PF'
      ) {
        if (
          !dados.mercadoLivreNome ||
          dados.mercadoLivreNome.length < 3
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mercadoLivreNome'],
            message:
              'Informe o nome do comprador.',
          });
        }

        if (
          !validarCpf(
            dados.mercadoLivreCpf,
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mercadoLivreCpf'],
            message: 'CPF inválido.',
          });
        }
      }

      if (
        dados.mercadoLivreTipoPessoa ===
        'PJ'
      ) {
        if (
          !dados.mercadoLivreNome ||
          dados.mercadoLivreNome.length < 3
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mercadoLivreNome'],
            message:
              'Informe o nome da empresa.',
          });
        }

        if (
          !validarCnpj(
            dados.mercadoLivreCpf,
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['mercadoLivreCpf'],
            message: 'CNPJ inválido.',
          });
        }
      }

      if (
        !dados.mercadoLivreQuemRecebe
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'mercadoLivreQuemRecebe',
          ],
          message:
            'Informe quem receberá o pedido.',
        });
      }

      if (!dados.mercadoLivreReferencia) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'mercadoLivreReferencia',
          ],
          message:
            'Informe uma referência para o endereço.',
        });
      }

      if (!validarCep(dados.cep)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cep'],
          message:
            'CEP deve ter 8 dígitos.',
        });
      }

      if (
        !dados.endereco ||
        dados.endereco.length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endereco'],
          message:
            'Informe o logradouro.',
        });
      }

      if (
        !dados.numero ||
        dados.numero.length < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['numero'],
          message:
            'Informe o número.',
        });
      }

      if (
        !dados.bairro ||
        dados.bairro.length < 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['bairro'],
          message:
            'Informe o bairro.',
        });
      }

      if (
        !dados.estado ||
        dados.estado.length !== 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['estado'],
          message:
            'Selecione o estado.',
        });
      }

      if (
        !dados.cidade ||
        dados.cidade.length < 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cidade'],
          message:
            'Selecione o município.',
        });
      }

      return;
    }

    if (dados.tipoCadastro === 'PJ') {
      if (
        !dados.razaoSocial ||
        dados.razaoSocial.length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['razaoSocial'],
          message:
            'Informe a razão social.',
        });
      }

      if (!validarCnpj(dados.cnpj)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cnpj'],
          message: 'CNPJ inválido.',
        });
      }

      if (!dados.situacaoContribuinte) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'situacaoContribuinte',
          ],
          message:
            'Selecione a situação do contribuinte.',
        });
      }
    }

    if (dados.tipoCadastro === 'PF') {
      if (
        !dados.nome ||
        dados.nome.length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nome'],
          message:
            'Informe o nome completo.',
        });
      }

      if (!dados.rg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rg'],
          message: 'Informe o RG.',
        });
      }

      if (!validarCpf(dados.cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cpf'],
          message: 'CPF inválido.',
        });
      }
    }

    if (!dados.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Informe o e-mail.',
      });
    }

    if (
      !validarTelefone(
        dados.telefone ?? '',
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['telefone'],
        message:
          'Telefone inválido. Use (31) 99999-9999.',
      });
    }

    if (!validarCep(dados.cep)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cep'],
        message:
          'CEP deve ter 8 dígitos.',
      });
    }

    if (
      !dados.endereco ||
      dados.endereco.length < 3
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endereco'],
        message:
          'Informe o logradouro.',
      });
    }

    if (
      !dados.numero ||
      dados.numero.length < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['numero'],
        message:
          'Informe o número.',
      });
    }

    if (
      !dados.bairro ||
      dados.bairro.length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bairro'],
        message:
          'Informe o bairro.',
      });
    }

    if (
      !dados.estado ||
      dados.estado.length !== 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['estado'],
        message:
          'Selecione o estado.',
      });
    }

    if (
      !dados.cidade ||
      dados.cidade.length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cidade'],
        message:
          'Selecione o município.',
      });
    }

    if (!dados.vendedor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vendedor'],
        message:
          'Selecione o vendedor responsável.',
      });
    }

    if (!dados.valorVenda) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['valorVenda'],
        message:
          'Informe o valor da venda.',
      });
    }

    if (
      dados.referenciasComerciais.length < 3
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          'referenciasComerciais',
        ],
        message:
          'Informe pelo menos 3 referências.',
      });
    }

    const referenciasParaValidar =
      dados.referenciasComerciais.slice(
        0,
        6,
      );

    referenciasParaValidar.forEach(
      (referencia, index) => {
        if (
          !referencia.empresa ||
          referencia.empresa.length < 2
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'referenciasComerciais',
              index,
              'empresa',
            ],
            message:
              'Informe o nome da empresa.',
          });
        }

        if (
          !validarTelefone(
            referencia.telefone ?? '',
          )
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              'referenciasComerciais',
              index,
              'telefone',
            ],
            message:
              'Telefone inválido.',
          });
        }
      },
    );
  });

export type DadosCadastro = z.infer<
  typeof schemaCadastro
>;

export const ROTULOS: Record<
  string,
  string
> = {
  tipoCadastro: 'Tipo de cadastro',
  tipoPessoa: 'Tipo de pessoa',
  mercadoLivreTipoPessoa:
    'Cadastro Mercado Livre por',
  situacaoContribuinte:
    'Situação do contribuinte',
  razaoSocial:
    'Nome da Empresa / Razão Social',
  nome: 'Nome do Cliente',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  rg: 'RG',
  inscricaoEstadual:
    'Inscrição Estadual',
  email: 'E-mail',
  telefone: 'Telefone',
  cep: 'CEP',
  endereco: 'Rua / Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
  estado: 'Estado',
  cidade: 'Município',
  vendedor: 'Vendedor',
  valorVenda: 'Valor da Venda',
};