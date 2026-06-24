-- Prela Atelier — MySQL Schema

CREATE TABLE IF NOT EXISTS admins (
  id          INT          NOT NULL AUTO_INCREMENT,
  username    VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id          INT            NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)   NOT NULL,
  slug        VARCHAR(255)   NOT NULL UNIQUE,
  description TEXT,
  price_eur   DECIMAL(10,2)  NOT NULL,
  image_path  VARCHAR(500),
  badge       VARCHAR(50),
  stock       INT            NOT NULL DEFAULT 99,
  featured    TINYINT(1)     NOT NULL DEFAULT 0,
  created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id              INT            NOT NULL AUTO_INCREMENT,
  order_code      VARCHAR(20)    NOT NULL UNIQUE,
  customer_name   VARCHAR(255)   NOT NULL,
  customer_email  VARCHAR(255)   NOT NULL,
  customer_phone  VARCHAR(50),
  address         TEXT           NOT NULL,
  city            VARCHAR(100)   NOT NULL,
  postcode        VARCHAR(20)    NOT NULL,
  country         VARCHAR(100)   NOT NULL DEFAULT 'France',
  subtotal        DECIMAL(10,2)  NOT NULL,
  shipping        DECIMAL(10,2)  NOT NULL DEFAULT 0,
  total           DECIMAL(10,2)  NOT NULL,
  status          ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  notes           TEXT,
  promo_code      VARCHAR(50),
  discount        DECIMAL(10,2)  NOT NULL DEFAULT 0,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id          INT           NOT NULL AUTO_INCREMENT,
  order_id    INT           NOT NULL,
  product_id  INT           NOT NULL,
  name        VARCHAR(255)  NOT NULL,
  price_eur   DECIMAL(10,2) NOT NULL,
  quantity    INT           NOT NULL DEFAULT 1,
  subtotal    DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  origin      VARCHAR(100) NOT NULL,
  description TEXT         NOT NULL,
  hardness    VARCHAR(50),
  tone        VARCHAR(50),
  veining     VARCHAR(50),
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bespoke_enquiries (
  id          INT          NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  type        VARCHAR(100),
  budget      VARCHAR(100),
  description TEXT         NOT NULL,
  timeline    VARCHAR(200),
  status      ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
  notes       TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promo_codes (
  id          INT           NOT NULL AUTO_INCREMENT,
  code        VARCHAR(50)   NOT NULL UNIQUE,
  type        ENUM('percentage','fixed') NOT NULL,
  value       DECIMAL(10,2) NOT NULL,
  min_order   DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses    INT,
  used_count  INT           NOT NULL DEFAULT 0,
  expires_at  DATETIME,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
