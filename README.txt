Habla con Elocuencia — Admin v11

Estructura:
- /            Curso público para testers
- /admin       Panel privado
- /api/progress Guarda progreso
- /api/admin    Entrega datos del panel solo con clave administrativa

IMPORTANTE ANTES DE USAR /admin:
En Vercel > Project Settings > Environment Variables, crea:
ADMIN_PASSWORD = una clave fuerte que solo tú conozcas
Aplica a Production y vuelve a desplegar.

Sube TODO el contenido al mismo repositorio de GitHub conservando la carpeta api.
