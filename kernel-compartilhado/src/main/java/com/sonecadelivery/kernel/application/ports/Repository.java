package com.sonecadelivery.kernel.application.ports;

import java.util.List;
import java.util.Optional;

public interface Repository<T, I> {
    T save(T entity);

    Optional<T> findById(I id);

    List<T> findAll();

    void deleteById(I id);

    boolean existsById(I id);
}
