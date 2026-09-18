import { describe, expect, it } from 'vitest';
import {
  contarReferenciasComTelefone,
  tipoDocumento,
  validarCep,
  validarCnpj,
  validarCpf,
  validarCpfOuCnpj,
  validarTelefone,
} from '@/lib/validadores';

describe('validarCnpj', () => {
  it('aceita CNPJ numérico válido, com e sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
  });

  it('aceita o CNPJ alfanumérico do exemplo oficial da Receita', () => {
    expect(validarCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(validarCnpj('12abc34501de35')).toBe(true);
  });

  it('recusa dígito verificador errado', () => {
    expect(validarCnpj('11.222.333/0001-80')).toBe(false);
    expect(validarCnpj('12.ABC.345/01DE-34')).toBe(false);
  });

  it('recusa sequência de caractere repetido', () => {
    expect(validarCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('recusa tamanho errado e letra nas posições do DV', () => {
    expect(validarCnpj('11222333000')).toBe(false);
    expect(validarCnpj('12ABC34501DEA5')).toBe(false);
  });
});

describe('validarCpf', () => {
  it('aceita CPF válido', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('11144477735')).toBe(true);
  });

  it('recusa CPF inválido e repetido', () => {
    expect(validarCpf('123.456.789-00')).toBe(false);
    expect(validarCpf('111.111.111-11')).toBe(false);
    expect(validarCpf('1234567890')).toBe(false);
  });
});

describe('validarCpfOuCnpj e tipoDocumento', () => {
  it('reconhece cada formato pelo tamanho', () => {
    expect(validarCpfOuCnpj('529.982.247-25')).toBe(true);
    expect(validarCpfOuCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCpfOuCnpj('123')).toBe(false);
    expect(tipoDocumento('529.982.247-25')).toBe('CPF');
    expect(tipoDocumento('12.ABC.345/01DE-35')).toBe('CNPJ');
    expect(tipoDocumento('000')).toBeNull();
  });
});

describe('validarTelefone', () => {
  it('aceita fixo e celular com DDD', () => {
    expect(validarTelefone('(31) 3333-4444')).toBe(true);
    expect(validarTelefone('31999998888')).toBe(true);
  });

  it('recusa DDD inválido, tamanho errado e celular sem o nove', () => {
    expect(validarTelefone('(01) 3333-4444')).toBe(false);
    expect(validarTelefone('3133334')).toBe(false);
    expect(validarTelefone('31833334444')).toBe(false);
  });
});

describe('validarCep', () => {
  it('exige oito dígitos', () => {
    expect(validarCep('32000-000')).toBe(true);
    expect(validarCep('3200000')).toBe(false);
  });
});

describe('contarReferenciasComTelefone', () => {
  it('conta apenas linhas com número de contato', () => {
    const texto = [
      'Metalúrgica Alfa - (31) 3333-1111',
      'Distribuidora Beta - (31) 3333-2222',
      'Comercial Gama - (31) 3333-3333',
    ].join('\n');
    expect(contarReferenciasComTelefone(texto)).toBe(3);
  });

  it('ignora linhas em branco e linhas sem telefone', () => {
    const texto = 'Alfa\n\nBeta - (31) 3333-2222\n   \nGama';
    expect(contarReferenciasComTelefone(texto)).toBe(1);
  });
});
