package com.hercycle.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Isolated JPA Auditing configuration.
 * Declared separately to prevent MVC slice tests from attempting to bootstrap JPA entities metadata.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
