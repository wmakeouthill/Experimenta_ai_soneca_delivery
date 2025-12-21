package com.sonecadelivery.kernel.infrastructure.mappers;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro centralizado de mappers para garantir reutilização e evitar duplicação.
 * 
 * <p>Implementa padrão Singleton para garantir uma única instância global do registro.
 * Este padrão é necessário porque o registry precisa manter estado compartilhado
 * entre diferentes partes da aplicação que podem não ter acesso ao contexto Spring.</p>
 * 
 * <p>NOTA: Em aplicações Spring, prefira usar injeção de dependência para mappers
 * diretamente, usando {@code @Component} nas implementações de {@link Mapper}.
 * Este registry é útil quando a injeção de dependência não está disponível.</p>
 */
@SuppressWarnings("java:S6548") // Singleton intencional - necessário para registry compartilhado sem Spring
public class MapperRegistry {
    
    private static final MapperRegistry INSTANCE = new MapperRegistry();
    private final Map<Class<?>, Mapper<?, ?>> mappers = new ConcurrentHashMap<>();
    
    private MapperRegistry() {
        // Construtor privado para garantir Singleton
    }
    
    /**
     * Retorna a instância singleton do registry.
     * 
     * @return Instância única do MapperRegistry
     */
    public static MapperRegistry getInstance() {
        return INSTANCE;
    }
    
    @SuppressWarnings("unchecked")
    public <D, E> Mapper<D, E> getMapper(Class<? extends Mapper<D, E>> mapperClass) {
        return (Mapper<D, E>) mappers.computeIfAbsent(mapperClass, this::createMapper);
    }
    
    public <D, E> void register(Mapper<D, E> mapper) {
        if (mapper != null) {
            mappers.put(mapper.getClass(), mapper);
        }
    }
    
    private Mapper<?, ?> createMapper(Class<?> mapperClass) {
        try {
            return (Mapper<?, ?>) mapperClass.getDeclaredConstructor().newInstance();
        } catch (ReflectiveOperationException e) {
            throw new MapperCreationException(
                "Erro ao criar mapper: " + mapperClass.getName() + 
                ". Verifique se a classe possui construtor público sem parâmetros.", 
                e
            );
        }
    }
    
    /**
     * Limpa todos os mappers registrados.
     * Útil para testes ou resetar o estado do registry.
     */
    public void clear() {
        mappers.clear();
    }
}

