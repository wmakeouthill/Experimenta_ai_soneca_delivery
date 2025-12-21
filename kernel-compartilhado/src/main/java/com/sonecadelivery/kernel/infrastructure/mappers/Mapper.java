package com.sonecadelivery.kernel.infrastructure.mappers;

/**
 * Interface genérica para mappers que convertem entre Domain e Entity.
 * 
 * Para conversões simples, use {@link MapperUtils}.
 * Para conversões complexas com lógica customizada, implemente esta interface.
 * 
 * @param <D> Tipo da entidade de domínio
 * @param <E> Tipo da entidade JPA
 */
public interface Mapper<D, E> {
    
    /**
     * Converte uma entidade de domínio para uma entidade JPA.
     * 
     * @param domain Entidade de domínio
     * @return Entidade JPA
     */
    E paraEntity(D domain);
    
    /**
     * Converte uma entidade JPA para uma entidade de domínio.
     * 
     * @param entity Entidade JPA
     * @return Entidade de domínio
     */
    D paraDomain(E entity);
}
