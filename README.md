# Kid plays Backend - Serverless API 

Este repositorio contiene la lógica de servidor y los endpoints encargados de la gestión de datos para el ecosistema **Kid plays**. El proyecto integra una plataforma web y un videojuego, permitiendo una persistencia de datos centralizada y escalable.

Desarrollado como proyecto para el socio formador **NIDE** en la unidad de formación *“Construcción de Software y Toma de Decisiones”* del **Tecnológico de Monterrey, Campus Estado de México**.

## Repositorios del Ecosistema
El sistema completo se compone de tres piezas fundamentales:
*   [**Frontend Web:**](https://github.com/svjuanma/NIDEwebpage.git) 
*   [**Videojuego:**](https://github.com/NewAndifer/VideojuegoNIDE/) 
*   **Backend (Este repo):**

## Stack Tecnológico e Infraestructura
*   **Lenguaje:** JavaScript (ES Modules)
*   **Runtime:** Node.js v24.14.1
*   **Infraestructura Cloud:** 
    *   **AWS Lambda:** Ejecución de funciones serverless para optimizar costos y escalabilidad.
    *   **AWS RDS:** Base de datos relacional para el almacenamiento seguro de información.
*   **Servicios Externos:** SMTP de Google para el sistema automatizado de correos electrónicos.

## Instalación y Configuración Local

### Requisitos previos
*   Node.js instalado (versión sugerida: 24.14.1).
*   Gestor de paquetes `npm` o `pnpm`.

### 1. Clonar el proyecto
```bash
git clone [https://github.com/JBanuel/backendNIDE](https://github.com/JBanuel/backendNIDE)
cd backendNIDE
```

### 2. Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 3. Configuración de Variables de Entorno
Para la conexión con los servicios de AWS y Google, debes crear un archivo llamado `config.mjs` en la raíz del proyecto:
```javascript
const config = {
    DB_HOST: "tu_endpoint_de_rds",
    DB_USER: "tu_usuario",
    DB_PASSWORD: "tu_password",
    DB_DATABASE: "nombre_de_la_bd",
    ES_EMAIL: "tu_correo@gmail.com",
    ES_PASSWORD: "tu_password_de_aplicacion" // Generada en Google Account
};

export default config;
```

Las variables `DB_*` son esenciales para la persistencia en AWS RDS. Las variables `ES_*` permiten la salida de correos mediante el protocolo SMTP de Gmail.

## Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. Puedes consultar el archivo [LICENSE](./LICENSE) para más detalles.

---
© 2026 - Jose Manuel Bañuelos Silva | ITESM Campus Estado de México