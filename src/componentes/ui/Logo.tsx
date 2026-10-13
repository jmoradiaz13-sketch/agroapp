// Marca SurcAF: brote en S con dos hojas (Citrus Grove).
// base = Evergreen Tide sobre Cream Zest (fondos claros),
// reverso = Cream Zest sobre Midnight Cypress (bloques oscuros).
export function LogoMarca({
  reverso = false,
  className = '',
  titulo = 'SurcAF',
}: {
  reverso?: boolean;
  className?: string;
  titulo?: string;
}) {
  return (
    <img
      src={reverso ? '/logo/logo-reverso.png' : '/logo/logo-base.png'}
      alt={titulo}
      loading="lazy"
      draggable={false}
      className={`w-full h-full object-cover block ${className}`}
    />
  );
}
