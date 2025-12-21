import { signal, computed } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';

export interface ErroFormulario {
  campo: string;
  mensagem: string;
}

/**
 * Composable reutilizável para gerenciamento de formulários reativos.
 * Segue Clean Code e DRY.
 */
export function useFormulario<T extends Record<string, any>>(
  camposIniciais: T,
  validadores?: Partial<Record<keyof T, ValidatorFn[]>>
) {
  // Criar FormGroup dinamicamente
  const grupo: Record<string, FormControl> = {};
  
  Object.keys(camposIniciais).forEach(chave => {
    const validadoresCampo = validadores?.[chave] || [];
    grupo[chave] = new FormControl(
      camposIniciais[chave] ?? '',
      validadoresCampo
    );
  });

  const form = new FormGroup(grupo);

  // Estados
  const enviando = signal(false);
  const erros = signal<ErroFormulario[]>([]);
  const sucesso = signal(false);
  const formValido = signal(form.valid);

  // Atualizar formValido quando o formulário mudar
  form.statusChanges.subscribe(() => {
    formValido.set(form.valid);
  });

  // Computed
  const valido = computed(() => formValido());
  const invalido = computed(() => !formValido());
  const podeEnviar = computed(() => valido() && !enviando());

  // Métodos
  const resetar = () => {
    form.reset(camposIniciais);
    erros.set([]);
    sucesso.set(false);
    enviando.set(false);
    formValido.set(form.valid);
  };

  const definirValores = (valores: Partial<T>) => {
    form.patchValue(valores as any);
    formValido.set(form.valid);
  };

  const obterValores = (): T => {
    return form.value as T;
  };

  const adicionarErro = (campo: keyof T, mensagem: string) => {
    const erro: ErroFormulario = { campo: campo as string, mensagem };
    erros.update(errosAtuais => [...errosAtuais, erro]);
    form.get(campo as string)?.setErrors({ custom: mensagem });
  };

  const limparErros = () => {
    erros.set([]);
    Object.keys(form.controls).forEach(chave => {
      form.get(chave)?.setErrors(null);
    });
  };

  const marcarTodosComoTocados = () => {
    Object.keys(form.controls).forEach(chave => {
      form.get(chave)?.markAsTouched();
    });
  };

  const temErro = (campo: keyof T): boolean => {
    const control = form.get(campo as string);
    return !!(control && control.invalid && (control.dirty || control.touched));
  };

  const obterMensagemErro = (campo: keyof T): string | null => {
    const control = form.get(campo as string);
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return null;
    }

    const errors = control.errors;
    
    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['min']) return `Valor mínimo é ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo é ${errors['max'].max}`;
    if (errors['custom']) return errors['custom'];
    
    return 'Campo inválido';
  };

  return {
    form,
    enviando,
    erros,
    sucesso,
    valido,
    invalido,
    podeEnviar,
    resetar,
    definirValores,
    obterValores,
    adicionarErro,
    limparErros,
    marcarTodosComoTocados,
    temErro,
    obterMensagemErro
  };
}

