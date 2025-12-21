package com.snackbar.clientes.infrastructure.web;

import com.snackbar.clientes.application.dto.CriarClienteRequest;
import com.snackbar.clientes.application.dto.ClienteDTO;
import com.snackbar.clientes.application.usecases.BuscarClientePorIdUseCase;
import com.snackbar.clientes.application.usecases.CriarClienteUseCase;
import com.snackbar.clientes.application.usecases.ListarClientesUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteRestController {
    
    private final CriarClienteUseCase criarClienteUseCase;
    private final ListarClientesUseCase listarClientesUseCase;
    private final BuscarClientePorIdUseCase buscarClientePorIdUseCase;
    
    @PostMapping
    public ResponseEntity<ClienteDTO> criar(@Valid @RequestBody CriarClienteRequest request) {
        ClienteDTO cliente = criarClienteUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cliente);
    }
    
    @GetMapping
    public ResponseEntity<List<ClienteDTO>> listar(
            @RequestParam(name = "telefone", required = false) String telefone,
            @RequestParam(name = "nome", required = false) String nome) {
        List<ClienteDTO> clientes;
        
        if (telefone != null) {
            clientes = listarClientesUseCase.executarPorTelefone(telefone);
        } else if (nome != null) {
            clientes = listarClientesUseCase.executarPorNome(nome);
        } else {
            clientes = listarClientesUseCase.executar();
        }
        
        return ResponseEntity.ok(clientes);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> buscarPorId(@PathVariable String id) {
        ClienteDTO cliente = buscarClientePorIdUseCase.executar(id);
        return ResponseEntity.ok(cliente);
    }
}

