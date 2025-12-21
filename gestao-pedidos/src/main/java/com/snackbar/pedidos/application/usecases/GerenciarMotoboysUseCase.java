package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.BusinessException;
import com.snackbar.kernel.domain.exceptions.NotFoundException;
import com.snackbar.pedidos.application.dto.AtualizarMotoboyRequest;
import com.snackbar.pedidos.application.dto.CriarMotoboyRequest;
import com.snackbar.pedidos.application.dto.MotoboyDTO;
import com.snackbar.pedidos.application.ports.MotoboyRepositoryPort;
import com.snackbar.pedidos.domain.entities.Motoboy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Use case para gerenciamento de motoboys.
 */
@Service
@RequiredArgsConstructor
public class GerenciarMotoboysUseCase {

    private final MotoboyRepositoryPort motoboyRepository;

    /**
     * Lista todos os motoboys.
     */
    @Transactional(readOnly = true)
    public List<MotoboyDTO> listarTodos() {
        return motoboyRepository.listarTodos()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista apenas motoboys ativos.
     */
    @Transactional(readOnly = true)
    public List<MotoboyDTO> listarAtivos() {
        return motoboyRepository.listarAtivos()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Busca motoboy por ID.
     */
    @Transactional(readOnly = true)
    public MotoboyDTO buscarPorId(String id) {
        Motoboy motoboy = motoboyRepository.buscarPorId(id)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));
        return toDTO(motoboy);
    }

    /**
     * Cria um novo motoboy.
     */
    @Transactional
    public MotoboyDTO criar(CriarMotoboyRequest request) {
        // Verifica se já existe motoboy com o telefone
        if (motoboyRepository.existePorTelefone(request.getTelefone())) {
            throw new BusinessException("Já existe um motoboy cadastrado com este telefone");
        }

        Motoboy motoboy = Motoboy.criar(
                request.getNome(),
                request.getTelefone(),
                request.getVeiculo(),
                request.getPlaca());

        Motoboy salvo = motoboyRepository.salvar(motoboy);
        return toDTO(salvo);
    }

    /**
     * Atualiza um motoboy existente.
     */
    @Transactional
    public MotoboyDTO atualizar(String id, AtualizarMotoboyRequest request) {
        Motoboy motoboy = motoboyRepository.buscarPorId(id)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));

        // Atualiza nome se informado
        if (request.getNome() != null && !request.getNome().trim().isEmpty()) {
            motoboy.atualizarNome(request.getNome());
        }

        // Atualiza telefone se informado
        if (request.getTelefone() != null && !request.getTelefone().trim().isEmpty()) {
            // Verifica se já existe outro motoboy com o telefone
            if (motoboyRepository.existePorTelefoneEIdDiferente(request.getTelefone(), id)) {
                throw new BusinessException("Já existe outro motoboy cadastrado com este telefone");
            }
            motoboy.atualizarTelefone(request.getTelefone());
        }

        // Atualiza veículo
        if (request.getVeiculo() != null) {
            motoboy.atualizarVeiculo(request.getVeiculo());
        }

        // Atualiza placa
        if (request.getPlaca() != null) {
            motoboy.atualizarPlaca(request.getPlaca());
        }

        // Atualiza status ativo
        if (request.getAtivo() != null) {
            if (request.getAtivo()) {
                motoboy.ativar();
            } else {
                motoboy.desativar();
            }
        }

        Motoboy salvo = motoboyRepository.salvar(motoboy);
        return toDTO(salvo);
    }

    /**
     * Ativa um motoboy.
     */
    @Transactional
    public MotoboyDTO ativar(String id) {
        Motoboy motoboy = motoboyRepository.buscarPorId(id)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));

        motoboy.ativar();
        Motoboy salvo = motoboyRepository.salvar(motoboy);
        return toDTO(salvo);
    }

    /**
     * Desativa um motoboy.
     */
    @Transactional
    public MotoboyDTO desativar(String id) {
        Motoboy motoboy = motoboyRepository.buscarPorId(id)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));

        motoboy.desativar();
        Motoboy salvo = motoboyRepository.salvar(motoboy);
        return toDTO(salvo);
    }

    /**
     * Exclui um motoboy.
     */
    @Transactional
    public void excluir(String id) {
        if (motoboyRepository.buscarPorId(id).isEmpty()) {
            throw new NotFoundException("Motoboy não encontrado");
        }
        motoboyRepository.excluir(id);
    }

    private MotoboyDTO toDTO(Motoboy motoboy) {
        return MotoboyDTO.builder()
                .id(motoboy.getId())
                .nome(motoboy.getNome())
                .telefone(motoboy.getTelefone())
                .veiculo(motoboy.getVeiculo())
                .placa(motoboy.getPlaca())
                .ativo(motoboy.isAtivo())
                .createdAt(motoboy.getCreatedAt())
                .updatedAt(motoboy.getUpdatedAt())
                .build();
    }
}
