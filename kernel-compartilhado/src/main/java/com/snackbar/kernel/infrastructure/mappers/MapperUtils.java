package com.snackbar.kernel.infrastructure.mappers;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * Utilitário singleton para mapeamento genérico usando Jackson.
 * Permite reutilização entre módulos sem duplicação de código.
 *
 * @author Sistema Snackbar
 */
@SuppressWarnings("java:S6548")
public class MapperUtils {

    private static final MapperUtils INSTANCE = new MapperUtils();
    private final ObjectMapper objectMapper;

    private MapperUtils() {
        this.objectMapper = new ObjectMapper();
        // Configurações do Jackson para mapeamento seguro
        this.objectMapper.findAndRegisterModules();
    }

    /**
     * Retorna a instância singleton do MapperUtils.
     * 
     * @return Instância única do MapperUtils
     */
    public static MapperUtils getInstance() {
        return INSTANCE;
    }

    /**
     * Converte um objeto de um tipo para outro usando Jackson.
     * Útil para conversões simples entre Domain, Entity e DTO.
     * 
     * @param source      Objeto fonte
     * @param targetClass Classe de destino
     * @param <S>         Tipo fonte
     * @param <T>         Tipo destino
     * @return Objeto convertido ou null se source for null
     */
    public <S, T> T map(S source, Class<T> targetClass) {
        if (source == null) {
            return null;
        }

        try {
            return objectMapper.convertValue(source, targetClass);
        } catch (IllegalArgumentException e) {
            throw new MappingException("Erro ao mapear " + source.getClass().getSimpleName() +
                    " para " + targetClass.getSimpleName() + ": " + e.getMessage(), e);
        }
    }

    /**
     * Converte uma lista de objetos de um tipo para outro.
     * 
     * @param sourceList  Lista fonte
     * @param targetClass Classe de destino
     * @param <S>         Tipo fonte
     * @param <T>         Tipo destino
     * @return Lista convertida ou lista vazia se sourceList for null
     */
    public <S, T> List<T> mapList(List<S> sourceList, Class<T> targetClass) {
        if (sourceList == null) {
            return List.of();
        }

        return sourceList.stream()
                .map(source -> map(source, targetClass))
                .toList();
    }

    /**
     * Copia propriedades de um objeto para outro (mesmo tipo ou compatível).
     * Útil para atualizar objetos existentes.
     * 
     * @param source Objeto fonte
     * @param target Objeto destino
     * @param <T>    Tipo dos objetos
     */
    public <T> void copyProperties(T source, T target) {
        if (source == null || target == null) {
            return;
        }

        try {
            objectMapper.updateValue(target, source);
        } catch (Exception e) {
            throw new MappingException("Erro ao copiar propriedades: " + e.getMessage(), e);
        }
    }

    /**
     * Retorna o ObjectMapper configurado (para casos avançados).
     * 
     * @return ObjectMapper singleton
     */
    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    /**
     * Exceção específica para erros de mapeamento.
     */
    public static class MappingException extends RuntimeException {
        public MappingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
