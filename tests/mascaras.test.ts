import { describe, expect, it } from 'vitest';
import {
  mascararCep,
  mascararCpfOuCnpj,
  mascararEstado,
  mascararMoeda,
  mascararTelefone,
} from '@/lib/mascaras';

/**
 * Intl.NumberFormat em pt-BR separa "R$" do valor com espaço não
 * separável (U+00A0). Comparar com espaço comum faz o teste falhar
 * mesmo com a saída correta, então normalizamos antes de comparar.
 */
const normalizar = (texto: string) => texto.replace(/\u00a0/g, ' ');

describe('mascararCpfOuCnpj', () => {
  it('formata CPF completo e parcial', () => {
    expect(mascararCpfOuCnpj('52998224725')).toBe('529.982.247-25');
    expect(mascararCpfOuCnpj('529982')).toBe('529.982');
  });

  it('formata CNPJ numérico e alfanumérico', () => {
    expect(mascararCpfOuCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(mascararCpfOuCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
  });

  it('descarta o excedente de 14 posições', () => {
    expect(mascararCpfOuCnpj('112223330001819999')).toBe('11.222.333/0001-81');
  });
});

describe('demais máscaras', () => {
  it('formata telefone fixo e celular', () => {
    expect(mascararTelefone('3133334444')).toBe('(31) 3333-4444');
    expect(mascararTelefone('31999998888')).toBe('(31) 99999-8888');
  });

  it('formata CEP', () => {
    expect(mascararCep('32000000')).toBe('32000-000');
  });

  it('formata moeda a partir dos centavos', () => {
    expect(normalizar(mascararMoeda('1250000'))).toBe('R$ 12.500,00');
    expect(mascararMoeda('')).toBe('');
  });

  it('normaliza a sigla do estado', () => {
    expect(mascararEstado('mg')).toBe('MG');
    expect(mascararEstado('m1g2')).toBe('MG');
  });
});
