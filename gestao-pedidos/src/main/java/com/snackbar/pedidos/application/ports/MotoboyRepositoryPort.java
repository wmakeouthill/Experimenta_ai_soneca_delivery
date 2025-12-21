package com.snackbar.pedidos.application.ports;

import com.snackbar.pedidos.domain.entities.Motoboy;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Port do repositório de Motoboy.
 */
public interface MotoboyRepositoryPort {

    /**
     * Salva um motoboy (criar ou atualizar).
     */
    Motoboy salvar(Motoboy motoboy);

    /**
     * Busca motoboy por ID.
     */
    Optional<Motoboy> buscarPorId(String id);

    /**
     * Busca motoboys por IDs.
     */
    List<Motoboy> buscarPorIds(Collection<String> ids);

    /**
     * Busca motoboy por telefone.
     */
    Optional<Motoboy> buscarPorTelefone(String telefone);

    /**
     * Lista todos os motoboys ordenados por nome.
     */
    List<Motoboy> listarTodos();

    /**
     * Lista apenas motoboys ativos ordenados por nome.
     */
    List<Motoboy> listarAtivos();

    /**
     * Verifica se existe motoboy com o telefone informado.
     */
    boolean existePorTelefone(String telefone);

    /**
     * Verifica se existe outro motoboy com o telefone informado (para atualização).
     */
    boolean existePorTelefoneEIdDiferente(String telefone, String id);

    /**
     * Exclui um motoboy por ID.
     */
    void excluir(String id);
}
