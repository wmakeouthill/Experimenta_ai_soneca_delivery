package com.sonecadelivery.autenticacao.infrastructure.web;

import com.sonecadelivery.autenticacao.application.dtos.*;
import com.sonecadelivery.autenticacao.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioRestController {

    private final CriarUsuarioUseCase criarUsuarioUseCase;
    private final ListarUsuariosUseCase listarUsuariosUseCase;
    private final BuscarUsuarioPorIdUseCase buscarUsuarioPorIdUseCase;
    private final AtualizarUsuarioUseCase atualizarUsuarioUseCase;
    private final ExcluirUsuarioUseCase excluirUsuarioUseCase;
    private final AlterarSenhaUseCase alterarSenhaUseCase;

    @PostMapping
    public ResponseEntity<UsuarioDTO> criar(@Valid @RequestBody CriarUsuarioRequest request) {
        UsuarioDTO usuario = criarUsuarioUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(usuario);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listar() {
        List<UsuarioDTO> usuarios = listarUsuariosUseCase.executar();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> buscarPorId(@NonNull @PathVariable String id) {
        UsuarioDTO usuario = buscarUsuarioPorIdUseCase.executar(id);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> atualizar(
            @NonNull @PathVariable String id,
            @Valid @RequestBody AtualizarUsuarioRequest request) {
        UsuarioDTO usuario = atualizarUsuarioUseCase.executar(id, request);
        return ResponseEntity.ok(usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@NonNull @PathVariable String id) {
        excluirUsuarioUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<Void> alterarSenha(
            @NonNull @PathVariable String id,
            @Valid @RequestBody AlterarSenhaRequest request) {
        alterarSenhaUseCase.executar(id, request);
        return ResponseEntity.noContent().build();
    }
}
