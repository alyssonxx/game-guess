# Game Guess V12.3 — Mobile Compatibility

## iOS / iPadOS
- `viewport-fit=cover` com safe areas.
- Input real do Termo mantido focável para abrir o teclado do sistema.
- Foco com fallback para Safari.
- Input com `font-size:16px` para evitar zoom ao receber foco.
- Uso de `visualViewport` para detectar teclado aberto sem forçar scroll da página.
- Overlays e modais usam altura dinâmica do viewport.

## Android
- Ajustes para viewport dinâmico e teclado virtual.
- Touch targets maiores em telas de toque.
- `touch-action: manipulation` nos controles principais.
- Melhor adaptação à barra de endereço e ao teclado.

## Termo
- Dueto e Quarteto viram cards com scroll horizontal / snap em telas pequenas.
- O teclado virtual do site é ocultado apenas quando o teclado nativo realmente está visível.
- Mantido como fallback quando o teclado nativo não abre.
- Remove dependência visual de `:has()` para a linha editável.
- Suporte a `prefers-reduced-motion`.
