import { Injectable, signal } from '@angular/core';

export interface Notificacao {
    id: string;
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'info' | 'aviso';
    duracao?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    readonly notificacoes = signal<Notificacao[]>([]);

    sucesso(mensagem: string, duracao = 3000) {
        this.adicionar(mensagem, 'sucesso', duracao);
    }

    erro(mensagem: string, duracao = 5000) {
        this.adicionar(mensagem, 'erro', duracao);
    }

    info(mensagem: string, duracao = 3000) {
        this.adicionar(mensagem, 'info', duracao);
    }

    aviso(mensagem: string, duracao = 4000) {
        this.adicionar(mensagem, 'aviso', duracao);
    }

    remover(id: string) {
        this.notificacoes.update(lista => lista.filter(n => n.id !== id));
    }

    private adicionar(mensagem: string, tipo: Notificacao['tipo'], duracao: number) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const novaNotificacao: Notificacao = { id, mensagem, tipo, duracao };

        this.notificacoes.update(lista => [...lista, novaNotificacao]);

        if (duracao > 0) {
            setTimeout(() => {
                this.remover(id);
            }, duracao);
        }
    }
}
