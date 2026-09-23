import { z } from 'zod';

import {
  limparDocumento,
  validarCep,
  validarCpf,
  validarCnpj,
  validarTelefone,
} from './validadores';

export const VENDEDORES = [
  'Guilherme Resende',
  'Paulo Ferraz',
  'Otávio Oliveira',
  'João Paulo',
  'Leonardo Ferreira',
  'Anderson Lopes',
  'Marcos Paulo',
  'Ezequiel Lopes',
  'Mercado Livre',
  'Ferrasoldas',
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
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
] as const;

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

    razaoSocial: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    nome: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    cnpj: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .default('')
      .transform(limparDocumento),

    cpf: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .default('')
      .transform((valor) =>
        valor.replace(/\D/g, ''),
      ),

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

    mercadoLivreNome: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    mercadoLivreCpf: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .default('')
      .transform((valor) =>
        valor.replace(/\D/g, ''),
      ),

    mercadoLivreQuemRecebe: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal('')),

    mercadoLivreReferencia: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal('')),

    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254)
      .optional()
      .or(z.literal('')),

    telefone: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),

    cep: z
      .string()
      .trim()
      .refine(
        validarCep,
        'CEP deve ter 8 dígitos.',
      ),

    endereco: z
      .string()
      .trim()
      .min(3, 'Informe o logradouro.')
      .max(200),

    numero: z
      .string()
      .trim()
      .min(1, 'Informe o número.')
      .max(20),

    complemento: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal('')),

    bairro: z
      .string()
      .trim()
      .min(2, 'Informe o bairro.')
      .max(100),

    estado: z
      .string()
      .length(
        2,
        'Selecione o estado.',
      ),

    cidade: z
      .string()
      .trim()
      .min(
        2,
        'Selecione o município.',
      )
      .max(100),

    vendedor: z.union([
      z.enum(VENDEDORES),
      z.literal(''),
    ]),

    valorVenda: z
      .string()
      .trim()
      .min(
        1,
        'Informe o valor da venda.',
      ),

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
    /*
     * MERCADO LIVRE
     */
    if (
      dados.tipoCadastro ===
      'MERCADO_LIVRE'
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

      if (
        !dados.mercadoLivreQuemRecebe ||
        dados.mercadoLivreQuemRecebe.length <
          3
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

      if (
        !dados.mercadoLivreReferencia
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'mercadoLivreReferencia',
          ],
          message:
            'Informe uma referência para o endereço.',
        });
      }
    }

    /*
     * PESSOA JURÍDICA
     */
    if (
      dados.tipoCadastro ===
      'PJ'
    ) {
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

      if (!dados.inscricaoEstadual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [
            'inscricaoEstadual',
          ],
          message:
            'Informe a inscrição estadual ou ISENTO.',
        });
      }
    }

    /*
     * PESSOA FÍSICA
     */
    if (
      dados.tipoCadastro ===
      'PF'
    ) {
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

    /*
     * E-MAIL E TELEFONE
     *
     * Mercado Livre não exige esses dados.
     */
    if (
      dados.tipoCadastro !==
      'MERCADO_LIVRE'
    ) {
      if (!dados.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['email'],
          message:
            'Informe o e-mail.',
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
    }

    /*
     * VENDEDOR
     */
    if (!dados.vendedor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vendedor'],
        message:
          'Selecione o vendedor responsável.',
      });
    }

    /*
     * REFERÊNCIAS COMERCIAIS
     *
     * PJ e PF exigem pelo menos 3.
     * Mercado Livre não exige referências.
     */
    if (
      dados.tipoCadastro !==
        'MERCADO_LIVRE' &&
      dados.referenciasComerciais.length <
        3
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

    /*
     * VALIDAÇÃO DOS CAMPOS DAS REFERÊNCIAS
     *
     * Os campos são opcionais na estrutura base
     * para permitir Mercado Livre, mas são
     * obrigatórios para PJ/PF.
     */
    if (
      dados.tipoCadastro !==
      'MERCADO_LIVRE'
    ) {
      dados.referenciasComerciais.forEach(
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
    }
  });

export type DadosCadastro =
  z.infer<typeof schemaCadastro>;

export const ROTULOS: Record<
  string,
  string
> = {
  tipoCadastro: 'Tipo de cadastro',
  tipoPessoa: 'Tipo de pessoa',
  razaoSocial: 'Razão Social',
  nome: 'Nome completo',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  rg: 'RG',
  inscricaoEstadual:
    'Inscrição Estadual',
  mercadoLivreNome:
    'Nome do comprador',
  mercadoLivreCpf:
    'CPF do comprador',
  mercadoLivreQuemRecebe:
    'Quem recebe',
  mercadoLivreReferencia:
    'Referência do endereço',
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